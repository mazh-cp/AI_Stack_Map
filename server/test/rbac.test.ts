import { describe, it, expect } from "vitest";
import { can } from "../src/auth.js";

describe("RBAC can()", () => {
  it("owner can do everything", () => {
    for (const p of [
      "controls:write",
      "risks:write",
      "models:write",
      "scan:run",
      "inspect:run",
      "admin:write",
    ]) {
      expect(can("owner", p)).toBe(true);
    }
  });

  it("viewer can do nothing", () => {
    for (const p of ["controls:write", "risks:write", "scan:run", "admin:write"]) {
      expect(can("viewer", p)).toBe(false);
    }
  });

  it("appsec edits controls/models but not admin", () => {
    expect(can("appsec", "controls:write")).toBe(true);
    expect(can("appsec", "models:write")).toBe(true);
    expect(can("appsec", "scan:run")).toBe(true);
    expect(can("appsec", "admin:write")).toBe(false);
  });

  it("soc handles risks/scans but not controls or models", () => {
    expect(can("soc", "risks:write")).toBe(true);
    expect(can("soc", "scan:run")).toBe(true);
    expect(can("soc", "inspect:run")).toBe(true);
    expect(can("soc", "controls:write")).toBe(false);
    expect(can("soc", "models:write")).toBe(false);
  });

  it("unknown permission is denied", () => {
    expect(can("owner", "nonsense:write")).toBe(false);
  });
});
