import { useMemo, useState } from "react";
import { Plus, Library, X } from "lucide-react";
import { useStore } from "../store/useStore";
import { PageHeader } from "../components/layout/Layout";
import { OwaspBadge, LayerBadge } from "../components/ui/Badges";
import {
  LAYERS,
  LAYER_ORDER,
  CONTROL_STATUSES,
  OWASP_CATEGORIES,
  STATUS_META,
} from "../lib/constants";
import type {
  ControlStatus,
  LayerKey,
  OwaspCategory,
  SecurityControl,
} from "../types";

export function ControlLibrary() {
  const { controls, filters, setFilters, setControlStatus, addControl, can } =
    useStore();
  const [showAdd, setShowAdd] = useState(false);
  const canWrite = can("controls:write");

  const filtered = useMemo(() => {
    return controls.filter((c) => {
      if (filters.layer !== "all" && c.layer !== filters.layer) return false;
      if (filters.status !== "all" && c.status !== filters.status) return false;
      if (filters.owasp !== "all" && !c.owasp.includes(filters.owasp as OwaspCategory))
        return false;
      if (
        filters.search &&
        !(c.name + c.description)
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [controls, filters]);

  return (
    <div>
      <PageHeader
        title="Control Library"
        subtitle="Security controls mapped to the OWASP Top 10 for LLM Applications"
        actions={
          canWrite ? (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-[#0f172a] hover:bg-accent/90"
            >
              <Plus className="h-4 w-4" /> Add control
            </button>
          ) : (
            <span className="rounded-lg border border-base-border px-3 py-2 text-xs text-gray-500">
              Read-only
            </span>
          )
        }
      />

      <div className="space-y-4 p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            value={filters.layer}
            onChange={(v) => setFilters({ layer: v as LayerKey | "all" })}
            options={[
              { value: "all", label: "All layers" },
              ...LAYER_ORDER.map((l) => ({
                value: l,
                label: LAYERS[l].name,
              })),
            ]}
          />
          <FilterSelect
            value={filters.status}
            onChange={(v) => setFilters({ status: v as ControlStatus | "all" })}
            options={[
              { value: "all", label: "All statuses" },
              ...CONTROL_STATUSES.map((s) => ({
                value: s,
                label: STATUS_META[s].label,
              })),
            ]}
          />
          <FilterSelect
            value={filters.owasp}
            onChange={(v) => setFilters({ owasp: v })}
            options={[
              { value: "all", label: "All OWASP" },
              ...OWASP_CATEGORIES.map((o) => ({ value: o, label: o })),
            ]}
          />
          <span className="ml-auto text-xs text-gray-500">
            {filtered.length} of {controls.length} controls
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="soc-card flex flex-col p-4 transition-colors hover:border-gray-600"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-md p-1.5"
                    style={{ backgroundColor: `${LAYERS[c.layer].color}1a` }}
                  >
                    <Library
                      className="h-4 w-4"
                      style={{ color: LAYERS[c.layer].color }}
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{c.name}</h3>
                </div>
              </div>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-gray-400">
                {c.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <LayerBadge layer={c.layer} />
                {c.owasp.map((o) => (
                  <OwaspBadge key={o} category={o} />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-base-border pt-3">
                <span className="text-xs text-gray-500">{c.owner}</span>
                <select
                  value={c.status}
                  disabled={!canWrite}
                  onChange={(e) =>
                    setControlStatus(c.id, e.target.value as ControlStatus)
                  }
                  className={`rounded-md border bg-base-bg px-2 py-1 text-xs font-medium outline-none disabled:opacity-60 ${STATUS_META[c.status].color}`}
                >
                  {CONTROL_STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-base-card text-gray-200">
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="soc-card py-16 text-center">
            <p className="text-sm text-gray-500">
              No controls match the current filters.
            </p>
          </div>
        )}
      </div>

      {showAdd && (
        <AddControlModal
          onClose={() => setShowAdd(false)}
          onAdd={(c) => {
            addControl(c);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-base-border bg-base-card px-3 py-2 text-sm text-gray-300 outline-none focus:border-accent/40"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-base-card">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function AddControlModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (c: SecurityControl) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [layer, setLayer] = useState<LayerKey>("input");
  const [status, setStatus] = useState<ControlStatus>("planned");
  const [owner, setOwner] = useState("");
  const [owasp, setOwasp] = useState<OwaspCategory>("LLM01");

  const submit = () => {
    if (!name.trim()) return;
    onAdd({
      id: `ctl-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || "No description provided.",
      layer,
      mitigates: [],
      owasp: [owasp],
      status,
      owner: owner.trim() || "Unassigned",
      weight: 2,
      position: { x: 40, y: 40 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-base-border bg-base-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-base-border px-5 py-4">
          <h2 className="text-base font-bold text-white">Add Security Control</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-base-hover hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <Labeled label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Output schema validation"
              className="input-soc"
            />
          </Labeled>
          <Labeled label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="input-soc resize-none"
            />
          </Labeled>
          <div className="grid grid-cols-2 gap-4">
            <Labeled label="Layer">
              <select
                value={layer}
                onChange={(e) => setLayer(e.target.value as LayerKey)}
                className="input-soc"
              >
                {LAYER_ORDER.map((l) => (
                  <option key={l} value={l} className="bg-base-card">
                    {LAYERS[l].name}
                  </option>
                ))}
              </select>
            </Labeled>
            <Labeled label="OWASP category">
              <select
                value={owasp}
                onChange={(e) => setOwasp(e.target.value as OwaspCategory)}
                className="input-soc"
              >
                {OWASP_CATEGORIES.map((o) => (
                  <option key={o} value={o} className="bg-base-card">
                    {o}
                  </option>
                ))}
              </select>
            </Labeled>
            <Labeled label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ControlStatus)}
                className="input-soc"
              >
                {CONTROL_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-base-card">
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </Labeled>
            <Labeled label="Owner">
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Team or person"
                className="input-soc"
              />
            </Labeled>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-base-border px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-base-border px-4 py-2 text-sm text-gray-300 hover:bg-base-hover"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-[#0f172a] hover:bg-accent/90 disabled:opacity-40"
          >
            Add control
          </button>
        </div>
      </div>
    </div>
  );
}

function Labeled({
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
