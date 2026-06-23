// Typed client for the AI Security Stack Mapper backend.
//
// The app is local-first: it works fully offline against seed data and the
// in-browser mock services. When the backend is reachable, the store hydrates
// from it and mirrors mutations here so they persist server-side. Vendor calls
// (file scan, prompt inspect) then run on the server, keeping API keys off the
// client entirely.

import type {
  SecurityControl,
  Risk,
  ModelCoverage,
  FileScan,
  PromptInspection,
  Integration,
  Incident,
  ComplianceMapping,
  Evidence,
  Project,
  ScanSource,
  ScanProvider,
} from "../types";

const BASE = "/api";
const TIMEOUT_MS = 4000;

// Auth uses httpOnly cookies (set by the server), so the browser sends them
// automatically with `credentials: "include"` — no token is stored in JS.

/** Thrown on HTTP errors so callers can branch on status (e.g. 401/403). */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function rawFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new ApiError(res.status, `${res.status} ${res.statusText}`);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

let refreshing: Promise<unknown> | null = null;

/**
 * On a 401, transparently try once to refresh the access cookie, then retry the
 * original request. Avoids logging users out when only the access token expired.
 */
async function req<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await rawFetch<T>(path, init);
  } catch (e) {
    const isAuthRoute = path.startsWith("/auth/");
    if (e instanceof ApiError && e.status === 401 && !isAuthRoute) {
      try {
        refreshing =
          refreshing ?? rawFetch("/auth/refresh", { method: "POST" });
        await refreshing;
        refreshing = null;
        return await rawFetch<T>(path, init);
      } catch {
        refreshing = null;
        throw e;
      }
    }
    throw e;
  }
}

export interface Bootstrap {
  projects: Project[];
  controls: SecurityControl[];
  risks: Risk[];
  incidents: Incident[];
  compliance: ComplianceMapping[];
  evidence: Evidence[];
  integrations: Integration[];
  models: ModelCoverage[];
  fileScans: FileScan[];
  promptInspections: PromptInspection[];
}

export type Role = "owner" | "appsec" | "soc" | "viewer";
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}
export interface ProbeResult {
  category: string;
  label: string;
  prompt: string;
  response: string;
  verdict: "resilient" | "vulnerable";
  note: string;
}
export interface Evaluation {
  mode: "live" | "simulated";
  reachable: boolean;
  latencyMs: number;
  score: number;
  passes: number;
  total: number;
  evaluatedAt: string;
  probes: ProbeResult[];
}

export interface UserSettings {
  locale?: "en" | "es";
  defaultProjectId?: string;
  emailNotifications?: boolean;
}
export interface AuthResponse {
  user: AuthUser;
  permissions: Record<string, Role[]>;
  settings?: UserSettings;
}
export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}
export interface NewUser {
  email: string;
  name: string;
  role: Role;
  password: string;
}

export const api = {
  health: () => req<{ ok: boolean }>("/health"),
  bootstrap: () => req<Bootstrap>("/bootstrap"),

  login: (email: string, password: string) =>
    req<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => req<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  me: () => req<AuthResponse>("/auth/me"),

  // Per-user settings (self-service)
  settings: {
    update: (patch: UserSettings) =>
      req<UserSettings>("/users/me/settings", {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
  },

  // User management (owner only)
  users: {
    list: () => req<ManagedUser[]>("/users"),
    create: (u: NewUser) =>
      req<ManagedUser>("/users", { method: "POST", body: JSON.stringify(u) }),
    update: (id: string, patch: Partial<NewUser>) =>
      req<ManagedUser>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id: string) => req<void>(`/users/${id}`, { method: "DELETE" }),
  },

  controls: {
    create: (c: SecurityControl) =>
      req<SecurityControl>("/controls", { method: "POST", body: JSON.stringify(c) }),
    update: (id: string, patch: Partial<SecurityControl>) =>
      req<SecurityControl>(`/controls/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id: string) => req<void>(`/controls/${id}`, { method: "DELETE" }),
  },
  risks: {
    create: (r: Risk) => req<Risk>("/risks", { method: "POST", body: JSON.stringify(r) }),
    update: (id: string, patch: Partial<Risk>) =>
      req<Risk>(`/risks/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id: string) => req<void>(`/risks/${id}`, { method: "DELETE" }),
  },
  models: {
    create: (m: ModelCoverage) =>
      req<ModelCoverage>("/models", { method: "POST", body: JSON.stringify(m) }),
    update: (id: string, patch: Partial<ModelCoverage>) =>
      req<ModelCoverage>(`/models/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id: string) => req<void>(`/models/${id}`, { method: "DELETE" }),
    test: (id: string) =>
      req<{ reachable: boolean; latencyMs: number; detail: string }>(
        `/models/${id}/test`,
        { method: "POST" }
      ),
    evaluate: (id: string) =>
      req<Evaluation>(`/models/${id}/evaluate`, { method: "POST" }),
  },
  integrations: {
    setEnabled: (id: string, enabled: boolean) =>
      req<Integration>(`/integrations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      }),
  },

  fileScan: (input: {
    filename: string;
    fileHash: string;
    source: ScanSource;
    scanProvider: ScanProvider;
    projectId: string;
  }) => req<FileScan>("/file-scans/scan", { method: "POST", body: JSON.stringify(input) }),
  retryFileScan: (id: string) =>
    req<FileScan>(`/file-scans/${id}/retry`, { method: "POST" }),

  inspectPrompt: (input: {
    text: string;
    stage: "input" | "output";
    modelId?: string;
    projectId: string;
  }) =>
    req<PromptInspection>("/prompt-inspections/inspect", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

/** Best-effort fire-and-forget — never throws (used for local-first sync). */
export function syncBackground(fn: () => Promise<unknown>): void {
  fn().catch(() => {
    /* offline or transient — local state remains the source of truth */
  });
}
