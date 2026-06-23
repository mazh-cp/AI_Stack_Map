import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  tone?: "info" | "success" | "warning" | "critical" | "violet";
}

const TONE: Record<string, { text: string; bg: string; ring: string }> = {
  info: { text: "text-status-info", bg: "bg-status-info/10", ring: "ring-status-info/20" },
  success: {
    text: "text-status-success",
    bg: "bg-status-success/10",
    ring: "ring-status-success/20",
  },
  warning: {
    text: "text-status-warning",
    bg: "bg-status-warning/10",
    ring: "ring-status-warning/20",
  },
  critical: {
    text: "text-status-critical",
    bg: "bg-status-critical/10",
    ring: "ring-status-critical/20",
  },
  violet: {
    text: "text-status-violet",
    bg: "bg-status-violet/10",
    ring: "ring-status-violet/20",
  },
};

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "info",
}: StatCardProps) {
  const t = TONE[tone];
  return (
    <div className="soc-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ring-1 ${t.bg} ${t.ring}`}>
          <Icon className={`h-5 w-5 ${t.text}`} />
        </div>
      </div>
    </div>
  );
}
