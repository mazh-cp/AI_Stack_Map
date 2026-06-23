import { describe, it, expect } from "vitest";
import { computeScore, modelIssues } from "../src/score.js";

const ctl = (id: string, status: string, weight = 3, layer = "input") => ({
  id,
  status,
  weight,
  layer,
});

describe("computeScore", () => {
  it("rewards vendor protections and penalizes gaps", () => {
    const controls = [
      ctl("ctl-siem", "verified", 3, "monitoring"),
      ctl("ctl-vault", "verified", 3, "secrets"),
      ctl("ctl-content-mod", "implemented", 2, "output"),
      ctl("ctl-tool-allowlist", "verified", 3, "tools"),
      ctl("ctl-lakera-input", "verified", 3, "guard"),
      ctl("ctl-lakera-output", "verified", 3, "guard"),
    ];
    const integrations = [{ type: "threat_emulation", enabled: true }];
    const s = computeScore(controls as never, [], [], integrations as never);

    const bonusLabels = s.bonuses.map((b) => b.label);
    expect(bonusLabels).toContain("Check Point file scanning enabled");
    expect(bonusLabels).toContain("Lakera Guard input protection enabled");
    expect(bonusLabels).toContain("Lakera Guard output inspection enabled");
    // logging/output-mod/tools/secrets all present → no missing-control penalties
    expect(s.penalties.map((p) => p.label)).not.toContain("Missing SIEM / audit logging");
    expect(s.score).toBeGreaterThan(80);
    expect(["A", "B"]).toContain(s.grade);
  });

  it("penalizes missing file scanning, logging, tools, secrets", () => {
    const controls = [ctl("ctl-pi-classifier", "planned", 3, "input")];
    const s = computeScore(controls as never, [], [], []);
    const labels = s.penalties.map((p) => p.label);
    expect(labels).toContain("Files can enter RAG without scanning");
    expect(labels).toContain("Missing SIEM / audit logging");
    expect(labels).toContain("Missing tool restrictions");
    expect(labels).toContain("Missing secrets management");
  });

  it("penalizes unguarded and internet-exposed local models", () => {
    const models = [
      {
        projectId: "p",
        environment: "dev",
        sensitivity: "internal",
        deploymentType: "local",
        inputGuardrailsEnabled: false,
        outputGuardrailsEnabled: false,
        toolAccessEnabled: true,
        loggingEnabled: false,
        riskLevel: "critical",
        networkIsolated: false,
        internetAccess: true,
        modelIntegrityVerified: false,
        allowedTools: [],
      },
    ];
    const s = computeScore([], [], models as never, []);
    const labels = s.penalties.map((p) => p.label);
    expect(labels.some((l) => l.includes("without input guardrail"))).toBe(true);
    expect(labels.some((l) => l.includes("internet access"))).toBe(true);
    expect(labels.some((l) => l.includes("not network isolated"))).toBe(true);
  });

  it("clamps score to 0..100 and grades F at the bottom", () => {
    const s = computeScore([], [], [], []);
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(100);
    expect(s.grade).toBe("F");
  });
});

describe("modelIssues", () => {
  it("flags local-LLM-specific weaknesses", () => {
    const issues = modelIssues({
      deploymentType: "local",
      inputGuardrailsEnabled: true,
      outputGuardrailsEnabled: true,
      loggingEnabled: true,
      toolAccessEnabled: true,
      networkIsolated: false,
      internetAccess: true,
      modelIntegrityVerified: false,
      allowedTools: [],
    } as never);
    expect(issues).toContain("Not network isolated");
    expect(issues).toContain("Internet access enabled");
    expect(issues).toContain("Unrestricted tool access");
  });
});
