import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeGenerationManifest } from "./writeGenerationManifest";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("writeGenerationManifest", () => {
  it("writes traceable generation metadata for the generated package", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "genxapi-manifest-"));
    tempDirs.push(projectDir);

    await writeGenerationManifest({
      clients: [
        {
          name: "pets",
          output: {
            workspace: "./src/pets",
            target: "./src/pets/client.ts",
            schemas: "./src/pets/model",
          },
          orval: {
            mode: "split",
            client: "react-query",
            httpClient: "fetch",
            mock: false,
          },
        },
      ],
      generatedAt: "2026-03-08T12:00:00.000Z",
      contractVersion: "2026.03.09",
      projectDir,
      projectDirectory: "./sdk/pets",
      projectName: "pets-sdk",
      resolvedContracts: {
        pets: {
          source: "https://user:secret@api.example.com/openapi.json",
          type: "remote",
          resolvedSource: "https://user:secret@api.example.com/openapi.json",
          generatorInput: ".genxapi/contracts/pets.json",
          snapshot: {
            enabled: true,
            path: ".genxapi/contracts/pets.json",
          },
          checksum: {
            algorithm: "sha256",
            value: "abc123",
          },
          metadata: {
            fetchedAt: "2026-03-08T12:00:00.000Z",
            etag: '"abc123"',
            sizeBytes: 256,
          },
          info: {
            title: "Pets API",
            version: "1.0.0",
            source: "https://api.example.com/openapi.json",
          },
        },
      },
      templateKind: "orval",
      templateName: "@genxapi/template-orval",
      toolVersion: "0.2.0",
    });

    const manifest = JSON.parse(
      await readFile(join(projectDir, "genxapi.manifest.json"), "utf8"),
    ) as any;

    expect(manifest.tool).toEqual({
      name: "@genxapi/cli",
      version: "0.2.0",
    });
    expect(manifest.contractVersion).toBe("2026.03.09");
    expect(manifest.template).toEqual({
      kind: "orval",
      name: "@genxapi/template-orval",
    });
    expect(manifest.clients[0].contract.source).toBe("https://api.example.com/openapi.json");
    expect(manifest.clients[0].contract.snapshot.path).toBe(".genxapi/contracts/pets.json");
    expect(manifest.clients[0].selectedFeatures).toEqual({
      mode: "split",
      client: "react-query",
      httpClient: "fetch",
      mock: false,
    });
  });
});
