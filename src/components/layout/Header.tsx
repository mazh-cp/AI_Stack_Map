import {
  ChevronDown,
  Search,
  ShieldCheck,
  LogOut,
  UserCircle2,
  Menu,
  Languages,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { useI18n, LOCALES } from "../../i18n";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  appsec: "AppSec",
  soc: "SOC",
  viewer: "Viewer",
};

export function Header({ onMenu }: { onMenu?: () => void }) {
  const {
    projects,
    activeProjectId,
    setActiveProject,
    filters,
    setFilters,
    backend,
    currentUser,
    logout,
  } = useStore();
  const { t, locale, setLocale } = useI18n();
  const active = projects.find((p) => p.id === activeProjectId);

  const conn =
    backend === "online"
      ? { dot: "bg-status-success", label: t("conn.online") }
      : backend === "offline"
      ? { dot: "bg-status-warning", label: t("conn.local") }
      : { dot: "bg-gray-500", label: t("conn.connecting") };

  return (
    <header className="flex items-center justify-between gap-2 border-b border-base-border bg-base-sidebar px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="Open navigation menu"
          className="rounded-lg border border-base-border p-2 text-gray-400 hover:bg-base-hover md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Project selector */}
        <div className="dropdown dropdown-bottom">
          <label
            tabIndex={0}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-base-border bg-base-card px-3 py-2 text-sm hover:border-accent/40"
          >
            <ShieldCheck className="h-4 w-4 text-accent" />
            <div className="text-left leading-tight">
              <p className="font-semibold text-white">{active?.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500">
                {active?.environment}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content z-50 mt-2 w-72 rounded-lg border border-base-border bg-base-card p-1.5 shadow-2xl"
          >
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setActiveProject(p.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-base-hover ${
                    p.id === activeProjectId ? "text-accent" : "text-gray-300"
                  }`}
                >
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.description}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder={t("header.search")}
            aria-label={t("header.search")}
            className="w-64 rounded-lg border border-base-border bg-base-card py-2 pl-9 pr-3 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/40"
          />
        </div>

        {/* Language switcher */}
        <div className="dropdown dropdown-end dropdown-bottom">
          <label
            tabIndex={0}
            aria-label="Change language"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-base-border bg-base-card px-2.5 py-2 text-xs text-gray-300 hover:border-accent/40"
          >
            <Languages className="h-4 w-4" />
            <span className="uppercase">{locale}</span>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content z-50 mt-2 w-36 rounded-lg border border-base-border bg-base-card p-1.5 shadow-2xl"
          >
            {LOCALES.map((l) => (
              <li key={l.code}>
                <button
                  onClick={() => setLocale(l.code)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-base-hover ${
                    locale === l.code ? "text-accent" : "text-gray-300"
                  }`}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="hidden items-center gap-2 rounded-lg border border-base-border bg-base-card px-3 py-2 sm:flex"
          title={conn.label}
        >
          <span className={`h-2 w-2 rounded-full ${conn.dot} soc-pulse`} />
          <span className="text-xs font-medium text-gray-300">{conn.label}</span>
        </div>

        {currentUser && (
          <div className="dropdown dropdown-end dropdown-bottom">
            <label
              tabIndex={0}
              aria-label="Account menu"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-base-border bg-base-card px-2.5 py-2 hover:border-accent/40"
            >
              <UserCircle2 className="h-5 w-5 text-accent" />
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-xs font-semibold text-white">
                  {currentUser.name}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">
                  {ROLE_LABEL[currentUser.role] ?? currentUser.role}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content z-50 mt-2 w-48 rounded-lg border border-base-border bg-base-card p-1.5 shadow-2xl"
            >
              <li className="px-3 py-1.5 text-xs text-gray-500">
                {currentUser.email}
              </li>
              <li>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-status-critical hover:bg-base-hover"
                >
                  <LogOut className="h-4 w-4" /> {t("header.signout")}
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
