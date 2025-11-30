import { UnifiedClientOptions, UnifiedGeneratorConfig } from "src/types/types";
import { cleanUndefined } from "src/utils/cleanUndefined";
import { createTemplateOptions } from "src/utils/creteTemplateOptions";
import { mergeOptions } from "src/utils/mergeOptions";
import { resolveOutputs } from "src/utils/resolveOutputs";
import { normaliseMockValue } from "src/utils/normaliseMockValue";

import type {
  ClientConfig as OrvalClientConfig,
  MultiClientConfig as OrvalMultiClientConfig,
  ProjectConfig as OrvalProjectConfig
} from "@genxapi/template-orval";

export type {
  ClientConfig as OrvalClientConfig,
  MultiClientConfig as OrvalMultiClientConfig,
  ProjectConfig as OrvalProjectConfig
} from "@genxapi/template-orval";

export function buildOrvalConfig(
  unified: UnifiedGeneratorConfig,
  templatePackage: string
): OrvalMultiClientConfig {
  const projectOptions = unified.project.config ?? {};
  const projectOutput = unified.project.output;

  const projectTemplate = createTemplateOptions(
    templatePackage,
    unified.project.templateOptions
  );

  const projectPublish = unified.project.publish as OrvalProjectConfig["publish"] | undefined;
  const projectRepository = unified.project.repository as OrvalProjectConfig["repository"] | undefined;

  const projectConfig = cleanUndefined({
    name: unified.project.name,
    directory: unified.project.directory,
    packageManager: unified.project.packageManager,
    runGenerate: unified.project.runGenerate ?? true,
    template: projectTemplate,
    repository: projectRepository,
    publish: projectPublish,
    readme: unified.project.readme
  }) as OrvalProjectConfig;

  const clients: OrvalClientConfig[] = unified.clients.map((client) => {
    const mergedOptions = mergeOptions<UnifiedClientOptions>(
      projectOptions,
      client.config ?? {}
    );
    const outputs = resolveOutputs(projectOutput, client.output ?? {}, client.name);

    const mockValue = normaliseMockValue(mergedOptions.mock);

    const orvalOptions = cleanUndefined({
      mode: mergedOptions.mode,
      client: mergedOptions.client,
      httpClient: mergedOptions.httpClient,
      baseUrl: mergedOptions.baseUrl,
      mock: mockValue,
      prettier: mergedOptions.prettier,
      clean: mergedOptions.clean
    });

    return {
      name: client.name,
      swagger: client.swagger,
      output: outputs,
      orval: orvalOptions
    } as OrvalClientConfig;
  });

  return {
    project: projectConfig,
    clients,
    hooks: unified.hooks ?? { beforeGenerate: [], afterGenerate: [] }
  };
}