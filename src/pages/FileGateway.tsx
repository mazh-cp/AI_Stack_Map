import { useRef, useState } from "react";
import {
  Upload,
  FileSearch,
  ShieldX,
  ShieldCheck,
  RefreshCw,
  Ban,
  FileWarning,
} from "lucide-react";
import { useStore } from "../store/useStore";
import { PageHeader } from "../components/layout/Layout";
import {
  VerdictBadge,
  ScanStatusBadge,
  VendorBadge,
} from "../components/ui/Badges";
import { EvidenceViewer } from "../components/ui/EvidenceViewer";
import { StatCard } from "../components/ui/StatCard";
import { sha256 } from "../services/config";
import { SCAN_SOURCE_LABEL } from "../lib/constants";
import type { ScanProvider, ScanSource } from "../types";

export function FileGateway() {
  const { fileScans, activeProjectId, submitFileScan, retryFileScan, can } =
    useStore();
  const canScan = can("scan:run");
  const fileInput = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<ScanSource>("upload");
  const [provider, setProvider] = useState<ScanProvider>("checkpoint_te");
  const [busy, setBusy] = useState(false);

  const scans = fileScans.filter((f) => f.projectId === activeProjectId);
  const malicious = scans.filter(
    (f) => f.verdict === "malicious" || f.verdict === "suspicious"
  ).length;
  const blocked = scans.filter((f) => f.blockedFromRetrieval).length;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !canScan) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      const buf = await file.arrayBuffer();
      const hash = await sha256(buf);
      await submitFileScan({
        filename: file.name,
        fileHash: hash,
        source,
        scanProvider: provider,
      });
    }
    setBusy(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <div>
      <PageHeader
        title="File Security Gateway"
        subtitle="Scan files with Check Point before they enter the RAG corpus"
        actions={<VendorBadge vendor="checkpoint" />}
      />

      <div className="space-y-6 p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Files Scanned" value={scans.length} icon={FileSearch} tone="info" />
          <StatCard
            label="Malicious / Suspicious"
            value={malicious}
            icon={FileWarning}
            tone="critical"
          />
          <StatCard
            label="Blocked From Retrieval"
            value={blocked}
            sub="Quarantined before vector DB"
            icon={Ban}
            tone="warning"
          />
        </div>

        {/* Upload workflow */}
        <div className="soc-card p-6">
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div>
              <p className="stat-label mb-1.5">Ingestion source</p>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as ScanSource)}
                className="input-soc w-48"
              >
                {(
                  Object.keys(SCAN_SOURCE_LABEL) as ScanSource[]
                ).map((s) => (
                  <option key={s} value={s} className="bg-base-card">
                    {SCAN_SOURCE_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="stat-label mb-1.5">Scan engine</p>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as ScanProvider)}
                className="input-soc w-56"
              >
                <option value="checkpoint_te" className="bg-base-card">
                  Check Point Threat Emulation
                </option>
                <option value="checkpoint_file_scan" className="bg-base-card">
                  Check Point TE File Scan
                </option>
              </select>
            </div>
          </div>

          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-base-border bg-base-bg/40 px-6 py-10 text-center transition-colors ${
              canScan
                ? "cursor-pointer hover:border-accent/40"
                : "cursor-not-allowed opacity-50"
            }`}
          >
            <Upload className="h-8 w-8 text-gray-500" />
            <p className="mt-3 text-sm font-medium text-gray-300">
              Drop files here or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-600">
              PDF, Office, archives, email attachments · routed through the
              File Security Gateway
            </p>
            <input
              ref={fileInput}
              type="file"
              multiple
              disabled={!canScan}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
          {busy && (
            <p className="mt-3 flex items-center gap-2 text-xs text-status-info">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Submitting to
              Check Point…
            </p>
          )}
          <p className="mt-3 text-[11px] text-gray-600">
            Demo hint: filenames containing “malware”, “.exe”, “macro” or
            “invoice-” return malicious/suspicious verdicts so blocking is
            demonstrable. Files are hashed locally (SHA-256); no bytes leave the
            browser in mock mode.
          </p>
        </div>

        {/* Scan results */}
        <div className="space-y-3">
          {scans.length === 0 && (
            <div className="soc-card py-12 text-center text-sm text-gray-600">
              No files scanned yet.
            </div>
          )}
          {scans.map((f) => (
            <div key={f.id} className="soc-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-lg p-2 ${
                      f.blockedFromRetrieval
                        ? "bg-status-critical/10"
                        : "bg-status-success/10"
                    }`}
                  >
                    {f.blockedFromRetrieval ? (
                      <ShieldX className="h-5 w-5 text-status-critical" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 text-status-success" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {f.filename}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-gray-500">
                      sha256:{f.fileHash.slice(0, 32)}…
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {SCAN_SOURCE_LABEL[f.source]} ·{" "}
                      {f.scanProvider === "checkpoint_te"
                        ? "Threat Emulation"
                        : "File Scan"}{" "}
                      · {f.submittedAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {f.status === "completed" ? (
                    <VerdictBadge verdict={f.verdict} />
                  ) : (
                    <ScanStatusBadge status={f.status} />
                  )}
                  <button
                    onClick={() => retryFileScan(f.id)}
                    disabled={f.status === "scanning" || !canScan}
                    className="flex items-center gap-1.5 rounded-md border border-base-border px-2.5 py-1.5 text-xs text-gray-400 hover:bg-base-hover disabled:opacity-40"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${f.status === "scanning" ? "animate-spin" : ""}`}
                    />
                    Retry
                  </button>
                </div>
              </div>

              {f.blockedFromRetrieval && (
                <div className="mt-3 flex items-center gap-2 rounded-md border border-status-critical/30 bg-status-critical/10 px-3 py-2 text-xs text-status-critical">
                  <Ban className="h-4 w-4" />
                  Blocked from vector DB / RAG corpus — verdict requires review.
                </div>
              )}

              {f.status === "completed" && (
                <div className="mt-3">
                  <EvidenceViewer evidence={f.rawEvidence} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
