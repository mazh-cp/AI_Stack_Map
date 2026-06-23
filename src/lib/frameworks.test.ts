import { describe, it, expect } from "vitest";
import {
  FRAMEWORKS,
  evaluateFramework,
  buildFrameworkReport,
} from "./frameworks";
import type { SecurityControl } from "../types";

// Minimal control factory — evaluateFramework only reads id, owasp, layer, status.
const ctl = (
  id: string,
  status: SecurityControl["status"],
  owasp: string[] = [],
  layer = "input"
): SecurityControl =>
  ({
    id,
    name: id,
    description: "",
    layer,
    mitigates: [],
    owasp,
    status,
    owner: "",
    weight: 3,
  }) as SecurityControl;

const nist = FRAMEWORKS.find((f) => f.id === "nist-ai-rmf")!;

describe("evaluateFramework", () => {
  it("marks a requirement covered when its controls are verified", () => {
    const controls = [
      ctl("ctl-siem", "verified"),
      ctl("ctl-audit-export", "verified"),
      ctl("ctl-soc-ticket", "verified"),
    ];
    const result = evaluateFramework(nist, controls);
    const govern = result.requirements.find((r) => r.req.code === "GOVERN-1.1")!;
    expect(govern.status).toBe("covered");
    expect(govern.mapped.length).toBe(3);
  });

  it("marks a requirement partial for planned controls and gap when unmapped", () => {
    const controls = [ctl("ctl-siem", "planned")];
    const result = evaluateFramework(nist, controls);
    expect(result.requirements.find((r) => r.req.code === "GOVERN-1.1")!.status).toBe(
      "partial"
    );
    // A requirement whose controls aren't present at all is a gap.
    expect(result.requirements.find((r) => r.req.code === "MAP-1.1")!.status).toBe(
      "gap"
    );
  });

  it("counts sum to the requirement total and percent is bounded", () => {
    const result = evaluateFramework(nist, [ctl("ctl-siem", "verified")]);
    const { covered, partial, gap } = result.counts;
    expect(covered + partial + gap).toBe(nist.requirements.length);
    expect(result.percent).toBeGreaterThanOrEqual(0);
    expect(result.percent).toBeLessThanOrEqual(100);
  });

  it("maps OWASP requirements by category", () => {
    const owasp = FRAMEWORKS.find((f) => f.id === "owasp-llm")!;
    const result = evaluateFramework(owasp, [ctl("c1", "verified", ["LLM01"])]);
    expect(result.requirements.find((r) => r.req.code === "LLM01")!.status).toBe(
      "covered"
    );
  });
});

describe("buildFrameworkReport", () => {
  it("produces markdown with coverage and a requirements table", () => {
    const result = evaluateFramework(nist, [ctl("ctl-siem", "verified")]);
    const md = buildFrameworkReport(result, "Demo Project", "2026-06-22");
    expect(md).toContain("# NIST AI Risk Management Framework — Compliance Report");
    expect(md).toContain("Demo Project");
    expect(md).toContain("| Requirement | Status | Mapped controls |");
  });
});
