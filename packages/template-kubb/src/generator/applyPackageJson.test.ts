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
        scripts: {},
        devDependencies: {
          "@kubb/cli": "^4.1.3",
          "@kubb/core": "^4.1.3",
          "@kubb/plugin-client": "^4.1.3",
          "@kubb/plugin-oas": "^4.1.3",
          "@kubb/plugin-ts": "^4.1.3",
          "@rollup/plugin-typescript": "^12.1.2",
          "@types/node": "^22.0.0",
          "axios": "^1.7.9",
          "rimraf": "^5.0.10",
          "rollup": "^4.34.0",
          "rollup-plugin-delete": "^2.1.0",
          "rollup-plugin-dts": "^6.1.1",
          "tslib": "^2.8.1",
          "typescript": "^5.6.3",
          "vitest": "^3.2.4",
          "zod": "^3.23.8"
        }
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
      }),
      {
        selectedCapabilities: ["http-client", "kubb-plugin-client"],
        dependencies: [
          {
            name: "@kubb/cli",
            section: "devDependencies",
            reason: "generator"
          },
          {
            name: "@kubb/core",
            section: "devDependencies",
            reason: "generator"
          },
          {
            name: "@kubb/plugin-client",
            section: "devDependencies",
            reason: "generator"
          },
          {
            name: "@kubb/plugin-oas",
            section: "devDependencies",
            reason: "generator"
          },
          {
            name: "@kubb/plugin-ts",
            section: "devDependencies",
            reason: "generator"
          },
          {
            name: "@rollup/plugin-typescript",
            section: "devDependencies",
            reason: "build"
          },
          {
            name: "@types/node",
            section: "devDependencies",
            reason: "build"
          },
          {
            name: "axios",
            section: "devDependencies",
            reason: "transport"
          },
          {
            name: "rimraf",
            section: "devDependencies",
            reason: "build"
          },
          {
            name: "rollup",
            section: "devDependencies",
            reason: "build"
          },
          {
            name: "rollup-plugin-delete",
            section: "devDependencies",
            reason: "build"
          },
          {
            name: "rollup-plugin-dts",
            section: "devDependencies",
            reason: "build"
          },
          {
            name: "tslib",
            section: "devDependencies",
            reason: "build"
          },
          {
            name: "typescript",
            section: "devDependencies",
            reason: "build"
          },
          {
            name: "vitest",
            section: "devDependencies",
            reason: "test"
          },
          {
            name: "zod",
            section: "devDependencies",
            reason: "parser"
          }
        ]
      }
    );

    const pkg = JSON.parse(await readFile(join(projectDir, "package.json"), "utf8")) as any;
    expect(pkg.files).toContain("genxapi.manifest.json");
    expect(pkg.scripts.generate).toBe("kubb generate --config kubb.config.ts");
    expect(pkg.scripts.build).toBe("rimraf dist && rollup -c");
    expect(pkg.scripts.publish).toBe("npm run build && npm run publish:npm");
    expect(pkg.scripts["generate-clients"]).toBe("npm run generate");
    expect(pkg.scripts["npm-publish"]).toBe("npm run publish");
    expect(pkg.devDependencies.axios).toBe("^1.7.9");
    expect(pkg.devDependencies.zod).toBe("^3.23.8");
  });
});
