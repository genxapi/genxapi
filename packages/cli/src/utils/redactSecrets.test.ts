import { describe, expect, it } from "vitest";
import { redactSecrets } from "./redactSecrets";

describe("redactSecrets", () => {
  it("redacts GitHub tokens and bearer headers", () => {
    const token = "ghp_1234567890abcdef1234567890abcdef1234";
    const input = `Authorization: Bearer ${token}`;
    const output = redactSecrets(input);

    expect(output).toContain("Authorization: Bearer [REDACTED]");
    expect(output).not.toContain(token);
  });

  it("redacts URL credentials and provided secrets", () => {
    const secret = "custom-secret-value";
    const input = `https://user:pass@github.com/org/repo.git\nvalue=${secret}`;
    const output = redactSecrets(input, { secrets: [secret] });

    expect(output).toContain("https://[REDACTED]@github.com/org/repo.git");
    expect(output).not.toContain(secret);
  });

  it("redacts fine-grained tokens", () => {
    const token = "github_pat_abcdefghijklmnopqrstuvwxyz1234567890";
    const output = redactSecrets(`token=${token}`);

    expect(output).toContain("github_pat_[REDACTED]");
  });
});
