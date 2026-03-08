import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "fs-extra";
import { rollup } from "rollup";
import { generateClients } from "./generator.js";
import { MultiClientConfigSchema } from "./types.js";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const templateDir = join(packageRoot, "src/template");
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function buildTemplateFixture(tempDir: string) {
  const previousCwd = process.cwd();
  process.chdir(tempDir);
  try {
    const configModule = await import(pathToFileURL(join(tempDir, "rollup.config.mjs")).href);
    const configs = Array.isArray(configModule.default)
      ? configModule.default
      : [configModule.default];

    for (const config of configs) {
      const bundle = await rollup(config);
      try {
        const outputs = Array.isArray(config.output) ? config.output : [config.output];
        for (const output of outputs) {
          await bundle.write(output);
        }
      } finally {
        await bundle.close();
      }
    }
  } finally {
    process.chdir(previousCwd);
  }
}

describe("template-orval scaffold", () => {
  it("builds root declarations that consumers can import from the package name", async () => {
    const tempDir = await mkdtemp(join(packageRoot, ".tmp-template-build-"));
    tempDirs.push(tempDir);

    await fs.copy(templateDir, tempDir, { overwrite: true, dereference: true });

    await fs.ensureDir(join(tempDir, "src/pets/model"));
    await fs.ensureDir(join(tempDir, "src/store/model"));

    await writeFile(
      join(tempDir, "src/pets/client.ts"),
      [
        "import type { Pet } from \"./model\";",
        "",
        "export interface ListPetsOptions {",
        "  limit?: number;",
        "}",
        "",
        "export const listPets = (_options?: ListPetsOptions): Pet[] => [];",
        "",
      ].join("\n"),
    );
    await writeFile(
      join(tempDir, "src/pets/model/index.ts"),
      ["export interface Pet {", "  id: number;", "  name: string;", "}", ""].join("\n"),
    );
    await writeFile(
      join(tempDir, "src/pets/index.ts"),
      ["export * from \"./client\";", "export * from \"./model\";", ""].join("\n"),
    );

    await writeFile(
      join(tempDir, "src/store/client.ts"),
      [
        "import type { Order } from \"./model\";",
        "",
        "export interface ListOrdersOptions {",
        "  page?: number;",
        "}",
        "",
        "export const listOrders = (_options?: ListOrdersOptions): Order[] => [];",
        "",
      ].join("\n"),
    );
    await writeFile(
      join(tempDir, "src/store/model/index.ts"),
      ["export interface Order {", "  id: number;", "  total: number;", "}", ""].join("\n"),
    );
    await writeFile(
      join(tempDir, "src/store/index.ts"),
      ["export * from \"./client\";", "export * from \"./model\";", ""].join("\n"),
    );
    await writeFile(
      join(tempDir, "src/index.ts"),
      ["export * as pets from \"./pets\";", "export * as store from \"./store\";", ""].join("\n"),
    );

    await buildTemplateFixture(tempDir);

    const typesBundle = await readFile(join(tempDir, "dist/index.d.ts"), "utf8");
    expect(typesBundle).toContain("ListPetsOptions");
    expect(typesBundle).toContain("Pet");
    expect(typesBundle).toContain("Order");
    expect(typesBundle).toMatch(/export \{ .* as pets, .* as store \};/);
  });

  it("removes stale declaration artifacts when regenerating an SDK", async () => {
    const configRoot = await mkdtemp(join(packageRoot, ".tmp-template-generate-"));
    tempDirs.push(configRoot);

    const projectDir = join(configRoot, "sdk");
    await fs.ensureDir(join(projectDir, "src/runtime"));
    await writeFile(
      join(projectDir, "src/index.d.ts"),
      "export * from \"./runtime/create-client\";\n",
    );
    await writeFile(
      join(projectDir, "src/runtime/create-client.d.ts"),
      "export interface CreateClientOptions {}\n",
    );

    await generateClients(
      MultiClientConfigSchema.parse({
        project: {
          name: "fixture-sdk",
          directory: "./sdk",
          packageManager: "npm",
          runGenerate: false,
          template: {
            name: "@genxapi/template-orval",
            installDependencies: false,
            variables: {},
          },
        },
        clients: [
          {
            name: "pets",
            swagger: "./petstore.yaml",
            output: {
              workspace: "./src/pets",
              target: "./src/pets/client.ts",
              schemas: "model",
            },
            templateVariables: {},
            orval: {
              mode: "split",
              client: "react-query",
              baseUrl: "http://localhost:3000",
              mock: false,
              prettier: true,
              clean: true,
            },
            copySwagger: false,
            swaggerCopyTarget: "swagger-spec.json",
          },
        ],
        hooks: {
          beforeGenerate: [],
          afterGenerate: [],
        },
      }),
      {
        configDir: configRoot,
        logger: { info() {}, warn() {}, error() {} },
        runOrval: false,
      },
    );

    expect(await fs.pathExists(join(projectDir, "src/index.d.ts"))).toBe(false);
    expect(await fs.pathExists(join(projectDir, "src/runtime/create-client.d.ts"))).toBe(false);
  });
});
