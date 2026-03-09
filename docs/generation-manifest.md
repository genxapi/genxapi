---
title: "Generation Manifest"
---

# Generation Manifest

Every successful generation now writes `genxapi.manifest.json` into the generated project root.

The manifest gives you a traceable record of:

- which contract source was used
- whether the contract was resolved from a local path or remote URL
- whether a snapshot was written and which generator input path was used
- which checksum was calculated
- which template and feature set produced the package
- which output paths were targeted
- when generation happened and which GenX API CLI version wrote the package

## Example

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-03-08T12:00:00.000Z",
  "contractVersion": "backend-sha-abc123",
  "tool": {
    "name": "@genxapi/cli",
    "version": "0.2.0"
  },
  "template": {
    "kind": "orval",
    "name": "@genxapi/template-orval"
  },
  "project": {
    "name": "pets-sdk",
    "directory": "./sdk/pets"
  },
  "clients": [
    {
      "name": "pets",
      "contract": {
        "source": "https://api.example.com/openapi.json",
        "type": "remote",
        "resolvedSource": "https://api.example.com/openapi.json",
        "generatorInput": ".genxapi/contracts/pets.json",
        "snapshot": {
          "enabled": true,
          "path": ".genxapi/contracts/pets.json"
        },
        "checksum": {
          "algorithm": "sha256",
          "value": "abc123"
        },
        "metadata": {
          "fetchedAt": "2026-03-08T12:00:00.000Z",
          "etag": "\"abc123\"",
          "sizeBytes": 256
        }
      },
      "output": {
        "workspace": "./src/pets",
        "target": "./src/pets/client.ts",
        "schemas": "./src/pets/model"
      },
      "selectedFeatures": {
        "mode": "split",
        "client": "react-query",
        "httpClient": "fetch",
        "mock": false
      }
    }
  ]
}
```

## Field Reference

| Field                               | Meaning                                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `schemaVersion`                     | Manifest format version.                                                                     |
| `generatedAt`                       | ISO-8601 timestamp for the generation run.                                                   |
| `contractVersion`                   | Optional external contract version recorded by CI automation.                                |
| `tool`                              | The GenX API CLI package name and version that wrote the output.                             |
| `template`                          | Template kind (`orval`, `kubb`, or `custom`) plus the resolved template package name.        |
| `project`                           | Generated package name and configured output directory.                                      |
| `clients[].contract.source`         | Sanitised contract input recorded for traceability.                                          |
| `clients[].contract.type`           | `local` or `remote`.                                                                         |
| `clients[].contract.resolvedSource` | Absolute local path or sanitised fetched URL after resolution.                               |
| `clients[].contract.generatorInput` | The exact path or URL handed to Orval/Kubb.                                                  |
| `clients[].contract.snapshot`       | Whether a local snapshot was written and where it lives inside the generated project.        |
| `clients[].contract.checksum`       | Optional checksum recorded for reproducibility.                                              |
| `clients[].contract.metadata`       | Non-secret source metadata such as fetch time, content type, ETag, auth env names, and size. |
| `clients[].output`                  | Workspace, client target, and schemas output paths.                                          |
| `clients[].selectedFeatures`        | Template-specific feature summary when it can be derived cleanly.                            |

## Intended Use

- Commit the manifest with generated package changes so reviewers can see which contract input produced the diff.
- Use the checksum and snapshot metadata to confirm generation came from a fixed contract file instead of a mutable live input.
- Inspect `selectedFeatures` and `output` when comparing package changes across templates or configuration updates.

The manifest is metadata only. It does not replace backend-owned contract versioning or future contract diff tooling.
