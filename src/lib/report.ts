import type {
  SecurityControl,
  Risk,
  Incident,
  Project,
  ModelCoverage,
  Integration,
} from "../types";
import { LAYERS, LAYER_ORDER, STATUS_META, SEVERITY_META, OWASP_META } from "./constants";
import { computeScore } from "./score";

interface ReportInput {
  project: Project;
  controls: SecurityControl[];
  risks: Risk[];
  incidents: Incident[];
  models?: ModelCoverage[];
  integrations?: Integration[];
  date: string;
}

export function buildMarkdownReport({
  project,
  controls,
  risks,
  incidents,
  models = [],
  integrations = [],
  date,
}: ReportInput): string {
  const s = computeScore(controls, risks, models, integrations);
  const lines: string[] = [];

  lines.push(`# AI Security Architecture Report`);
  lines.push("");
  lines.push(`**Project:** ${project.name} _(${project.environment})_`);
  lines.push(`**Owner:** ${project.owner}`);
  lines.push(`**Generated:** ${date}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Executive summary
  lines.push(`## 1. Executive Summary`);
  lines.push("");
  lines.push(
    `The ${project.name} LLM application achieves an overall **AI Security Score of ${s.score}/100 (Grade ${s.grade})**, with weighted control coverage of ${s.coverage}%. ${s.protectedLayers} of ${s.totalLayers} architecture layers have active controls. There are currently **${s.openRisks} open risks** and **${s.criticalGaps} critical gaps** requiring attention.`
  );
  lines.push("");
  if (s.penalties.length) {
    lines.push(`Score deductions:`);
    for (const p of s.penalties) lines.push(`- ${p.label} (−${p.points})`);
    lines.push("");
  }

  // Architecture overview
  lines.push(`## 2. Architecture Overview`);
  lines.push("");
  lines.push(`Defense-in-depth flow across the LLM application stack:`);
  lines.push("");
  lines.push("```");
  lines.push(
    LAYER_ORDER.map((l) => LAYERS[l].name).join("  →  ")
  );
  lines.push("```");
  lines.push("");

  // Layer-by-layer findings
  lines.push(`## 3. Layer-by-Layer Findings`);
  lines.push("");
  for (const key of LAYER_ORDER) {
    const layer = LAYERS[key];
    const lc = controls.filter((c) => c.layer === key);
    const active = lc.filter(
      (c) => c.status === "implemented" || c.status === "verified"
    ).length;
    lines.push(`### ${layer.name} — ${active}/${lc.length} active`);
    lines.push("");
    lines.push(`_${layer.description}_`);
    lines.push("");
    if (lc.length === 0) {
      lines.push(`> ⚠️ No controls defined for this layer.`);
    } else {
      lines.push(`| Control | Status | OWASP | Owner |`);
      lines.push(`| --- | --- | --- | --- |`);
      for (const c of lc) {
        lines.push(
          `| ${c.name} | ${STATUS_META[c.status].label} | ${c.owasp.join(", ")} | ${c.owner} |`
        );
      }
    }
    lines.push("");
  }

  // Control implementation status
  lines.push(`## 4. Control Implementation Status`);
  lines.push("");
  for (const st of ["verified", "implemented", "planned", "not_implemented"] as const) {
    const count = controls.filter((c) => c.status === st).length;
    lines.push(`- **${STATUS_META[st].label}:** ${count}`);
  }
  lines.push("");

  // Critical gaps
  lines.push(`## 5. Critical Gaps`);
  lines.push("");
  const gaps = controls.filter(
    (c) => c.status === "not_implemented" && c.weight >= 3
  );
  const critRisks = risks.filter(
    (r) =>
      r.severity === "critical" &&
      (r.status === "open" || r.status === "mitigating")
  );
  if (!gaps.length && !critRisks.length) {
    lines.push(`No critical gaps identified. ✅`);
  } else {
    for (const g of gaps) {
      lines.push(`- **${g.name}** (${LAYERS[g.layer].name}) — not implemented`);
    }
    for (const r of critRisks) {
      lines.push(
        `- **${r.title}** — unresolved critical risk (${r.status})`
      );
    }
  }
  lines.push("");

  // Risk register
  lines.push(`## 6. Risk Register`);
  lines.push("");
  lines.push(`| Risk | Severity | Status | Layer | OWASP |`);
  lines.push(`| --- | --- | --- | --- | --- |`);
  for (const r of [...risks].sort(
    (a, b) => SEVERITY_META[b.severity].rank - SEVERITY_META[a.severity].rank
  )) {
    lines.push(
      `| ${r.title} | ${SEVERITY_META[r.severity].label} | ${r.status} | ${LAYERS[r.layer].name} | ${r.owasp.join(", ")} |`
    );
  }
  lines.push("");

  // Incidents
  lines.push(`## 7. Recent Incidents`);
  lines.push("");
  if (!incidents.length) {
    lines.push(`No incidents recorded.`);
  } else {
    for (const i of incidents) {
      lines.push(
        `- **${i.title}** (${SEVERITY_META[i.severity].label}, ${i.status}) — ${i.detectedAt}`
      );
    }
  }
  lines.push("");

  // Remediation plan
  lines.push(`## 8. Recommended Remediation Plan`);
  lines.push("");
  const recs = buildRecommendations(controls, risks);
  if (!recs.length) {
    lines.push(`Posture is strong. Maintain monitoring and re-verify quarterly.`);
  } else {
    recs.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
  }
  lines.push("");
  lines.push("---");
  lines.push(`_Report generated by AI Security Stack Mapper._`);

  return lines.join("\n");
}

export function buildRecommendations(
  controls: SecurityControl[],
  risks: Risk[]
): string[] {
  const recs: string[] = [];
  const s = computeScore(controls, risks);
  for (const p of s.penalties) {
    if (p.label.includes("logging"))
      recs.push("Stand up SIEM/audit logging across the gateway and tool layer.");
    else if (p.label.includes("output moderation"))
      recs.push("Deploy output moderation and PII redaction before delivery.");
    else if (p.label.includes("tool restrictions"))
      recs.push("Enforce a tool allow-list with least-privilege, short-lived credentials.");
    else if (p.label.includes("secrets"))
      recs.push("Move all secrets into a managed vault; remove keys from code/env.");
    else if (p.label.includes("critical risk"))
      recs.push("Prioritize remediation of unresolved critical risks.");
  }
  // High-weight not-implemented controls
  controls
    .filter((c) => c.status === "not_implemented" && c.weight >= 3)
    .forEach((c) =>
      recs.push(`Implement "${c.name}" in the ${LAYERS[c.layer].name} layer.`)
    );
  // Planned high-weight controls
  controls
    .filter((c) => c.status === "planned" && c.weight >= 3)
    .forEach((c) =>
      recs.push(`Complete the planned "${c.name}" control and verify it.`)
    );
  return [...new Set(recs)];
}

// Used by the HTML preview / print view
export { computeScore, OWASP_META };
