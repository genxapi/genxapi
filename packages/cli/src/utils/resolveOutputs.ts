import { join } from "pathe";
import { UnifiedClientOutputInput } from "src/types/types";

function resolveWorkspace(base: string | undefined, clientName: string): string {
  if (!base) {
    return join("./src", clientName);
  }
  return join(base, clientName);
}

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