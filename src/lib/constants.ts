import type {
  ControlStatus,
  LayerKey,
  OwaspCategory,
  RiskStatus,
  Severity,
  IncidentStatus,
  StackLayer,
  FileVerdict,
  ScanStatus,
  PromptDecision,
  Sensitivity,
  RiskLevel,
  ModelProvider,
  IntegrationStatus,
  Vendor,
  LocalRuntime,
  ScanSource,
} from "../types";

// ── Control status display ──────────────────────────────────────────────────
export const STATUS_META: Record<
  ControlStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  not_implemented: {
    label: "Not Implemented",
    color: "text-status-critical",
    bg: "bg-status-critical/10 border-status-critical/30",
    dot: "bg-status-critical",
  },
  planned: {
    label: "Planned",
    color: "text-status-warning",
    bg: "bg-status-warning/10 border-status-warning/30",
    dot: "bg-status-warning",
  },
  implemented: {
    label: "Implemented",
    color: "text-status-info",
    bg: "bg-status-info/10 border-status-info/30",
    dot: "bg-status-info",
  },
  verified: {
    label: "Verified",
    color: "text-status-success",
    bg: "bg-status-success/10 border-status-success/30",
    dot: "bg-status-success",
  },
};

export const CONTROL_STATUSES: ControlStatus[] = [
  "not_implemented",
  "planned",
  "implemented",
  "verified",
];

// ── Severity display ────────────────────────────────────────────────────────
export const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; bg: string; rank: number }
> = {
  critical: {
    label: "Critical",
    color: "text-status-critical",
    bg: "bg-status-critical/15 border-status-critical/40",
    rank: 4,
  },
  high: {
    label: "High",
    color: "text-orange-400",
    bg: "bg-orange-500/15 border-orange-500/40",
    rank: 3,
  },
  medium: {
    label: "Medium",
    color: "text-status-warning",
    bg: "bg-status-warning/15 border-status-warning/40",
    rank: 2,
  },
  low: {
    label: "Low",
    color: "text-status-info",
    bg: "bg-status-info/15 border-status-info/40",
    rank: 1,
  },
};

export const RISK_STATUS_META: Record<
  RiskStatus,
  { label: string; color: string; bg: string }
> = {
  open: {
    label: "Open",
    color: "text-status-critical",
    bg: "bg-status-critical/10 border-status-critical/30",
  },
  mitigating: {
    label: "Mitigating",
    color: "text-status-warning",
    bg: "bg-status-warning/10 border-status-warning/30",
  },
  mitigated: {
    label: "Mitigated",
    color: "text-status-success",
    bg: "bg-status-success/10 border-status-success/30",
  },
  accepted: {
    label: "Accepted",
    color: "text-gray-400",
    bg: "bg-gray-500/10 border-gray-500/30",
  },
};

export const INCIDENT_STATUS_META: Record<
  IncidentStatus,
  { label: string; color: string }
> = {
  open: { label: "Open", color: "text-status-critical" },
  investigating: { label: "Investigating", color: "text-status-warning" },
  contained: { label: "Contained", color: "text-status-info" },
  closed: { label: "Closed", color: "text-status-success" },
};

// ── OWASP Top 10 for LLM Apps ─────────────────────────────────────────────────
export const OWASP_META: Record<OwaspCategory, { title: string; short: string }> =
  {
    LLM01: { title: "Prompt Injection", short: "Prompt Injection" },
    LLM02: {
      title: "Sensitive Information Disclosure",
      short: "Sensitive Disclosure",
    },
    LLM03: { title: "Supply Chain", short: "Supply Chain" },
    LLM04: { title: "Data & Model Poisoning", short: "Data Poisoning" },
    LLM05: { title: "Improper Output Handling", short: "Output Handling" },
    LLM06: { title: "Excessive Agency", short: "Excessive Agency" },
    LLM07: { title: "System Prompt Leakage", short: "Prompt Leakage" },
    LLM08: {
      title: "Vector & Embedding Weaknesses",
      short: "Vector Weaknesses",
    },
    LLM09: { title: "Misinformation", short: "Misinformation" },
    LLM10: { title: "Unbounded Consumption", short: "Unbounded Consumption" },
  };

export const OWASP_CATEGORIES = Object.keys(OWASP_META) as OwaspCategory[];

// ── Stack layers (defense-in-depth zones) ─────────────────────────────────────
export const LAYERS: Record<LayerKey, StackLayer> = {
  threats: {
    key: "threats",
    name: "Users & Threats",
    description: "Legitimate users and adversaries entering the system",
    order: 0,
    color: "#C2453F",
  },
  input: {
    key: "input",
    name: "Input Security Gateway",
    description: "User prompts entering the system",
    order: 1,
    color: "#4E7FB5",
  },
  file: {
    key: "file",
    name: "File Security Gateway",
    description: "Check Point Threat Emulation & file reputation",
    order: 2,
    color: "#4EB5A9",
  },
  guard: {
    key: "guard",
    name: "Prompt Firewall",
    description: "Lakera Guard — injection, jailbreak & policy checks",
    order: 3,
    color: "#4E7FB5",
  },
  retrieval: {
    key: "retrieval",
    name: "Retrieval Security",
    description: "Vector DB / RAG corpus, sources & embeddings",
    order: 4,
    color: "#6E76A8",
  },
  secrets: {
    key: "secrets",
    name: "Secrets & Prompt Store",
    description: "System prompts, keys & vaulted credentials",
    order: 5,
    color: "#C8902E",
  },
  model: {
    key: "model",
    name: "Model Coverage",
    description: "Hosted & local LLMs and model integrity",
    order: 6,
    color: "#3E9B74",
  },
  tools: {
    key: "tools",
    name: "Tool Gateway",
    description: "Agent tool calls & external actions",
    order: 7,
    color: "#C2453F",
  },
  output: {
    key: "output",
    name: "Output Defenses",
    description: "Response moderation & safe rendering",
    order: 8,
    color: "#4E7FB5",
  },
  delivery: {
    key: "delivery",
    name: "Delivery",
    description: "Channels delivering responses to users",
    order: 9,
    color: "#6E76A8",
  },
  monitoring: {
    key: "monitoring",
    name: "SIEM & Audit",
    description: "Logging, detection & incident response",
    order: 10,
    color: "#3E9B74",
  },
  compliance: {
    key: "compliance",
    name: "Compliance Reports",
    description: "OWASP & audit reporting evidence",
    order: 11,
    color: "#6E76A8",
  },
  future: {
    key: "future",
    name: "Future Enhancements",
    description: "Planned controls & roadmap items",
    order: 12,
    color: "#94A3B8",
  },
};

export const LAYER_ORDER: LayerKey[] = Object.values(LAYERS)
  .sort((a, b) => a.order - b.order)
  .map((l) => l.key);

// ── File scan verdicts ────────────────────────────────────────────────────────
export const VERDICT_META: Record<
  FileVerdict,
  { label: string; color: string; bg: string; dot: string }
> = {
  clean: {
    label: "Clean",
    color: "text-status-success",
    bg: "bg-status-success/10 border-status-success/30",
    dot: "bg-status-success",
  },
  suspicious: {
    label: "Suspicious",
    color: "text-status-warning",
    bg: "bg-status-warning/10 border-status-warning/30",
    dot: "bg-status-warning",
  },
  malicious: {
    label: "Malicious",
    color: "text-status-critical",
    bg: "bg-status-critical/10 border-status-critical/30",
    dot: "bg-status-critical",
  },
  unknown: {
    label: "Unknown",
    color: "text-gray-400",
    bg: "bg-gray-500/10 border-gray-500/30",
    dot: "bg-gray-500",
  },
};

export const SCAN_STATUS_META: Record<
  ScanStatus,
  { label: string; color: string }
> = {
  queued: { label: "Queued", color: "text-gray-400" },
  scanning: { label: "Scanning", color: "text-status-info" },
  completed: { label: "Completed", color: "text-status-success" },
  error: { label: "Error", color: "text-status-critical" },
};

export const SCAN_SOURCE_LABEL: Record<ScanSource, string> = {
  upload: "User upload",
  rag_ingest: "RAG ingestion",
  email_attachment: "Email attachment",
  kb_document: "KB document",
};

// ── Prompt decisions (Lakera Guard) ───────────────────────────────────────────
export const DECISION_META: Record<
  PromptDecision,
  { label: string; color: string; bg: string }
> = {
  allow: {
    label: "Allow",
    color: "text-status-success",
    bg: "bg-status-success/10 border-status-success/30",
  },
  redact: {
    label: "Redact",
    color: "text-status-warning",
    bg: "bg-status-warning/10 border-status-warning/30",
  },
  escalate: {
    label: "Escalate",
    color: "text-status-violet",
    bg: "bg-status-violet/10 border-status-violet/30",
  },
  block: {
    label: "Block",
    color: "text-status-critical",
    bg: "bg-status-critical/10 border-status-critical/30",
  },
};

// ── Sensitivity / risk level ──────────────────────────────────────────────────
export const SENSITIVITY_META: Record<
  Sensitivity,
  { label: string; color: string }
> = {
  public: { label: "Public", color: "text-status-success" },
  internal: { label: "Internal", color: "text-status-info" },
  confidential: { label: "Confidential", color: "text-status-warning" },
  restricted: { label: "Restricted", color: "text-status-critical" },
};

export const RISK_LEVEL_META: Record<
  RiskLevel,
  { label: string; color: string; bg: string }
> = {
  low: {
    label: "Low",
    color: "text-status-success",
    bg: "bg-status-success/10 border-status-success/30",
  },
  medium: {
    label: "Medium",
    color: "text-status-warning",
    bg: "bg-status-warning/10 border-status-warning/30",
  },
  high: {
    label: "High",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
  },
  critical: {
    label: "Critical",
    color: "text-status-critical",
    bg: "bg-status-critical/10 border-status-critical/30",
  },
};

// ── Model providers ───────────────────────────────────────────────────────────
export const PROVIDER_META: Record<
  ModelProvider,
  { label: string; short: string }
> = {
  openai: { label: "OpenAI", short: "OpenAI" },
  azure_openai: { label: "Azure OpenAI", short: "Azure" },
  anthropic: { label: "Anthropic Claude", short: "Anthropic" },
  google: { label: "Google Gemini", short: "Gemini" },
  meta: { label: "Meta Llama", short: "Llama" },
  mistral: { label: "Mistral", short: "Mistral" },
  cohere: { label: "Cohere", short: "Cohere" },
  local: { label: "Local LLM", short: "Local" },
  custom: { label: "Custom Endpoint", short: "Custom" },
};

export const LOCAL_RUNTIME_LABEL: Record<LocalRuntime, string> = {
  ollama: "Ollama",
  lm_studio: "LM Studio",
  vllm: "vLLM",
  llama_cpp: "llama.cpp",
  localai: "LocalAI",
  hf_tgi: "HF TGI",
};

// ── Integration status ────────────────────────────────────────────────────────
export const INTEGRATION_STATUS_META: Record<
  IntegrationStatus,
  { label: string; color: string; dot: string }
> = {
  connected: {
    label: "Connected",
    color: "text-status-success",
    dot: "bg-status-success",
  },
  mock: { label: "Mock mode", color: "text-status-info", dot: "bg-status-info" },
  degraded: {
    label: "Degraded",
    color: "text-status-warning",
    dot: "bg-status-warning",
  },
  disconnected: {
    label: "Disconnected",
    color: "text-status-critical",
    dot: "bg-status-critical",
  },
};

export const VENDOR_META: Record<Vendor, { label: string; color: string }> = {
  checkpoint: { label: "Check Point", color: "#4EB5A9" },
  lakera: { label: "Lakera", color: "#4E7FB5" },
  internal: { label: "Internal", color: "#6E76A8" },
};
