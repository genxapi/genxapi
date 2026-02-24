import { describe, expect, it, vi } from "vitest";
import { execa } from "execa";
import { runGit } from "./runGit";

vi.mock("execa", () => ({ execa: vi.fn() }));

const execaMock = vi.mocked(execa);

describe("runGit", () => {
  it("redacts secrets from error output and command details", async () => {
    const token = "ghp_1234567890abcdef1234567890abcdef1234";
    const basicValue = Buffer.from(`x-access-token:${token}`, "utf8").toString("base64");
    execaMock.mockRejectedValueOnce({
      exitCode: 128,
      stderr: `fatal: Authentication failed for 'https://x-access-token:${token}@github.com/org/repo.git'`,
      stdout: `request failed: Authorization: Basic ${basicValue}`
    });

    let message = "";
    try {
      await runGit(
        [
          "-c",
          `http.https://github.com/.extraheader=Authorization: Basic ${basicValue}`,
          "fetch",
          "origin",
          "main"
        ],
        "/repo",
        { redactValues: [token, basicValue] }
      );
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain("Authorization: Basic [REDACTED]");
    expect(message).toContain("https://[REDACTED]@github.com/org/repo.git");
    expect(message).not.toContain(token);
  });

  it("disables interactive terminal prompts", async () => {
    execaMock.mockResolvedValueOnce({ stdout: "" });

    await runGit(["status"], "/repo");

    expect(execaMock).toHaveBeenCalledWith(
      "git",
      ["status"],
      expect.objectContaining({
        env: expect.objectContaining({
          GIT_TERMINAL_PROMPT: "0"
        })
      })
    );
  });
});
