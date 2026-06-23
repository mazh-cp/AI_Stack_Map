// Server-side AI Security Score — a faithful port of the frontend logic
// (src/lib/score.ts) so the API and CI gate compute identical scores.

interface Control {
  id: string;
  layer: string;
  status: string;
  weight: number;
}
interface Risk {
  severity: string;
  status: string;
}
interface Model {
  projectId: string;
  environment: string;
  sensitivity: string;
  deploymentType: string;
  inputGuardrailsEnabled: boolean;
  outputGuardrailsEnabled: boolean;
  toolAccessEnabled: boolean;
  loggingEnabled: boolean;
  riskLevel: string;
  networkIsolated?: boolean | null;
  internetAccess?: boolean | null;
  modelIntegrityVerified?: boolean | null;
  allowedTools: string[];
}
interface Integration {
  type: string;
  enabled: boolean;
}

export interface Adjustment {
  label: string;
  points: number;
}
export interface ScoreBreakdown {
  score: number;
  grade: string;
  coverage: number;
  protectedLayers: number;
  totalLayers: number;
  openRisks: number;
  criticalGaps: number;
  penalties: Adjustment[];
  bonuses: Adjustment[];
}

const STATUS_CREDIT: Record<string, number> = {
  not_implemented: 0,
  planned: 0.25,
  implemented: 0.75,
  verified: 1,
};

function grade(s: number): string {
  if (s >= 90) return "A";
  if (s >= 80) return "B";
  if (s >= 70) return "C";
  if (s >= 60) return "D";
  return "F";
}

export function modelIssues(m: Model): string[] {
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

export function computeScore(
  controls: Control[],
  risks: Risk[],
  models: Model[] = [],
  integrations: Integration[] = []
): ScoreBreakdown {
  const totalWeight = controls.reduce((s, c) => s + c.weight, 0) || 1;
  const earned = controls.reduce(
    (s, c) => s + c.weight * (STATUS_CREDIT[c.status] ?? 0),
    0
  );
  const coverage = Math.round((earned / totalWeight) * 100);

  let score = coverage;
  const penalties: Adjustment[] = [];
  const bonuses: Adjustment[] = [];
  const isActive = (c: Control) =>
    c.status === "implemented" || c.status === "verified";
  const activeIntegration = (type: string) =>
    integrations.some((i) => i.type === type && i.enabled);

  const fileScanActive =
    activeIntegration("threat_emulation") || activeIntegration("file_scan");
  if (fileScanActive) bonuses.push({ label: "Check Point file scanning enabled", points: 6 });
  else penalties.push({ label: "Files can enter RAG without scanning", points: 10 });

  if (controls.some((c) => c.id === "ctl-lakera-input" && isActive(c)))
    bonuses.push({ label: "Lakera Guard input protection enabled", points: 6 });
  if (controls.some((c) => c.id === "ctl-lakera-output" && isActive(c)))
    bonuses.push({ label: "Lakera Guard output inspection enabled", points: 5 });

  if (!controls.some((c) => c.id === "ctl-siem" && isActive(c)))
    penalties.push({ label: "Missing SIEM / audit logging", points: 10 });
  if (
    !controls.some(
      (c) => (c.id === "ctl-content-mod" || c.id === "ctl-pii-redaction") && isActive(c)
    )
  )
    penalties.push({ label: "Missing output moderation", points: 8 });
  if (
    !controls.some(
      (c) => (c.id === "ctl-tool-allowlist" || c.id === "ctl-least-priv") && isActive(c)
    )
  )
    penalties.push({ label: "Missing tool restrictions", points: 10 });
  if (!controls.some((c) => c.id === "ctl-vault" && isActive(c)))
    penalties.push({ label: "Missing secrets management", points: 8 });

  if (models.length) {
    const prod = models.filter((m) => m.environment === "production");
    const prodCovered = prod.filter(
      (m) => m.inputGuardrailsEnabled && m.outputGuardrailsEnabled
    );
    if (prod.length && prodCovered.length === prod.length)
      bonuses.push({ label: "All production LLMs guardrailed", points: 5 });

    const noInput = models.filter((m) => !m.inputGuardrailsEnabled).length;
    if (noInput) penalties.push({ label: `${noInput} model(s) without input guardrail`, points: noInput * 4 });
    const noOutput = models.filter((m) => !m.outputGuardrailsEnabled).length;
    if (noOutput) penalties.push({ label: `${noOutput} model(s) without output guardrail`, points: noOutput * 4 });
    const noLogging = models.filter((m) => !m.loggingEnabled).length;
    if (noLogging) penalties.push({ label: `${noLogging} model(s) without logging`, points: noLogging * 3 });

    const locals = models.filter((m) => m.deploymentType === "local");
    if (locals.length) {
      if (locals.every((m) => m.networkIsolated))
        bonuses.push({ label: "Local LLMs network isolated", points: 4 });
      const exposed = locals.filter((m) => !m.networkIsolated).length;
      if (exposed) penalties.push({ label: `${exposed} local LLM(s) not network isolated`, points: exposed * 5 });
      const online = locals.filter((m) => m.internetAccess).length;
      if (online) penalties.push({ label: `${online} local LLM(s) with internet access`, points: online * 5 });
      const loose = locals.filter(
        (m) => m.toolAccessEnabled && (m.allowedTools?.length ?? 0) === 0
      ).length;
      if (loose) penalties.push({ label: `${loose} local LLM(s) with unrestricted tools`, points: loose * 5 });
    }

    const restricted = models.filter(
      (m) => !m.toolAccessEnabled || (m.allowedTools?.length ?? 0) > 0
    );
    if (restricted.length === models.length)
      bonuses.push({ label: "Tool access restricted per model", points: 3 });
  }

  const unresolvedCritical = risks.filter(
    (r) => r.severity === "critical" && (r.status === "open" || r.status === "mitigating")
  );
  if (unresolvedCritical.length)
    penalties.push({
      label: `${unresolvedCritical.length} unresolved critical risk(s)`,
      points: unresolvedCritical.length * 6,
    });

  const totalPenalty = penalties.reduce((s, p) => s + p.points, 0);
  const totalBonus = bonuses.reduce((s, b) => s + b.points, 0);
  score = Math.max(0, Math.min(100, score - totalPenalty + totalBonus));

  const definedLayers = Array.from(new Set(controls.map((c) => c.layer)));
  const protectedLayers = definedLayers.filter((l) =>
    controls.some((c) => c.layer === l && isActive(c))
  ).length;
  const openRisks = risks.filter((r) => r.status === "open" || r.status === "mitigating").length;
  const criticalGaps =
    controls.filter((c) => c.status === "not_implemented" && c.weight >= 3).length +
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

/** Load a project's data from the DB (via a Prisma client) and score it. */
export async function scoreProject(
  prisma: import("@prisma/client").PrismaClient,
  projectId: string
): Promise<ScoreBreakdown> {
  const [controls, risks, models, integrations] = await Promise.all([
    prisma.securityControl.findMany(),
    prisma.risk.findMany(),
    prisma.modelCoverage.findMany({ where: { projectId } }),
    prisma.integration.findMany(),
  ]);
  const parseTools = (m: Record<string, unknown>) => ({
    ...m,
    allowedTools:
      typeof m.allowedTools === "string"
        ? (JSON.parse(m.allowedTools as string) as string[])
        : ((m.allowedTools as string[]) ?? []),
  });
  return computeScore(
    controls as Control[],
    risks as Risk[],
    (models as Record<string, unknown>[]).map(parseTools) as unknown as Model[],
    integrations as Integration[]
  );
}
