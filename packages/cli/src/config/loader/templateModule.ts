import { z } from "zod";
import { genxTemplate as kubbTemplate } from "@genxapi/template-kubb";
import { genxTemplate as orvalTemplate } from "@genxapi/template-orval";
import type { UnifiedGeneratorConfig } from "src/types";

export type TemplateCapabilityClassification = "universal" | "template-first-class" | "escape-hatch";
export type TemplateDependencySection =
  | "dependencies"
  | "devDependencies"
  | "peerDependencies"
  | "optionalDependencies";

export interface TemplateCapability {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly classification: TemplateCapabilityClassification;
  readonly configPaths: readonly string[];
}

export interface TemplateCapabilityManifest {
  readonly summary: string;
  readonly capabilities: readonly TemplateCapability[];
}

export interface TemplatePlannedDependency {
  readonly name: string;
  readonly section: TemplateDependencySection;
  readonly reason: string;
}

export interface TemplateDocumentationHint {
  readonly title: string;
  readonly body: string;
}

export interface TemplateOutputMetadata {
  readonly configFiles?: readonly string[];
  readonly entrypoints?: readonly string[];
  readonly notes?: readonly string[];
}

export interface TemplateGenerationPlan {
  readonly selectedCapabilities: readonly string[];
  readonly dependencies: readonly TemplatePlannedDependency[];
  readonly documentationHints?: readonly TemplateDocumentationHint[];
  readonly output?: TemplateOutputMetadata;
}

export interface TemplateModule<TConfig = unknown> {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly aliases: readonly string[];
  readonly schema: z.AnyZodObject;
  readonly capabilityManifest: TemplateCapabilityManifest;
  readonly generateClients: (config: TConfig, options: Record<string, unknown>) => Promise<void>;
  readonly transformUnifiedConfig?: (
    unified: UnifiedGeneratorConfig,
    context: {
      readonly templateName: string;
    }
  ) => Promise<TConfig> | TConfig;
  readonly validateConfig?: (config: TConfig) => Promise<void> | void;
  readonly planGeneration?: (
    config: TConfig,
    context: {
      readonly templateName: string;
    }
  ) => Promise<TemplateGenerationPlan> | TemplateGenerationPlan;
}

type LegacyTemplateExports = {
  readonly MultiClientConfigSchema?: z.AnyZodObject;
  readonly generateClients?: (config: unknown, options: Record<string, unknown>) => Promise<void>;
};

type TemplateContractExports = {
  readonly genxTemplate?: unknown;
};

const BUILTIN_TEMPLATE_EXPORTS = [orvalTemplate, kubbTemplate];

const BUILTIN_TEMPLATES = BUILTIN_TEMPLATE_EXPORTS.map((template) =>
  normaliseTemplateModule(template.name, template)
);

const BUILTIN_TEMPLATE_INDEX = new Map<string, TemplateModule>();
for (const template of BUILTIN_TEMPLATES) {
  BUILTIN_TEMPLATE_INDEX.set(template.name, template);
  BUILTIN_TEMPLATE_INDEX.set(template.id, template);
  for (const alias of template.aliases) {
    BUILTIN_TEMPLATE_INDEX.set(alias.toLowerCase(), template);
  }
}

export const TEMPLATE_PACKAGE_MAP: Record<string, string> = Object.freeze(
  BUILTIN_TEMPLATES.reduce<Record<string, string>>((acc, template) => {
    acc[template.id] = template.name;
    return acc;
  }, {})
);

export const DEFAULT_TEMPLATE = TEMPLATE_PACKAGE_MAP.orval;

function defaultCapabilityManifest(templateName: string): TemplateCapabilityManifest {
  return {
    summary: `Legacy template module for ${templateName}. Capability metadata is not declared yet.`,
    capabilities: []
  };
}

function inferTemplateId(templateName: string): string {
  if (templateName === TEMPLATE_PACKAGE_MAP.orval) {
    return "orval";
  }
  if (templateName === TEMPLATE_PACKAGE_MAP.kubb) {
    return "kubb";
  }
  return templateName;
}

function normaliseLegacyTemplateModule(
  templateName: string,
  candidate: LegacyTemplateExports
): TemplateModule {
  const schema = candidate.MultiClientConfigSchema;
  const generateClients = candidate.generateClients;
  if (!schema || typeof schema.extend !== "function") {
    throw new Error(`Template "${templateName}" does not export MultiClientConfigSchema.`);
  }
  if (typeof generateClients !== "function") {
    throw new Error(`Template "${templateName}" does not export generateClients.`);
  }

  return {
    id: inferTemplateId(templateName),
    name: templateName,
    displayName: templateName,
    aliases: [],
    schema,
    capabilityManifest: defaultCapabilityManifest(templateName),
    generateClients
  };
}

function normaliseTemplateModule(templateName: string, candidate: unknown): TemplateModule {
  if (!candidate || typeof candidate !== "object") {
    throw new Error(`Template "${templateName}" does not export a valid template contract.`);
  }

  const template = candidate as Partial<TemplateModule>;
  if (typeof template.id !== "string" || template.id.length === 0) {
    throw new Error(`Template "${templateName}" must declare a non-empty template id.`);
  }
  if (typeof template.name !== "string" || template.name.length === 0) {
    throw new Error(`Template "${templateName}" must declare a non-empty package name.`);
  }
  if (typeof template.displayName !== "string" || template.displayName.length === 0) {
    throw new Error(`Template "${templateName}" must declare a non-empty display name.`);
  }
  if (!Array.isArray(template.aliases)) {
    throw new Error(`Template "${templateName}" must declare aliases as an array.`);
  }
  if (!template.schema || typeof template.schema.extend !== "function") {
    throw new Error(`Template "${templateName}" must export a Zod schema.`);
  }
  if (typeof template.generateClients !== "function") {
    throw new Error(`Template "${templateName}" must export generateClients.`);
  }
  if (
    !template.capabilityManifest ||
    typeof template.capabilityManifest.summary !== "string" ||
    !Array.isArray(template.capabilityManifest.capabilities)
  ) {
    throw new Error(`Template "${templateName}" must declare a capability manifest.`);
  }

  return {
    ...template,
    aliases: template.aliases.map((alias) => alias.toLowerCase())
  } as TemplateModule;
}

export function resolveTemplatePackage(selector: string): string {
  const normalised = selector.trim().toLowerCase();
  return BUILTIN_TEMPLATE_INDEX.get(normalised)?.name ?? selector;
}

export function resolveRegisteredTemplate(selector: string): TemplateModule | undefined {
  return BUILTIN_TEMPLATE_INDEX.get(selector.trim().toLowerCase());
}

export async function loadTemplateModule(name: string): Promise<TemplateModule> {
  const builtIn = resolveRegisteredTemplate(name);
  if (builtIn) {
    return builtIn;
  }

  try {
    const mod = (await import(name)) as TemplateContractExports & LegacyTemplateExports;
    if (mod.genxTemplate) {
      return normaliseTemplateModule(name, mod.genxTemplate);
    }
    return normaliseLegacyTemplateModule(name, mod);
  } catch (error) {
    throw new Error(
      `Failed to load template "${name}". Ensure it is installed and exports genxTemplate or MultiClientConfigSchema + generateClients. Reason: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
