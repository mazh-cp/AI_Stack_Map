import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  SecurityControl,
  Risk,
  Incident,
  ComplianceMapping,
  Evidence,
  Project,
  ControlStatus,
  LayerKey,
  Integration,
  ModelCoverage,
  FileScan,
  PromptInspection,
  ScanSource,
  ScanProvider,
} from "../types";
import {
  CONTROLS,
  RISKS,
  INCIDENTS,
  COMPLIANCE,
  EVIDENCE,
  PROJECTS,
} from "../data/seed";
import {
  INTEGRATIONS,
  MODEL_COVERAGE,
  FILE_SCANS,
  PROMPT_INSPECTIONS,
} from "../data/seedIntegrations";
import { checkpointThreatEmulationService } from "../services/checkpointThreatEmulationService";
import { checkpointFileScanService } from "../services/checkpointFileScanService";
import { lakeraGuardService } from "../services/lakeraGuardService";
import { deriveRiskLevel } from "../services/llmCoverageService";
import { sha256 } from "../services/config";
import { api, type AuthUser, type Role, type UserSettings } from "../api/client";

export interface Toast {
  id: string;
  kind: "error" | "success" | "info";
  message: string;
}

export interface Filters {
  layer: LayerKey | "all";
  status: ControlStatus | "all";
  owasp: string;
  search: string;
}

interface AppState {
  projects: Project[];
  activeProjectId: string;
  controls: SecurityControl[];
  risks: Risk[];
  incidents: Incident[];
  compliance: ComplianceMapping[];
  evidence: Evidence[];
  integrations: Integration[];
  models: ModelCoverage[];
  fileScans: FileScan[];
  promptInspections: PromptInspection[];

  selectedControlId: string | null;
  filters: Filters;
  /** Backend connectivity — local-first, syncs when online */
  backend: "unknown" | "online" | "offline";
  /** Auth — null when in local mode or not yet logged in */
  currentUser: AuthUser | null;
  permissions: Record<string, Role[]>;
  settings: UserSettings;
  authReady: boolean;
  toasts: Toast[];

  // actions
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  can: (perm: string) => boolean;
  updateMySettings: (patch: UserSettings) => void;
  pushToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  syncWrite: (fn: () => Promise<unknown>) => void;
  hydrate: () => Promise<void>;
  setActiveProject: (id: string) => void;
  selectControl: (id: string | null) => void;
  setFilters: (f: Partial<Filters>) => void;
  resetFilters: () => void;

  addControl: (c: SecurityControl) => void;
  updateControl: (id: string, patch: Partial<SecurityControl>) => void;
  setControlStatus: (id: string, status: ControlStatus) => void;
  deleteControl: (id: string) => void;
  updateControlPosition: (id: string, pos: { x: number; y: number }) => void;

  addRisk: (r: Risk) => void;
  updateRisk: (id: string, patch: Partial<Risk>) => void;
  deleteRisk: (id: string) => void;

  // integrations
  setIntegrationEnabled: (id: string, enabled: boolean) => void;

  // model coverage
  addModel: (m: ModelCoverage) => void;
  updateModel: (id: string, patch: Partial<ModelCoverage>) => void;
  deleteModel: (id: string) => void;

  // file scanning
  submitFileScan: (input: {
    filename: string;
    fileHash: string;
    source: ScanSource;
    scanProvider: ScanProvider;
  }) => Promise<string>;
  retryFileScan: (id: string) => Promise<void>;

  // prompt inspection
  inspectPrompt: (input: {
    text: string;
    stage: "input" | "output";
    modelId?: string;
  }) => Promise<string>;

  resetDemo: () => void;
}

let counter = 0;
const uid = (p: string) => `${p}-${Date.now()}-${counter++}`;

async function runScan(
  provider: ScanProvider,
  filename: string,
  fileHash: string
) {
  return provider === "checkpoint_te"
    ? checkpointThreatEmulationService.scan({ filename, fileHash })
    : checkpointFileScanService.scan({ filename, fileHash });
}

// Apply a user's saved default project after data has hydrated.
function applyDefaultProject(
  get: () => AppState,
  set: (partial: Partial<AppState>) => void,
  settings?: UserSettings
) {
  const id = settings?.defaultProjectId;
  if (id && get().projects.some((p) => p.id === id)) {
    set({ activeProjectId: id });
  }
}

const defaultFilters: Filters = {
  layer: "all",
  status: "all",
  owasp: "all",
  search: "",
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: PROJECTS,
      activeProjectId: PROJECTS[0].id,
      controls: CONTROLS,
      risks: RISKS,
      incidents: INCIDENTS,
      compliance: COMPLIANCE,
      evidence: EVIDENCE,
      integrations: INTEGRATIONS,
      models: MODEL_COVERAGE,
      fileScans: FILE_SCANS,
      promptInspections: PROMPT_INSPECTIONS,

      selectedControlId: null,
      filters: defaultFilters,
      backend: "unknown",
      currentUser: null,
      permissions: {},
      settings: {},
      authReady: false,
      toasts: [],

      // Startup: detect the backend, then restore the session (cookie-based)
      // or require login. The client auto-refreshes the access token on 401.
      init: async () => {
        try {
          await api.health(); // public endpoint
        } catch {
          set({ backend: "offline", authReady: true });
          return;
        }
        try {
          const { user, permissions, settings } = await api.me();
          set({ backend: "online", currentUser: user, permissions, settings: settings ?? {} });
          await get().hydrate();
          applyDefaultProject(get, set, settings);
        } catch {
          set({ backend: "online", currentUser: null });
        }
        set({ authReady: true });
      },

      login: async (email, password) => {
        try {
          const { user, permissions, settings } = await api.login(email, password);
          set({ backend: "online", currentUser: user, permissions, settings: settings ?? {} });
          await get().hydrate();
          applyDefaultProject(get, set, settings);
          return { ok: true };
        } catch {
          return { ok: false, error: "Invalid email or password" };
        }
      },

      logout: async () => {
        try {
          await api.logout();
        } catch {
          /* clear locally regardless */
        }
        set({ currentUser: null, settings: {} });
      },

      can: (perm) => {
        const { currentUser, permissions, backend } = get();
        if (backend !== "online") return true; // local mode → full access
        if (!currentUser) return false;
        return (permissions[perm] ?? []).includes(currentUser.role);
      },

      // Update the current user's own settings (optimistic + server-persisted).
      updateMySettings: (patch) => {
        const prev = get().settings;
        const next = { ...prev, ...patch };
        set({ settings: next });
        if (patch.defaultProjectId && get().projects.some((p) => p.id === patch.defaultProjectId)) {
          set({ activeProjectId: patch.defaultProjectId });
        }
        if (get().backend === "online") {
          api.settings.update(patch).catch(() => {
            set({ settings: prev });
            get().pushToast({ kind: "error", message: "Couldn't save settings — reverting." });
          });
        }
      },

      pushToast: ({ kind, message }) =>
        set((s) => ({
          toasts: [...s.toasts, { id: `t-${Date.now()}-${counter++}`, kind, message }],
        })),
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      // Best-effort server sync for local-first mutations. On failure, surface a
      // toast and re-hydrate from the server (rollback to authoritative state).
      syncWrite: (fn) => {
        fn().catch((e: unknown) => {
          const status = (e as { status?: number })?.status;
          get().pushToast({
            kind: "error",
            message:
              status === 403
                ? "Permission denied — your role can't make this change."
                : "Couldn't save to the server — reverting.",
          });
          get().hydrate();
        });
      },

      // Load everything from the backend if reachable; otherwise stay on the
      // local seed/persisted data (fully functional offline).
      hydrate: async () => {
        try {
          const b = await api.bootstrap();
          set((s) => ({
            projects: b.projects,
            activeProjectId: b.projects.some((p) => p.id === s.activeProjectId)
              ? s.activeProjectId
              : b.projects[0]?.id ?? s.activeProjectId,
            controls: b.controls,
            risks: b.risks,
            incidents: b.incidents,
            compliance: b.compliance,
            evidence: b.evidence,
            integrations: b.integrations,
            models: b.models,
            fileScans: b.fileScans,
            promptInspections: b.promptInspections,
            backend: "online",
          }));
        } catch {
          set({ backend: "offline" });
        }
      },

      setActiveProject: (id) => set({ activeProjectId: id }),
      selectControl: (id) => set({ selectedControlId: id }),
      setFilters: (f) =>
        set((s) => ({ filters: { ...s.filters, ...f } })),
      resetFilters: () => set({ filters: defaultFilters }),

      addControl: (c) => {
        set((s) => ({ controls: [...s.controls, c] }));
        if (get().backend === "online") get().syncWrite(() =>api.controls.create(c));
      },
      updateControl: (id, patch) => {
        set((s) => ({
          controls: s.controls.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
        if (get().backend === "online")
          get().syncWrite(() =>api.controls.update(id, patch));
      },
      setControlStatus: (id, status) => {
        set((s) => ({
          controls: s.controls.map((c) => (c.id === id ? { ...c, status } : c)),
        }));
        if (get().backend === "online")
          get().syncWrite(() =>api.controls.update(id, { status }));
      },
      deleteControl: (id) => {
        set((s) => ({
          controls: s.controls.filter((c) => c.id !== id),
          selectedControlId:
            s.selectedControlId === id ? null : s.selectedControlId,
        }));
        if (get().backend === "online") get().syncWrite(() =>api.controls.remove(id));
      },
      updateControlPosition: (id, pos) => {
        set((s) => ({
          controls: s.controls.map((c) =>
            c.id === id ? { ...c, position: pos } : c
          ),
        }));
        if (get().backend === "online")
          get().syncWrite(() =>api.controls.update(id, { position: pos }));
      },

      addRisk: (r) => {
        set((s) => ({ risks: [...s.risks, r] }));
        if (get().backend === "online") get().syncWrite(() =>api.risks.create(r));
      },
      updateRisk: (id, patch) => {
        set((s) => ({
          risks: s.risks.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        }));
        if (get().backend === "online") get().syncWrite(() =>api.risks.update(id, patch));
      },
      deleteRisk: (id) => {
        set((s) => ({ risks: s.risks.filter((r) => r.id !== id) }));
        if (get().backend === "online") get().syncWrite(() =>api.risks.remove(id));
      },

      // ── Integrations ─────────────────────────────────────────────────
      setIntegrationEnabled: (id, enabled) => {
        set((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === id ? { ...i, enabled } : i
          ),
        }));
        if (get().backend === "online")
          get().syncWrite(() =>api.integrations.setEnabled(id, enabled));
      },

      // ── Model coverage ───────────────────────────────────────────────
      addModel: (m) => {
        const withRisk = { ...m, riskLevel: deriveRiskLevel(m) };
        set((s) => ({ models: [...s.models, withRisk] }));
        if (get().backend === "online") get().syncWrite(() =>api.models.create(withRisk));
      },
      updateModel: (id, patch) => {
        let mergedRisk = patch.riskLevel;
        set((s) => ({
          models: s.models.map((m) => {
            if (m.id !== id) return m;
            const merged = { ...m, ...patch };
            mergedRisk = deriveRiskLevel(merged);
            return { ...merged, riskLevel: mergedRisk };
          }),
        }));
        if (get().backend === "online")
          get().syncWrite(() =>api.models.update(id, { ...patch, riskLevel: mergedRisk }));
      },
      deleteModel: (id) => {
        set((s) => ({ models: s.models.filter((m) => m.id !== id) }));
        if (get().backend === "online") get().syncWrite(() =>api.models.remove(id));
      },

      // ── File scanning ────────────────────────────────────────────────
      submitFileScan: async ({ filename, fileHash, source, scanProvider }) => {
        const id = uid("fs");
        const submittedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
        const scan: FileScan = {
          id,
          projectId: get().activeProjectId,
          filename,
          fileHash,
          source,
          scanProvider,
          verdict: "unknown",
          status: "scanning",
          submittedAt,
          blockedFromRetrieval: false,
        };
        set((s) => ({ fileScans: [scan, ...s.fileScans] }));

        // Online: scan server-side (vendor keys stay on the server).
        if (get().backend === "online") {
          try {
            const row = await api.fileScan({
              filename,
              fileHash,
              source,
              scanProvider,
              projectId: get().activeProjectId,
            });
            set((s) => ({
              fileScans: s.fileScans.map((f) => (f.id === id ? row : f)),
            }));
            return row.id;
          } catch {
            /* fall back to in-browser mock */
          }
        }

        try {
          const { verdict, rawEvidence } = await runScan(
            scanProvider,
            filename,
            fileHash
          );
          set((s) => ({
            fileScans: s.fileScans.map((f) =>
              f.id === id
                ? {
                    ...f,
                    status: "completed",
                    verdict,
                    rawEvidence,
                    completedAt: new Date()
                      .toISOString()
                      .slice(0, 16)
                      .replace("T", " "),
                    blockedFromRetrieval:
                      verdict === "malicious" || verdict === "suspicious",
                  }
                : f
            ),
          }));
        } catch {
          set((s) => ({
            fileScans: s.fileScans.map((f) =>
              f.id === id ? { ...f, status: "error" } : f
            ),
          }));
        }
        return id;
      },
      retryFileScan: async (id) => {
        const scan = get().fileScans.find((f) => f.id === id);
        if (!scan) return;
        set((s) => ({
          fileScans: s.fileScans.map((f) =>
            f.id === id ? { ...f, status: "scanning", verdict: "unknown" } : f
          ),
        }));

        if (get().backend === "online") {
          try {
            const row = await api.retryFileScan(id);
            set((s) => ({
              fileScans: s.fileScans.map((f) => (f.id === id ? row : f)),
            }));
            return;
          } catch {
            /* fall back to in-browser mock */
          }
        }

        try {
          const { verdict, rawEvidence } = await runScan(
            scan.scanProvider,
            scan.filename,
            scan.fileHash
          );
          set((s) => ({
            fileScans: s.fileScans.map((f) =>
              f.id === id
                ? {
                    ...f,
                    status: "completed",
                    verdict,
                    rawEvidence,
                    completedAt: new Date()
                      .toISOString()
                      .slice(0, 16)
                      .replace("T", " "),
                    blockedFromRetrieval:
                      verdict === "malicious" || verdict === "suspicious",
                  }
                : f
            ),
          }));
        } catch {
          set((s) => ({
            fileScans: s.fileScans.map((f) =>
              f.id === id ? { ...f, status: "error" } : f
            ),
          }));
        }
      },

      // ── Prompt inspection (Lakera Guard) ─────────────────────────────
      inspectPrompt: async ({ text, stage, modelId }) => {
        // Online: inspect server-side via Lakera (key stays on the server).
        if (get().backend === "online") {
          try {
            const row = await api.inspectPrompt({
              text,
              stage,
              modelId,
              projectId: get().activeProjectId,
            });
            set((s) => ({ promptInspections: [row, ...s.promptInspections] }));
            return row.id;
          } catch {
            /* fall back to in-browser mock */
          }
        }

        const result = await lakeraGuardService.inspect({ text, stage });
        const promptHash = await sha256(text);
        const inspection: PromptInspection = {
          id: uid("pi"),
          projectId: get().activeProjectId,
          modelId,
          provider: "Lakera Guard",
          promptHash: promptHash.slice(0, 16),
          riskScore: result.riskScore,
          categories: result.categories,
          decision: result.decision,
          inspectedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
          rawEvidence: result.rawEvidence,
          stage,
        };
        set((s) => ({
          promptInspections: [inspection, ...s.promptInspections],
        }));
        return inspection.id;
      },

      resetDemo: () =>
        set({
          controls: CONTROLS,
          risks: RISKS,
          incidents: INCIDENTS,
          compliance: COMPLIANCE,
          evidence: EVIDENCE,
          integrations: INTEGRATIONS,
          models: MODEL_COVERAGE,
          fileScans: FILE_SCANS,
          promptInspections: PROMPT_INSPECTIONS,
          selectedControlId: null,
          filters: defaultFilters,
        }),
    }),
    {
      name: "ai-security-stack-mapper",
      version: 2,
      // Persist domain data only — auth/connectivity are resolved at startup.
      partialize: (s) => ({
        projects: s.projects,
        activeProjectId: s.activeProjectId,
        controls: s.controls,
        risks: s.risks,
        incidents: s.incidents,
        compliance: s.compliance,
        evidence: s.evidence,
        integrations: s.integrations,
        models: s.models,
        fileScans: s.fileScans,
        promptInspections: s.promptInspections,
        filters: s.filters,
      }),
      // The schema changed substantially in v2 (integrations, model coverage,
      // file scans, new zones). Rather than partially merge an incompatible v1
      // blob, reset persisted data slices to the fresh seed on upgrade.
      migrate: () => ({
        projects: PROJECTS,
        activeProjectId: PROJECTS[0].id,
        controls: CONTROLS,
        risks: RISKS,
        incidents: INCIDENTS,
        compliance: COMPLIANCE,
        evidence: EVIDENCE,
        integrations: INTEGRATIONS,
        models: MODEL_COVERAGE,
        fileScans: FILE_SCANS,
        promptInspections: PROMPT_INSPECTIONS,
        selectedControlId: null,
        filters: defaultFilters,
      }),
    }
  )
);
