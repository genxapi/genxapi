import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveContractSources } from "./resolveContractSources";

const tempDirs: string[] = [];

afterEach(async () => {
  delete process.env["OPENAPI_TOKEN"];
  vi.restoreAllMocks();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("resolveContractSources", () => {
  it("snapshots local contracts and calculates checksums when requested", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "genxapi-contracts-"));
    tempDirs.push(workspace);
    const configDir = join(workspace, "config");
    const projectDir = join(workspace, "project");
    await fs.ensureDir(join(configDir, "specs"));
    await writeFile(
      join(configDir, "specs", "pets.yaml"),
      ["openapi: 3.0.0", "info:", "  title: Pets API", "  version: 1.2.3", "paths: {}", ""].join(
        "\n",
      ),
      "utf8",
    );

    const resolved = await resolveContractSources({
      configDir,
      projectDir,
      clients: [
        {
          name: "pets",
          contract: {
            source: "./specs/pets.yaml",
            checksum: true,
            snapshot: {
              path: ".genxapi/contracts/pets.yaml",
            },
          },
        },
      ],
    });

    expect(resolved.pets.type).toBe("local");
    expect(resolved.pets.generatorInput).toBe(".genxapi/contracts/pets.yaml");
    expect(resolved.pets.checksum?.algorithm).toBe("sha256");
    expect(resolved.pets.info?.title).toBe("Pets API");
    expect(await readFile(join(projectDir, ".genxapi/contracts/pets.yaml"), "utf8")).toContain(
      "Pets API",
    );
  });

  it("fetches authenticated remote contracts without leaking secret values into metadata", async () => {
    let receivedAuthHeader: string | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      receivedAuthHeader = (init?.headers as Record<string, string> | undefined)?.Authorization;
      return new Response(
        JSON.stringify({
          openapi: "3.0.0",
          info: {
            title: "Secure API",
            version: "9.9.9",
          },
          paths: {},
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            etag: '"abc123"',
            "last-modified": "Sun, 08 Mar 2026 12:00:00 GMT",
          },
        },
      );
    });

    process.env["OPENAPI_TOKEN"] = "super-secret-token";

    const workspace = await mkdtemp(join(tmpdir(), "genxapi-contracts-"));
    tempDirs.push(workspace);
    const projectDir = join(workspace, "project");

    const resolved = await resolveContractSources({
      configDir: workspace,
      projectDir,
      clients: [
        {
          name: "secure",
          contract: {
            source: "https://api.example.com/openapi.json",
            auth: {
              type: "bearer",
              tokenEnv: "OPENAPI_TOKEN",
            },
            checksum: {
              algorithm: "sha512",
            },
            snapshot: {
              path: "contracts/secure.json",
            },
          },
        },
      ],
    });

    expect(receivedAuthHeader).toBe("Bearer super-secret-token");
    expect(resolved.secure.generatorInput).toBe("contracts/secure.json");
    expect(resolved.secure.checksum?.algorithm).toBe("sha512");
    expect(resolved.secure.metadata.auth).toEqual({
      type: "bearer",
      tokenEnv: "OPENAPI_TOKEN",
      scheme: "Bearer",
    });
    expect(JSON.stringify(resolved.secure)).not.toContain("super-secret-token");
    expect(await readFile(join(projectDir, "contracts/secure.json"), "utf8")).toContain(
      "Secure API",
    );
  });

  it("rejects authenticated remote contracts when snapshotting is disabled", async () => {
    process.env["OPENAPI_TOKEN"] = "super-secret-token";
    const workspace = await mkdtemp(join(tmpdir(), "genxapi-contracts-"));
    tempDirs.push(workspace);

    await expect(
      resolveContractSources({
        configDir: workspace,
        projectDir: join(workspace, "project"),
        clients: [
          {
            name: "secure",
            contract: {
              source: "https://api.example.com/openapi.json",
              auth: {
                type: "bearer",
                tokenEnv: "OPENAPI_TOKEN",
              },
              snapshot: false,
            },
          },
        ],
      }),
    ).rejects.toThrow(/must be snapshotted/);
  });

  it("does not write snapshots during dry-run planning", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "genxapi-contracts-"));
    tempDirs.push(workspace);
    const configDir = join(workspace, "config");
    const projectDir = join(workspace, "project");
    await fs.ensureDir(join(configDir, "specs"));
    await writeFile(
      join(configDir, "specs", "pets.yaml"),
      ["openapi: 3.0.0", "info:", "  title: Pets API", "  version: 1.2.3", "paths: {}", ""].join(
        "\n",
      ),
      "utf8",
    );

    const resolved = await resolveContractSources({
      configDir,
      projectDir,
      writeSnapshots: false,
      clients: [
        {
          name: "pets",
          contract: {
            source: "./specs/pets.yaml",
            snapshot: {
              path: ".genxapi/contracts/pets.yaml",
            },
          },
        },
      ],
    });

    expect(resolved.pets.generatorInput).toBe(".genxapi/contracts/pets.yaml");
    expect(await fs.pathExists(join(projectDir, ".genxapi/contracts/pets.yaml"))).toBe(false);
  });
});
