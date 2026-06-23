// Check Point Threat Emulation + TE File Scan (server-side).
// Mock-first; live calls require the corresponding env keys.

import { CONFIG, authHeaders, delay } from "./config.js";

export type Verdict = "clean" | "malicious" | "suspicious" | "unknown";
export type Provider = "checkpoint_te" | "checkpoint_file_scan";

const MAL = ["malware", "trojan", "exploit", "payload", "ransom", ".exe", ".scr", ".js", ".vbs"];
const SUS = ["macro", "invoice-", "urgent", ".docm", ".xlsm", ".zip", ".7z", ".rar", "password"];

function mockVerdict(filename: string): Verdict {
  const f = filename.toLowerCase();
  if (MAL.some((h) => f.includes(h))) return "malicious";
  if (SUS.some((h) => f.includes(h))) return "suspicious";
  if (f.includes("draft") || f.endsWith(".bin")) return "unknown";
  return "clean";
}

export interface ScanResult {
  verdict: Verdict;
  rawEvidence: Record<string, unknown>;
}

export async function scanFile(
  provider: Provider,
  filename: string,
  fileHash: string
): Promise<ScanResult> {
  const cfg = provider === "checkpoint_te" ? CONFIG.checkpointTE : CONFIG.checkpointFileScan;
  const label =
    provider === "checkpoint_te" ? "Check Point Threat Emulation" : "Check Point TE File Scan";

  if (cfg.mock) {
    await delay(400);
    const verdict = mockVerdict(filename);
    return {
      verdict,
      rawEvidence: {
        provider: label,
        mode: "mock",
        sha256: fileHash,
        filename,
        combined_verdict: verdict,
        confidence: verdict === "clean" ? 0.02 : verdict === "unknown" ? 0.5 : 0.94,
        triggered_signatures:
          verdict === "malicious"
            ? ["Generic.Trojan.Downloader", "Suspicious.Macro.Exec"]
            : verdict === "suspicious"
            ? ["Office.Macro.AutoOpen"]
            : [],
      },
    };
  }

  // ── Live mode (only when a real key is configured) ────────────────────────
  const res = await fetch(`${cfg.baseUrl}/v1/file/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(cfg) },
    body: JSON.stringify({
      request: [{ sha256: fileHash, file_name: filename, features: ["te"] }],
    }),
  });
  if (!res.ok) throw new Error(`${label} error ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  const blob = JSON.stringify(data).toLowerCase();
  const verdict: Verdict = blob.includes("malicious")
    ? "malicious"
    : blob.includes("suspicious")
    ? "suspicious"
    : blob.includes("benign") || blob.includes("clean")
    ? "clean"
    : "unknown";
  return { verdict, rawEvidence: data };
}
