import { readFile, writeFile } from "node:fs/promises";
import { extname, join } from "pathe";
import { globby } from "globby";
import type { MultiClientConfig } from "../types.js";
import { TEXT_EXTENSIONS } from "./constants.js";

export async function applyTemplateVariables(projectDir: string, config: MultiClientConfig) {
  const replacements = new Map<string, string>([
    ["__PROJECT_NAME__", config.project.name]
  ]);

  for (const [key, value] of Object.entries(config.project.template.variables ?? {})) {
    replacements.set(`__${key.toUpperCase()}__`, value);
  }

  const files = await globby(["**/*"], {
    cwd: projectDir,
    dot: true,
    onlyFiles: true
  });

  await Promise.all(
    files.map(async (file) => {
      const fullPath = join(projectDir, file);
      const extension = extname(file);
      if (extension && !TEXT_EXTENSIONS.has(extension)) {
        return;
      }
      const data = await readFile(fullPath, "utf8").catch(() => null);
      if (!data) return;
      let updated = data;
      for (const [token, value] of replacements) {
        updated = updated.replaceAll(token, value);
      }
      if (updated !== data) {
        await writeFile(fullPath, updated);
      }
    })
  );
}
