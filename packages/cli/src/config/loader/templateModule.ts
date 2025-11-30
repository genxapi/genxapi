import { z } from "zod";

export interface TemplateModule {
  readonly name: string;
  readonly schema: z.ZodObject<any>;
  readonly generateClients: (config: unknown, options: Record<string, unknown>) => Promise<void>;
}

export async function loadTemplateModule(name: string): Promise<TemplateModule> {
  try {
    const mod = await import(name);
    const schema = mod.MultiClientConfigSchema;
    const generateClients = mod.generateClients;
    if (!schema || typeof schema.extend !== "function") {
      throw new Error(`Template "${name}" does not export MultiClientConfigSchema.`);
    }
    if (typeof generateClients !== "function") {
      throw new Error(`Template "${name}" does not export generateClients.`);
    }
    return {
      name,
      schema,
      generateClients
    };
  } catch (error) {
    throw new Error(
      `Failed to load template "${name}". Ensure it is installed and exports MultiClientConfigSchema + generateClients. Reason: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
