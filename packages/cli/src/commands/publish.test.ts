import { describe, expect, it, vi } from "vitest";
import ora from "ora";
import { runPublishCommand } from "./publish";

vi.mock("octokit", () => {
  const createRelease = vi.fn().mockResolvedValue(undefined);
  const rest = { repos: { createRelease } };
  const Octokit = vi.fn().mockImplementation(() => ({ rest }));
  return { Octokit };
});

vi.mock("ora", () => {
  const start = vi.fn().mockReturnValue({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn()
  });
  return {
    default: vi.fn(() => ({ start }))
  };
});

describe("runPublishCommand", () => {
  it("calls octokit.createRelease with provided options", async () => {
    const logger = {} as any;
    await runPublishCommand({
      token: "test-token",
      owner: "acme",
      repo: "demo",
      tag: "v1.0.0",
      title: "Release v1.0.0",
      body: "notes",
      draft: true,
      prerelease: true,
      logger
    });

    const { Octokit } = await import("octokit");
    const instance = (Octokit as any).mock.results[0].value;
    expect(instance.rest.repos.createRelease).toHaveBeenCalledWith({
      owner: "acme",
      repo: "demo",
      tag_name: "v1.0.0",
      name: "Release v1.0.0",
      body: "notes",
      draft: true,
      prerelease: true
    });
  });
});
