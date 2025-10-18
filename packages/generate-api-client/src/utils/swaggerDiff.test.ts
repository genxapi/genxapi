import { describe, expect, it } from "vitest";
import { analyzeSwaggerDiff } from "./swaggerDiff/index.js";

describe("analyzeSwaggerDiff", () => {
  const baseSpec = {
    openapi: "3.0.0",
    paths: {
      "/pets": {
        get: {
          operationId: "listPets",
          responses: {
            "200": {
              description: "A list of pets"
            }
          }
        }
      }
    },
    components: {
      schemas: {
        Pet: {
          type: "object",
          properties: {
            id: { type: "integer" }
          }
        }
      }
    }
  };

  it("marks new endpoints as feat", () => {
    const nextSpec = {
      ...baseSpec,
      paths: {
        ...baseSpec.paths,
        "/pets/{id}": {
          get: {
            operationId: "getPet",
            responses: {
              "200": { description: "single pet" }
            }
          }
        }
      }
    };

    const result = analyzeSwaggerDiff(baseSpec, nextSpec);
    expect(result.type).toBe("feat");
    expect(result.summary).toContain("GET /pets/{id}");
  });

  it("marks structural changes as fix", () => {
    const nextSpec = JSON.parse(JSON.stringify(baseSpec));
    nextSpec.paths["/pets"].get.responses["200"].content = {
      "application/json": {
        schema: { type: "array" }
      }
    };

    const result = analyzeSwaggerDiff(baseSpec, nextSpec);
    expect(result.type).toBe("fix");
    expect(result.summary).toContain("GET /pets");
  });

  it("marks description-only changes as chore", () => {
    const nextSpec = JSON.parse(JSON.stringify(baseSpec));
    nextSpec.paths["/pets"].get.description = "Updated docs";

    const result = analyzeSwaggerDiff(baseSpec, nextSpec);
    expect(result.type).toBe("chore");
    expect(result.summary).toContain("docs");
  });
});
