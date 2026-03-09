import { createRequire } from "node:module";
import { isAbsolute, resolve as resolvePath } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { genxTemplate as kubbTemplate } from "@genxapi/template-kubb";
import { genxTemplate as orvalTemplate } from "@genxapi/template-orval";
import {
  validateTemplateCapabilityManifest,
  type GenxTemplate,
  type TemplateCapabilityManifest
} from "../../template-contract";
import {
  ExternalTemplateReferenceSchema,
  isBuiltinTemplateReference,
  isExternalTemplateReference,
  type BuiltinTemplateReference,
  type ExternalTemplateReference,
  type TemplateIdentifier
} from "../../types";

export type {
  GenxTemplateContext,
  TemplateCapability,
  TemplateCapabilityClassification,
  TemplateCapabilityManifest,
  TemplateDependencySection,
  TemplateDocumentationHint,
  TemplateGenerationPlan,
  TemplateOutputMetadata,
  TemplatePlannedDependency
} from "../../template-contract";

export type TemplateModule<TConfig = unknown> = GenxTemplate<TConfig>;

type LegacyTemplateExports = {
  readonly MultiClientConfigSchema?: z.AnyZodObject;
  readonly generateClients?: (config: unknown, options: Record<string, unknown>) => Promise<void>;
};

type TemplateContractExports = Record<string, unknown> & {
  readonly genxTemplate?: unknown;
};

type TemplateSelection = string | BuiltinTemplateReference | ExternalTemplateReference;

type ResolvedTemplateTarget =
  | {
      readonly kind: "builtin";
      readonly template: TemplateModule;
    }
  | {
      readonly kind: "external";
      readonly module: string;
      readonly exportName: string;
      readonly explicit: boolean;
    };

interface LoadTemplateModuleOptions {
  readonly configDir?: string;
}

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

function normaliseAliases(templateName: string, aliases: unknown): readonly string[] {
  if (!Array.isArray(aliases)) {
    throw new Error(`Template "${templateName}" must declare aliases as an array.`);
  }

  const normalised = aliases.map((alias) => {
    if (typeof alias !== "string" || alias.trim().length === 0) {
      throw new Error(`Template "${templateName}" must declare aliases as non-empty strings.`);
    }
    return alias.trim().toLowerCase();
  });

  return Array.from(new Set(normalised));
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
  if (!template.schema || typeof template.schema.extend !== "function") {
    throw new Error(`Template "${templateName}" must export a Zod schema.`);
  }
  if (typeof template.generateClients !== "function") {
    throw new Error(`Template "${templateName}" must export generateClients.`);
  }

  return {
    ...template,
    aliases: normaliseAliases(templateName, template.aliases),
    capabilityManifest: validateTemplateCapabilityManifest(templateName, template.capabilityManifest)
  } as TemplateModule;
}

function resolveTemplateTarget(selector: TemplateSelection): ResolvedTemplateTarget {
  if (typeof selector === "string") {
    const builtIn = resolveRegisteredTemplate(selector);
    if (builtIn) {
      return {
        kind: "builtin",
        template: builtIn
      };
    }

    return {
      kind: "external",
      module: selector,
      exportName: "genxTemplate",
      explicit: false
    };
  }

  if (isBuiltinTemplateReference(selector)) {
    const builtIn = resolveRegisteredTemplate(selector.name);
    if (!builtIn) {
      throw new Error(
        `Unknown built-in template "${selector.name}". Supported built-ins: ${BUILTIN_TEMPLATES.map((template) => template.id).join(", ")}.`
      );
    }

    return {
      kind: "builtin",
      template: builtIn
    };
  }

  const external = ExternalTemplateReferenceSchema.parse(selector);
  return {
    kind: "external",
    module: external.module,
    exportName: external.export,
    explicit: true
  };
}

function isLocalModulePath(specifier: string): boolean {
  return (
    specifier.startsWith("./") ||
    specifier.startsWith("../") ||
    isAbsolute(specifier) ||
    specifier.startsWith("file:")
  );
}

function resolveImportSpecifier(specifier: string, configDir?: string): string {
  if (specifier.startsWith("http://") || specifier.startsWith("https://")) {
    throw new Error(`Template modules must be loaded from a package name or filesystem path. Received "${specifier}".`);
  }

  if (specifier.startsWith("file:")) {
    return specifier;
  }

  if (isLocalModulePath(specifier)) {
    const absolutePath = isAbsolute(specifier)
      ? specifier
      : resolvePath(configDir ?? process.cwd(), specifier);
    return pathToFileURL(absolutePath).href;
  }

  if (configDir) {
    const requireFromConfig = createRequire(resolvePath(configDir, "__genxapi_template_loader__.cjs"));
    try {
      return pathToFileURL(requireFromConfig.resolve(specifier)).href;
    } catch {
      return specifier;
    }
  }

  return specifier;
}

async function importTemplateExports(
  specifier: string,
  options: LoadTemplateModuleOptions
): Promise<TemplateContractExports & LegacyTemplateExports> {
  const resolvedSpecifier = resolveImportSpecifier(specifier, options.configDir);
  return (await import(resolvedSpecifier)) as TemplateContractExports & LegacyTemplateExports;
}

export function resolveTemplatePackage(selector: string): string {
  const normalised = selector.trim().toLowerCase();
  return BUILTIN_TEMPLATE_INDEX.get(normalised)?.name ?? selector;
}

export function resolveRegisteredTemplate(selector: string): TemplateModule | undefined {
  return BUILTIN_TEMPLATE_INDEX.get(selector.trim().toLowerCase());
}

export async function loadTemplateModule(
  selector: TemplateSelection,
  options: LoadTemplateModuleOptions = {}
): Promise<TemplateModule> {
  const target = resolveTemplateTarget(selector);
  if (target.kind === "builtin") {
    return target.template;
  }

  try {
    const mod = await importTemplateExports(target.module, options);
    const selectedExport = mod[target.exportName];

    if (selectedExport) {
      return normaliseTemplateModule(target.module, selectedExport);
    }

    if (target.explicit) {
      throw new Error(
        `External template modules must export "${target.exportName}" and that export must satisfy the GenX API template contract.`
      );
    }

    if (mod.genxTemplate) {
      return normaliseTemplateModule(target.module, mod.genxTemplate);
    }
    return normaliseLegacyTemplateModule(target.module, mod);
  } catch (error) {
    throw new Error(
      `Failed to load template "${renderTemplateSelection(selector)}". Ensure it is installed or reachable from the config directory and exports the expected template contract. Reason: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function renderTemplateSelection(selector: TemplateIdentifier | string): string {
  if (typeof selector === "string") {
    return selector;
  }
  if (isBuiltinTemplateReference(selector)) {
    return selector.name;
  }
  if (isExternalTemplateReference(selector)) {
    return selector.module;
  }
  return JSON.stringify(selector);
}
