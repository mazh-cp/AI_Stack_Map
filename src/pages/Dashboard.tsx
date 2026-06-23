import {
  Layers,
  ShieldAlert,
  AlertOctagon,
  Activity,
  CheckCircle2,
  XCircle,
  MinusCircle,
  FileSearch,
  Ban,
  ShieldX,
  Cpu,
  Server,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { computeScore } from "../lib/score";
import { StatCard } from "../components/ui/StatCard";
import { ScoreRing } from "../components/ui/ScoreRing";
import { PageHeader } from "../components/layout/Layout";
import { SeverityBadge } from "../components/ui/Badges";
import { LAYERS, LAYER_ORDER, OWASP_META, STATUS_META } from "../lib/constants";
import type { ComplianceStatus } from "../types";

export function Dashboard() {
  const {
    controls,
    risks,
    incidents,
    compliance,
    models,
    integrations,
    fileScans,
    promptInspections,
    activeProjectId,
  } = useStore();
  // ── Integration / coverage metrics ──────────────────────────────────
  const projectModels = models.filter((m) => m.projectId === activeProjectId);
  const s = computeScore(controls, risks, projectModels, integrations);

  const recentIncidents = [...incidents]
    .sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1))
    .slice(0, 4);
  const filesScanned = fileScans.length;
  const maliciousBlocked = fileScans.filter(
    (f) => f.blockedFromRetrieval
  ).length;
  const injectionsBlocked = promptInspections.filter(
    (p) =>
      (p.decision === "block" || p.decision === "redact") &&
      p.categories.some((c) => c === "prompt_injection" || c === "jailbreak")
  ).length;
  const localModels = projectModels.filter((m) => m.deploymentType === "local");
  const localProtected = localModels.filter((m) => m.networkIsolated).length;
  const unguarded = projectModels.filter(
    (m) => !m.inputGuardrailsEnabled || !m.outputGuardrailsEnabled
  ).length;
  const highRisk = projectModels.filter(
    (m) => m.riskLevel === "high" || m.riskLevel === "critical"
  ).length;

  return (
    <div>
      <PageHeader
        title="Security Dashboard"
        subtitle="Defense-in-depth posture across your LLM application stack"
      />

      <div className="space-y-6 p-6">
        {/* Top stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Protected Layers"
            value={`${s.protectedLayers}/${s.totalLayers}`}
            sub="Layers with active controls"
            icon={Layers}
            tone="info"
          />
          <StatCard
            label="Open Risks"
            value={s.openRisks}
            sub="Open or mitigating"
            icon={ShieldAlert}
            tone="warning"
          />
          <StatCard
            label="Critical Gaps"
            value={s.criticalGaps}
            sub="High-weight controls missing"
            icon={AlertOctagon}
            tone="critical"
          />
          <StatCard
            label="Active Incidents"
            value={incidents.filter((i) => i.status !== "closed").length}
            sub={`${incidents.length} total tracked`}
            icon={Activity}
            tone="violet"
          />
        </div>

        {/* Integration & coverage widgets */}
        <div>
          <p className="stat-label mb-3">Vendor Protection & Model Coverage</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
            <MiniStat label="Files Scanned" value={filesScanned} icon={FileSearch} tone="info" />
            <MiniStat label="Malicious Blocked" value={maliciousBlocked} icon={Ban} tone="critical" />
            <MiniStat label="Injections Blocked" value={injectionsBlocked} icon={ShieldX} tone="warning" />
            <MiniStat label="Models Covered" value={projectModels.length} icon={Cpu} tone="info" />
            <MiniStat
              label="Local Protected"
              value={`${localProtected}/${localModels.length}`}
              icon={Server}
              tone="success"
            />
            <MiniStat label="Unguarded" value={unguarded} icon={AlertTriangle} tone="warning" />
            <MiniStat label="High-Risk" value={highRisk} icon={Flame} tone="critical" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Score */}
          <div className="soc-card flex flex-col items-center justify-center p-6">
            <p className="stat-label mb-4">Overall AI Security Score</p>
            <ScoreRing score={s.score} grade={s.grade} />
            <p className="mt-4 text-center text-xs text-gray-500">
              Weighted coverage {s.coverage}% · {s.bonuses.length} bonuses ·{" "}
              {s.penalties.length} penalties
            </p>
            {(s.bonuses.length > 0 || s.penalties.length > 0) && (
              <div className="mt-4 max-h-56 w-full space-y-1.5 overflow-auto">
                {s.bonuses.map((b) => (
                  <div
                    key={b.label}
                    className="flex items-center justify-between rounded-md border border-status-success/20 bg-status-success/5 px-3 py-1.5 text-xs"
                  >
                    <span className="text-gray-300">{b.label}</span>
                    <span className="font-mono text-status-success">
                      +{b.points}
                    </span>
                  </div>
                ))}
                {s.penalties.map((p) => (
                  <div
                    key={p.label}
                    className="flex items-center justify-between rounded-md border border-base-border bg-base-bg/50 px-3 py-1.5 text-xs"
                  >
                    <span className="text-gray-400">{p.label}</span>
                    <span className="font-mono text-status-critical">
                      −{p.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Layer posture */}
          <div className="soc-card p-6 lg:col-span-2">
            <p className="stat-label mb-4">Layer Posture</p>
            <div className="space-y-3">
              {LAYER_ORDER.map((key) => {
                const layer = LAYERS[key];
                const layerControls = controls.filter((c) => c.layer === key);
                const active = layerControls.filter(
                  (c) =>
                    c.status === "implemented" || c.status === "verified"
                ).length;
                const pct = layerControls.length
                  ? Math.round((active / layerControls.length) * 100)
                  : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex w-36 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: layer.color }}
                      />
                      <span className="text-sm font-medium text-gray-300">
                        {layer.name}
                      </span>
                    </div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-base-bg">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: layer.color,
                        }}
                      />
                    </div>
                    <span className="w-20 text-right text-xs text-gray-500">
                      {active}/{layerControls.length} active
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent incidents */}
          <div className="soc-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="stat-label">Recent Incidents</p>
              <span className="text-xs text-gray-600">last 7 days</span>
            </div>
            <div className="space-y-2.5">
              {recentIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className="flex items-start gap-3 rounded-lg border border-base-border bg-base-bg/40 p-3"
                >
                  <div className="mt-0.5">
                    <SeverityBadge severity={inc.severity} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-200">
                      {inc.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {LAYERS[inc.layer].name} · {inc.detectedAt} ·{" "}
                      <span className="capitalize">{inc.status}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance status */}
          <div className="soc-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="stat-label">Compliance Status</p>
              <span className="text-xs text-gray-600">OWASP LLM Top 10</span>
            </div>
            <div className="space-y-2">
              {compliance.map((c) => (
                <div
                  key={c.owasp}
                  className="flex items-center justify-between rounded-lg border border-base-border bg-base-bg/40 px-3 py-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-status-violet">
                      {c.owasp}
                    </span>
                    <span className="text-sm text-gray-300">
                      {OWASP_META[c.owasp].short}
                    </span>
                  </div>
                  <ComplianceIcon status={c.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Control status summary */}
        <div className="soc-card p-6">
          <p className="stat-label mb-4">Control Implementation Summary</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              ["verified", "implemented", "planned", "not_implemented"] as const
            ).map((st) => {
              const count = controls.filter((c) => c.status === st).length;
              const m = STATUS_META[st];
              return (
                <div
                  key={st}
                  className={`rounded-lg border p-4 ${m.bg}`}
                >
                  <p className={`text-2xl font-bold ${m.color}`}>{count}</p>
                  <p className="mt-1 text-xs text-gray-400">{m.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: typeof Layers;
  tone: "info" | "success" | "warning" | "critical" | "violet";
}) {
  const color = {
    info: "text-status-info",
    success: "text-status-success",
    warning: "text-status-warning",
    critical: "text-status-critical",
    violet: "text-status-violet",
  }[tone];
  return (
    <div className="soc-card p-3.5">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-[10px] uppercase tracking-wider text-gray-500">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function ComplianceIcon({ status }: { status: ComplianceStatus }) {
  if (status === "compliant")
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-status-success">
        <CheckCircle2 className="h-4 w-4" /> Compliant
      </span>
    );
  if (status === "partial")
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-status-warning">
        <MinusCircle className="h-4 w-4" /> Partial
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-status-critical">
      <XCircle className="h-4 w-4" /> Gap
    </span>
  );
}
