import { createServer, type Server } from "node:http";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "pathe";
import { execa } from "execa";
import fs from "fs-extra";
import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";

const CLI_BIN = fileURLToPath(new URL("../../dist/index.js", import.meta.url));

describe.sequential("assest end to end kubb", () => {
  let server: Server | undefined;
  let baseUrl: string;
  let projectDir: string;
  let workspaceDir: string;

  beforeAll(async () => {
    ({ server, baseUrl } = await startServer());
    const { configPath, projectPath, workspace } = await prepareWorkspace(baseUrl);
    projectDir = projectPath;
    workspaceDir = workspace;

    const result = await execa(
      "node",
      [
        CLI_BIN,
        "generate",
        "--config",
        configPath,
        "--target",
        projectDir,
        "--log-level",
        "silent",
        "--template",
        "kubb",
        "--http-client",
        "fetch",
        "--base-url",
        baseUrl,
        "--mock-type",
        "off"
      ],
      { cwd: workspaceDir, stdio: "pipe" }
    );

    if (result.stdout) {
      console.log(result.stdout);
    }
    if (result.stderr) {
      console.error(result.stderr);
    }

    const clientPath = join(projectDir, "src/pets/client.ts");
    if (!(await fs.pathExists(clientPath))) {
      throw new Error(`Expected generated client at ${clientPath}`);
    }
  }, 180000);

  afterAll(async () => {
    server?.close();
    if (workspaceDir) {
      await fs.remove(workspaceDir);
    }
  });

  it("imports the generated pets client and performs a request", async () => {
    vi.doMock("@kubb/plugin-client/clients/fetch", () => ({ default: fetch }));

    const clientModule = await import(
      pathToFileURL(join(projectDir, "src/pets/client.ts")).href
    );

    const getPets =
      (clientModule as any).getPets ??
      (clientModule as any).listPets ??
      Object.values(clientModule).find((value) => typeof value === "function");

    expect(typeof getPets).toBe("function");

    const response = await (getPets as any)();
    const payload = (response as any)?.data ?? response;
    expect(payload).toEqual([{ id: 1, name: "Fido" }]);
  }, 120000);
});

async function startServer(): Promise<{ server: Server; baseUrl: string }> {
  const srv = createServer((req, res) => {
    if (req.url === "/pets" && req.method === "GET") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify([{ id: 1, name: "Fido" }]));
      return;
    }
    res.statusCode = 404;
    res.end();
  });

  await new Promise<void>((resolve) => srv.listen(0, "127.0.0.1", resolve));
  const address = srv.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind test server");
  }
  return { server: srv, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function prepareWorkspace(baseUrl: string): Promise<{
  configPath: string;
  projectPath: string;
  workspace: string;
}> {
  const workspace = await mkdtemp(join(tmpdir(), "genxapi-kubb-e2e-"));
  const specsDir = join(workspace, "specs");
  await fs.ensureDir(specsDir);
  const specPath = join(specsDir, "petstore.json");

  await writeFile(
    specPath,
    JSON.stringify(
      {
        openapi: "3.0.0",
        info: { title: "Pets", version: "1.0.0" },
        paths: {
          "/pets": {
            get: {
              operationId: "getPets",
              responses: {
                "200": {
                  description: "ok",
                  content: {
                    "application/json": {
                      schema: {
                        type: "array",
                        items: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" } } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      null,
      2
    ),
    "utf8"
  );

  const projectPath = join(workspace, "kubb-generated");
  const configPath = join(workspace, "genxapi.config.json");
  const config = {
    $schema: "https://raw.githubusercontent.com/genxapi/genxapi/main/schemas/genxapi.schema.json",
    logLevel: "info",
    project: {
      name: "kubb-e2e",
      directory: "./kubb-generated",
      packageManager: "npm",
      template: "kubb",
      templateOptions: { installDependencies: true },
      runGenerate: true,
      output: "./src",
      config: {
        baseUrl,
        httpClient: "fetch",
        mock: { type: "off" }
      }
    },
    clients: [
      {
        name: "pets",
        swagger: "./specs/petstore.json",
        output: {
          workspace: "./src/pets",
          target: "./src/pets/client.ts",
          schemas: "./src/pets/model"
        },
        config: {
          baseUrl,
          httpClient: "fetch",
          mock: { type: "off" }
        }
      }
    ],
    hooks: { beforeGenerate: [], afterGenerate: [] }
  };

  await writeFile(configPath, JSON.stringify(config, null, 2), "utf8");

  return { configPath, projectPath, workspace };
}
