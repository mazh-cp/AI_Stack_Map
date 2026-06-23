import { Fragment, useState } from "react";
import { ShieldAlert, ChevronRight } from "lucide-react";
import { useStore } from "../store/useStore";
import { PageHeader } from "../components/layout/Layout";
import {
  SeverityBadge,
  OwaspBadge,
  LayerBadge,
} from "../components/ui/Badges";
import { SEVERITY_META, RISK_STATUS_META } from "../lib/constants";
import type { RiskStatus, Severity } from "../types";

const RISK_STATUSES: RiskStatus[] = [
  "open",
  "mitigating",
  "mitigated",
  "accepted",
];

export function RiskRegister() {
  const { risks, controls, updateRisk, filters, can } = useStore();
  const canWrite = can("risks:write");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sevFilter, setSevFilter] = useState<Severity | "all">("all");

  const filtered = risks
    .filter((r) => (sevFilter === "all" ? true : r.severity === sevFilter))
    .filter((r) =>
      filters.search
        ? (r.title + r.description)
            .toLowerCase()
            .includes(filters.search.toLowerCase())
        : true
    )
    .sort(
      (a, b) =>
        SEVERITY_META[b.severity].rank - SEVERITY_META[a.severity].rank
    );

  const counts = (["critical", "high", "medium", "low"] as Severity[]).map(
    (s) => ({ s, n: risks.filter((r) => r.severity === s).length })
  );

  return (
    <div>
      <PageHeader
        title="Risk Register"
        subtitle="Track LLM-specific threats, their severity, and mitigating controls"
      />
      <div className="space-y-4 p-6">
        {/* Severity summary / filter */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSevFilter("all")}
            className={`rounded-lg border px-4 py-2 text-sm ${
              sevFilter === "all"
                ? "border-accent bg-accent/10 text-accent"
                : "border-base-border bg-base-card text-gray-400 hover:bg-base-hover"
            }`}
          >
            All <span className="ml-1 font-mono">{risks.length}</span>
          </button>
          {counts.map(({ s, n }) => (
            <button
              key={s}
              onClick={() => setSevFilter(s)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
                sevFilter === s
                  ? "border-accent bg-accent/10"
                  : "border-base-border bg-base-card hover:bg-base-hover"
              }`}
            >
              <span className={SEVERITY_META[s].color}>
                {SEVERITY_META[s].label}
              </span>
              <span className="font-mono text-gray-400">{n}</span>
            </button>
          ))}
        </div>

        {/* Risk table */}
        <div className="soc-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-border text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Layer</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">OWASP</th>
                <th className="px-4 py-3 font-medium">Controls</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const linked = controls.filter((c) =>
                  r.controls.includes(c.id)
                );
                const isOpen = expanded === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                      className="cursor-pointer border-b border-base-border/60 hover:bg-base-hover/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ChevronRight
                            className={`h-4 w-4 text-gray-600 transition-transform ${
                              isOpen ? "rotate-90" : ""
                            }`}
                          />
                          <ShieldAlert
                            className={`h-4 w-4 ${SEVERITY_META[r.severity].color}`}
                          />
                          <span className="font-medium text-gray-200">
                            {r.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <LayerBadge layer={r.layer} />
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={r.severity} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {r.owasp.map((o) => (
                            <OwaspBadge key={o} category={o} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {linked.length} linked
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={r.status}
                          disabled={!canWrite}
                          onChange={(e) =>
                            updateRisk(r.id, {
                              status: e.target.value as RiskStatus,
                            })
                          }
                          className={`rounded-md border bg-base-bg px-2 py-1 text-xs font-medium outline-none disabled:opacity-60 ${RISK_STATUS_META[r.status].color}`}
                        >
                          {RISK_STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-base-card text-gray-200">
                              {RISK_STATUS_META[s].label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-base-border/60 bg-base-bg/40">
                        <td colSpan={6} className="px-12 py-4">
                          <p className="text-sm text-gray-400">
                            {r.description}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-4">
                            <span className="text-xs text-gray-500">
                              Owner:{" "}
                              <span className="text-gray-300">{r.owner}</span>
                            </span>
                            <span className="text-xs text-gray-500">
                              Likelihood:{" "}
                              <span
                                className={SEVERITY_META[r.likelihood].color}
                              >
                                {SEVERITY_META[r.likelihood].label}
                              </span>
                            </span>
                          </div>
                          {linked.length > 0 && (
                            <div className="mt-3">
                              <p className="stat-label mb-1.5">
                                Mitigating controls
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {linked.map((c) => (
                                  <span
                                    key={c.id}
                                    className="rounded-md border border-base-border bg-base-card px-2.5 py-1 text-xs text-gray-300"
                                  >
                                    {c.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-600">
              No risks match the current filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
