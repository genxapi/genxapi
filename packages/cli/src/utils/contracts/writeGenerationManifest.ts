import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cleanUndefined } from "../cleanUndefined";
import type { ResolvedContractSource } from "./resolveContractSources";

interface ManifestClientOutput {
  readonly workspace?: string;
  readonly target?: string;
  readonly schemas?: string;
}

interface ManifestClientShape {
  readonly name: string;
  readonly output?: ManifestClientOutput;
  readonly orval?: Record<string, unknown>;
  readonly kubb?: Record<string, unknown>;
}

export interface WriteGenerationManifestOptions {
  readonly projectDir: string;
  readonly templateName: string;
  readonly templateKind: string;
  readonly toolVersion?: string;
  readonly generatedAt: string;
  readonly projectName: string;
  readonly projectDirectory: string;
  readonly clients: readonly ManifestClientShape[];
  readonly resolvedContracts: Record<string, ResolvedContractSource>;
}

export async function writeGenerationManifest(
  options: WriteGenerationManifestOptions
): Promise<void> {
  const manifest = {
    schemaVersion: 1,
    generatedAt: options.generatedAt,
    tool: {
      name: "@genxapi/cli",
      version: options.toolVersion ?? "unknown"
    },
    template: {
      kind: options.templateKind,
      name: options.templateName
    },
    project: {
      name: options.projectName,
      directory: options.projectDirectory
    },
    clients: options.clients.map((client) => {
      const resolvedContract = options.resolvedContracts[client.name];
      return {
        name: client.name,
        contract: {
          source: resolvedContract.source,
          type: resolvedContract.type,
          resolvedSource: resolvedContract.resolvedSource,
          generatorInput: resolvedContract.generatorInput,
          snapshot: resolvedContract.snapshot,
          checksum: resolvedContract.checksum,
          metadata: resolvedContract.metadata
        },
        output: client.output,
        selectedFeatures: buildSelectedFeatures(options.templateKind, client)
      };
    })
  };

  await writeFile(
    join(options.projectDir, "genxapi.manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
}

function buildSelectedFeatures(templateKind: string, client: ManifestClientShape): Record<string, unknown> | undefined {
  if (templateKind === "orval" && client.orval) {
    return cleanUndefined({
      mode: client.orval.mode,
      client: client.orval.client,
      httpClient: client.orval.httpClient,
      baseUrl: client.orval.baseUrl,
      mock: client.orval.mock,
      prettier: client.orval.prettier,
      clean: client.orval.clean
    });
  }

  if (templateKind === "kubb" && client.kubb) {
    return cleanUndefined({
      client: client.kubb.client,
      ts: client.kubb.ts,
      oas: client.kubb.oas
    });
  }

  return undefined;
}
