// Demo dataset for the AI Security Stack Mapper API.
// Plain objects (no enums) so they map directly onto Prisma create() inputs.
// Mirrors the frontend seed so the experience is identical when connected.

// Demo users — passwords are hashed at seed time, never stored in plaintext.
// All share the same demo password for convenience; change before any real use.
export const DEMO_PASSWORD = "Demo!1234";
export const users = [
  { id: "usr-owner", email: "owner@imbsys.com", name: "Olivia Owner", role: "owner" },
  { id: "usr-appsec", email: "appsec@imbsys.com", name: "Aaron AppSec", role: "appsec" },
  { id: "usr-soc", email: "soc@imbsys.com", name: "Sam SOC", role: "soc" },
  { id: "usr-viewer", email: "viewer@imbsys.com", name: "Vera Viewer", role: "viewer" },
];

export const projects = [
  {
    id: "proj-copilot",
    name: "Customer Support Copilot",
    description:
      "Production RAG assistant answering customer tickets with tool access to the CRM.",
    environment: "production",
    owner: "Platform Security",
    updatedAt: "2026-06-18",
  },
  {
    id: "proj-devbot",
    name: "Internal DevOps Agent",
    description: "Staging agent that triages alerts and proposes runbook actions.",
    environment: "staging",
    owner: "SRE Guild",
    updatedAt: "2026-06-10",
  },
];

export const risks = [
  {
    id: "risk-prompt-injection",
    title: "Prompt Injection",
    description:
      "Adversarial instructions embedded in user input or retrieved content hijack the model's behavior.",
    layer: "input",
    owasp: ["LLM01"],
    severity: "critical",
    likelihood: "high",
    status: "mitigating",
    owner: "AppSec",
    controls: ["ctl-input-filter", "ctl-pi-classifier", "ctl-gateway"],
  },
  {
    id: "risk-jailbreak",
    title: "Jailbreak Attempts",
    description:
      "Users craft prompts to bypass safety guardrails and elicit prohibited responses.",
    layer: "input",
    owasp: ["LLM01"],
    severity: "high",
    likelihood: "high",
    status: "mitigating",
    owner: "AppSec",
    controls: ["ctl-pi-classifier", "ctl-system-prompt", "ctl-content-mod"],
  },
  {
    id: "risk-data-leakage",
    title: "Sensitive Data Leakage",
    description:
      "PII or confidential data is exposed in prompts, retrieved context, or model responses.",
    layer: "output",
    owasp: ["LLM02"],
    severity: "critical",
    likelihood: "medium",
    status: "open",
    owner: "Data Protection",
    controls: ["ctl-pii-redaction", "ctl-dlp-scan"],
  },
  {
    id: "risk-unsafe-tool",
    title: "Unsafe Tool Execution",
    description:
      "The agent invokes dangerous tools or actions beyond its intended authority.",
    layer: "tools",
    owasp: ["LLM06"],
    severity: "critical",
    likelihood: "medium",
    status: "open",
    owner: "Platform Security",
    controls: ["ctl-tool-allowlist", "ctl-least-priv"],
  },
  {
    id: "risk-retrieval-poison",
    title: "Retrieval Poisoning",
    description:
      "Malicious documents injected into the knowledge base manipulate model outputs.",
    layer: "retrieval",
    owasp: ["LLM04", "LLM08"],
    severity: "high",
    likelihood: "medium",
    status: "open",
    owner: "Data Engineering",
    controls: ["ctl-source-validation", "ctl-cp-te"],
  },
  {
    id: "risk-secret-exposure",
    title: "Secret Exposure",
    description:
      "API keys, system prompts, or credentials are leaked through logs or responses.",
    layer: "secrets",
    owasp: ["LLM07", "LLM02"],
    severity: "high",
    likelihood: "medium",
    status: "mitigating",
    owner: "Platform Security",
    controls: ["ctl-vault", "ctl-prompt-store", "ctl-system-prompt"],
  },
  {
    id: "risk-insecure-output",
    title: "Insecure Output Handling",
    description:
      "Unvalidated model output is rendered or executed, enabling XSS or injection downstream.",
    layer: "output",
    owasp: ["LLM05"],
    severity: "high",
    likelihood: "high",
    status: "mitigating",
    owner: "AppSec",
    controls: ["ctl-schema-validation", "ctl-output-sanitize"],
  },
  {
    id: "risk-missing-audit",
    title: "Missing Audit Logs",
    description:
      "Insufficient logging prevents detection, forensics, and compliance reporting.",
    layer: "monitoring",
    owasp: ["LLM02"],
    severity: "medium",
    likelihood: "high",
    status: "mitigating",
    owner: "SOC",
    controls: ["ctl-siem", "ctl-soc-ticket", "ctl-audit-export"],
  },
];

// position {x,y} → positionX/positionY for the relational store
export const controls = [
  ["ctl-input-filter", "Input Filtering / WAF", "Cloudflare WAF and bot defense filter malicious traffic before it reaches the gateway.", "input", ["risk-prompt-injection"], ["LLM01"], "verified", "Network Security", "https://wiki.internal/security/waf-config", "Managed ruleset + custom LLM abuse rules deployed 2026-05.", 3, 40, 60, null, null],
  ["ctl-pi-classifier", "Prompt Injection Classifier", "ML classifier scores every prompt for injection / jailbreak intent and blocks high-risk inputs.", "input", ["risk-prompt-injection", "risk-jailbreak"], ["LLM01"], "implemented", "AppSec", "https://wiki.internal/security/pi-classifier", "Threshold tuning in progress; false-positive rate ~2%.", 3, 40, 160, null, null],
  ["ctl-rate-limit", "Rate Limiting", "Per-user and per-IP rate limits prevent abuse, scraping and unbounded consumption.", "input", ["risk-jailbreak"], ["LLM10"], "verified", "Platform Security", null, null, 2, 40, 260, null, null],
  ["ctl-source-validation", "Retrieval Source Validation", "Validate and sign ingested documents; quarantine untrusted sources before embedding.", "retrieval", ["risk-retrieval-poison"], ["LLM04", "LLM08"], "planned", "Data Engineering", null, "Design approved; implementation scheduled Q3.", 3, 320, 110, null, null],
  ["ctl-gateway", "LLM Gateway", "Central gateway enforces auth, policy, logging and routing for all model calls.", "secrets", ["risk-prompt-injection"], ["LLM01", "LLM10"], "verified", "Platform Security", "https://wiki.internal/security/gateway", null, 3, 600, 40, null, null],
  ["ctl-vault", "Vault for Secrets", "HashiCorp Vault stores API keys & credentials; no secrets in code or env files.", "secrets", ["risk-secret-exposure"], ["LLM07"], "verified", "Platform Security", "https://wiki.internal/security/vault", null, 3, 600, 140, null, null],
  ["ctl-prompt-store", "Prompt Store", "Versioned, access-controlled store for system prompts with change review.", "secrets", ["risk-secret-exposure"], ["LLM07"], "implemented", "AppSec", null, null, 2, 600, 240, null, null],
  ["ctl-system-prompt", "Hardened System Prompt", "Defensive system prompt with instruction hierarchy and leak resistance.", "secrets", ["risk-jailbreak", "risk-secret-exposure"], ["LLM07", "LLM01"], "implemented", "AppSec", null, null, 2, 600, 340, null, null],
  ["ctl-signed-model", "Signed Model Files", "Model artifacts are signed and integrity-verified before deployment.", "model", ["risk-retrieval-poison"], ["LLM03", "LLM04"], "planned", "ML Platform", null, null, 2, 880, 110, null, null],
  ["ctl-tool-allowlist", "Tool Allow-list", "Only explicitly approved tools are callable; everything else is denied by default.", "tools", ["risk-unsafe-tool"], ["LLM06"], "planned", "Platform Security", null, "Allow-list defined; enforcement middleware not yet shipped.", 3, 1160, 60, null, null],
  ["ctl-least-priv", "Least Privilege Tool Access", "Scoped, short-lived credentials per tool; no standing write access.", "tools", ["risk-unsafe-tool"], ["LLM06"], "not_implemented", "Platform Security", null, null, 3, 1160, 160, null, null],
  ["ctl-output-sanitize", "HTML / SQL Sanitization", "Sanitize and encode model output before rendering or passing to downstream systems.", "output", ["risk-insecure-output"], ["LLM05"], "implemented", "AppSec", null, null, 2, 1440, 40, null, null],
  ["ctl-schema-validation", "Output Schema Validation", "Validate structured model output against a strict schema before use.", "output", ["risk-insecure-output"], ["LLM05"], "verified", "AppSec", null, null, 2, 1440, 140, null, null],
  ["ctl-content-mod", "Content Moderation", "Moderation pass blocks unsafe, toxic or policy-violating responses.", "output", ["risk-jailbreak"], ["LLM09"], "implemented", "Trust & Safety", null, null, 2, 1440, 240, null, null],
  ["ctl-pii-redaction", "PII Redaction", "Detect and redact PII from prompts, context and responses.", "output", ["risk-data-leakage"], ["LLM02"], "planned", "Data Protection", null, null, 3, 1440, 340, null, null],
  ["ctl-dlp-scan", "DLP Scan", "Data-loss-prevention scanning on outbound responses with block-and-log.", "output", ["risk-data-leakage"], ["LLM02"], "not_implemented", "Data Protection", null, null, 3, 1440, 440, null, null],
  ["ctl-block-log", "Block & Log", "Policy violations are blocked at delivery and logged with full context.", "delivery", ["risk-insecure-output"], ["LLM05"], "implemented", "Platform Security", null, null, 2, 1720, 110, null, null],
  ["ctl-siem", "SIEM Logging", "All gateway, tool and policy events forwarded to the SIEM for correlation.", "monitoring", ["risk-missing-audit"], ["LLM02"], "verified", "SOC", "https://wiki.internal/security/siem-pipeline", null, 3, 2000, 40, null, null],
  ["ctl-soc-ticket", "SOC Ticketing", "High-severity detections auto-create SOC tickets with enrichment.", "monitoring", ["risk-missing-audit"], ["LLM02"], "implemented", "SOC", null, null, 2, 2000, 140, null, null],
  ["ctl-audit-export", "Compliance Audit Export", "Tamper-evident audit log export for compliance and forensics.", "monitoring", ["risk-missing-audit"], ["LLM02"], "planned", "Compliance", null, null, 2, 2000, 240, null, null],
  ["ctl-file-gateway", "File Security Gateway", "All uploaded and ingested files are routed through Check Point before entering the RAG corpus.", "file", ["risk-retrieval-poison"], ["LLM04", "LLM03"], "implemented", "Platform Security", null, null, 3, 320, 40, "checkpoint", "int-cp-te"],
  ["ctl-cp-te", "Check Point Threat Emulation", "Sandbox detonation of suspicious files; malicious/suspicious verdicts are blocked from retrieval.", "file", ["risk-retrieval-poison"], ["LLM04"], "verified", "Platform Security", "https://te.checkpoint.com", null, 3, 320, 140, "checkpoint", "int-cp-te"],
  ["ctl-cp-filescan", "Check Point TE File Scan", "File reputation + AV engines for PDFs, Office docs, archives and email attachments.", "file", ["risk-retrieval-poison"], ["LLM04", "LLM03"], "implemented", "Platform Security", null, null, 2, 320, 240, "checkpoint", "int-cp-filescan"],
  ["ctl-lakera-input", "Lakera Guard — Input", "Screens every user prompt for injection, jailbreaks and unsafe content before LLM execution.", "guard", ["risk-prompt-injection", "risk-jailbreak"], ["LLM01"], "implemented", "AppSec", null, null, 3, 600, 60, "lakera", "int-lakera"],
  ["ctl-lakera-output", "Lakera Guard — Output", "Inspects model output for data leakage and policy violations before delivery.", "guard", ["risk-data-leakage", "risk-insecure-output"], ["LLM02", "LLM05"], "planned", "AppSec", null, null, 3, 600, 160, "lakera", "int-lakera"],
].map((c) => ({
  id: c[0] as string,
  name: c[1] as string,
  description: c[2] as string,
  layer: c[3] as string,
  mitigates: c[4] as string[],
  owasp: c[5] as string[],
  status: c[6] as string,
  owner: c[7] as string,
  evidenceLink: c[8] as string | null,
  notes: c[9] as string | null,
  weight: c[10] as number,
  positionX: c[11] as number,
  positionY: c[12] as number,
  vendor: c[13] as string | null,
  integrationId: c[14] as string | null,
}));

export const incidents = [
  { id: "inc-001", title: "Prompt injection via support ticket attachment", description: "Crafted instructions in an uploaded document attempted to exfiltrate the system prompt.", layer: "input", severity: "high", status: "contained", detectedAt: "2026-06-15 09:42", relatedRisk: "risk-prompt-injection" },
  { id: "inc-002", title: "PII detected in model response", description: "DLP-shadow flagged an email address echoed from retrieved context into a response.", layer: "output", severity: "critical", status: "investigating", detectedAt: "2026-06-17 14:08", relatedRisk: "risk-data-leakage" },
  { id: "inc-003", title: "Anomalous tool-call volume from agent", description: "DevOps agent attempted 40 CRM writes in 2 minutes; rate limiter throttled the burst.", layer: "tools", severity: "medium", status: "closed", detectedAt: "2026-06-12 22:15", relatedRisk: "risk-unsafe-tool" },
  { id: "inc-004", title: "Jailbreak attempt — roleplay bypass", description: "User attempted a multi-turn roleplay to bypass safety guardrails; blocked by classifier.", layer: "input", severity: "low", status: "closed", detectedAt: "2026-06-11 11:30", relatedRisk: "risk-jailbreak" },
];

export const compliance = [
  { owasp: "LLM01", title: "Prompt Injection", status: "partial", framework: "OWASP LLM Top 10" },
  { owasp: "LLM02", title: "Sensitive Information Disclosure", status: "non_compliant", framework: "OWASP LLM Top 10" },
  { owasp: "LLM04", title: "Data & Model Poisoning", status: "partial", framework: "OWASP LLM Top 10" },
  { owasp: "LLM05", title: "Improper Output Handling", status: "compliant", framework: "OWASP LLM Top 10" },
  { owasp: "LLM06", title: "Excessive Agency", status: "non_compliant", framework: "OWASP LLM Top 10" },
  { owasp: "LLM07", title: "System Prompt Leakage", status: "partial", framework: "OWASP LLM Top 10" },
  { owasp: "LLM10", title: "Unbounded Consumption", status: "compliant", framework: "OWASP LLM Top 10" },
];

export const evidence = [
  { id: "ev-1", controlId: "ctl-input-filter", title: "WAF ruleset configuration export", url: "https://wiki.internal/security/waf-config", addedBy: "n.network", addedAt: "2026-05-20" },
  { id: "ev-2", controlId: "ctl-siem", title: "SIEM pipeline architecture", url: "https://wiki.internal/security/siem-pipeline", addedBy: "s.soc", addedAt: "2026-06-01" },
];

export const integrations = [
  { id: "int-cp-te", name: "Check Point Threat Emulation", vendor: "checkpoint", type: "threat_emulation", apiBaseUrl: "https://te.checkpoint.com/api", enabled: true, authMethod: "api_key", status: "mock", lastHealthCheck: "2026-06-22 08:00", supportedLayers: ["input", "file", "retrieval"], mock: true },
  { id: "int-cp-filescan", name: "Check Point TE File Scan", vendor: "checkpoint", type: "file_scan", apiBaseUrl: "https://te.checkpoint.com/tecloud/api/v1/file", enabled: true, authMethod: "api_key", status: "mock", lastHealthCheck: "2026-06-22 08:00", supportedLayers: ["file", "retrieval"], mock: true },
  { id: "int-lakera", name: "Lakera Guard", vendor: "lakera", type: "prompt_firewall", apiBaseUrl: "https://api.lakera.ai/v2", enabled: true, authMethod: "api_key", status: "mock", lastHealthCheck: "2026-06-22 08:00", supportedLayers: ["input", "guard", "retrieval", "output"], mock: true },
  { id: "int-llm-coverage", name: "LLM Coverage Manager", vendor: "internal", type: "llm_coverage", apiBaseUrl: "internal://coverage", enabled: true, authMethod: "none", status: "connected", lastHealthCheck: "2026-06-22 08:00", supportedLayers: ["model"], mock: false },
];

export const models = [
  { id: "mdl-gpt4o", projectId: "proj-copilot", provider: "azure_openai", modelName: "gpt-4o (Azure)", deploymentType: "hosted", endpoint: "https://contoso.openai.azure.com/openai/deployments/gpt-4o", environment: "production", sensitivity: "confidential", owner: "Platform Security", useCase: "Customer support answering with CRM tool access", allowedTools: ["crm.read", "kb.search"], inputGuardrailsEnabled: true, outputGuardrailsEnabled: true, toolAccessEnabled: true, loggingEnabled: true, riskLevel: "medium", localRuntime: null, internal: null, internetAccess: null, networkIsolated: null, localDataAccess: null, modelIntegrityVerified: null, serverLocation: null },
  { id: "mdl-claude", projectId: "proj-copilot", provider: "anthropic", modelName: "claude-opus-4-8", deploymentType: "hosted", endpoint: "https://api.anthropic.com/v1/messages", environment: "production", sensitivity: "confidential", owner: "AppSec", useCase: "Escalation summarization", allowedTools: ["kb.search"], inputGuardrailsEnabled: true, outputGuardrailsEnabled: false, toolAccessEnabled: true, loggingEnabled: true, riskLevel: "high", localRuntime: null, internal: null, internetAccess: null, networkIsolated: null, localDataAccess: null, modelIntegrityVerified: null, serverLocation: null },
  { id: "mdl-llama-local", projectId: "proj-copilot", provider: "local", modelName: "llama-3.1-70b", deploymentType: "local", endpoint: "http://10.20.4.11:11434/api/generate", environment: "staging", sensitivity: "restricted", owner: "ML Platform", useCase: "On-prem PII-sensitive document Q&A", allowedTools: [], inputGuardrailsEnabled: true, outputGuardrailsEnabled: true, toolAccessEnabled: false, loggingEnabled: true, riskLevel: "medium", localRuntime: "ollama", internal: true, internetAccess: false, networkIsolated: true, localDataAccess: true, modelIntegrityVerified: true, serverLocation: "DC-EU-West / GPU pool A" },
  { id: "mdl-mistral-local", projectId: "proj-devbot", provider: "local", modelName: "mistral-small (vLLM)", deploymentType: "local", endpoint: "http://10.20.4.22:8000/v1/completions", environment: "dev", sensitivity: "internal", owner: "SRE Guild", useCase: "Alert triage experimentation", allowedTools: ["shell.exec", "k8s.read"], inputGuardrailsEnabled: false, outputGuardrailsEnabled: false, toolAccessEnabled: true, loggingEnabled: false, riskLevel: "critical", localRuntime: "vllm", internal: true, internetAccess: true, networkIsolated: false, localDataAccess: true, modelIntegrityVerified: false, serverLocation: "Lab rack 3" },
];

export const fileScans = [
  { id: "fs-1", projectId: "proj-copilot", filename: "Q2-product-guide.pdf", fileHash: "9f2c1a7b4e8d3f60a1b2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f7081", source: "kb_document", scanProvider: "checkpoint_te", verdict: "clean", status: "completed", submittedAt: "2026-06-21 10:12", completedAt: "2026-06-21 10:12", blockedFromRetrieval: false, rawEvidence: { provider: "Check Point Threat Emulation", combined_verdict: "clean" } },
  { id: "fs-2", projectId: "proj-copilot", filename: "invoice-urgent-macro.docm", fileHash: "a1b2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f7081929f2c1a7b4e8d3f6", source: "email_attachment", scanProvider: "checkpoint_te", verdict: "suspicious", status: "completed", submittedAt: "2026-06-21 14:31", completedAt: "2026-06-21 14:31", blockedFromRetrieval: true, rawEvidence: { provider: "Check Point Threat Emulation", combined_verdict: "suspicious", triggered_signatures: ["Office.Macro.AutoOpen"] } },
  { id: "fs-3", projectId: "proj-copilot", filename: "payload-dropper.exe", fileHash: "deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678", source: "upload", scanProvider: "checkpoint_file_scan", verdict: "malicious", status: "completed", submittedAt: "2026-06-20 19:05", completedAt: "2026-06-20 19:06", blockedFromRetrieval: true, rawEvidence: { provider: "Check Point TE File Scan", reputation: { risk_score: 92, classification: "malicious" }, av_engines: { detections: 34, total: 68 } } },
];

export const promptInspections = [
  { id: "pi-1", projectId: "proj-copilot", modelId: "mdl-gpt4o", provider: "Lakera Guard", promptHash: "7b4e8d3f60a1b2c3", riskScore: 8, categories: ["none"], decision: "allow", inspectedAt: "2026-06-22 09:40", rawEvidence: null, stage: "input" },
  { id: "pi-2", projectId: "proj-copilot", modelId: "mdl-gpt4o", provider: "Lakera Guard", promptHash: "a1b2c3d4e5f60718", riskScore: 88, categories: ["prompt_injection", "system_prompt_leakage"], decision: "block", inspectedAt: "2026-06-22 09:42", rawEvidence: null, stage: "input" },
  { id: "pi-3", projectId: "proj-copilot", modelId: "mdl-claude", provider: "Lakera Guard", promptHash: "c3d4e5f607182930", riskScore: 47, categories: ["pii"], decision: "redact", inspectedAt: "2026-06-22 09:55", rawEvidence: null, stage: "output" },
];
