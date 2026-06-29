import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Network,
  ClipboardCheck,
  ShieldAlert,
  Library,
  Boxes,
  FileText,
  ShieldCheck,
  FileSearch,
  ScanSearch,
  Cpu,
  Plug,
  BadgeCheck,
  Settings as SettingsIcon,
  BookOpen,
} from "lucide-react";
import { useI18n } from "../../i18n";

const NAV = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard, end: true },
  { to: "/stack-map", labelKey: "nav.stackMap", icon: Network },
  { to: "/assessment", labelKey: "nav.assessment", icon: ClipboardCheck },
  { to: "/risks", labelKey: "nav.risks", icon: ShieldAlert },
  { to: "/controls", labelKey: "nav.controls", icon: Library },
  { to: "/builder", labelKey: "nav.builder", icon: Boxes },
];

const NAV_INTEGRATIONS = [
  { to: "/file-gateway", labelKey: "nav.fileGateway", icon: FileSearch },
  { to: "/lakera", labelKey: "nav.lakera", icon: ScanSearch },
  { to: "/models", labelKey: "nav.models", icon: Cpu },
  { to: "/integrations", labelKey: "nav.integrations", icon: Plug },
];

const NAV_REPORTS = [
  { to: "/compliance", labelKey: "nav.compliance", icon: BadgeCheck },
  { to: "/report", labelKey: "nav.report", icon: FileText },
];

const NAV_ACCOUNT = [
  { to: "/settings", labelKey: "nav.settings", icon: SettingsIcon },
];

const NAV_DOCS = [
  { to: "/docs", labelKey: "nav.docs", icon: BookOpen },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  return (
    <aside
      className="flex h-full w-60 flex-shrink-0 flex-col border-r border-base-border bg-base-sidebar"
      aria-label="Primary navigation"
    >
      <div className="flex items-center gap-2.5 border-b border-base-border px-5 py-4">
        <div className="rounded-lg bg-accent/10 p-1.5 ring-1 ring-accent/20">
          <ShieldCheck className="h-5 w-5 text-accent" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">Stack Mapper</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">
            AI Security
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-auto px-3 py-4">
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}

        <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
          {t("nav.section.integrations")}
        </p>
        {NAV_INTEGRATIONS.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}

        <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
          {t("nav.section.reporting")}
        </p>
        {NAV_REPORTS.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}

        <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
          {t("nav.section.account")}
        </p>
        {NAV_ACCOUNT.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}

        <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
          {t("nav.section.docs")}
        </p>
        {NAV_DOCS.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="border-t border-base-border px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-status-success soc-pulse" />
          {t("sidebar.socActive")}
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  to,
  labelKey,
  icon: Icon,
  end,
  onNavigate,
}: {
  to: string;
  labelKey: string;
  icon: typeof ShieldCheck;
  end?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-accent/10 text-accent ring-1 ring-accent/20"
            : "text-gray-400 hover:bg-base-hover hover:text-gray-200"
        }`
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {t(labelKey)}
    </NavLink>
  );
}
