import { writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import fs from "fs-extra";
import { loadContractDocument } from "../utils/contracts";
import { writeReleaseManifest } from "../utils/release";
import { analyzeSwaggerDiff } from "../utils/swaggerDiff";
import {
  buildContractDiffReport,
  renderContractDiffReport,
  type ContractDiffReport,
} from "../utils/swaggerDiff/report";
import type { Logger } from "../utils/logger";

export interface DiffCommandOptions {
  readonly base: string;
  readonly head: string;
  readonly logger: Logger;
  readonly cwd?: string;
  readonly format?: "text" | "json";
  readonly outputFile?: string;
  readonly releaseManifestOutputFile?: string;
  readonly toolVersion?: string;
}

export async function runDiffCommand(options: DiffCommandOptions): Promise<ContractDiffReport> {
  const generatedAt = new Date().toISOString();
  const base = await loadContractDocument({
    source: options.base,
    cwd: options.cwd,
    logger: options.logger,
    label: "base",
  });
  const head = await loadContractDocument({
    source: options.head,
    cwd: options.cwd,
    logger: options.logger,
    label: "head",
  });
  const result = analyzeSwaggerDiff(base.document, head.document);
  const report = buildContractDiffReport({
    base,
    head,
    generatedAt,
    toolVersion: options.toolVersion,
    result,
  });
  const format = options.format ?? "text";

  if (options.outputFile) {
    await writeOutputFile(options.outputFile, format === "json" ? JSON.stringify(report, null, 2) : renderContractDiffReport(report));
    options.logger.info(`Contract diff output written to ${options.outputFile}.`);
  }

  if (options.releaseManifestOutputFile) {
    await writeReleaseManifest({
      filePath: options.releaseManifestOutputFile,
      generatedAt,
      toolVersion: options.toolVersion,
      diffReport: report,
    });
    options.logger.info(`Release manifest written to ${options.releaseManifestOutputFile}.`);
  }

  if (!options.outputFile || format === "text") {
    if (format === "json") {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    } else {
      options.logger.info(renderContractDiffReport(report).trimEnd());
    }
  }

  return report;
}

async function writeOutputFile(filePath: string, contents: string): Promise<void> {
  await fs.ensureDir(dirname(filePath));
  await writeFile(filePath, `${contents.trimEnd()}\n`, "utf8");
}
