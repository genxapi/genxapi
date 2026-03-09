import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyPackageJson } from "./applyPackageJson.js";
import { MultiClientConfigSchema } from "../types.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("applyPackageJson", () => {
  it("separates generate, build, and publish scripts for generated packages", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "genxapi-kubb-pkg-"));
    tempDirs.push(projectDir);

    await writeFile(
      join(projectDir, "package.json"),
      JSON.stringify({
        name: "placeholder",
        files: ["dist"],
        scripts: {}
      }),
      "utf8"
    );

    await applyPackageJson(
      projectDir,
      MultiClientConfigSchema.parse({
        project: {
          name: "demo-client",
          directory: "./demo",
          packageManager: "npm",
          template: {
            name: "@genxapi/template-kubb",
            installDependencies: false,
            variables: {}
          }
        },
        clients: [
          {
            name: "pets",
            swagger: "./petstore.yaml",
            output: {
              workspace: "./src/pets",
              target: "./src/pets/client.ts",
              schemas: "model"
            }
          }
        ]
      })
    );

    const pkg = JSON.parse(await readFile(join(projectDir, "package.json"), "utf8")) as any;
    expect(pkg.files).toContain("genxapi.manifest.json");
    expect(pkg.scripts.generate).toBe("kubb generate --config kubb.config.ts");
    expect(pkg.scripts.build).toBe("rimraf dist && rollup -c");
    expect(pkg.scripts.publish).toBe("npm run build && npm run publish:npm");
    expect(pkg.scripts["generate-clients"]).toBe("npm run generate");
    expect(pkg.scripts["npm-publish"]).toBe("npm run publish");
  });
});
