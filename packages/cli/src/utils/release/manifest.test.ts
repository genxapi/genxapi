import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeReleaseManifest } from "./manifest";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("writeReleaseManifest", () => {
  it("merges diff and generation metadata into one release manifest", async () => {
    const dir = await mkdtemp(join(tmpdir(), "genxapi-release-"));
    tempDirs.push(dir);
    const manifestPath = join(dir, "genxapi.release.json");

    await writeReleaseManifest({
      filePath: manifestPath,
      generatedAt: "2026-03-09T10:00:00.000Z",
      toolVersion: "0.2.0",
      diffReport: {
        schemaVersion: 1,
        generatedAt: "2026-03-09T10:00:00.000Z",
        tool: {
          name: "@genxapi/cli",
          version: "0.2.0",
        },
        base: {
          source: "./base.json",
          resolvedSource: "/tmp/base.json",
          type: "local",
          metadata: {
            sizeBytes: 100,
          },
          info: {
            source: "./base.json",
            version: "1.0.0",
          },
        },
        head: {
          source: "./head.json",
          resolvedSource: "/tmp/head.json",
          type: "local",
          metadata: {
            sizeBytes: 120,
          },
          info: {
            source: "./head.json",
            version: "1.1.0",
          },
        },
        result: {
          type: "feat",
          summary: "feat(api): GET /pets/{id}",
          diff: {
            additions: ["operation GET /pets/{id}"],
            removals: [],
            modifications: [],
            docChanges: [],
          },
          classification: {
            schemaVersion: 1,
            changeLevel: "additive",
            summaryType: "feat",
            counts: {
              additions: 1,
              removals: 0,
              modifications: 0,
              docChanges: 0,
            },
            releaseSignal: {
              level: "candidate-minor",
              suggestedVersionBump: "minor",
              semverAutomationSupported: false,
              requiresManualReview: true,
            },
          },
        },
        nextSteps: [
          {
            id: "run-generate-after-additive-diff",
            label: "Run generate after diff.",
            kind: "generate",
            automated: false,
          },
        ],
      },
    });

    await writeReleaseManifest({
      filePath: manifestPath,
      generatedAt: "2026-03-09T11:00:00.000Z",
      toolVersion: "0.2.0",
      contractVersion: "backend-sha-123",
      project: {
        name: "pets-sdk",
        directory: "./sdk/pets",
      },
      template: {
        kind: "orval",
        name: "@genxapi/template-orval",
      },
      generationReport: {
        schemaVersion: 1,
        dryRun: true,
        generatedAt: "2026-03-09T11:00:00.000Z",
        contractVersion: "backend-sha-123",
        tool: {
          name: "@genxapi/cli",
          version: "0.2.0",
        },
        template: {
          kind: "orval",
          name: "@genxapi/template-orval",
          displayName: "Orval API Client Template",
          summary: "Orval template",
        },
        project: {
          name: "pets-sdk",
          directory: "./sdk/pets",
          absoluteDirectory: "/tmp/sdk/pets",
          packageManager: "npm",
          runGenerate: true,
        },
        manifest: {
          path: "/tmp/sdk/pets/genxapi.manifest.json",
        },
        templatePlan: {
          selectedCapabilities: [],
          dependencies: [],
        },
        clients: [
          {
            name: "pets",
            contract: {
              source: "./head.json",
              resolvedSource: "/tmp/head.json",
              type: "local",
              generatorInput: "./head.json",
              snapshot: {
                enabled: false,
              },
              info: {
                source: "./head.json",
                version: "1.1.0",
              },
              metadata: {
                sizeBytes: 120,
              },
            },
            output: {
              target: "./src/pets/client.ts",
            },
          },
        ],
        plannedActions: [],
        nextSteps: [
          {
            id: "review-generated-output",
            label: "Review generated output.",
            kind: "review",
            automated: false,
          },
        ],
      },
    });

    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as any;

    expect(manifest.contractVersion).toBe("backend-sha-123");
    expect(manifest.diff.result.classification.changeLevel).toBe("additive");
    expect(manifest.generation.manifestPath).toBe("/tmp/sdk/pets/genxapi.manifest.json");
    expect(manifest.release.nextSteps).toHaveLength(2);
  });
});
