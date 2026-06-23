import { useState } from "react";
import { Code2, Copy, Check, ChevronDown } from "lucide-react";

export function EvidenceViewer({
  evidence,
  title = "API response evidence",
  defaultOpen = false,
}: {
  evidence: unknown;
  title?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  if (evidence === undefined || evidence === null) {
    return (
      <p className="text-xs text-gray-600">No evidence captured for this record.</p>
    );
  }

  const json = JSON.stringify(evidence, null, 2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="rounded-lg border border-base-border bg-base-bg/60">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-xs font-medium text-gray-300"
        >
          <ChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform ${open ? "" : "-rotate-90"}`}
          />
          <Code2 className="h-4 w-4 text-accent" />
          {title}
        </button>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-base-hover"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-status-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {open && (
        <pre className="max-h-72 overflow-auto border-t border-base-border px-3 py-2 font-mono text-[11px] leading-relaxed text-gray-300">
          {json}
        </pre>
      )}
    </div>
  );
}
