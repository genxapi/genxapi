import { HttpClientValue, OrvalClientAdapterValue, OrvalModeValue } from "./unifiedConfig.js";

export interface TemplateOverrides {
  httpClient?: HttpClientValue;
  client?: OrvalClientAdapterValue;
  mode?: OrvalModeValue;
  baseUrl?: string;
  prettier?: boolean;
  clean?: boolean;
  packageManager?: "npm" | "pnpm" | "yarn" | "bun";
  publish?: {
    npm?: {
      enabled?: boolean;
      tag?: string;
      access?: "public" | "restricted";
      dryRun?: boolean;
      tokenEnv?: string;
      registry?: string;
      command?: "npm" | "pnpm" | "yarn" | "bun";
    };
  };
  mock?: {
    type?: string | null;
    delay?: number | null;
    useExamples?: boolean | null;
    enabled?: boolean;
  };
}
