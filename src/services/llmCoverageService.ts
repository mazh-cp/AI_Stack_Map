// LLM Coverage service — validates model registrations and derives a per-model
// risk level from its guardrail / isolation posture. Connection tests run in
// mock mode (no outbound calls) unless a real endpoint check is wired to a
// backend later.

import type { ModelCoverage, RiskLevel } from "../types";
import { delay } from "./config";

export interface ConnectionResult {
  ok: boolean;
  latencyMs: number;
  detail: string;
}

/** Issues that drag a model's posture down — surfaced in the UI. */
export function modelIssues(m: ModelCoverage): string[] {
  const issues: string[] = [];
  if (!m.inputGuardrailsEnabled) issues.push("No input guardrail");
  if (!m.outputGuardrailsEnabled) issues.push("No output guardrail");
  if (!m.loggingEnabled) issues.push("Logging disabled");
  if (m.deploymentType === "local") {
    if (!m.networkIsolated) issues.push("Not network isolated");
    if (m.internetAccess) issues.push("Internet access enabled");
    if (!m.modelIntegrityVerified) issues.push("Model integrity unverified");
    if (m.toolAccessEnabled && (m.allowedTools?.length ?? 0) === 0)
      issues.push("Unrestricted tool access");
  }
  return issues;
}

/** Derive a risk level from the model's posture and environment. */
export function deriveRiskLevel(m: ModelCoverage): RiskLevel {
  let score = modelIssues(m).length;
  if (m.environment === "production") score += 1;
  if (m.sensitivity === "restricted") score += 2;
  else if (m.sensitivity === "confidential") score += 1;
  if (score >= 5) return "critical";
  if (score >= 3) return "high";
  if (score >= 1) return "medium";
  return "low";
}

export const llmCoverageService = {
  async testConnection(m: ModelCoverage): Promise<ConnectionResult> {
    await delay(700);
    // Mock: a reachable endpoint is one that has a value; flag obvious gaps.
    if (!m.endpoint) {
      return { ok: false, latencyMs: 0, detail: "No endpoint configured" };
    }
    const latencyMs = m.deploymentType === "local" ? 18 : 240;
    return {
      ok: true,
      latencyMs,
      detail:
        m.deploymentType === "local"
          ? `Reachable on internal network (${latencyMs}ms)`
          : `Reachable via provider API (${latencyMs}ms)`,
    };
  },
};
