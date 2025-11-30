import { describe, expect, it } from "vitest";
import baseSpecJson from "./swaggerDiff/fixtures/base.json";
import { analyzeSwaggerDiff } from "./swaggerDiff/index";

type AnySpec = Record<string, any>;
const baseSpec = baseSpecJson as AnySpec;

describe("analyzeSwaggerDiff", () => {
  it("marks new endpoints as feat", () => {
    const nextSpec = structuredClone(baseSpec);
    nextSpec.paths["/pets/{id}"] = {
      get: {
        operationId: "getPet",
        responses: {
          "200": { description: "single pet" }
        }
      }
    };

    const result = analyzeSwaggerDiff(baseSpec, nextSpec);
    expect(result.type).toBe("feat");
    expect(result.diff.additions.some((entry) => entry.includes("GET /pets/{id}"))).toBe(true);
    expect(result.summary).toContain("GET /pets/{id}");
  });

  it("marks structural changes as fix", () => {
    const nextSpec = structuredClone(baseSpec);
    nextSpec.paths["/pets"].get.responses["200"].content = {
      "application/json": {
        schema: { type: "array" }
      }
    };

    const result = analyzeSwaggerDiff(baseSpec, nextSpec);
    expect(result.type).toBe("fix");
    expect(result.diff.modifications).toContain("operation changed GET /pets");
    expect(result.summary).toContain("GET /pets");
  });

  it("marks description-only changes as chore", () => {
    const nextSpec = structuredClone(baseSpec);
    nextSpec.paths["/pets"].get.description = "Updated docs";

    const result = analyzeSwaggerDiff(baseSpec, nextSpec);
    expect(result.type).toBe("chore");
    expect(result.diff.docChanges).toContain("operation docs GET /pets");
    expect(result.summary).toContain("docs GET /pets");
  });

  it("detects schema level additions", () => {
    const nextSpec = structuredClone(baseSpec);
    nextSpec.components.schemas.PetOwner = {
      type: "object",
      properties: {
        id: { type: "string" }
      }
    };

    const result = analyzeSwaggerDiff(baseSpec, nextSpec);
    expect(result.type).toBe("feat");
    expect(result.diff.additions).toContain("schema added components/schemas/PetOwner");
  });

  it("detects schema removals as fix", () => {
    const nextSpec = structuredClone(baseSpec);
    delete (nextSpec.components.schemas).Pet;

    const result = analyzeSwaggerDiff(baseSpec, nextSpec);
    expect(result.type).toBe("fix");
    expect(result.diff.modifications).toContain("schema removed components/schemas/Pet");
  });
});
