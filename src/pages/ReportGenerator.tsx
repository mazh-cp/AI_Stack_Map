import { Download, Printer, FileText } from "lucide-react";
import { useStore } from "../store/useStore";
import { PageHeader } from "../components/layout/Layout";
import { buildMarkdownReport, buildRecommendations } from "../lib/report";
import { computeScore } from "../lib/score";
import { ScoreRing } from "../components/ui/ScoreRing";
import { StatusBadge, SeverityBadge } from "../components/ui/Badges";
import { LAYERS, LAYER_ORDER, STATUS_META } from "../lib/constants";

export function ReportGenerator() {
  const { projects, activeProjectId, controls, risks, incidents, models, integrations } =
    useStore();
  const project = projects.find((p) => p.id === activeProjectId)!;
  const today = "2026-06-22";
  const projectModels = models.filter((m) => m.projectId === activeProjectId);
  const s = computeScore(controls, risks, projectModels, integrations);
  const recs = buildRecommendations(controls, risks);

  const downloadMarkdown = () => {
    const md = buildMarkdownReport({
      project,
      controls,
      risks,
      incidents,
      models: projectModels,
      integrations,
      date: today,
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}-security-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Report Generator"
        subtitle="Generate a shareable security architecture assessment"
        actions={
          <div className="flex gap-2">
            <button
              onClick={downloadMarkdown}
              className="flex items-center gap-2 rounded-lg border border-base-border bg-base-card px-3 py-2 text-sm font-medium text-gray-200 hover:bg-base-hover"
            >
              <Download className="h-4 w-4" /> Markdown
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-[#0f172a] hover:bg-accent/90"
            >
              <Printer className="h-4 w-4" /> Export PDF
            </button>
          </div>
        }
      />

      <div className="p-6">
        {/* Printable document */}
        <div
          id="report-doc"
          className="mx-auto max-w-4xl space-y-8 rounded-xl border border-base-border bg-base-card p-8 print:border-0 print:bg-[#ffffff] print:text-[#111827]"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-base-border pb-6 print:border-gray-300">
            <div>
              <div className="flex items-center gap-2 text-accent print:text-orange-900">
                <FileText className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wider">
                  AI Security Architecture Report
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-white print:text-black">
                {project.name}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {project.environment} · Owner: {project.owner} · {today}
              </p>
            </div>
            <ScoreRing score={s.score} grade={s.grade} size={120} />
          </div>

          {/* Executive summary */}
          <section>
            <h2 className="report-h2">1. Executive Summary</h2>
            <p className="text-sm leading-relaxed text-gray-300 print:text-gray-800">
              The {project.name} LLM application achieves an overall AI Security
              Score of <strong>{s.score}/100 (Grade {s.grade})</strong>, with
              weighted control coverage of {s.coverage}%. {s.protectedLayers} of{" "}
              {s.totalLayers} architecture layers have active controls, with{" "}
              <strong>{s.openRisks} open risks</strong> and{" "}
              <strong>{s.criticalGaps} critical gaps</strong>.
            </p>
            {s.penalties.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-gray-400 print:text-gray-800">
                {s.penalties.map((p) => (
                  <li key={p.label}>
                    • {p.label}{" "}
                    <span className="text-status-critical">(−{p.points})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Architecture diagram (flow) */}
          <section>
            <h2 className="report-h2">2. Architecture Overview</h2>
            <div className="flex flex-wrap items-center gap-2">
              {LAYER_ORDER.map((l, i) => (
                <div key={l} className="flex items-center gap-2">
                  <span
                    className="rounded-md px-2.5 py-1 text-xs font-medium"
                    style={{
                      color: LAYERS[l].color,
                      backgroundColor: `${LAYERS[l].color}1a`,
                    }}
                  >
                    {LAYERS[l].name}
                  </span>
                  {i < LAYER_ORDER.length - 1 && (
                    <span className="text-gray-600">→</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Layer findings */}
          <section>
            <h2 className="report-h2">3. Layer-by-Layer Findings</h2>
            <div className="space-y-4">
              {LAYER_ORDER.map((key) => {
                const lc = controls.filter((c) => c.layer === key);
                const active = lc.filter(
                  (c) =>
                    c.status === "implemented" || c.status === "verified"
                ).length;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white print:text-black">
                        {LAYERS[key].name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {active}/{lc.length} active
                      </span>
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {lc.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between rounded-md border border-base-border px-3 py-1.5 print:border-gray-300"
                        >
                          <span className="text-xs text-gray-300 print:text-gray-800">
                            {c.name}
                          </span>
                          <StatusBadge status={c.status} />
                        </div>
                      ))}
                      {lc.length === 0 && (
                        <p className="text-xs text-status-warning">
                          ⚠ No controls defined.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Control status */}
          <section>
            <h2 className="report-h2">4. Control Implementation Status</h2>
            <div className="grid grid-cols-4 gap-3">
              {(
                ["verified", "implemented", "planned", "not_implemented"] as const
              ).map((st) => (
                <div
                  key={st}
                  className={`rounded-lg border p-3 text-center ${STATUS_META[st].bg}`}
                >
                  <p className={`text-xl font-bold ${STATUS_META[st].color}`}>
                    {controls.filter((c) => c.status === st).length}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {STATUS_META[st].label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Risk register */}
          <section>
            <h2 className="report-h2">5. Risk Register</h2>
            <div className="space-y-1.5">
              {risks.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border border-base-border px-3 py-2 print:border-gray-300"
                >
                  <span className="text-sm text-gray-300 print:text-gray-800">
                    {r.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs capitalize text-gray-500">
                      {r.status}
                    </span>
                    <SeverityBadge severity={r.severity} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Remediation */}
          <section>
            <h2 className="report-h2">6. Recommended Remediation Plan</h2>
            {recs.length === 0 ? (
              <p className="text-sm text-status-success">
                Posture is strong — maintain monitoring and re-verify quarterly.
              </p>
            ) : (
              <ol className="list-inside list-decimal space-y-1.5 text-sm text-gray-300 print:text-gray-800">
                {recs.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ol>
            )}
          </section>

          <p className="border-t border-base-border pt-4 text-center text-xs text-gray-600 print:border-gray-300">
            Generated by AI Security Stack Mapper · {today}
          </p>
        </div>
      </div>
    </div>
  );
}
