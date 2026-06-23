// Lakera Guard — prompt & response screening for injection, jailbreaks,
// unsafe content and data leakage.
//
// Mock-first; live calls require LAKERA_GUARD_API_KEY + _BASE_URL.

import type { PromptDecision } from "../types";
import { INTEGRATION_CONFIG, authHeaders, delay } from "./config";

export interface GuardRequest {
  text: string;
  stage: "input" | "output";
}

export interface GuardResult {
  /** 0–100 */
  riskScore: number;
  categories: string[];
  decision: PromptDecision;
  rawEvidence: Record<string, unknown>;
}

const cfg = INTEGRATION_CONFIG.lakeraGuard;

interface Detector {
  category: string;
  patterns: RegExp[];
  weight: number;
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

function decide(score: number, categories: string[]): PromptDecision {
  if (score >= 80) return "block";
  if (categories.includes("pii")) return "redact";
  if (score >= 50) return "escalate";
  return "allow";
}

export const lakeraGuardService = {
  isMock: cfg.mock,
  baseUrl: cfg.baseUrl,

  async inspect(req: GuardRequest): Promise<GuardResult> {
    if (cfg.mock) {
      await delay(650);
      const categories: string[] = [];
      let score = 0;
      for (const d of DETECTORS) {
        if (d.patterns.some((p) => p.test(req.text))) {
          categories.push(d.category);
          score = Math.max(score, d.weight + Math.min(20, Math.floor(req.text.length / 40)));
        }
      }
      score = Math.min(99, score);
      const decision = decide(score, categories);
      return {
        riskScore: score,
        categories: categories.length ? categories : ["none"],
        decision,
        rawEvidence: {
          provider: "Lakera Guard",
          mode: "mock",
          stage: req.stage,
          flagged: categories.length > 0,
          results: DETECTORS.map((d) => ({
            detector: d.category,
            detected: categories.includes(d.category),
          })),
          payload_length: req.text.length,
        },
      };
    }

    const res = await fetch(`${cfg.baseUrl}/guard`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(cfg) },
      body: JSON.stringify({ messages: [{ role: "user", content: req.text }] }),
    });
    if (!res.ok) throw new Error(`Lakera Guard error ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    const flagged = Boolean((data as { flagged?: boolean }).flagged);
    const categories = Object.keys(
      (data as { categories?: Record<string, boolean> }).categories ?? {}
    ).filter((k) => (data as { categories: Record<string, boolean> }).categories[k]);
    const score = flagged ? 85 : 5;
    return {
      riskScore: score,
      categories: categories.length ? categories : ["none"],
      decision: decide(score, categories),
      rawEvidence: data,
    };
  },
};
