import { useState } from "react";
import {
  Cpu,
  Server,
  Cloud,
  Plus,
  X,
  Wifi,
  WifiOff,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Bug,
  ChevronDown,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { PageHeader } from "../components/layout/Layout";
import { RiskLevelBadge } from "../components/ui/Badges";
import { StatCard } from "../components/ui/StatCard";
import {
  PROVIDER_META,
  SENSITIVITY_META,
  LOCAL_RUNTIME_LABEL,
} from "../lib/constants";
import { llmCoverageService, modelIssues } from "../services/llmCoverageService";
import { api, type Evaluation } from "../api/client";
import type {
  ModelCoverage as Model,
  ModelProvider,
  DeploymentType,
  Environment,
  Sensitivity,
  LocalRuntime,
} from "../types";

export function ModelCoverage() {
  const { models, activeProjectId, updateModel, addModel, deleteModel, can } =
    useStore();
  const [showAdd, setShowAdd] = useState(false);
  const canWrite = can("models:write");

  const list = models.filter((m) => m.projectId === activeProjectId);
  const locals = list.filter((m) => m.deploymentType === "local");
  const localsProtected = locals.filter((m) => m.networkIsolated).length;
  const unguarded = list.filter(
    (m) => !m.inputGuardrailsEnabled || !m.outputGuardrailsEnabled
  ).length;
  const highRisk = list.filter(
    (m) => m.riskLevel === "high" || m.riskLevel === "critical"
  ).length;

  return (
    <div>
      <PageHeader
        title="LLM Coverage Management"
        subtitle="Define which models are covered by the security architecture"
        actions={
          canWrite ? (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-[#0f172a] hover:bg-accent/90"
            >
              <Plus className="h-4 w-4" /> Register model
            </button>
          ) : (
            <span className="rounded-lg border border-base-border px-3 py-2 text-xs text-gray-500">
              Read-only
            </span>
          )
        }
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Models Covered" value={list.length} icon={Cpu} tone="info" />
          <StatCard
            label="Local LLMs Protected"
            value={`${localsProtected}/${locals.length}`}
            sub="Network isolated"
            icon={Server}
            tone="success"
          />
          <StatCard
            label="Unguarded Models"
            value={unguarded}
            sub="Missing input/output guard"
            icon={AlertTriangle}
            tone="warning"
          />
          <StatCard
            label="High-Risk Deployments"
            value={highRisk}
            icon={AlertTriangle}
            tone="critical"
          />
        </div>

        <div className="space-y-4">
          {list.map((m) => (
            <ModelCard
              key={m.id}
              model={m}
              canWrite={canWrite}
              onUpdate={(patch) => updateModel(m.id, patch)}
              onDelete={() => deleteModel(m.id)}
            />
          ))}
          {list.length === 0 && (
            <div className="soc-card py-12 text-center text-sm text-gray-600">
              No models registered for this project.
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddModelModal
          projectId={activeProjectId}
          onClose={() => setShowAdd(false)}
          onAdd={(m) => {
            addModel(m);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function DeploymentIcon({ type }: { type: DeploymentType }) {
  if (type === "local") return <Server className="h-4 w-4" />;
  if (type === "custom") return <Cpu className="h-4 w-4" />;
  return <Cloud className="h-4 w-4" />;
}

function ModelCard({
  model: m,
  onUpdate,
  onDelete,
  canWrite,
}: {
  model: Model;
  onUpdate: (patch: Partial<Model>) => void;
  onDelete: () => void;
  canWrite: boolean;
}) {
  const { backend, can, pushToast } = useStore();
  const online = backend === "online";
  const canRun = can("models:write");
  const [conn, setConn] = useState<{ ok: boolean; detail: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<Evaluation | null>(null);
  const [showProbes, setShowProbes] = useState(false);
  const issues = modelIssues(m);
  const isLocal = m.deploymentType === "local";

  // Latest eval summary: a freshly-run result wins over the persisted one.
  const evalSummary =
    evalResult
      ? { mode: evalResult.mode, score: evalResult.score, passes: evalResult.passes, total: evalResult.total }
      : m.lastEvaluation ?? null;

  const test = async () => {
    setTesting(true);
    try {
      if (online) {
        const r = await api.models.test(m.id);
        setConn({ ok: r.reachable, detail: r.detail });
      } else {
        const r = await llmCoverageService.testConnection(m);
        setConn({ ok: r.ok, detail: r.detail });
      }
    } catch {
      setConn({ ok: false, detail: "Connection test failed" });
    }
    setTesting(false);
  };

  const evaluate = async () => {
    if (!online) {
      pushToast({ kind: "info", message: "Evaluation needs the backend (it calls the model server-side)." });
      return;
    }
    setEvaluating(true);
    try {
      const r = await api.models.evaluate(m.id);
      setEvalResult(r);
      setShowProbes(true);
      pushToast({
        kind: r.score >= 80 ? "success" : "error",
        message: `${m.modelName}: ${r.score}% resilient (${r.mode}).`,
      });
    } catch {
      pushToast({ kind: "error", message: "Evaluation failed." });
    }
    setEvaluating(false);
  };

  return (
    <div className="soc-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-base-bg p-2.5 text-accent ring-1 ring-base-border">
            <DeploymentIcon type={m.deploymentType} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-white">{m.modelName}</h3>
              <span className="rounded bg-base-bg px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">
                {PROVIDER_META[m.provider].label}
              </span>
              {isLocal && m.localRuntime && (
                <span className="rounded bg-status-violet/10 px-1.5 py-0.5 text-[10px] text-status-violet">
                  {LOCAL_RUNTIME_LABEL[m.localRuntime]}
                </span>
              )}
              <RiskLevelBadge level={m.riskLevel} />
            </div>
            <p className="mt-0.5 font-mono text-[11px] text-gray-500">
              {m.endpoint}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {m.environment} ·{" "}
              <span className={SENSITIVITY_META[m.sensitivity].color}>
                {SENSITIVITY_META[m.sensitivity].label}
              </span>{" "}
              · {m.owner} · {m.useCase}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={test}
            disabled={testing}
            className="flex items-center gap-1.5 rounded-md border border-base-border px-2.5 py-1.5 text-xs text-gray-400 hover:bg-base-hover disabled:opacity-40"
          >
            <Activity className={`h-3.5 w-3.5 ${testing ? "animate-pulse" : ""}`} />
            Test
          </button>
          {canRun && (
            <button
              onClick={evaluate}
              disabled={evaluating}
              title="Run an adversarial security evaluation against the model endpoint"
              className="flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-40"
            >
              <Bug className={`h-3.5 w-3.5 ${evaluating ? "animate-pulse" : ""}`} />
              {evaluating ? "Evaluating…" : "Evaluate"}
            </button>
          )}
          {evalSummary && (
            <span
              className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                evalSummary.score >= 80
                  ? "border-status-success/30 bg-status-success/10 text-status-success"
                  : evalSummary.score >= 50
                  ? "border-status-warning/30 bg-status-warning/10 text-status-warning"
                  : "border-status-critical/30 bg-status-critical/10 text-status-critical"
              }`}
              title={`Security resilience · ${evalSummary.mode}`}
            >
              {evalSummary.score}% resilient
            </span>
          )}
          {canWrite && (
            <button
              onClick={onDelete}
              aria-label="Delete model"
              className="rounded-md border border-base-border p-1.5 text-gray-500 hover:bg-status-critical/10 hover:text-status-critical"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {conn && (
        <p className={`mt-2 text-xs ${conn.ok ? "text-status-success" : "text-status-critical"}`}>
          {conn.ok ? "✓" : "✕"} {conn.detail}
        </p>
      )}

      {/* Security evaluation results */}
      {evalResult && (
        <div className="mt-3 rounded-lg border border-base-border bg-base-bg/40 p-3">
          <button
            onClick={() => setShowProbes((s) => !s)}
            aria-expanded={showProbes}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-gray-200">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Security evaluation — {evalResult.score}% resilient ({evalResult.passes}/
              {evalResult.total})
              <span className="rounded bg-base-card px-1.5 py-0.5 text-[10px] uppercase text-gray-500">
                {evalResult.mode} · {evalResult.latencyMs}ms
              </span>
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showProbes ? "" : "-rotate-90"}`} />
          </button>
          {showProbes && (
            <div className="mt-3 space-y-2">
              {evalResult.probes.map((p) => (
                <div key={p.category} className="rounded-md border border-base-border bg-base-card p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-200">{p.label}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        p.verdict === "resilient"
                          ? "bg-status-success/10 text-status-success"
                          : "bg-status-critical/10 text-status-critical"
                      }`}
                    >
                      {p.verdict}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-gray-500">↳ {p.response.slice(0, 160)}</p>
                  <p className="mt-0.5 text-[11px] text-gray-600">{p.note}</p>
                </div>
              ))}
              <p className="text-[11px] text-gray-600">
                Probes: prompt injection, system-prompt leakage, jailbreak, harmful
                content, PII fabrication — sent to the model endpoint server-side.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Guardrail toggles */}
      <fieldset
        disabled={!canWrite}
        className="mt-4 grid grid-cols-2 gap-2 border-0 p-0 disabled:opacity-60 sm:grid-cols-4"
      >
        <Toggle
          label="Input guard"
          checked={m.inputGuardrailsEnabled}
          onChange={(v) => onUpdate({ inputGuardrailsEnabled: v })}
        />
        <Toggle
          label="Output guard"
          checked={m.outputGuardrailsEnabled}
          onChange={(v) => onUpdate({ outputGuardrailsEnabled: v })}
        />
        <Toggle
          label="Tool access"
          checked={m.toolAccessEnabled}
          onChange={(v) => onUpdate({ toolAccessEnabled: v })}
        />
        <Toggle
          label="Logging"
          checked={m.loggingEnabled}
          onChange={(v) => onUpdate({ loggingEnabled: v })}
        />
      </fieldset>

      {/* Local LLM controls */}
      {isLocal && (
        <div className="mt-3 rounded-lg border border-status-violet/20 bg-status-violet/5 p-3">
          <p className="stat-label mb-2 text-status-violet">Local LLM controls</p>
          <fieldset
            disabled={!canWrite}
            className="grid grid-cols-2 gap-2 border-0 p-0 disabled:opacity-60 sm:grid-cols-3"
          >
            <Toggle
              label="Network isolated"
              checked={!!m.networkIsolated}
              onChange={(v) => onUpdate({ networkIsolated: v })}
            />
            <Toggle
              label="Internet access"
              checked={!!m.internetAccess}
              onChange={(v) => onUpdate({ internetAccess: v })}
              danger
            />
            <Toggle
              label="Integrity verified"
              checked={!!m.modelIntegrityVerified}
              onChange={(v) => onUpdate({ modelIntegrityVerified: v })}
            />
          </fieldset>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              {m.internetAccess ? (
                <Wifi className="h-3.5 w-3.5 text-status-critical" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-status-success" />
              )}
              {m.internetAccess ? "Internet reachable" : "Air-gapped"}
            </span>
            {m.serverLocation && <span>· {m.serverLocation}</span>}
            <span>· tools: {m.allowedTools.length ? m.allowedTools.join(", ") : "none"}</span>
          </div>
        </div>
      )}

      {/* Issues */}
      {issues.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {issues.map((iss) => (
            <span
              key={iss}
              className="flex items-center gap-1 rounded-md border border-status-warning/30 bg-status-warning/10 px-2 py-0.5 text-[11px] text-status-warning"
            >
              <AlertTriangle className="h-3 w-3" />
              {iss}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-status-success">
          <ShieldCheck className="h-4 w-4" /> Fully guardrailed
        </p>
      )}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  danger,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md border border-base-border bg-base-bg/40 px-2.5 py-1.5 text-xs text-gray-300">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`toggle toggle-xs ${danger ? "toggle-error" : "toggle-primary"}`}
      />
    </label>
  );
}

function AddModelModal({
  projectId,
  onClose,
  onAdd,
}: {
  projectId: string;
  onClose: () => void;
  onAdd: (m: Model) => void;
}) {
  const [provider, setProvider] = useState<ModelProvider>("openai");
  const [modelName, setModelName] = useState("");
  const [deploymentType, setDeploymentType] = useState<DeploymentType>("hosted");
  const [endpoint, setEndpoint] = useState("");
  const [environment, setEnvironment] = useState<Environment>("production");
  const [sensitivity, setSensitivity] = useState<Sensitivity>("internal");
  const [owner, setOwner] = useState("");
  const [useCase, setUseCase] = useState("");
  const [localRuntime, setLocalRuntime] = useState<LocalRuntime>("ollama");

  const isLocal = deploymentType === "local";

  const submit = () => {
    if (!modelName.trim()) return;
    onAdd({
      id: `mdl-${Date.now()}`,
      projectId,
      provider: isLocal ? "local" : provider,
      modelName: modelName.trim(),
      deploymentType,
      endpoint: endpoint.trim(),
      environment,
      sensitivity,
      owner: owner.trim() || "Unassigned",
      useCase: useCase.trim() || "—",
      allowedTools: [],
      inputGuardrailsEnabled: false,
      outputGuardrailsEnabled: false,
      toolAccessEnabled: false,
      loggingEnabled: false,
      riskLevel: "medium",
      ...(isLocal
        ? {
            localRuntime,
            internal: true,
            internetAccess: false,
            networkIsolated: false,
            localDataAccess: true,
            modelIntegrityVerified: false,
          }
        : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border border-base-border bg-base-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-base-border px-5 py-4">
          <h2 className="text-base font-bold text-white">Register LLM</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-500 hover:bg-base-hover">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 p-5">
          <Field label="Model name">
            <input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g. gpt-4o, llama-3.1-70b"
              className="input-soc"
            />
          </Field>
          <Field label="Deployment">
            <select
              value={deploymentType}
              onChange={(e) => setDeploymentType(e.target.value as DeploymentType)}
              className="input-soc"
            >
              <option value="hosted" className="bg-base-card">Hosted</option>
              <option value="local" className="bg-base-card">Local</option>
              <option value="custom" className="bg-base-card">Custom</option>
            </select>
          </Field>
          {isLocal ? (
            <Field label="Local runtime">
              <select
                value={localRuntime}
                onChange={(e) => setLocalRuntime(e.target.value as LocalRuntime)}
                className="input-soc"
              >
                {(Object.keys(LOCAL_RUNTIME_LABEL) as LocalRuntime[]).map((r) => (
                  <option key={r} value={r} className="bg-base-card">
                    {LOCAL_RUNTIME_LABEL[r]}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Provider">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as ModelProvider)}
                className="input-soc"
              >
                {(Object.keys(PROVIDER_META) as ModelProvider[])
                  .filter((p) => p !== "local")
                  .map((p) => (
                    <option key={p} value={p} className="bg-base-card">
                      {PROVIDER_META[p].label}
                    </option>
                  ))}
              </select>
            </Field>
          )}
          <Field label="Environment">
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as Environment)}
              className="input-soc"
            >
              <option value="dev" className="bg-base-card">Dev</option>
              <option value="staging" className="bg-base-card">Staging</option>
              <option value="production" className="bg-base-card">Production</option>
            </select>
          </Field>
          <Field label="Endpoint">
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://… or http://10.x:11434"
              className="input-soc"
            />
          </Field>
          <Field label="Data sensitivity">
            <select
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value as Sensitivity)}
              className="input-soc"
            >
              {(Object.keys(SENSITIVITY_META) as Sensitivity[]).map((s) => (
                <option key={s} value={s} className="bg-base-card">
                  {SENSITIVITY_META[s].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Owner">
            <input value={owner} onChange={(e) => setOwner(e.target.value)} className="input-soc" />
          </Field>
          <Field label="Business use case">
            <input value={useCase} onChange={(e) => setUseCase(e.target.value)} className="input-soc" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-base-border px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-base-border px-4 py-2 text-sm text-gray-300 hover:bg-base-hover">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!modelName.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#0f172a] hover:bg-accent/90 disabled:opacity-40"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="stat-label mb-1.5">{label}</p>
      {children}
    </div>
  );
}
