import { Plug, ShieldCheck, FileSearch, Cpu, KeyRound } from "lucide-react";
import { useStore } from "../store/useStore";
import { PageHeader } from "../components/layout/Layout";
import {
  IntegrationStatusBadge,
  VendorBadge,
  LayerBadge,
} from "../components/ui/Badges";
import type { Integration, IntegrationType } from "../types";

const TYPE_META: Record<
  IntegrationType,
  { label: string; icon: typeof Plug }
> = {
  threat_emulation: { label: "Threat Emulation", icon: ShieldCheck },
  file_scan: { label: "File Scan", icon: FileSearch },
  prompt_firewall: { label: "Prompt Firewall", icon: ShieldCheck },
  llm_coverage: { label: "LLM Coverage", icon: Cpu },
};

const ENV_VARS = [
  "CHECKPOINT_TE_API_KEY",
  "CHECKPOINT_TE_BASE_URL",
  "CHECKPOINT_FILE_SCAN_API_KEY",
  "CHECKPOINT_FILE_SCAN_BASE_URL",
  "LAKERA_GUARD_API_KEY",
  "LAKERA_GUARD_BASE_URL",
];

export function Integrations() {
  const { integrations, setIntegrationEnabled, can } = useStore();
  const canToggle = can("admin:write");

  return (
    <div>
      <PageHeader
        title="Integrations"
        subtitle="Vendor & security integrations protecting the LLM stack"
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {integrations.map((i) => (
            <IntegrationCard
              key={i.id}
              integration={i}
              canToggle={canToggle}
              onToggle={(enabled) => setIntegrationEnabled(i.id, enabled)}
            />
          ))}
        </div>

        {/* Env var setup */}
        <div className="soc-card p-6">
          <div className="mb-3 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-accent" />
            <p className="stat-label">API Key Configuration</p>
          </div>
          <p className="mb-4 text-sm text-gray-400">
            Integrations run in <span className="text-status-info">mock mode</span>{" "}
            until real credentials are supplied through environment variables.
            Keys are never hardcoded or stored in the browser — for production,
            proxy these calls through a backend that holds the secrets.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ENV_VARS.map((v) => (
              <div
                key={v}
                className="flex items-center justify-between rounded-md border border-base-border bg-base-bg/60 px-3 py-2"
              >
                <span className="font-mono text-xs text-gray-300">{v}</span>
                <span className="font-mono text-[10px] text-gray-600">
                  not set
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({
  integration: i,
  onToggle,
  canToggle,
}: {
  integration: Integration;
  onToggle: (enabled: boolean) => void;
  canToggle: boolean;
}) {
  const meta = TYPE_META[i.type];
  const Icon = meta.icon;
  return (
    <div className="soc-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-base-bg p-2.5 ring-1 ring-base-border">
            <Icon className="h-5 w-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{i.name}</h3>
              <VendorBadge vendor={i.vendor} />
            </div>
            <p className="mt-0.5 text-xs text-gray-500">{meta.label}</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={i.enabled}
          disabled={!canToggle}
          onChange={(e) => onToggle(e.target.checked)}
          className="toggle toggle-primary toggle-sm disabled:opacity-50"
          title={canToggle ? (i.enabled ? "Enabled" : "Disabled") : "Owner only"}
        />
      </div>

      <div className="mt-4 space-y-2.5 text-sm">
        <Row label="Status">
          <IntegrationStatusBadge status={i.enabled ? i.status : "disconnected"} />
        </Row>
        <Row label="Auth">
          <span className="text-gray-300 capitalize">
            {i.authMethod.replace("_", " ")}
          </span>
        </Row>
        <Row label="Base URL">
          <span className="max-w-[60%] truncate font-mono text-xs text-gray-400">
            {i.apiBaseUrl}
          </span>
        </Row>
        <Row label="Last health check">
          <span className="text-gray-400">{i.lastHealthCheck}</span>
        </Row>
        <div>
          <p className="stat-label mb-1.5">Protects layers</p>
          <div className="flex flex-wrap gap-1.5">
            {i.supportedLayers.map((l) => (
              <LayerBadge key={l} layer={l} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      {children}
    </div>
  );
}
