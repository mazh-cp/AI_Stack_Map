// Authentication & role-based access control.
//
// SECURITY: the JWT signing secret comes from JWT_SECRET. If it is not set we
// generate a random ephemeral secret at boot (tokens simply won't survive a
// restart) — we never ship a hardcoded secret. Passwords are bcrypt-hashed.

import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

export type Role = "owner" | "appsec" | "soc" | "viewer";
export const ROLES: Role[] = ["owner", "appsec", "soc", "viewer"];

// Which roles may perform each write action. Reads are allowed for any
// authenticated user.
const PERMISSIONS: Record<string, Role[]> = {
  "controls:write": ["owner", "appsec"],
  "risks:write": ["owner", "appsec", "soc"],
  "incidents:write": ["owner", "appsec", "soc"],
  "models:write": ["owner", "appsec"],
  "scan:run": ["owner", "appsec", "soc"],
  "inspect:run": ["owner", "appsec", "soc"],
  "admin:write": ["owner"],
  "users:manage": ["owner"],
};

export function can(role: Role, perm: string): boolean {
  return PERMISSIONS[perm]?.includes(role) ?? false;
}

/** The permission matrix, exposed so the client can mirror it for UI gating. */
export const PERMISSION_MATRIX = PERMISSIONS;

const JWT_SECRET =
  process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.JWT_SECRET) {
  console.warn(
    "[auth] JWT_SECRET not set — using an ephemeral secret (tokens reset on restart)."
  );
}
const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";
export const ACCESS_MAX_AGE = 15 * 60 * 1000;
export const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export interface TokenUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export function signAccess(u: TokenUser): string {
  return jwt.sign(
    { sub: u.id, email: u.email, name: u.name, role: u.role, type: "access" },
    JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

export function signRefresh(u: TokenUser): string {
  return jwt.sign({ sub: u.id, type: "refresh" }, JWT_SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

/** httpOnly cookie options — `secure` only in production (behind TLS). */
export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
  };
}

export function verifyRefresh(token: string): { sub: string } {
  const p = jwt.verify(token, JWT_SECRET) as { sub: string; type?: string };
  if (p.type !== "refresh") throw new Error("not a refresh token");
  return { sub: p.sub };
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) =>
  bcrypt.compare(pw, hash);

export interface AuthedRequest extends Request {
  user?: TokenUser;
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  // Prefer the httpOnly cookie; fall back to a Bearer header for API/CI clients.
  const cookieToken = (req as { cookies?: Record<string, string> }).cookies?.access;
  const header = req.headers.authorization;
  const token = cookieToken || (header?.startsWith("Bearer ") ? header.slice(7) : null);
  if (!token) return res.status(401).json({ error: "authentication required" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      email: string;
      name: string;
      role: Role;
    };
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({ error: "invalid or expired token" });
  }
}

export function requirePerm(perm: string) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "authentication required" });
    if (!can(req.user.role, perm))
      return res
        .status(403)
        .json({ error: `role '${req.user.role}' lacks permission '${perm}'` });
    next();
  };
}
