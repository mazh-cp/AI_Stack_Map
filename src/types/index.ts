// ───────────────────────────────────────────────────────────────────────────
// Core domain model for the AI Security Stack Mapper
// ───────────────────────────────────────────────────────────────────────────

export type ControlStatus =
  | "not_implemented"
  | "planned"
  | "implemented"
  | "verified";

export type Severity = "low" | "medium" | "high" | "critical";

export type RiskStatus = "open" | "mitigating" | "mitigated" | "accepted";

export type IncidentStatus = "open" | "investigating" | "contained" | "closed";

export type ComplianceStatus = "compliant" | "partial" | "non_compliant";

// The defense-in-depth zones of the LLM application stack
export type LayerKey =
  | "threats" // Users & Threats
  | "input" // Input Security Gateway
  | "file" // File Security Gateway (Check Point TE + File Scan)
  | "guard" // Prompt Firewall (Lakera Guard)
  | "retrieval" // Retrieval Security / Vector DB / RAG Corpus
  | "secrets" // Secrets & Prompt Store
  | "model" // Model Coverage (Hosted + Local LLMs)
  | "tools" // Tool Gateway
  | "output" // Output Defenses
  | "delivery" // Delivery
  | "monitoring" // SIEM & Audit
  | "compliance" // Compliance Reports
  | "future"; // Future Enhancements

// OWASP Top 10 for LLM Applications (2025)
export type OwaspCategory =
  | "LLM01" // Prompt Injection
  | "LLM02" // Sensitive Information Disclosure
  | "LLM03" // Supply Chain
  | "LLM04" // Data and Model Poisoning
  | "LLM05" // Improper Output Handling
  | "LLM06" // Excessive Agency
  | "LLM07" // System Prompt Leakage
  | "LLM08" // Vector and Embedding Weaknesses
  | "LLM09" // Misinformation
  | "LLM10"; // Unbounded Consumption

export interface Project {
  id: string;
  name: string;
  description: string;
  environment: "production" | "staging" | "development";
  owner: string;
  updatedAt: string;
}

export interface StackLayer {
  key: LayerKey;
  name: string;
  description: string;
  /** Position in the defense-in-depth flow, left → right */
  order: number;
  color: string;
}

export interface SecurityControl {
  id: string;
  name: string;
  description: string;
  layer: LayerKey;
  /** Risk ids this control mitigates */
  mitigates: string[];
  owasp: OwaspCategory[];
  status: ControlStatus;
  owner: string;
  evidenceLink?: string;
  notes?: string;
  /** Relative weight in the security score (higher = more important) */
  weight: number;
  /** Optional position on the architecture canvas */
  position?: { x: number; y: number };
  /** Vendor this control is backed by, if it is an integration node */
  vendor?: Vendor;
  /** Linked Integration id (for integration-backed controls) */
  integrationId?: string;
}

// ───────────────────────────────────────────────────────────────────────────
// Vendor / security integrations
// ───────────────────────────────────────────────────────────────────────────

export type Vendor = "checkpoint" | "lakera" | "internal";

export type IntegrationType =
  | "threat_emulation"
  | "file_scan"
  | "prompt_firewall"
  | "llm_coverage";

export type AuthMethod = "api_key" | "oauth" | "none";

export type IntegrationStatus =
  | "connected"
  | "degraded"
  | "disconnected"
  | "mock";

export interface Integration {
  id: string;
  name: string;
  vendor: Vendor;
  type: IntegrationType;
  apiBaseUrl: string;
  enabled: boolean;
  authMethod: AuthMethod;
  status: IntegrationStatus;
  lastHealthCheck: string;
  supportedLayers: LayerKey[];
  /** True when running against mock responses (no real key configured) */
  mock: boolean;
}

// ── Model coverage ────────────────────────────────────────────────────────────
export type ModelProvider =
  | "openai"
  | "azure_openai"
  | "anthropic"
  | "google"
  | "meta"
  | "mistral"
  | "cohere"
  | "local"
  | "custom";

export type DeploymentType = "hosted" | "local" | "custom";

export type Environment = "dev" | "staging" | "production";

export type Sensitivity = "public" | "internal" | "confidential" | "restricted";

export type RiskLevel = "low" | "medium" | "high" | "critical";

/** Local-runtime examples surfaced in the UI for local deployments */
export type LocalRuntime =
  | "ollama"
  | "lm_studio"
  | "vllm"
  | "llama_cpp"
  | "localai"
  | "hf_tgi";

export interface ModelCoverage {
  id: string;
  projectId: string;
  provider: ModelProvider;
  modelName: string;
  deploymentType: DeploymentType;
  endpoint: string;
  environment: Environment;
  sensitivity: Sensitivity;
  owner: string;
  useCase: string;
  allowedTools: string[];
  inputGuardrailsEnabled: boolean;
  outputGuardrailsEnabled: boolean;
  toolAccessEnabled: boolean;
  loggingEnabled: boolean;
  riskLevel: RiskLevel;
  // Local-LLM specific
  localRuntime?: LocalRuntime;
  internal?: boolean;
  internetAccess?: boolean;
  networkIsolated?: boolean;
  localDataAccess?: boolean;
  modelIntegrityVerified?: boolean;
  serverLocation?: string;
  // Latest security-evaluation summary (set by POST /api/models/:id/evaluate)
  lastEvaluation?: {
    mode: "live" | "simulated";
    score: number;
    passes: number;
    total: number;
    latencyMs: number;
  } | null;
  lastEvaluatedAt?: string | null;
}

// ── File scanning ───────────────────────────────────────────────────────────
export type FileVerdict = "clean" | "malicious" | "suspicious" | "unknown";

export type ScanStatus = "queued" | "scanning" | "completed" | "error";

export type ScanSource =
  | "upload"
  | "rag_ingest"
  | "email_attachment"
  | "kb_document";

export type ScanProvider = "checkpoint_te" | "checkpoint_file_scan";

export interface FileScan {
  id: string;
  projectId: string;
  filename: string;
  fileHash: string;
  source: ScanSource;
  scanProvider: ScanProvider;
  verdict: FileVerdict;
  status: ScanStatus;
  submittedAt: string;
  completedAt?: string;
  rawEvidence?: unknown;
  blockedFromRetrieval: boolean;
}

// ── Prompt inspection (Lakera Guard) ──────────────────────────────────────────
export type PromptDecision = "allow" | "block" | "redact" | "escalate";

export interface PromptInspection {
  id: string;
  projectId: string;
  modelId?: string;
  provider: string;
  promptHash: string;
  /** 0–100 risk score */
  riskScore: number;
  categories: string[];
  decision: PromptDecision;
  inspectedAt: string;
  rawEvidence?: unknown;
  /** Whether this inspection covered an input prompt or a model output */
  stage: "input" | "output";
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  layer: LayerKey;
  owasp: OwaspCategory[];
  severity: Severity;
  likelihood: Severity;
  status: RiskStatus;
  owner: string;
  /** Control ids that mitigate this risk */
  controls: string[];
}

export interface Assessment {
  controlId: string;
  status: ControlStatus;
  assessedBy: string;
  assessedAt: string;
  note?: string;
}

export interface Evidence {
  id: string;
  controlId: string;
  title: string;
  url: string;
  addedBy: string;
  addedAt: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  layer: LayerKey;
  severity: Severity;
  status: IncidentStatus;
  detectedAt: string;
  relatedRisk?: string;
}

export interface ComplianceMapping {
  owasp: OwaspCategory;
  title: string;
  status: ComplianceStatus;
  framework: string;
}
