// Check Point Threat Emulation — sandbox detonation of suspicious files
// before they enter the LLM / RAG pipeline.
//
// Mock-first: returns synthetic verdicts until CHECKPOINT_TE_API_KEY +
// CHECKPOINT_TE_BASE_URL are configured. Real calls go over HTTPS with the
// key supplied via Authorization header (see config.ts).

import type { FileVerdict } from "../types";
import { INTEGRATION_CONFIG, authHeaders, delay } from "./config";

export interface ScanRequest {
  filename: string;
  fileHash: string;
  /** Raw bytes — only sent in live mode */
  bytes?: ArrayBuffer;
}

export interface ScanResult {
  verdict: FileVerdict;
  rawEvidence: Record<string, unknown>;
}

const cfg = INTEGRATION_CONFIG.checkpointTE;

// Filenames containing these tokens deterministically produce a bad verdict
// so the demo is reproducible and reviewable.
const MALICIOUS_HINTS = ["malware", "trojan", "exploit", "payload", ".exe", ".scr"];
const SUSPICIOUS_HINTS = ["macro", "invoice-", "urgent", ".docm", ".xlsm", ".zip"];

function mockVerdict(filename: string): FileVerdict {
  const f = filename.toLowerCase();
  if (MALICIOUS_HINTS.some((h) => f.includes(h))) return "malicious";
  if (SUSPICIOUS_HINTS.some((h) => f.includes(h))) return "suspicious";
  // A small slice of unknowns to exercise the UI
  if (f.includes("draft") || f.endsWith(".bin")) return "unknown";
  return "clean";
}

export const checkpointThreatEmulationService = {
  isMock: cfg.mock,
  baseUrl: cfg.baseUrl,

  async scan(req: ScanRequest): Promise<ScanResult> {
    if (cfg.mock) {
      await delay(1400);
      const verdict = mockVerdict(req.filename);
      return {
        verdict,
        rawEvidence: {
          provider: "Check Point Threat Emulation",
          mode: "mock",
          status: "found",
          sha256: req.fileHash,
          filename: req.filename,
          combined_verdict: verdict,
          emulation: {
            os: ["Win10", "Win11"],
            triggered_signatures:
              verdict === "malicious"
                ? ["Generic.Trojan.Downloader", "Suspicious.Macro.Exec"]
                : verdict === "suspicious"
                ? ["Office.Macro.AutoOpen"]
                : [],
            confidence: verdict === "clean" ? 0.02 : verdict === "unknown" ? 0.5 : 0.94,
          },
          te_report_url: `https://te.checkpoint.com/report/${req.fileHash.slice(0, 16)}`,
        },
      };
    }

    // ── Live mode (executed only when a real key is configured) ──────────────
    const res = await fetch(`${cfg.baseUrl}/v1/file/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(cfg) },
      body: JSON.stringify({
        request: [{ sha256: req.fileHash, file_name: req.filename, features: ["te"] }],
      }),
    });
    if (!res.ok) throw new Error(`Threat Emulation error ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    const verdict = normalizeVerdict(data);
    return { verdict, rawEvidence: data };
  },
};

function normalizeVerdict(data: Record<string, unknown>): FileVerdict {
  const combined = JSON.stringify(data).toLowerCase();
  if (combined.includes("malicious")) return "malicious";
  if (combined.includes("suspicious")) return "suspicious";
  if (combined.includes("benign") || combined.includes("clean")) return "clean";
  return "unknown";
}
