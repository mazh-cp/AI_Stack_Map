// ───────────────────────────────────────────────────────────────────────────
// Integration configuration.
//
// SECURITY: API keys are NEVER hardcoded. They are read from environment
// variables at runtime. In this Vite frontend, only variables prefixed with
// `VITE_` are exposed to the browser bundle — so for a real deployment these
// integrations should be proxied through a backend that holds the unprefixed
// secrets (CHECKPOINT_TE_API_KEY, …). Until a key + base URL are configured,
// every service runs in MOCK mode and performs no network calls.
//
// All real calls use HTTPS; TLS verification is never disabled.
// ───────────────────────────────────────────────────────────────────────────

interface RawEnv {
  [key: string]: string | undefined;
}

// import.meta.env is statically replaced by Vite; guard for non-Vite contexts.
const env: RawEnv =
  (typeof import.meta !== "undefined" && (import.meta as { env?: RawEnv }).env) ||
  {};

export interface ProviderConfig {
  apiKey?: string;
  baseUrl: string;
  /** True when no real key is configured → use mock responses */
  mock: boolean;
}

function resolve(
  keyVar: string,
  urlVar: string,
  defaultUrl: string
): ProviderConfig {
  // Support both VITE_-prefixed (frontend) and bare names (documented for backend).
  const apiKey = env[`VITE_${keyVar}`] || env[keyVar];
  const baseUrl = env[`VITE_${urlVar}`] || env[urlVar] || defaultUrl;
  return { apiKey, baseUrl, mock: !apiKey };
}

export const INTEGRATION_CONFIG = {
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
} as const;

/** Build an Authorization header from a config, only when a key exists. */
export function authHeaders(cfg: ProviderConfig): Record<string, string> {
  return cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {};
}

/** Small latency simulation so the UI exercises async/loading states. */
export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** SHA-256 hex of an ArrayBuffer or string, using the Web Crypto API. */
export async function sha256(input: ArrayBuffer | string): Promise<string> {
  const data =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
