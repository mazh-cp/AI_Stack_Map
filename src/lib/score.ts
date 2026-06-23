import type {
  SecurityControl,
  Risk,
  LayerKey,
  ModelCoverage,
  Integration,
} from "../types";
import { modelIssues } from "../services/llmCoverageService";

export interface ScoreAdjustment {
  label: string;
  points: number;
}

export interface ScoreBreakdown {
  score: number; // 0–100
  grade: string;
  coverage: number; // weighted implemented coverage %
  protectedLayers: number;
  totalLayers: number;
  openRisks: number;
  criticalGaps: number;
  penalties: ScoreAdjustment[];
  bonuses: ScoreAdjustment[];
}

// Each control status contributes a fraction of its weight to coverage.
const STATUS_CREDIT: Record<string, number> = {
  not_implemented: 0,
  planned: 0.25,
  implemented: 0.75,
  verified: 1,
};

function grade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/**
 * Security score combines weighted control coverage with targeted penalties
 * for the highest-impact gaps and bonuses for active vendor protections
 * (Check Point file scanning, Lakera Guard) and a healthy model-coverage posture.
 */
export function computeScore(
  controls: SecurityControl[],
  risks: Risk[],
  models: ModelCoverage[] = [],
  integrations: Integration[] = []
): ScoreBreakdown {
  // ── Weighted coverage ──────────────────────────────────────────────
  const totalWeight = controls.reduce((s, c) => s + c.weight, 0) || 1;
  const earned = controls.reduce(
    (s, c) => s + c.weight * STATUS_CREDIT[c.status],
    0
  );
  const coverage = Math.round((earned / totalWeight) * 100);

  let score = coverage;
  const penalties: ScoreAdjustment[] = [];
  const bonuses: ScoreAdjustment[] = [];

  const isActive = (c: SecurityControl) =>
    c.status === "implemented" || c.status === "verified";

  const hasActiveInLayer = (layer: LayerKey) =>
    controls.some((c) => c.layer === layer && isActive(c));

  const activeIntegration = (type: Integration["type"]) =>
    integrations.some((i) => i.type === type && i.enabled);

  // ── Vendor integration bonuses ─────────────────────────────────────
  const fileScanActive =
    activeIntegration("threat_emulation") || activeIntegration("file_scan");
  if (fileScanActive) {
    bonuses.push({ label: "Check Point file scanning enabled", points: 6 });
  } else {
    penalties.push({ label: "Files can enter RAG without scanning", points: 10 });
  }

  const lakeraInput = controls.some(
    (c) => c.id === "ctl-lakera-input" && isActive(c)
  );
  if (lakeraInput) {
    bonuses.push({ label: "Lakera Guard input protection enabled", points: 6 });
  }
  const lakeraOutput = controls.some(
    (c) => c.id === "ctl-lakera-output" && isActive(c)
  );
  if (lakeraOutput) {
    bonuses.push({ label: "Lakera Guard output inspection enabled", points: 5 });
  }

  // ── Legacy targeted gap penalties ──────────────────────────────────
  const hasLogging = controls.some((c) => c.id === "ctl-siem" && isActive(c));
  if (!hasLogging) {
    penalties.push({ label: "Missing SIEM / audit logging", points: 10 });
  }
  const hasOutputMod = controls.some(
    (c) =>
      (c.id === "ctl-content-mod" || c.id === "ctl-pii-redaction") && isActive(c)
  );
  if (!hasOutputMod) {
    penalties.push({ label: "Missing output moderation", points: 8 });
  }
  const hasToolRestriction = controls.some(
    (c) =>
      (c.id === "ctl-tool-allowlist" || c.id === "ctl-least-priv") && isActive(c)
  );
  if (!hasToolRestriction) {
    penalties.push({ label: "Missing tool restrictions", points: 10 });
  }
  const hasSecrets = controls.some((c) => c.id === "ctl-vault" && isActive(c));
  if (!hasSecrets) {
    penalties.push({ label: "Missing secrets management", points: 8 });
  }

  // ── Model coverage posture ─────────────────────────────────────────
  if (models.length) {
    const prod = models.filter((m) => m.environment === "production");
    const prodCovered = prod.filter(
      (m) => m.inputGuardrailsEnabled && m.outputGuardrailsEnabled
    );
    if (prod.length && prodCovered.length === prod.length) {
      bonuses.push({ label: "All production LLMs guardrailed", points: 5 });
    }

    const noInput = models.filter((m) => !m.inputGuardrailsEnabled).length;
    if (noInput)
      penalties.push({
        label: `${noInput} model(s) without input guardrail`,
        points: noInput * 4,
      });

    const noOutput = models.filter((m) => !m.outputGuardrailsEnabled).length;
    if (noOutput)
      penalties.push({
        label: `${noOutput} model(s) without output guardrail`,
        points: noOutput * 4,
      });

    const noLogging = models.filter((m) => !m.loggingEnabled).length;
    if (noLogging)
      penalties.push({
        label: `${noLogging} model(s) without logging`,
        points: noLogging * 3,
      });

    const locals = models.filter((m) => m.deploymentType === "local");
    if (locals.length) {
      const isolated = locals.filter((m) => m.networkIsolated);
      if (isolated.length === locals.length) {
        bonuses.push({ label: "Local LLMs network isolated", points: 4 });
      }
      const exposedNet = locals.filter((m) => !m.networkIsolated).length;
      if (exposedNet)
        penalties.push({
          label: `${exposedNet} local LLM(s) not network isolated`,
          points: exposedNet * 5,
        });
      const onlineLocal = locals.filter((m) => m.internetAccess).length;
      if (onlineLocal)
        penalties.push({
          label: `${onlineLocal} local LLM(s) with internet access`,
          points: onlineLocal * 5,
        });
      const looseTools = locals.filter(
        (m) =>
          m.toolAccessEnabled && (m.allowedTools?.length ?? 0) === 0
      ).length;
      if (looseTools)
        penalties.push({
          label: `${looseTools} local LLM(s) with unrestricted tools`,
          points: looseTools * 5,
        });
    }

    const restricted = models.filter(
      (m) => !m.toolAccessEnabled || (m.allowedTools?.length ?? 0) > 0
    );
    if (restricted.length === models.length) {
      bonuses.push({ label: "Tool access restricted per model", points: 3 });
    }
  }

  // Unresolved critical risks
  const unresolvedCritical = risks.filter(
    (r) =>
      r.severity === "critical" &&
      (r.status === "open" || r.status === "mitigating")
  );
  if (unresolvedCritical.length) {
    penalties.push({
      label: `${unresolvedCritical.length} unresolved critical risk(s)`,
      points: unresolvedCritical.length * 6,
    });
  }

  const totalPenalty = penalties.reduce((s, p) => s + p.points, 0);
  const totalBonus = bonuses.reduce((s, b) => s + b.points, 0);
  score = Math.max(0, Math.min(100, score - totalPenalty + totalBonus));

  // ── Layer protection (only count layers that have controls defined) ──
  const definedLayers = Array.from(new Set(controls.map((c) => c.layer)));
  const protectedLayers = definedLayers.filter(hasActiveInLayer).length;

  const openRisks = risks.filter(
    (r) => r.status === "open" || r.status === "mitigating"
  ).length;

  const criticalGaps =
    controls.filter((c) => c.status === "not_implemented" && c.weight >= 3)
      .length +
    unresolvedCritical.length +
    models.filter((m) => m.riskLevel === "critical").length;

  return {
    score,
    grade: grade(score),
    coverage,
    protectedLayers,
    totalLayers: definedLayers.length,
    openRisks,
    criticalGaps,
    penalties,
    bonuses,
  };
}

// Re-export so widgets can reuse the same posture logic.
export { modelIssues };
