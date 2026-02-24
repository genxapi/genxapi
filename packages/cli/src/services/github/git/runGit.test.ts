import { describe, expect, it, vi } from "vitest";
import { execa } from "execa";
import { runGit } from "./runGit";

vi.mock("execa", () => ({ execa: vi.fn() }));

const execaMock = vi.mocked(execa);

describe("runGit", () => {
  it("redacts secrets from error output and command details", async () => {
    const token = "ghp_1234567890abcdef1234567890abcdef1234";
    execaMock.mockRejectedValueOnce({
      exitCode: 128,
      stderr: `fatal: Authentication failed for 'https://x-access-token:${token}@github.com/org/repo.git'`,
      stdout: `request failed: Authorization: Bearer ${token}`
    });

    let message = "";
    try {
      await runGit(
        ["-c", `http.extraheader=Authorization: Bearer ${token}`, "fetch", "origin", "main"],
        "/repo",
        { redactValues: [token] }
      );
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain("Authorization: Bearer [REDACTED]");
    expect(message).toContain("https://[REDACTED]@github.com/org/repo.git");
    expect(message).not.toContain(token);
  });
});
