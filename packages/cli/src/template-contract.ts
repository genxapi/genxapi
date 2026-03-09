import { z } from "zod";

import type { UnifiedGeneratorConfig } from "./types/unifiedConfig";

export type TemplateCapabilityClassification =
  | "universal"
  | "template-first-class"
  | "escape-hatch";

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

export interface GenxTemplateContext {
  readonly templateName: string;
}

export interface GenxTemplate<TConfig = unknown> {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly aliases: readonly string[];
  readonly schema: z.AnyZodObject;
  readonly capabilityManifest: TemplateCapabilityManifest;
  readonly generateClients: (config: TConfig, options: Record<string, unknown>) => Promise<void>;
  readonly transformUnifiedConfig?: (
    unified: UnifiedGeneratorConfig,
    context: GenxTemplateContext,
  ) => Promise<TConfig> | TConfig;
  readonly validateConfig?: (config: TConfig) => Promise<void> | void;
  readonly planGeneration?: (
    config: TConfig,
    context: GenxTemplateContext,
  ) => Promise<TemplateGenerationPlan> | TemplateGenerationPlan;
}

const TemplateCapabilitySchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    description: z.string().min(1),
    classification: z.enum(["universal", "template-first-class", "escape-hatch"]),
    configPaths: z.array(z.string().min(1)).min(1),
  })
  .strict();

const TemplateCapabilityManifestSchema = z
  .object({
    summary: z.string().min(1),
    capabilities: z.array(TemplateCapabilitySchema),
  })
  .strict();

const TemplatePlannedDependencySchema = z
  .object({
    name: z.string().min(1),
    section: z.enum([
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ]),
    reason: z.string().min(1),
  })
  .strict();

const TemplateDocumentationHintSchema = z
  .object({
    title: z.string().min(1),
    body: z.string().min(1),
  })
  .strict();

const TemplateOutputMetadataSchema = z
  .object({
    configFiles: z.array(z.string().min(1)).optional(),
    entrypoints: z.array(z.string().min(1)).optional(),
    notes: z.array(z.string().min(1)).optional(),
  })
  .strict();

const TemplateGenerationPlanSchema = z
  .object({
    selectedCapabilities: z.array(z.string().min(1)),
    dependencies: z.array(TemplatePlannedDependencySchema),
    documentationHints: z.array(TemplateDocumentationHintSchema).optional(),
    output: TemplateOutputMetadataSchema.optional(),
  })
  .strict();

export function validateTemplateCapabilityManifest(
  templateName: string,
  manifest: unknown,
): TemplateCapabilityManifest {
  const parsed = TemplateCapabilityManifestSchema.parse(manifest);
  const keys = new Set<string>();

  for (const capability of parsed.capabilities) {
    if (keys.has(capability.key)) {
      throw new Error(
        `Template "${templateName}" declares duplicate capability key "${capability.key}".`,
      );
    }
    keys.add(capability.key);
  }

  return parsed;
}

export function validateTemplateGenerationPlan(
  templateName: string,
  manifest: TemplateCapabilityManifest,
  plan: unknown,
): TemplateGenerationPlan {
  const parsed = TemplateGenerationPlanSchema.parse(plan);
  const manifestKeys = new Set(manifest.capabilities.map((capability) => capability.key));

  for (const capability of parsed.selectedCapabilities) {
    if (!manifestKeys.has(capability)) {
      throw new Error(
        `Template "${templateName}" selected unknown capability "${capability}" in planGeneration(). Declare it in capabilityManifest first.`,
      );
    }
  }

  return parsed;
}
