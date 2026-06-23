import { useEffect } from "react";
import { X, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useStore } from "../../store/useStore";
import type { Toast } from "../../store/useStore";

const META = {
  error: { icon: AlertCircle, cls: "border-status-critical/40 text-status-critical" },
  success: { icon: CheckCircle2, cls: "border-status-success/40 text-status-success" },
  info: { icon: Info, cls: "border-status-info/40 text-status-info" },
};

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const m = META[toast.kind];
  const Icon = m.icon;
  useEffect(() => {
    const id = setTimeout(onDismiss, 5000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-base-card px-3 py-2.5 shadow-2xl ${m.cls}`}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <p className="flex-1 text-xs leading-relaxed text-gray-200">{toast.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-gray-500 hover:text-gray-300"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
