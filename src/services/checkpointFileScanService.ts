// Check Point TE File Scan — file reputation + sandbox analysis for documents
// uploaded by users or ingested into the RAG pipeline.
//
// Mock-first; live calls require CHECKPOINT_FILE_SCAN_API_KEY + _BASE_URL.

import type { FileVerdict } from "../types";
import { INTEGRATION_CONFIG, authHeaders, delay } from "./config";

export interface FileScanRequest {
  filename: string;
  fileHash: string;
  bytes?: ArrayBuffer;
}

export interface FileScanResult {
  verdict: FileVerdict;
  rawEvidence: Record<string, unknown>;
}

const cfg = INTEGRATION_CONFIG.checkpointFileScan;

const MALICIOUS_HINTS = ["malware", "trojan", "ransom", ".exe", ".js", ".vbs"];
const SUSPICIOUS_HINTS = ["macro", ".docm", ".xlsm", "password", ".7z", ".rar"];

function mockReputation(filename: string): { verdict: FileVerdict; score: number } {
  const f = filename.toLowerCase();
  if (MALICIOUS_HINTS.some((h) => f.includes(h))) return { verdict: "malicious", score: 92 };
  if (SUSPICIOUS_HINTS.some((h) => f.includes(h))) return { verdict: "suspicious", score: 61 };
  if (f.endsWith(".bin") || f.includes("draft")) return { verdict: "unknown", score: 40 };
  return { verdict: "clean", score: 3 };
}

export const checkpointFileScanService = {
  isMock: cfg.mock,
  baseUrl: cfg.baseUrl,

  async scan(req: FileScanRequest): Promise<FileScanResult> {
    if (cfg.mock) {
      await delay(1100);
      const { verdict, score } = mockReputation(req.filename);
      return {
        verdict,
        rawEvidence: {
          provider: "Check Point TE File Scan",
          mode: "mock",
          sha256: req.fileHash,
          filename: req.filename,
          reputation: { risk_score: score, classification: verdict },
          file_type: req.filename.split(".").pop() ?? "unknown",
          av_engines: { detections: verdict === "malicious" ? 34 : verdict === "suspicious" ? 4 : 0, total: 68 },
          sandbox: { detonated: verdict !== "clean", verdict },
        },
      };
    }

    const res = await fetch(`${cfg.baseUrl}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(cfg) },
      body: JSON.stringify({ request: [{ sha256: req.fileHash, file_name: req.filename }] }),
    });
    if (!res.ok) throw new Error(`File Scan error ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    const blob = JSON.stringify(data).toLowerCase();
    const verdict: FileVerdict = blob.includes("malicious")
      ? "malicious"
      : blob.includes("suspicious")
      ? "suspicious"
      : blob.includes("benign") || blob.includes("clean")
      ? "clean"
      : "unknown";
    return { verdict, rawEvidence: data };
  },
};
