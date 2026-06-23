import { X, Trash2, ExternalLink, ShieldAlert } from "lucide-react";
import { useStore } from "../../store/useStore";
import { CONTROL_STATUSES, OWASP_META, LAYERS } from "../../lib/constants";
import { StatusBadge, OwaspBadge, LayerBadge } from "../ui/Badges";
import type { ControlStatus } from "../../types";

export function InspectorPanel() {
  const {
    selectedControlId,
    controls,
    risks,
    selectControl,
    updateControl,
    setControlStatus,
    deleteControl,
    can,
  } = useStore();
  const canWrite = can("controls:write");

  const control = controls.find((c) => c.id === selectedControlId);

  if (!control) {
    return (
      <div className="flex h-full w-80 flex-shrink-0 flex-col items-center justify-center border-l border-base-border bg-base-sidebar p-6 text-center">
        <ShieldAlert className="h-8 w-8 text-gray-700" />
        <p className="mt-3 text-sm font-medium text-gray-400">
          No control selected
        </p>
        <p className="mt-1 text-xs text-gray-600">
          Click a node on the map to inspect and edit its control details.
        </p>
      </div>
    );
  }

  const mitigated = risks.filter((r) => control.mitigates.includes(r.id));
  const layer = LAYERS[control.layer];

  return (
    <div className="flex h-full w-80 flex-shrink-0 flex-col border-l border-base-border bg-base-sidebar">
      <div
        className="flex items-start justify-between border-b border-base-border px-4 py-3"
        style={{ borderTopColor: layer.color }}
      >
        <div className="min-w-0">
          <p className="stat-label">Control Inspector</p>
          <h2 className="mt-0.5 truncate text-sm font-bold text-white">
            {control.name}
          </h2>
        </div>
        <button
          onClick={() => selectControl(null)}
          aria-label="Close inspector"
          className="rounded-md p-1 text-gray-500 hover:bg-base-hover hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-auto p-4">
        <div className="flex flex-wrap items-center gap-2">
          <LayerBadge layer={control.layer} />
          {control.owasp.map((o) => (
            <OwaspBadge key={o} category={o} />
          ))}
        </div>

        <Field label="Description">
          <p className="text-sm leading-relaxed text-gray-300">
            {control.description}
          </p>
        </Field>

        <Field label="Status">
          <div className="mb-2">
            <StatusBadge status={control.status} />
          </div>
          <fieldset
            disabled={!canWrite}
            className="grid grid-cols-2 gap-1.5 border-0 p-0 disabled:opacity-60"
          >
            {CONTROL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setControlStatus(control.id, s)}
                className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                  control.status === s
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-base-border text-gray-400 hover:bg-base-hover"
                }`}
              >
                {labelFor(s)}
              </button>
            ))}
          </fieldset>
        </Field>

        <Field label="Owner">
          <input
            value={control.owner}
            disabled={!canWrite}
            onChange={(e) => updateControl(control.id, { owner: e.target.value })}
            className="w-full rounded-md border border-base-border bg-base-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-accent/40 disabled:opacity-60"
          />
        </Field>

        <Field label="Evidence link">
          <div className="flex gap-2">
            <input
              value={control.evidenceLink ?? ""}
              placeholder="https://…"
              disabled={!canWrite}
              onChange={(e) =>
                updateControl(control.id, { evidenceLink: e.target.value })
              }
              className="w-full rounded-md border border-base-border bg-base-card px-3 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/40 disabled:opacity-60"
            />
            {control.evidenceLink && (
              <a
                href={control.evidenceLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center rounded-md border border-base-border px-2 text-gray-400 hover:text-accent"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </Field>

        <Field label="Notes">
          <textarea
            value={control.notes ?? ""}
            disabled={!canWrite}
            onChange={(e) => updateControl(control.id, { notes: e.target.value })}
            rows={3}
            placeholder="Implementation notes, caveats…"
            className="w-full resize-none rounded-md border border-base-border bg-base-card px-3 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/40 disabled:opacity-60"
          />
        </Field>

        <Field label={`Mitigates (${mitigated.length})`}>
          {mitigated.length === 0 ? (
            <p className="text-xs text-gray-600">No linked risks.</p>
          ) : (
            <div className="space-y-1.5">
              {mitigated.map((r) => (
                <div
                  key={r.id}
                  className="rounded-md border border-base-border bg-base-card px-3 py-2"
                >
                  <p className="text-xs font-medium text-gray-200">{r.title}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {OWASP_META[r.owasp[0]]?.title}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Field>
      </div>

      {canWrite && (
        <div className="border-t border-base-border p-3">
          <button
            onClick={() => deleteControl(control.id)}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-status-critical/30 bg-status-critical/10 px-3 py-2 text-sm font-medium text-status-critical hover:bg-status-critical/20"
          >
            <Trash2 className="h-4 w-4" />
            Delete control
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="stat-label mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function labelFor(s: ControlStatus): string {
  return {
    not_implemented: "Not impl.",
    planned: "Planned",
    implemented: "Implemented",
    verified: "Verified",
  }[s];
}
