import { join } from "pathe";
import { UnifiedClientOutputInput } from "src/types";

/**
 * Builds the default workspace directory for a client.
 *
 * @param base - Project-level output directory, if provided.
 * @param clientName - Name of the client.
 * @returns Resolved workspace path.
 */
function resolveWorkspace(base: string | undefined, clientName: string): string {
  if (!base) {
    return join("./src", clientName);
  }
  return join(base, clientName);
}

/**
 * Resolves output paths for a client by combining project defaults and client overrides.
 *
 * @param projectOutput - Project-level output base.
 * @param clientOutput - Client-specific output overrides.
 * @param clientName - Name of the client.
 * @returns Resolved workspace, target, and schemas paths.
 */
export function resolveOutputs(
  projectOutput: string | undefined,
  clientOutput: UnifiedClientOutputInput | undefined,
  clientName: string
) {
  const output = clientOutput ?? {};
  const workspace = output.workspace ?? resolveWorkspace(projectOutput, clientName);
  const target = output.target ?? join(workspace, "client.ts");
  const schemas = output.schemas ?? join(workspace, "model");
  return { workspace, target, schemas };
}
