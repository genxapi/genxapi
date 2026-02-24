const REDACTION_TEXT = "[REDACTED]";

export interface RedactSecretsOptions {
  readonly secrets?: Array<string | undefined>;
}

const GITHUB_TOKEN_PATTERN = /\bgh[pousr]_[A-Za-z0-9]{10,}\b/g;
const GITHUB_FINE_GRAINED_PATTERN = /\bgithub_pat_[A-Za-z0-9_]{10,}\b/g;
const AUTH_BEARER_PATTERN = /(authorization:\s*bearer\s+)([^\s]+)/gi;
const AUTH_BASIC_PATTERN = /(authorization:\s*basic\s+)([^\s]+)/gi;
const BEARER_TOKEN_PATTERN = /\bbearer\s+([A-Za-z0-9\-._=]+)\b/gi;
const X_ACCESS_TOKEN_PATTERN = /x-access-token:[^\s@]+/gi;
const URL_CREDENTIAL_PATTERN = /(https?:\/\/)([^@\s]+)@/gi;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function redactValues(input: string, values: Array<string | undefined>): string {
  return values
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .reduce(
      (output, value) => output.replace(new RegExp(escapeRegExp(value), "g"), REDACTION_TEXT),
      input
    );
}

export function redactSecrets(input: string, options: RedactSecretsOptions = {}): string {
  let output = redactValues(input, options.secrets ?? []);

  output = output.replace(GITHUB_FINE_GRAINED_PATTERN, "github_pat_[REDACTED]");
  output = output.replace(GITHUB_TOKEN_PATTERN, (match) => `${match.slice(0, 4)}${REDACTION_TEXT}`);
  output = output.replace(AUTH_BEARER_PATTERN, `$1${REDACTION_TEXT}`);
  output = output.replace(AUTH_BASIC_PATTERN, `$1${REDACTION_TEXT}`);
  output = output.replace(BEARER_TOKEN_PATTERN, "Bearer [REDACTED]");
  output = output.replace(X_ACCESS_TOKEN_PATTERN, "x-access-token:[REDACTED]");
  output = output.replace(URL_CREDENTIAL_PATTERN, `$1${REDACTION_TEXT}@`);

  return output;
}
