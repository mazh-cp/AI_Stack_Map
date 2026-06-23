// Lakera Guard prompt/output screening (server-side).
// Mock-first; live calls require LAKERA_GUARD_API_KEY.

import { CONFIG, authHeaders, delay } from "./config.js";

export type Decision = "allow" | "block" | "redact" | "escalate";

export interface GuardResult {
  riskScore: number; // 0–100
  categories: string[];
  decision: Decision;
  rawEvidence: Record<string, unknown>;
}

interface Detector {
  category: string;
  weight: number;
  patterns: RegExp[];
}

const DETECTORS: Detector[] = [
  {
    category: "prompt_injection",
    weight: 70,
    patterns: [
      /ignore (?:all |the |your |previous |prior |above )*(?:instructions|prompts?)/i,
      /disregard (?:the |your |all |above |previous |system )+/i,
      /you are now/i,
      /new instructions:/i,
    ],
  },
  {
    category: "jailbreak",
    weight: 65,
    patterns: [/jailbreak/i, /\bDAN\b/, /developer mode/i, /pretend you have no (rules|guardrails)/i, /roleplay as/i],
  },
  {
    category: "system_prompt_leakage",
    weight: 55,
    patterns: [/system prompt/i, /reveal your (instructions|prompt|rules)/i, /repeat the words above/i],
  },
  {
    category: "pii",
    weight: 45,
    patterns: [/\b\d{3}-\d{2}-\d{4}\b/, /[\w.+-]+@[\w-]+\.[\w.-]+/, /\b(?:\d[ -]*?){13,16}\b/],
  },
  {
    category: "unsafe_content",
    weight: 50,
    patterns: [/how to make (a )?(bomb|weapon|explosive)/i, /credentials?|api[_ ]?key/i],
  },
];

function decide(score: number, categories: string[]): Decision {
  if (score >= 80) return "block";
  if (categories.includes("pii")) return "redact";
  if (score >= 50) return "escalate";
  return "allow";
}

export async function inspect(
  text: string,
  stage: "input" | "output"
): Promise<GuardResult> {
  const cfg = CONFIG.lakeraGuard;

  if (cfg.mock) {
    await delay(250);
    const categories: string[] = [];
    let score = 0;
    for (const d of DETECTORS) {
      if (d.patterns.some((p) => p.test(text))) {
        categories.push(d.category);
        score = Math.max(score, d.weight + Math.min(20, Math.floor(text.length / 40)));
      }
    }
    score = Math.min(99, score);
    return {
      riskScore: score,
      categories: categories.length ? categories : ["none"],
      decision: decide(score, categories),
      rawEvidence: {
        provider: "Lakera Guard",
        mode: "mock",
        stage,
        flagged: categories.length > 0,
        results: DETECTORS.map((d) => ({
          detector: d.category,
          detected: categories.includes(d.category),
        })),
        payload_length: text.length,
      },
    };
  }

  const res = await fetch(`${cfg.baseUrl}/guard`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(cfg) },
    body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
  });
  if (!res.ok) throw new Error(`Lakera Guard error ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  const flagged = Boolean((data as { flagged?: boolean }).flagged);
  const cats = Object.keys(
    (data as { categories?: Record<string, boolean> }).categories ?? {}
  ).filter((k) => (data as { categories: Record<string, boolean> }).categories[k]);
  const score = flagged ? 85 : 5;
  return {
    riskScore: score,
    categories: cats.length ? cats : ["none"],
    decision: decide(score, cats),
    rawEvidence: data,
  };
}
