import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import * as Icons from "lucide-react";
import type { ControlStatus, LayerKey, Vendor } from "../../types";
import { STATUS_META, LAYERS, VENDOR_META } from "../../lib/constants";

export interface StackNodeData {
  label: string;
  layer: LayerKey;
  status: ControlStatus;
  owasp: string[];
  icon?: keyof typeof Icons;
  vendor?: Vendor;
  /** Live summary shown on integration nodes (e.g. latest verdict) */
  badge?: { text: string; tone: "good" | "warn" | "bad" };
}

function StackNodeImpl({ data, selected }: NodeProps<StackNodeData>) {
  const m = STATUS_META[data.status];
  const layer = LAYERS[data.layer];
  const Icon = (Icons[data.icon ?? "Shield"] ??
    Icons.Shield) as Icons.LucideIcon;

  return (
    <div
      className={`group w-52 rounded-lg border bg-base-card px-3 py-2.5 shadow-lg transition-all ${
        selected
          ? "border-accent ring-2 ring-accent/40"
          : "border-base-border hover:border-gray-600"
      }`}
      style={{ borderLeftColor: layer.color, borderLeftWidth: 3 }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-start gap-2.5">
        <div
          className="mt-0.5 rounded-md p-1.5"
          style={{ backgroundColor: `${layer.color}1a` }}
        >
          <Icon className="h-4 w-4" style={{ color: layer.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="truncate text-sm font-semibold text-white">
              {data.label}
            </p>
            {data.vendor && data.vendor !== "internal" && (
              <span
                className="flex-shrink-0 rounded px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                style={{
                  color: VENDOR_META[data.vendor].color,
                  backgroundColor: `${VENDOR_META[data.vendor].color}1a`,
                }}
              >
                {VENDOR_META[data.vendor].label}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
            <span className={`text-[10px] font-medium ${m.color}`}>
              {m.label}
            </span>
          </div>
          {data.badge && (
            <div
              className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                data.badge.tone === "good"
                  ? "bg-status-success/10 text-status-success"
                  : data.badge.tone === "warn"
                  ? "bg-status-warning/10 text-status-warning"
                  : "bg-status-critical/10 text-status-critical"
              }`}
            >
              {data.badge.text}
            </div>
          )}
          {data.owasp.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {data.owasp.slice(0, 2).map((o) => (
                <span
                  key={o}
                  className="rounded bg-status-violet/10 px-1 py-0.5 font-mono text-[9px] text-status-violet"
                >
                  {o}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const StackNode = memo(StackNodeImpl);

function ZoneNodeImpl({ data }: NodeProps<{ label: string; color: string; description: string }>) {
  return (
    <div className="pointer-events-none flex h-full w-full flex-col rounded-xl border border-dashed bg-base-sidebar/40"
      style={{ borderColor: `${data.color}55` }}
    >
      <div
        className="rounded-t-xl px-3 py-2"
        style={{ backgroundColor: `${data.color}14` }}
      >
        <p
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: data.color }}
        >
          {data.label}
        </p>
        <p className="text-[10px] text-gray-500">{data.description}</p>
      </div>
    </div>
  );
}

export const ZoneNode = memo(ZoneNodeImpl);
