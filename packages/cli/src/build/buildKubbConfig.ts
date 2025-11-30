import { UnifiedClientOptions, UnifiedGeneratorConfig } from "src/types/types";
import { cleanUndefined } from "src/utils/cleanUndefined";
import { mergeOptions } from "src/utils/mergeOptions";
import { resolveOutputs } from "src/utils/resolveOutputs";
import { createTemplateOptions } from "src/utils/creteTemplateOptions";

import type {
  ClientConfig as KubbClientConfig,
  MultiClientConfig as KubbMultiClientConfig,
  ProjectConfig as KubbProjectConfig
} from "@genxapi/template-kubb";

export type {
  ClientConfig as KubbClientConfig,
  MultiClientConfig as KubbMultiClientConfig,
  ProjectConfig as KubbProjectConfig
} from "@genxapi/template-kubb";

export function buildKubbConfig(
  unified: UnifiedGeneratorConfig,
  templatePackage: string
): KubbMultiClientConfig {
  const projectOptions = unified.project.config ?? {};
  const projectOutput = unified.project.output;

  const projectTemplate = createTemplateOptions(
    templatePackage,
    unified.project.templateOptions
  );

  const projectPublish = unified.project.publish as KubbProjectConfig["publish"] | undefined;
  const projectRepository = unified.project.repository as KubbProjectConfig["repository"] | undefined;

  const projectConfig = cleanUndefined({
    name: unified.project.name,
    directory: unified.project.directory,
    packageManager: unified.project.packageManager,
    runGenerate: unified.project.runGenerate ?? true,
    template: projectTemplate,
    repository: projectRepository,
    publish: projectPublish,
    readme: unified.project.readme
  }) as KubbProjectConfig;

  const clients: KubbClientConfig[] = unified.clients.map((client) => {
    const mergedOptions = mergeOptions<UnifiedClientOptions>(
      projectOptions,
      client.config ?? {}
    );
    const pluginDefaults = projectOptions.plugins ?? projectOptions.kubb ?? {};
    const pluginOverrides = client.config?.plugins ?? client.config?.kubb ?? {};
    const outputs = resolveOutputs(projectOutput, client.output ?? {}, client.name);

    const pluginClient = mergeOptions(
      pluginDefaults.client,
      pluginOverrides.client
    );
    if (mergedOptions.httpClient && typeof pluginClient === "object") {
      (pluginClient as Record<string, unknown>).client = mergedOptions.httpClient;
    }
    if (mergedOptions.baseUrl && typeof pluginClient === "object") {
      (pluginClient as Record<string, unknown>).baseURL = mergedOptions.baseUrl;
    }
    const pluginTs = mergeOptions(pluginDefaults.ts, pluginOverrides.ts);
    const pluginOas = mergeOptions(pluginDefaults.oas, pluginOverrides.oas);

    const kubbOptions = cleanUndefined({
      client: pluginClient,
      ts: pluginTs,
      oas: pluginOas
    });

    return {
      name: client.name,
      swagger: client.swagger,
      output: outputs,
      kubb: kubbOptions
    } as KubbClientConfig;
  });

  return {
    project: projectConfig,
    clients,
    hooks: unified.hooks ?? { beforeGenerate: [], afterGenerate: [] }
  };
}