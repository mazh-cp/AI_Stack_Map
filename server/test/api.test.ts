import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/index.js";

// These tests run against the seeded dev database and never mutate it (every
// write path tested is rejected by RBAC or validation before reaching the DB).
// The rate-limit test runs LAST because it trips the per-IP login limiter.

describe("public + auth", () => {
  it("GET /api/health is public and ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("GET /api/bootstrap requires auth", async () => {
    const res = await request(app).get("/api/bootstrap");
    expect(res.status).toBe(401);
  });

  it("rejects bad credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "owner@imbsys.com", password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("logs in, sets httpOnly cookies, and authorizes bootstrap", async () => {
    const agent = request.agent(app);
    const login = await agent
      .post("/api/auth/login")
      .send({ email: "owner@imbsys.com", password: "Demo!1234" });
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe("owner");
    expect(login.body.token).toBeUndefined(); // no token in body
    const setCookie = login.headers["set-cookie"].join(";");
    expect(setCookie).toContain("access=");
    expect(setCookie).toContain("HttpOnly");

    const boot = await agent.get("/api/bootstrap");
    expect(boot.status).toBe(200);
    expect(Array.isArray(boot.body.controls)).toBe(true);
  });
});

describe("RBAC + validation", () => {
  it("forbids a viewer from writing a control (403)", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "viewer@imbsys.com", password: "Demo!1234" });
    const res = await agent
      .patch("/api/controls/ctl-siem")
      .send({ status: "planned" });
    expect(res.status).toBe(403);
  });

  it("rejects an invalid control body (400)", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "owner@imbsys.com", password: "Demo!1234" });
    const res = await agent.post("/api/controls").send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });
});

describe("rate limiting (runs last)", () => {
  it("returns 429 after too many login attempts", async () => {
    const codes: number[] = [];
    for (let i = 0; i < 14; i++) {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@x.com", password: "bad" });
      codes.push(res.status);
    }
    expect(codes).toContain(429);
  });
});
