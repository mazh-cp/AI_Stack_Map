import type {
  ControlStatus,
  Severity,
  RiskStatus,
  OwaspCategory,
  LayerKey,
  FileVerdict,
  ScanStatus,
  PromptDecision,
  RiskLevel,
  IntegrationStatus,
  Vendor,
} from "../../types";
import {
  STATUS_META,
  SEVERITY_META,
  RISK_STATUS_META,
  OWASP_META,
  LAYERS,
  VERDICT_META,
  SCAN_STATUS_META,
  DECISION_META,
  RISK_LEVEL_META,
  INTEGRATION_STATUS_META,
  VENDOR_META,
} from "../../lib/constants";

export function StatusBadge({ status }: { status: ControlStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${m.bg} ${m.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const m = SEVERITY_META[severity];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${m.bg} ${m.color}`}
    >
      {m.label}
    </span>
  );
}

export function RiskStatusBadge({ status }: { status: RiskStatus }) {
  const m = RISK_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${m.bg} ${m.color}`}
    >
      {m.label}
    </span>
  );
}

export function OwaspBadge({ category }: { category: OwaspCategory }) {
  return (
    <span
      title={OWASP_META[category].title}
      className="inline-flex items-center gap-1 rounded-md border border-status-violet/30 bg-status-violet/10 px-2 py-0.5 text-xs font-medium text-status-violet"
    >
      <span className="font-mono">{category}</span>
      <span className="hidden text-status-violet/70 sm:inline">
        {OWASP_META[category].short}
      </span>
    </span>
  );
}

export function VerdictBadge({ verdict }: { verdict: FileVerdict }) {
  const m = VERDICT_META[verdict];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${m.bg} ${m.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function ScanStatusBadge({ status }: { status: ScanStatus }) {
  const m = SCAN_STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${m.color}`}>
      {status === "scanning" && (
        <span className="h-1.5 w-1.5 rounded-full bg-status-info soc-pulse" />
      )}
      {m.label}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: PromptDecision }) {
  const m = DECISION_META[decision];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${m.bg} ${m.color}`}
    >
      {m.label}
    </span>
  );
}

export function RiskLevelBadge({ level }: { level: RiskLevel }) {
  const m = RISK_LEVEL_META[level];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${m.bg} ${m.color}`}
    >
      {m.label}
    </span>
  );
}

export function IntegrationStatusBadge({
  status,
}: {
  status: IntegrationStatus;
}) {
  const m = INTEGRATION_STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${m.color}`}>
      <span className={`h-2 w-2 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function VendorBadge({ vendor }: { vendor: Vendor }) {
  const m = VENDOR_META[vendor];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ color: m.color, borderColor: `${m.color}40`, backgroundColor: `${m.color}15` }}
    >
      {m.label}
    </span>
  );
}

export function LayerBadge({ layer }: { layer: LayerKey }) {
  const l = LAYERS[layer];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium"
      style={{
        color: l.color,
        borderColor: `${l.color}40`,
        backgroundColor: `${l.color}15`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: l.color }}
      />
      {l.name}
    </span>
  );
}
