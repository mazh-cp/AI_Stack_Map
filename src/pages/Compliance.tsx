import { useMemo, useState } from "react";
import { Download, ShieldCheck, ExternalLink, ChevronRight } from "lucide-react";
import { useStore } from "../store/useStore";
import { PageHeader } from "../components/layout/Layout";
import { StatusBadge } from "../components/ui/Badges";
import {
  FRAMEWORKS,
  evaluateFramework,
  buildFrameworkReport,
  REQ_STATUS_META,
  type FrameworkResult,
} from "../lib/frameworks";

export function Compliance() {
  const { controls, projects, activeProjectId } = useStore();
  const project = projects.find((p) => p.id === activeProjectId);
  const [activeId, setActiveId] = useState(FRAMEWORKS[0].id);
  const [expanded, setExpanded] = useState<string | null>(null);

  const results = useMemo(
    () => FRAMEWORKS.map((f) => evaluateFramework(f, controls)),
    [controls]
  );
  const active = results.find((r) => r.framework.id === activeId)!;

  const download = (result: FrameworkResult) => {
    const md = buildFrameworkReport(
      result,
      project?.name ?? "Project",
      "2026-06-22"
    );
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.framework.short.replace(/\s+/g, "-").toLowerCase()}-compliance.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Compliance Frameworks"
        subtitle="Coverage across OWASP, NIST AI RMF, EU AI Act, ISO 42001 & MITRE ATLAS"
      />
      <div className="space-y-5 p-6">
        {/* Framework selector cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {results.map((r) => {
            const isActive = r.framework.id === activeId;
            return (
              <button
                key={r.framework.id}
                onClick={() => setActiveId(r.framework.id)}
                aria-pressed={isActive}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  isActive
                    ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                    : "border-base-border bg-base-card hover:border-gray-600"
                }`}
              >
                <p className="text-xs font-semibold text-gray-300">
                  {r.framework.short}
                </p>
                <p className="mt-1 text-[10px] text-gray-600">
                  {r.framework.version}
                </p>
                <div className="mt-2 flex items-end gap-1.5">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: barColor(r.percent) }}
                  >
                    {r.percent}%
                  </span>
                  <span className="mb-1 text-[10px] text-gray-500">
                    {r.framework.requirements.length} reqs
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-base-bg">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${r.percent}%`, backgroundColor: barColor(r.percent) }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Active framework detail */}
        <div className="soc-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-border p-5">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <h2 className="text-base font-bold text-white">
                  {active.framework.name}
                </h2>
                <a
                  href={active.framework.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open framework reference"
                  className="text-gray-500 hover:text-accent"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {active.framework.description}
              </p>
              <div className="mt-2 flex gap-3 text-xs">
                <span className="text-status-success">
                  {active.counts.covered} covered
                </span>
                <span className="text-status-warning">
                  {active.counts.partial} partial
                </span>
                <span className="text-status-critical">
                  {active.counts.gap} gaps
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p
                  className="text-3xl font-bold"
                  style={{ color: barColor(active.percent) }}
                >
                  {active.percent}%
                </p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">
                  Grade {active.grade}
                </p>
              </div>
              <button
                onClick={() => download(active)}
                className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-[#0f172a] hover:bg-accent/90"
              >
                <Download className="h-4 w-4" /> Export report
              </button>
            </div>
          </div>

          <div className="divide-y divide-base-border/60">
            {active.requirements.map((r) => {
              const m = REQ_STATUS_META[r.status];
              const open = expanded === r.req.code;
              return (
                <div key={r.req.code}>
                  <button
                    onClick={() => setExpanded(open ? null : r.req.code)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-base-hover/40"
                  >
                    <ChevronRight
                      className={`h-4 w-4 flex-shrink-0 text-gray-600 transition-transform ${open ? "rotate-90" : ""}`}
                    />
                    <span className="w-28 flex-shrink-0 font-mono text-xs text-status-violet">
                      {r.req.code}
                    </span>
                    <span className="flex-1 text-sm text-gray-200">
                      {r.req.title}
                    </span>
                    <span className="hidden text-xs text-gray-600 sm:inline">
                      {r.mapped.length} control{r.mapped.length === 1 ? "" : "s"}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs font-medium ${m.bg} ${m.color}`}
                    >
                      {m.label}
                    </span>
                  </button>
                  {open && (
                    <div className="bg-base-bg/40 px-12 py-3">
                      {r.req.description && (
                        <p className="mb-2 text-sm text-gray-400">
                          {r.req.description}
                        </p>
                      )}
                      {r.mapped.length === 0 ? (
                        <p className="text-xs text-status-critical">
                          No controls mapped — unaddressed requirement.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {r.mapped.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center gap-2 rounded-md border border-base-border bg-base-card px-2.5 py-1"
                            >
                              <span className="text-xs text-gray-300">
                                {c.name}
                              </span>
                              <StatusBadge status={c.status} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function barColor(p: number): string {
  return p >= 80 ? "#3E9B74" : p >= 60 ? "#C8902E" : "#C2453F";
}
