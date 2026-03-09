import { describe, expect, it } from "vitest";
import {
  validateTemplateCapabilityManifest,
  validateTemplateGenerationPlan
} from "./template-contract";

describe("template-contract", () => {
  it("rejects duplicate capability keys", () => {
    expect(() =>
      validateTemplateCapabilityManifest("@acme/example", {
        summary: "Example",
        capabilities: [
          {
            key: "contracts",
            label: "Contracts",
            description: "Consumes contract inputs.",
            classification: "universal",
            configPaths: ["clients[].contract"]
          },
          {
            key: "contracts",
            label: "Contracts again",
            description: "Duplicate key.",
            classification: "universal",
            configPaths: ["clients[].swagger"]
          }
        ]
      })
    ).toThrow(/duplicate capability key/);
  });

  it("rejects plan capabilities that are not declared in the manifest", () => {
    const manifest = validateTemplateCapabilityManifest("@acme/example", {
      summary: "Example",
      capabilities: [
        {
          key: "contracts",
          label: "Contracts",
          description: "Consumes contract inputs.",
          classification: "universal",
          configPaths: ["clients[].contract"]
        }
      ]
    });

    expect(() =>
      validateTemplateGenerationPlan("@acme/example", manifest, {
        selectedCapabilities: ["contracts", "acme-runtime"],
        dependencies: []
      })
    ).toThrow(/selected unknown capability "acme-runtime"/);
  });
});
