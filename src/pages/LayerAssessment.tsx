import { useStore } from "../store/useStore";
import { PageHeader } from "../components/layout/Layout";
import {
  LAYERS,
  LAYER_ORDER,
  CONTROL_STATUSES,
  STATUS_META,
} from "../lib/constants";
import { OwaspBadge } from "../components/ui/Badges";
import type { ControlStatus } from "../types";

export function LayerAssessment() {
  const { controls, setControlStatus, can } = useStore();
  const canWrite = can("controls:write");

  return (
    <div>
      <PageHeader
        title="Layer Assessment"
        subtitle="Mark the implementation maturity of every control, layer by layer"
      />
      <div className="space-y-5 p-6">
        {LAYER_ORDER.map((key) => {
          const layer = LAYERS[key];
          const layerControls = controls.filter((c) => c.layer === key);
          const verified = layerControls.filter(
            (c) => c.status === "verified"
          ).length;
          const active = layerControls.filter(
            (c) => c.status === "implemented" || c.status === "verified"
          ).length;
          const pct = layerControls.length
            ? Math.round((active / layerControls.length) * 100)
            : 0;

          return (
            <div key={key} className="soc-card overflow-hidden">
              <div
                className="flex items-center justify-between border-b border-base-border px-5 py-3"
                style={{ borderLeft: `3px solid ${layer.color}` }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: layer.color }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {layer.name}
                    </h3>
                    <p className="text-xs text-gray-500">{layer.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {verified} verified · {active}/{layerControls.length} active
                    </p>
                    <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-base-bg">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: layer.color,
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className="text-lg font-bold"
                    style={{ color: layer.color }}
                  >
                    {pct}%
                  </span>
                </div>
              </div>

              <div className="divide-y divide-base-border/60">
                {layerControls.length === 0 && (
                  <p className="px-5 py-4 text-sm text-gray-600">
                    No controls defined for this layer yet.
                  </p>
                )}
                {layerControls.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-200">
                          {c.name}
                        </p>
                        {c.owasp.map((o) => (
                          <OwaspBadge key={o} category={o} />
                        ))}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {c.description}
                      </p>
                    </div>
                    <fieldset
                      disabled={!canWrite}
                      className="flex flex-shrink-0 gap-1.5 border-0 p-0 disabled:opacity-60"
                    >
                      {CONTROL_STATUSES.map((s) => (
                        <StatusButton
                          key={s}
                          status={s}
                          active={c.status === s}
                          onClick={() => setControlStatus(c.id, s)}
                        />
                      ))}
                    </fieldset>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusButton({
  status,
  active,
  onClick,
}: {
  status: ControlStatus;
  active: boolean;
  onClick: () => void;
}) {
  const m = STATUS_META[status];
  const short = {
    not_implemented: "Not impl.",
    planned: "Planned",
    implemented: "Implemented",
    verified: "Verified",
  }[status];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? `${m.bg} ${m.color}`
          : "border-base-border text-gray-500 hover:bg-base-hover"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? m.dot : "bg-gray-700"}`} />
      {short}
    </button>
  );
}
