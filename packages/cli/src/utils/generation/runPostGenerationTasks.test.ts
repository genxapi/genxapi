import { describe, expect, it, vi, beforeEach } from "vitest";
import { runPostGenerationTasks } from "./runPostGenerationTasks";

const serviceMocks = vi.hoisted(() => ({
  synchronizeRepository: vi.fn(),
  buildPackage: vi.fn(),
  publishToNpm: vi.fn()
}));

const { synchronizeRepository, buildPackage, publishToNpm } = serviceMocks;

vi.mock("src/services/github", () => ({
  synchronizeRepository: serviceMocks.synchronizeRepository
}));

vi.mock("src/services/npm", () => ({
  buildPackage: serviceMocks.buildPackage,
  publishToNpm: serviceMocks.publishToNpm
}));

describe("runPostGenerationTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    synchronizeRepository.mockResolvedValue(undefined);
    buildPackage.mockResolvedValue(undefined);
    publishToNpm.mockResolvedValue(undefined);
  });

  it("builds once before publishing to configured registries", async () => {
    await runPostGenerationTasks({
      config: {
        logLevel: "info",
        project: {
          name: "demo",
          directory: "./sdk",
          packageManager: "pnpm",
          runGenerate: true,
          template: "@genxapi/template-orval",
          publish: {
            npm: {
              enabled: true
            },
            github: {
              enabled: true
            }
          }
        },
        clients: [],
        hooks: {
          beforeGenerate: [],
          afterGenerate: []
        }
      } as any,
      configDir: "/workspace",
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        setLevel: vi.fn()
      } as any,
      template: {} as any
    });

    expect(buildPackage).toHaveBeenCalledTimes(1);
    expect(buildPackage).toHaveBeenCalledWith({
      projectDir: "/workspace/sdk",
      packageManager: "pnpm",
      logger: expect.any(Object)
    });
    expect(publishToNpm).toHaveBeenCalledTimes(2);
  });
});
