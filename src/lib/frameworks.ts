// Compliance frameworks beyond OWASP LLM Top 10. Each framework's requirements
// are mapped to existing SecurityControls (by control id, OWASP category, or
// layer). Coverage is derived from the status of the mapped controls, so a
// single assessment drives every framework's report.

import type { SecurityControl, OwaspCategory, LayerKey } from "../types";
import { OWASP_META } from "./constants";

export interface FrameworkRequirement {
  code: string;
  title: string;
  description?: string;
  controls?: string[];
  owasp?: OwaspCategory[];
  layers?: LayerKey[];
}

export interface Framework {
  id: string;
  name: string;
  short: string;
  version: string;
  description: string;
  url: string;
  /** Optional grouping label for requirements (e.g. NIST functions) */
  groups?: { code: string; title: string }[];
  requirements: (FrameworkRequirement & { group?: string })[];
}

export type ReqStatus = "covered" | "partial" | "gap";

// ── OWASP LLM Top 10 (mapped via the OWASP category each control carries) ────
const owaspReqs: FrameworkRequirement[] = (
  Object.keys(OWASP_META) as OwaspCategory[]
).map((c) => ({
  code: c,
  title: OWASP_META[c].title,
  owasp: [c],
}));

export const FRAMEWORKS: Framework[] = [
  {
    id: "owasp-llm",
    name: "OWASP Top 10 for LLM Applications",
    short: "OWASP LLM",
    version: "2025",
    description:
      "The ten most critical security risks for LLM applications.",
    url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
    requirements: owaspReqs,
  },
  {
    id: "nist-ai-rmf",
    name: "NIST AI Risk Management Framework",
    short: "NIST AI RMF",
    version: "1.0",
    description:
      "Voluntary framework to manage AI risks across four core functions.",
    url: "https://www.nist.gov/itl/ai-risk-management-framework",
    groups: [
      { code: "GOVERN", title: "Govern" },
      { code: "MAP", title: "Map" },
      { code: "MEASURE", title: "Measure" },
      { code: "MANAGE", title: "Manage" },
    ],
    requirements: [
      { group: "GOVERN", code: "GOVERN-1.1", title: "Policies & accountability", description: "Logging, audit and ownership of AI risk.", controls: ["ctl-siem", "ctl-audit-export", "ctl-soc-ticket"] },
      { group: "GOVERN", code: "GOVERN-1.2", title: "Secure secrets & access", description: "Credential and prompt governance.", controls: ["ctl-vault", "ctl-prompt-store"] },
      { group: "MAP", code: "MAP-1.1", title: "Context & risks identified", description: "Threats enumerated and classified.", controls: ["ctl-pi-classifier", "ctl-source-validation"] },
      { group: "MAP", code: "MAP-2.3", title: "Trusted data sources", description: "Provenance of retrieval/training data.", controls: ["ctl-source-validation", "ctl-cp-te"] },
      { group: "MEASURE", code: "MEASURE-2.7", title: "Security & resilience tested", description: "Inputs and files screened.", controls: ["ctl-cp-te", "ctl-cp-filescan", "ctl-lakera-input"] },
      { group: "MEASURE", code: "MEASURE-2.9", title: "Output validity checked", description: "Output validated before use.", controls: ["ctl-schema-validation", "ctl-output-sanitize"] },
      { group: "MANAGE", code: "MANAGE-1.3", title: "Access & action controls", description: "Tool authority constrained.", controls: ["ctl-gateway", "ctl-tool-allowlist", "ctl-least-priv"] },
      { group: "MANAGE", code: "MANAGE-2.2", title: "Sensitive-data controls", description: "PII/DLP on outputs.", controls: ["ctl-pii-redaction", "ctl-dlp-scan", "ctl-lakera-output"] },
      { group: "MANAGE", code: "MANAGE-4.1", title: "Continuous monitoring", description: "Detection & response in place.", controls: ["ctl-block-log", "ctl-siem"] },
    ],
  },
  {
    id: "eu-ai-act",
    name: "EU AI Act (High-Risk Obligations)",
    short: "EU AI Act",
    version: "2024",
    description:
      "Key obligations for high-risk AI systems under the EU AI Act.",
    url: "https://artificialintelligenceact.eu/",
    requirements: [
      { code: "Art.9", title: "Risk management system", description: "Identify and mitigate risks throughout the lifecycle.", controls: ["ctl-pi-classifier", "ctl-source-validation", "ctl-block-log"] },
      { code: "Art.10", title: "Data & data governance", description: "Quality and provenance of data.", controls: ["ctl-source-validation", "ctl-pii-redaction"] },
      { code: "Art.12", title: "Record-keeping (logging)", description: "Automatic event logging.", controls: ["ctl-siem", "ctl-audit-export", "ctl-soc-ticket"] },
      { code: "Art.13", title: "Transparency to users", description: "Documented system behaviour & prompts.", controls: ["ctl-prompt-store", "ctl-system-prompt"] },
      { code: "Art.14", title: "Human oversight", description: "Ability to intervene / block.", controls: ["ctl-block-log", "ctl-content-mod", "ctl-soc-ticket"] },
      { code: "Art.15a", title: "Accuracy & robustness", description: "Resilience to adversarial input.", controls: ["ctl-input-filter", "ctl-pi-classifier", "ctl-lakera-input", "ctl-schema-validation"] },
      { code: "Art.15b", title: "Cybersecurity", description: "Protection of model & secrets.", controls: ["ctl-vault", "ctl-signed-model", "ctl-gateway", "ctl-cp-te"] },
    ],
  },
  {
    id: "iso-42001",
    name: "ISO/IEC 42001 (AI Management System)",
    short: "ISO 42001",
    version: "2023",
    description:
      "Controls for an AI management system (Annex A control areas).",
    url: "https://www.iso.org/standard/81230.html",
    requirements: [
      { code: "A.2.2", title: "AI policy & governance", description: "Documented policy and oversight.", controls: ["ctl-audit-export", "ctl-soc-ticket"] },
      { code: "A.4.3", title: "Resources & data quality", description: "Trusted data resources.", controls: ["ctl-source-validation"] },
      { code: "A.6.2", title: "AI system lifecycle / development", description: "Secure development & integrity.", controls: ["ctl-signed-model", "ctl-schema-validation"] },
      { code: "A.7.4", title: "Data for AI systems", description: "Privacy and leakage controls.", controls: ["ctl-pii-redaction", "ctl-dlp-scan"] },
      { code: "A.8.3", title: "Information & transparency", description: "System-prompt management.", controls: ["ctl-prompt-store", "ctl-system-prompt"] },
      { code: "A.9.2", title: "Responsible use", description: "Content moderation & guardrails.", controls: ["ctl-content-mod", "ctl-lakera-input", "ctl-lakera-output"] },
      { code: "A.10.2", title: "Third-party & supplier security", description: "Vendor security integrations.", controls: ["ctl-cp-te", "ctl-cp-filescan", "ctl-file-gateway"] },
      { code: "A.6.2.8", title: "Logging & monitoring", description: "Operational monitoring.", controls: ["ctl-siem", "ctl-block-log"] },
    ],
  },
  {
    id: "mitre-atlas",
    name: "MITRE ATLAS (Adversarial ML Tactics)",
    short: "MITRE ATLAS",
    version: "v4",
    description:
      "Adversarial threat tactics against AI systems and their mitigations.",
    url: "https://atlas.mitre.org/",
    requirements: [
      { code: "AML.TA0002", title: "Reconnaissance / Resource access", description: "Limit probing & abuse.", controls: ["ctl-input-filter", "ctl-rate-limit"] },
      { code: "AML.TA0004", title: "Initial Access (Prompt Injection)", description: "Block malicious prompts.", controls: ["ctl-pi-classifier", "ctl-lakera-input", "ctl-input-filter"] },
      { code: "AML.TA0005", title: "ML Model Access", description: "Gate and authenticate model calls.", controls: ["ctl-gateway", "ctl-vault"] },
      { code: "AML.TA0006", title: "Execution (Unsafe tools)", description: "Constrain agent actions.", controls: ["ctl-tool-allowlist", "ctl-least-priv"] },
      { code: "AML.TA0007", title: "Defense Evasion (Jailbreak)", description: "Resist guardrail bypass.", controls: ["ctl-system-prompt", "ctl-content-mod", "ctl-lakera-input"] },
      { code: "AML.TA0010", title: "Exfiltration (Data leakage)", description: "Prevent sensitive egress.", controls: ["ctl-pii-redaction", "ctl-dlp-scan", "ctl-lakera-output"] },
      { code: "AML.TA0011", title: "Impact (Poisoning)", description: "Protect corpus & model integrity.", controls: ["ctl-cp-te", "ctl-source-validation", "ctl-signed-model"] },
      { code: "AML.TA0012", title: "Persistence & detection", description: "Detect and respond to attacks.", controls: ["ctl-siem", "ctl-block-log", "ctl-soc-ticket"] },
    ],
  },
];

const CREDIT: Record<string, number> = {
  not_implemented: 0,
  planned: 0.25,
  implemented: 0.75,
  verified: 1,
};

export interface RequirementResult {
  req: FrameworkRequirement & { group?: string };
  status: ReqStatus;
  credit: number;
  mapped: SecurityControl[];
}

export interface FrameworkResult {
  framework: Framework;
  percent: number;
  grade: string;
  counts: { covered: number; partial: number; gap: number };
  requirements: RequirementResult[];
}

function mapControls(
  req: FrameworkRequirement,
  controls: SecurityControl[]
): SecurityControl[] {
  const ids = new Set(req.controls ?? []);
  const owasp = new Set(req.owasp ?? []);
  const layers = new Set(req.layers ?? []);
  const seen = new Set<string>();
  const out: SecurityControl[] = [];
  for (const c of controls) {
    const hit =
      ids.has(c.id) ||
      c.owasp.some((o) => owasp.has(o)) ||
      layers.has(c.layer);
    if (hit && !seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
    }
  }
  return out;
}

function grade(p: number): string {
  if (p >= 90) return "A";
  if (p >= 80) return "B";
  if (p >= 70) return "C";
  if (p >= 60) return "D";
  return "F";
}

export function evaluateFramework(
  framework: Framework,
  controls: SecurityControl[]
): FrameworkResult {
  const requirements: RequirementResult[] = framework.requirements.map((req) => {
    const mapped = mapControls(req, controls);
    const credit = mapped.length
      ? mapped.reduce((s, c) => s + (CREDIT[c.status] ?? 0), 0) / mapped.length
      : 0;
    const status: ReqStatus =
      credit >= 0.75 ? "covered" : credit > 0 ? "partial" : "gap";
    return { req, status, credit, mapped };
  });

  const percent = Math.round(
    (requirements.reduce((s, r) => s + r.credit, 0) /
      (requirements.length || 1)) *
      100
  );
  const counts = {
    covered: requirements.filter((r) => r.status === "covered").length,
    partial: requirements.filter((r) => r.status === "partial").length,
    gap: requirements.filter((r) => r.status === "gap").length,
  };
  return { framework, percent, grade: grade(percent), counts, requirements };
}

export const REQ_STATUS_META: Record<
  ReqStatus,
  { label: string; color: string; bg: string }
> = {
  covered: {
    label: "Covered",
    color: "text-status-success",
    bg: "bg-status-success/10 border-status-success/30",
  },
  partial: {
    label: "Partial",
    color: "text-status-warning",
    bg: "bg-status-warning/10 border-status-warning/30",
  },
  gap: {
    label: "Gap",
    color: "text-status-critical",
    bg: "bg-status-critical/10 border-status-critical/30",
  },
};

// ── Per-framework Markdown report ─────────────────────────────────────────────
export function buildFrameworkReport(
  result: FrameworkResult,
  projectName: string,
  date: string
): string {
  const { framework: f, percent, grade: g, counts, requirements } = result;
  const lines: string[] = [];
  lines.push(`# ${f.name} — Compliance Report`);
  lines.push("");
  lines.push(`**Project:** ${projectName}`);
  lines.push(`**Framework:** ${f.name} (${f.version})`);
  lines.push(`**Generated:** ${date}`);
  lines.push("");
  lines.push(
    `**Coverage: ${percent}% (Grade ${g})** — ${counts.covered} covered, ${counts.partial} partial, ${counts.gap} gaps.`
  );
  lines.push("");
  lines.push(`| Requirement | Status | Mapped controls |`);
  lines.push(`| --- | --- | --- |`);
  for (const r of requirements) {
    const ctrls = r.mapped.length
      ? r.mapped.map((c) => `${c.name} (${c.status})`).join("; ")
      : "_none_";
    lines.push(
      `| **${r.req.code}** ${r.req.title} | ${REQ_STATUS_META[r.status].label} | ${ctrls} |`
    );
  }
  lines.push("");
  const gaps = requirements.filter((r) => r.status !== "covered");
  if (gaps.length) {
    lines.push(`## Gaps & partials to remediate`);
    lines.push("");
    for (const r of gaps) {
      lines.push(
        `- **${r.req.code} ${r.req.title}** — ${r.status}${
          r.mapped.length ? "" : " (no mapped controls)"
        }`
      );
    }
  } else {
    lines.push(`All requirements covered. ✅`);
  }
  lines.push("");
  lines.push(`_Mapped from the AI Security Stack Mapper control assessment._`);
  return lines.join("\n");
}
