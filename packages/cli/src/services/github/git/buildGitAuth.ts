import { Buffer } from "node:buffer";

export interface GitAuthContext {
  readonly extraHeader: string;
  readonly redactValues: string[];
}

export function buildGitAuthContext(token: string): GitAuthContext {
  const basicValue = Buffer.from(`x-access-token:${token}`, "utf8").toString("base64");
  return {
    extraHeader: `http.https://github.com/.extraheader=Authorization: Basic ${basicValue}`,
    redactValues: [token, basicValue]
  };
}
