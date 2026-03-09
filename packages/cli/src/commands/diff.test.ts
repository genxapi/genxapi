import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runDiffCommand } from "./diff";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("runDiffCommand", () => {
  it("renders a human-readable diff report with classification guidance", async () => {
    const dir = await mkdtemp(join(tmpdir(), "genxapi-diff-"));
    tempDirs.push(dir);
    const basePath = join(dir, "base.json");
    const headPath = join(dir, "head.json");

    await writeContracts(basePath, headPath);

    const logger = createLogger();
    const report = await runDiffCommand({
      base: "./base.json",
      head: "./head.json",
      cwd: dir,
      logger,
      format: "text",
      toolVersion: "0.2.0",
    });

    expect(report.result.classification.changeLevel).toBe("additive");
    expect(report.result.classification.releaseSignal.level).toBe("candidate-minor");
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("GenX API contract diff"));
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Next steps:"));
  });

  it("writes JSON diff output and a release manifest", async () => {
    const dir = await mkdtemp(join(tmpdir(), "genxapi-diff-"));
    tempDirs.push(dir);
    const basePath = join(dir, "base.json");
    const headPath = join(dir, "head.json");
    const outputPath = join(dir, "reports", "diff.json");
    const manifestPath = join(dir, "reports", "release.json");

    await writeContracts(basePath, headPath);

    const report = await runDiffCommand({
      base: basePath,
      head: headPath,
      logger: createLogger(),
      format: "json",
      outputFile: outputPath,
      releaseManifestOutputFile: manifestPath,
      toolVersion: "0.2.0",
    });

    const output = JSON.parse(await readFile(outputPath, "utf8")) as any;
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as any;

    expect(output.result.classification.changeLevel).toBe("additive");
    expect(output.base.source).toBe(basePath);
    expect(manifest.diff.result.summary).toBe(report.result.summary);
    expect(manifest.release.classification.releaseSignal.level).toBe("candidate-minor");
  });
});

async function writeContracts(basePath: string, headPath: string): Promise<void> {
  await writeFile(
    basePath,
    JSON.stringify(
      {
        openapi: "3.0.3",
        info: {
          title: "Pets API",
          version: "1.0.0",
        },
        paths: {
          "/pets": {
            get: {
              operationId: "listPets",
              responses: {
                "200": {
                  description: "ok",
                },
              },
            },
          },
        },
      },
      null,
      2,
    ),
    "utf8",
  );

  await writeFile(
    headPath,
    JSON.stringify(
      {
        openapi: "3.0.3",
        info: {
          title: "Pets API",
          version: "1.1.0",
        },
        paths: {
          "/pets": {
            get: {
              operationId: "listPets",
              responses: {
                "200": {
                  description: "ok",
                },
              },
            },
          },
          "/pets/{id}": {
            get: {
              operationId: "getPet",
              responses: {
                "200": {
                  description: "ok",
                },
              },
            },
          },
        },
      },
      null,
      2,
    ),
    "utf8",
  );
}

function createLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setLevel: vi.fn(),
  } as any;
}
