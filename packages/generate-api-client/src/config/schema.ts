import { z } from "zod";
import { MultiClientConfigSchema } from "@eduardoac/api-client-template";

export const CliConfigSchema = MultiClientConfigSchema.extend({
  logLevel: z.enum(["silent", "error", "warn", "info", "debug"]).default("info")
});

export type CliConfig = z.infer<typeof CliConfigSchema>;
