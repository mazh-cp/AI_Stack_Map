import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { validate, schemas } from "./validation.js";
import { prisma } from "./db.js";
import { CONFIG, sha256 } from "./services/config.js";
import { scanFile, type Provider } from "./services/checkpoint.js";
import { inspect } from "./services/lakera.js";
import {
  controlOut,
  controlIn,
  parseJsonFields,
  stringifyJsonFields,
} from "./serialize.js";
import {
  requireAuth,
  requirePerm,
  signAccess,
  signRefresh,
  verifyRefresh,
  cookieOptions,
  ACCESS_MAX_AGE,
  REFRESH_MAX_AGE,
  verifyPassword,
  hashPassword,
  PERMISSION_MATRIX,
  type AuthedRequest,
  type Role,
} from "./auth.js";
import { scoreProject } from "./score.js";
import {
  testConnection as llmTestConnection,
  evaluate as llmEvaluate,
  type EvalModel,
} from "./localLlm.js";

const app = express();
// Behind nginx (Docker) / the Vite dev proxy — trust the first hop so client
// IPs (for rate limiting) and protocol are read from X-Forwarded-* headers.
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
    credentials: true, // allow the httpOnly auth cookies
  })
);

const now = () => new Date().toISOString().slice(0, 16).replace("T", " ");

function parseSettings(s: string | null): Record<string, unknown> {
  if (!s) return {};
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// Strip passwordHash (and raw settings) from any user record sent to clients.
function publicUser(u: {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.createdAt };
}

// Overlay live integration status from server-side config (keys present?).
function integrationStatus(row: { id: string; type: string }) {
  if (row.type === "threat_emulation")
    return { mock: CONFIG.checkpointTE.mock, status: CONFIG.checkpointTE.mock ? "mock" : "connected" };
  if (row.type === "file_scan")
    return { mock: CONFIG.checkpointFileScan.mock, status: CONFIG.checkpointFileScan.mock ? "mock" : "connected" };
  if (row.type === "prompt_firewall")
    return { mock: CONFIG.lakeraGuard.mock, status: CONFIG.lakeraGuard.mock ? "mock" : "connected" };
  return { mock: false, status: "connected" };
}

// ── Health ────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    integrations: {
      checkpoint_te: CONFIG.checkpointTE.mock ? "mock" : "connected",
      checkpoint_file_scan: CONFIG.checkpointFileScan.mock ? "mock" : "connected",
      lakera_guard: CONFIG.lakeraGuard.mock ? "mock" : "connected",
    },
  });
});

// ── Auth: login is public; everything else under /api requires a token ──────
// Brute-force protection: cap login attempts per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too many login attempts, try again later" },
});

function issueCookies(res: Response, u: { id: string; email: string; name: string; role: Role }) {
  res.cookie("access", signAccess(u), cookieOptions(ACCESS_MAX_AGE));
  res.cookie("refresh", signRefresh(u), cookieOptions(REFRESH_MAX_AGE));
}

app.post("/api/auth/login", loginLimiter, validate(schemas.login), async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return res.status(401).json({ error: "invalid credentials" });
  const tokenUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  };
  issueCookies(res, tokenUser);
  res.json({
    user: tokenUser,
    permissions: PERMISSION_MATRIX,
    settings: parseSettings(user.settings),
  });
});

// Refresh: swap a valid refresh cookie for a fresh access cookie. Public so it
// works even when the access token has expired.
app.post("/api/auth/refresh", async (req: Request, res: Response) => {
  const token = (req as { cookies?: Record<string, string> }).cookies?.refresh;
  if (!token) return res.status(401).json({ error: "no refresh token" });
  try {
    const { sub } = verifyRefresh(token);
    const user = await prisma.user.findUnique({ where: { id: sub } });
    if (!user) return res.status(401).json({ error: "user not found" });
    const tokenUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
    };
    issueCookies(res, tokenUser);
    res.json({
      user: tokenUser,
      permissions: PERMISSION_MATRIX,
      settings: parseSettings(user.settings),
    });
  } catch {
    res.status(401).json({ error: "invalid refresh token" });
  }
});

app.post("/api/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie("access", { path: "/" });
  res.clearCookie("refresh", { path: "/" });
  res.json({ ok: true });
});

// Gate everything below: any route registered after this needs a valid token.
app.use("/api", requireAuth);

app.get("/api/auth/me", async (req: AuthedRequest, res: Response) => {
  const row = await prisma.user.findUnique({ where: { id: req.user!.id } });
  res.json({
    user: req.user,
    permissions: PERMISSION_MATRIX,
    settings: parseSettings(row?.settings ?? null),
  });
});

// ── Per-user settings (any authenticated user manages their own) ────────────
app.get("/api/users/me/settings", async (req: AuthedRequest, res: Response) => {
  const row = await prisma.user.findUnique({ where: { id: req.user!.id } });
  res.json(parseSettings(row?.settings ?? null));
});
app.patch(
  "/api/users/me/settings",
  validate(schemas.settings),
  async (req: AuthedRequest, res: Response) => {
    const row = await prisma.user.findUnique({ where: { id: req.user!.id } });
    const merged = { ...parseSettings(row?.settings ?? null), ...req.body };
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { settings: JSON.stringify(merged) },
    });
    res.json(merged);
  }
);

// ── User management (owner only) ────────────────────────────────────────────
const ownerOnly = requirePerm("users:manage");

app.get("/api/users", ownerOnly, async (_req: Request, res: Response) => {
  const rows = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  res.json(rows.map(publicUser));
});

app.post("/api/users", ownerOnly, validate(schemas.userCreate), async (req: Request, res: Response) => {
  const { email, name, role, password } = req.body as {
    email: string;
    name: string;
    role: string;
    password: string;
  };
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing)
    return res.status(409).json({ error: "a user with that email already exists" });
  const user = await prisma.user.create({
    data: {
      id: `usr-${Date.now()}`,
      email: email.toLowerCase(),
      name,
      role,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString().slice(0, 10),
    },
  });
  res.status(201).json(publicUser(user));
});

app.patch("/api/users/:id", ownerOnly, validate(schemas.userPatch), async (req: Request, res: Response) => {
  const { name, role, password } = req.body as {
    name?: string;
    role?: string;
    password?: string;
  };
  // Don't allow demoting the last remaining owner.
  if (role && role !== "owner") {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (target?.role === "owner") {
      const owners = await prisma.user.count({ where: { role: "owner" } });
      if (owners <= 1)
        return res.status(400).json({ error: "cannot demote the last owner" });
    }
  }
  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (role) data.role = role;
  if (password) data.passwordHash = await hashPassword(password);
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json(publicUser(user));
  } catch {
    res.status(404).json({ error: "user not found" });
  }
});

app.delete("/api/users/:id", ownerOnly, async (req: AuthedRequest, res: Response) => {
  if (req.params.id === req.user!.id)
    return res.status(400).json({ error: "you cannot delete your own account" });
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "user not found" });
  if (target.role === "owner") {
    const owners = await prisma.user.count({ where: { role: "owner" } });
    if (owners <= 1)
      return res.status(400).json({ error: "cannot delete the last owner" });
  }
  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ── Bootstrap: the whole dataset in one call ────────────────────────────────
app.get("/api/bootstrap", async (_req: Request, res: Response) => {
  const [
    projects,
    controls,
    risks,
    incidents,
    compliance,
    evidence,
    integrations,
    models,
    fileScans,
    promptInspections,
  ] = await Promise.all([
    prisma.project.findMany(),
    prisma.securityControl.findMany(),
    prisma.risk.findMany(),
    prisma.incident.findMany(),
    prisma.complianceMapping.findMany(),
    prisma.evidence.findMany(),
    prisma.integration.findMany(),
    prisma.modelCoverage.findMany(),
    prisma.fileScan.findMany({ orderBy: { submittedAt: "desc" } }),
    prisma.promptInspection.findMany({ orderBy: { inspectedAt: "desc" } }),
  ]);

  const P = (path: string, rows: Record<string, unknown>[]) =>
    rows.map((r) => parseJsonFields(path, r));

  res.json({
    projects,
    controls: controls.map((c) => controlOut(parseJsonFields("controls", c))),
    risks: P("risks", risks),
    incidents,
    compliance,
    evidence,
    integrations: integrations.map((i) => ({
      ...parseJsonFields("integrations", i),
      ...integrationStatus(i),
    })),
    models: P("models", models),
    fileScans: P("fileScans", fileScans),
    promptInspections: P("promptInspections", promptInspections),
  });
});

// ── Security score (server-computed) ────────────────────────────────────────
app.get("/api/score", async (req: Request, res: Response) => {
  const projectId = String(req.query.projectId || "");
  if (!projectId) return res.status(400).json({ error: "projectId required" });
  res.json(await scoreProject(prisma, projectId));
});

// ── Generic CRUD factory ────────────────────────────────────────────────────
type Delegate = {
  findMany: (args?: unknown) => Promise<unknown[]>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
};

function crud(
  path: string,
  delegate: Delegate,
  opts: {
    idField?: string;
    writePerm: string;
    createSchema?: import("zod").ZodTypeAny;
    patchSchema?: import("zod").ZodTypeAny;
    mapOut?: (r: Record<string, unknown>) => Record<string, unknown>;
    mapIn?: (b: Record<string, unknown>) => Record<string, unknown>;
  }
) {
  const idField = opts.idField ?? "id";
  const extraOut = opts.mapOut ?? ((r) => r);
  const extraIn = opts.mapIn ?? ((b) => b);
  const out = (r: Record<string, unknown>) => extraOut(parseJsonFields(path, r));
  const inn = (b: Record<string, unknown>) => stringifyJsonFields(path, extraIn(b));
  const guard = requirePerm(opts.writePerm);
  const createMw = opts.createSchema ? [guard, validate(opts.createSchema)] : [guard];
  const patchMw = opts.patchSchema ? [guard, validate(opts.patchSchema)] : [guard];

  app.get(`/api/${path}`, async (_req, res) => {
    const rows = (await delegate.findMany()) as Record<string, unknown>[];
    res.json(rows.map(out));
  });

  app.post(`/api/${path}`, createMw, async (req: Request, res: Response) => {
    try {
      const row = await delegate.create({ data: inn(req.body) });
      res.status(201).json(out(row as Record<string, unknown>));
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  app.patch(`/api/${path}/:id`, patchMw, async (req: Request, res: Response) => {
    try {
      const row = await delegate.update({
        where: { [idField]: req.params.id },
        data: inn(req.body),
      });
      res.json(out(row as Record<string, unknown>));
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  app.delete(`/api/${path}/:id`, guard, async (req, res) => {
    try {
      await delegate.delete({ where: { [idField]: req.params.id } });
      res.status(204).end();
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });
}

crud("controls", prisma.securityControl as unknown as Delegate, {
  writePerm: "controls:write",
  createSchema: schemas.controlCreate,
  patchSchema: schemas.controlPatch,
  mapOut: controlOut,
  mapIn: controlIn,
});
crud("risks", prisma.risk as unknown as Delegate, {
  writePerm: "risks:write",
  patchSchema: schemas.riskPatch,
});
crud("incidents", prisma.incident as unknown as Delegate, { writePerm: "incidents:write" });
crud("compliance", prisma.complianceMapping as unknown as Delegate, {
  idField: "owasp",
  writePerm: "admin:write",
});
crud("evidence", prisma.evidence as unknown as Delegate, { writePerm: "admin:write" });
crud("models", prisma.modelCoverage as unknown as Delegate, {
  writePerm: "models:write",
  createSchema: schemas.modelCreate,
  patchSchema: schemas.modelPatch,
});
crud("projects", prisma.project as unknown as Delegate, { writePerm: "admin:write" });

// ── Integrations (enable/disable) ───────────────────────────────────────────
app.get("/api/integrations", async (_req, res) => {
  const rows = await prisma.integration.findMany();
  res.json(rows.map((i) => ({ ...i, ...integrationStatus(i) })));
});
app.patch("/api/integrations/:id", requirePerm("admin:write"), validate(schemas.integrationPatch), async (req, res) => {
  try {
    const row = await prisma.integration.update({
      where: { id: req.params.id },
      data: { enabled: Boolean(req.body.enabled) },
    });
    res.json({ ...row, ...integrationStatus(row) });
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

// ── File scanning (Check Point) ─────────────────────────────────────────────
app.post("/api/file-scans/scan", requirePerm("scan:run"), validate(schemas.fileScan), async (req, res) => {
  const { filename, fileHash, source, scanProvider, projectId } = req.body as {
    filename: string;
    fileHash: string;
    source: string;
    scanProvider: Provider;
    projectId: string;
  };
  try {
    const { verdict, rawEvidence } = await scanFile(scanProvider, filename, fileHash);
    const blocked = verdict === "malicious" || verdict === "suspicious";
    const ts = now();
    const row = await prisma.fileScan.create({
      data: {
        id: `fs-${Date.now()}`,
        projectId,
        filename,
        fileHash,
        source,
        scanProvider,
        verdict,
        status: "completed",
        submittedAt: ts,
        completedAt: ts,
        rawEvidence: JSON.stringify(rawEvidence),
        blockedFromRetrieval: blocked,
      },
    });
    res.status(201).json(parseJsonFields("fileScans", row as Record<string, unknown>));
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

app.post("/api/file-scans/:id/retry", requirePerm("scan:run"), async (req, res) => {
  try {
    const existing = await prisma.fileScan.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "not found" });
    const { verdict, rawEvidence } = await scanFile(
      existing.scanProvider as Provider,
      existing.filename,
      existing.fileHash
    );
    const blocked = verdict === "malicious" || verdict === "suspicious";
    const row = await prisma.fileScan.update({
      where: { id: existing.id },
      data: {
        verdict,
        status: "completed",
        completedAt: now(),
        rawEvidence: JSON.stringify(rawEvidence),
        blockedFromRetrieval: blocked,
      },
    });
    res.json(parseJsonFields("fileScans", row as Record<string, unknown>));
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// ── Prompt inspection (Lakera Guard) ────────────────────────────────────────
app.post("/api/prompt-inspections/inspect", requirePerm("inspect:run"), validate(schemas.inspect), async (req, res) => {
  const { text, stage, modelId, projectId } = req.body as {
    text: string;
    stage: "input" | "output";
    modelId?: string;
    projectId: string;
  };
  try {
    const result = await inspect(text, stage);
    const row = await prisma.promptInspection.create({
      data: {
        id: `pi-${Date.now()}`,
        projectId,
        modelId: modelId ?? null,
        provider: "Lakera Guard",
        promptHash: sha256(text).slice(0, 16),
        riskScore: result.riskScore,
        categories: JSON.stringify(result.categories),
        decision: result.decision,
        inspectedAt: now(),
        rawEvidence: JSON.stringify(result.rawEvidence),
        stage,
      },
    });
    res.status(201).json(parseJsonFields("promptInspections", row as Record<string, unknown>));
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

// ── Local / self-hosted LLM: live connection test & security evaluation ─────
function toEvalModel(row: Record<string, unknown>): EvalModel {
  return {
    modelName: String(row.modelName),
    endpoint: String(row.endpoint),
    deploymentType: String(row.deploymentType),
    inputGuardrailsEnabled: Boolean(row.inputGuardrailsEnabled),
    outputGuardrailsEnabled: Boolean(row.outputGuardrailsEnabled),
  };
}

app.post("/api/models/:id/test", requirePerm("models:write"), async (req: Request, res: Response) => {
  const row = await prisma.modelCoverage.findUnique({ where: { id: req.params.id } });
  if (!row) return res.status(404).json({ error: "model not found" });
  res.json(await llmTestConnection(toEvalModel(row as Record<string, unknown>)));
});

app.post("/api/models/:id/evaluate", requirePerm("models:write"), async (req: Request, res: Response) => {
  const row = await prisma.modelCoverage.findUnique({ where: { id: req.params.id } });
  if (!row) return res.status(404).json({ error: "model not found" });
  const result = await llmEvaluate(toEvalModel(row as Record<string, unknown>));
  // Persist a compact summary on the model for the card badge.
  await prisma.modelCoverage.update({
    where: { id: req.params.id },
    data: {
      lastEvaluation: JSON.stringify({
        mode: result.mode,
        score: result.score,
        passes: result.passes,
        total: result.total,
        latencyMs: result.latencyMs,
      }),
      lastEvaluatedAt: result.evaluatedAt,
    },
  });
  res.json(result);
});

export { app };
