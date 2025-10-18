# @eduardoac/api-client-template

Reusable Orval template that supports generating multiple clients from a single configuration file.

## Usage

```ts
import { loadTemplateConfig, generateClients } from "@eduardoac/api-client-template";

const config = await loadTemplateConfig("./multi-client.config.json");
await generateClients(config);
```
