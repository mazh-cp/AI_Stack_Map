// Request body validation with zod. Each mutating route validates its payload
// before touching the database (org policy: validate & sanitize all input).

import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export function validate(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "invalid request body",
        details: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }
    req.body = result.data; // normalized / stripped of unknown keys
    next();
  };
}

const STATUS = z.enum(["not_implemented", "planned", "implemented", "verified"]);
const SEVERITY = z.enum(["low", "medium", "high", "critical"]);
const position = z.object({ x: z.number(), y: z.number() }).optional();

export const schemas = {
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1).max(200),
  }),

  controlCreate: z.object({
    id: z.string().min(1).max(120),
    name: z.string().min(1).max(200),
    description: z.string().max(2000),
    layer: z.string().min(1).max(40),
    mitigates: z.array(z.string()).default([]),
    owasp: z.array(z.string()).default([]),
    status: STATUS,
    owner: z.string().max(120),
    evidenceLink: z.string().max(500).optional(),
    notes: z.string().max(2000).optional(),
    weight: z.number().int().min(1).max(5),
    vendor: z.string().max(40).optional(),
    integrationId: z.string().max(120).optional(),
    position,
  }),
  controlPatch: z
    .object({
      name: z.string().min(1).max(200),
      description: z.string().max(2000),
      status: STATUS,
      owner: z.string().max(120),
      evidenceLink: z.string().max(500),
      notes: z.string().max(2000),
      position: z.object({ x: z.number(), y: z.number() }),
    })
    .partial(),

  riskPatch: z
    .object({
      status: z.enum(["open", "mitigating", "mitigated", "accepted"]),
      severity: SEVERITY,
      owner: z.string().max(120),
    })
    .partial(),

  modelCreate: z.object({
    id: z.string().min(1).max(120),
    projectId: z.string().min(1).max(120),
    provider: z.string().max(40),
    modelName: z.string().min(1).max(200),
    deploymentType: z.enum(["hosted", "local", "custom"]),
    endpoint: z.string().max(500),
    environment: z.enum(["dev", "staging", "production"]),
    sensitivity: z.enum(["public", "internal", "confidential", "restricted"]),
    owner: z.string().max(120),
    useCase: z.string().max(500),
    allowedTools: z.array(z.string()).default([]),
    inputGuardrailsEnabled: z.boolean(),
    outputGuardrailsEnabled: z.boolean(),
    toolAccessEnabled: z.boolean(),
    loggingEnabled: z.boolean(),
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
    localRuntime: z.string().max(40).nullish(),
    internal: z.boolean().nullish(),
    internetAccess: z.boolean().nullish(),
    networkIsolated: z.boolean().nullish(),
    localDataAccess: z.boolean().nullish(),
    modelIntegrityVerified: z.boolean().nullish(),
    serverLocation: z.string().max(200).nullish(),
  }),
  modelPatch: z
    .object({
      inputGuardrailsEnabled: z.boolean(),
      outputGuardrailsEnabled: z.boolean(),
      toolAccessEnabled: z.boolean(),
      loggingEnabled: z.boolean(),
      networkIsolated: z.boolean(),
      internetAccess: z.boolean(),
      modelIntegrityVerified: z.boolean(),
      riskLevel: z.enum(["low", "medium", "high", "critical"]),
      allowedTools: z.array(z.string()),
    })
    .partial(),

  integrationPatch: z.object({ enabled: z.boolean() }),

  fileScan: z.object({
    filename: z.string().min(1).max(400),
    fileHash: z.string().min(8).max(128),
    source: z.enum(["upload", "rag_ingest", "email_attachment", "kb_document"]),
    scanProvider: z.enum(["checkpoint_te", "checkpoint_file_scan"]),
    projectId: z.string().min(1).max(120),
  }),

  inspect: z.object({
    text: z.string().min(1).max(20000),
    stage: z.enum(["input", "output"]),
    modelId: z.string().max(120).optional(),
    projectId: z.string().min(1).max(120),
  }),

  // ── User management ────────────────────────────────────────────────
  userCreate: z.object({
    email: z.string().email().max(200),
    name: z.string().min(1).max(120),
    role: z.enum(["owner", "appsec", "soc", "viewer"]),
    password: z.string().min(8).max(200),
  }),
  userPatch: z
    .object({
      name: z.string().min(1).max(120),
      role: z.enum(["owner", "appsec", "soc", "viewer"]),
      password: z.string().min(8).max(200),
    })
    .partial()
    .refine((o) => Object.keys(o).length > 0, { message: "no fields to update" }),

  // ── Per-user settings ──────────────────────────────────────────────
  settings: z
    .object({
      locale: z.enum(["en", "es"]),
      defaultProjectId: z.string().max(120),
      emailNotifications: z.boolean(),
    })
    .partial(),
};
