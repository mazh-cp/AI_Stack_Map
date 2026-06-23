// Server-side integration configuration. API keys are read from the process
// environment and NEVER leave the server. Until a key is set, the matching
// service runs in MOCK mode and performs no outbound calls. All live calls use
// HTTPS; TLS verification is never disabled.

import crypto from "node:crypto";

export interface ProviderConfig {
  apiKey?: string;
  baseUrl: string;
  mock: boolean;
}

function resolve(keyVar: string, urlVar: string, defaultUrl: string): ProviderConfig {
  const apiKey = process.env[keyVar];
  const baseUrl = process.env[urlVar] || defaultUrl;
  return { apiKey, baseUrl, mock: !apiKey };
}

export const CONFIG = {
  checkpointTE: resolve(
    "CHECKPOINT_TE_API_KEY",
    "CHECKPOINT_TE_BASE_URL",
    "https://te.checkpoint.com/api"
  ),
  checkpointFileScan: resolve(
    "CHECKPOINT_FILE_SCAN_API_KEY",
    "CHECKPOINT_FILE_SCAN_BASE_URL",
    "https://te.checkpoint.com/tecloud/api/v1/file"
  ),
  lakeraGuard: resolve(
    "LAKERA_GUARD_API_KEY",
    "LAKERA_GUARD_BASE_URL",
    "https://api.lakera.ai/v2"
  ),
};

export function authHeaders(cfg: ProviderConfig): Record<string, string> {
  return cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {};
}

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
