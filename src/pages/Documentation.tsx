import { useState, type ReactNode } from "react";
import { BookOpen, Download, Settings as Cog, ListChecks } from "lucide-react";
import { PageHeader } from "../components/layout/Layout";

type Tab = "admin" | "usage";

const PDFS: Record<Tab, { label: string; href: string }> = {
  admin: {
    label: "Admin Setup (PDF)",
    href: "/docs/Check-Point-AI-Stack-Mapper-Admin-Setup.pdf",
  },
  usage: {
    label: "Usage Guide (PDF)",
    href: "/docs/Check-Point-AI-Stack-Mapper-Usage-Guide.pdf",
  },
};

export function Documentation() {
  const [tab, setTab] = useState<Tab>("admin");

  return (
    <div>
      <PageHeader
        title="Documentation"
        subtitle="Admin setup & step-by-step usage — in-app reference"
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/docs/Check-Point-AI-Stack-Mapper-Product-Guide.pdf"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-base-border px-3 py-2 text-sm font-medium text-gray-300 hover:bg-base-hover"
            >
              <Download className="h-4 w-4" /> Full Product Guide
            </a>
            <a
              href={PDFS[tab].href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-[#0f172a] hover:bg-accent/90"
            >
              <Download className="h-4 w-4" /> {PDFS[tab].label}
            </a>
          </div>
        }
      />

      <div className="p-6">
        {/* Tabs */}
        <div className="mb-5 inline-flex rounded-lg border border-base-border bg-base-card p-0.5">
          <TabBtn active={tab === "admin"} onClick={() => setTab("admin")} icon={Cog}>
            Admin Setup
          </TabBtn>
          <TabBtn active={tab === "usage"} onClick={() => setTab("usage")} icon={ListChecks}>
            Step-by-Step Usage
          </TabBtn>
        </div>

        <div className="mx-auto max-w-4xl space-y-5">
          {tab === "admin" ? <AdminDoc /> : <UsageDoc />}
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof BookOpen;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-accent/15 text-accent" : "text-gray-500 hover:text-gray-300"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

/* ── Shared doc primitives ─────────────────────────────────────────────── */
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="soc-card p-5">
      <h2 className="mb-3 border-b border-base-border pb-2 text-base font-bold text-white">
        {title}
      </h2>
      {children}
    </section>
  );
}
function P({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-sm leading-relaxed text-gray-300">{children}</p>;
}
function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="ml-4 list-decimal space-y-1.5 text-sm text-gray-300">
      {items.map((it, i) => (
        <li key={i} className="pl-1">{it}</li>
      ))}
    </ol>
  );
}
function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-4 list-disc space-y-1.5 text-sm text-gray-300">
      {items.map((it, i) => (
        <li key={i} className="pl-1">{it}</li>
      ))}
    </ul>
  );
}
function Code({ children }: { children: string }) {
  return (
    <pre className="my-2 overflow-auto rounded-md border border-base-border bg-base-bg px-3 py-2 font-mono text-xs leading-relaxed text-gray-300">
      {children}
    </pre>
  );
}
function K({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-base-bg px-1.5 py-0.5 font-mono text-xs text-accent">
      {children}
    </code>
  );
}
function Note({ children }: { children: ReactNode }) {
  return (
    <div className="my-2 rounded-md border-l-4 border-accent bg-accent/5 px-3 py-2 text-xs text-gray-400">
      {children}
    </div>
  );
}
function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="my-2 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-base-border text-left uppercase tracking-wider text-gray-500">
            {head.map((h) => (
              <th key={h} className="px-2 py-1.5 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-base-border/60">
              {r.map((c, j) => (
                <td key={j} className="px-2 py-1.5 align-top text-gray-300">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Admin Setup ───────────────────────────────────────────────────────── */
function AdminDoc() {
  return (
    <>
      <Card title="1. Prerequisites">
        <Bullets
          items={[
            <><strong>Node.js 20+</strong> and npm.</>,
            <><strong>Docker + Docker Compose</strong> — for the one-command full-stack / Postgres path.</>,
            <><em>(Optional)</em> <strong>Ollama</strong> or an OpenAI-compatible runtime for live model evaluation.</>,
          ]}
        />
      </Card>

      <Card title="2. Choose How To Run It">
        <Table
          head={["Mode", "Use when", "URL"]}
          rows={[
            ["Docker Compose", "Realistic demo / shared env (Postgres)", <K>localhost:8080</K>],
            ["Full stack (dev)", "Local development (SQLite)", <K>localhost:5173</K>],
            ["Frontend only", "Quick offline preview (no login)", <K>localhost:5173</K>],
          ]}
        />
        <P><strong>Docker (recommended):</strong></P>
        <Code>docker compose up --build</Code>
        <P><strong>Full stack (dev):</strong></P>
        <Code>{`cd server
npm install
cp .env.example .env
npm run setup        # prisma generate + migrate deploy + seed
npm start            # API on :4000

# new terminal
npm install && npm run dev   # UI on :5173`}</Code>
      </Card>

      <Card title="3. Environment Variables (server/.env)">
        <Table
          head={["Variable", "Purpose", "Default"]}
          rows={[
            [<K>DATABASE_URL</K>, "Prisma connection string", <K>file:./dev.db</K>],
            [<K>PORT</K>, "API port", "4000"],
            [<K>CORS_ORIGIN</K>, "Allowed browser origin(s)", "localhost:5173"],
            [<K>JWT_SECRET</K>, <>Session signing secret — <strong>set in production</strong></>, "ephemeral"],
            [<K>NODE_ENV</K>, <><K>production</K> blocks demo seeding</>, "unset"],
            [<K>ALLOW_SEED</K>, "Allow seeding in production", "unset"],
            [<K>CHECKPOINT_TE_API_KEY</K>, "Check Point Threat Emulation", "mock"],
            [<K>CHECKPOINT_FILE_SCAN_API_KEY</K>, "Check Point TE File Scan", "mock"],
            [<K>LAKERA_GUARD_API_KEY</K>, "Lakera Guard", "mock"],
          ]}
        />
        <Note>Secrets are read at runtime, never hardcoded. In production, supply them via a secret store and terminate TLS so the <K>Secure</K> session cookies apply.</Note>
      </Card>

      <Card title="4. Database & Migrations">
        <Bullets
          items={[
            <>Apply migrations: <K>npm run db:migrate</K>. Seed demo data: <K>npm run db:seed</K>. <K>npm run setup</K> does generate + migrate + seed.</>,
            <><strong>Postgres:</strong> point <K>DATABASE_URL</K> at Postgres (the Docker path does this); the schema is provider-portable.</>,
          ]}
        />
      </Card>

      <Card title="5. First Admin & Demo Accounts">
        <P>Demo accounts (dev/seed only) — all use password <K>Demo!1234</K>:</P>
        <Table
          head={["Email", "Role"]}
          rows={[
            ["owner@imbsys.com", "Owner"],
            ["appsec@imbsys.com", "AppSec"],
            ["soc@imbsys.com", "SOC"],
            ["viewer@imbsys.com", "Viewer"],
          ]}
        />
        <P>In production, seeding is blocked — create the first Owner with the CLI:</P>
        <Code>{`cd server
npm run create:admin -- --email you@org.com --name "You" --password 'StrongPass!23'`}</Code>
        <P>Manage everyone else from <strong>Settings → User Management</strong>.</P>
      </Card>

      <Card title="6. Roles & Permissions">
        <Table
          head={["Role", "Can do"]}
          rows={[
            [<strong>Owner</strong>, "Everything, incl. integration toggles & user management"],
            [<strong>AppSec</strong>, "Edit controls, risks, models; run scans & inspections"],
            [<strong>SOC</strong>, "Edit risks/incidents; run scans & inspections; read elsewhere"],
            [<strong>Viewer</strong>, "Read-only"],
          ]}
        />
      </Card>

      <Card title="7. Integrations & Local LLM">
        <P>Integrations run in <strong>mock mode</strong> until keys are set; then they flip to <strong>live</strong> automatically (calls run server-side). To enable live local-model evaluation:</P>
        <Code>ollama pull llama3.2:1b</Code>
        <P>Then register a local model with endpoint <K>http://localhost:11434/api/generate</K> and click <strong>Evaluate</strong>.</P>
      </Card>

      <Card title="8. Production Hardening Checklist">
        <Bullets
          items={[
            <>Set a strong <K>JWT_SECRET</K> and <K>NODE_ENV=production</K>.</>,
            <>Terminate <strong>TLS</strong> in front of the API (enables <K>Secure</K> cookies).</>,
            <>Use managed <strong>Postgres</strong> with committed migrations + backups.</>,
            <>Replace demo accounts; create the real Owner via <K>create:admin</K>.</>,
            <>Lock <K>CORS_ORIGIN</K> to your real frontend origin.</>,
            <>Run <K>npm test</K> (frontend + server) and the score gate in CI.</>,
          ]}
        />
      </Card>
    </>
  );
}

/* ── Step-by-step Usage ────────────────────────────────────────────────── */
function Role({ children }: { children: ReactNode }) {
  return (
    <span className="ml-2 rounded border-l-2 border-accent bg-accent/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
      {children}
    </span>
  );
}
function UsageDoc() {
  return (
    <>
      <Note>Roles in tags indicate who can perform an action. <strong>Viewers</strong> see everything but editing/run actions are hidden. In <strong>Local mode</strong> (no backend) everything is enabled.</Note>

      <Card title="1. Sign In">
        <Steps items={[
          "Open the app and enter your email + password (or click a demo account).",
          "You land on the Dashboard; your role shows top-right. Your session is private (httpOnly cookie).",
        ]} />
      </Card>

      <Card title="2. Dashboard — Read Your Posture">
        <Bullets items={[
          "Top row: protected layers, open risks, critical gaps, active incidents.",
          "Vendor & model widgets: files scanned, malicious blocked, injections blocked, models covered, unguarded, high-risk.",
          "AI Security Score ring with its bonuses/penalties; Layer Posture, incidents, compliance status.",
        ]} />
        <P>Use the project selector (top-left) to switch projects; set a default in Settings.</P>
      </Card>

      <Card title="3. LLM Stack Map">
        <Steps items={[
          "Open LLM Stack Map; pan/zoom the defense-in-depth flow (nodes colored by status).",
          <>Click any node to open the inspector. <Role>Editors</Role> change status, owner, evidence, notes, or delete.</>,
        ]} />
      </Card>

      <Card title="4. Layer Assessment & Risk Register">
        <Steps items={[
          <><strong>Layer Assessment</strong> — set each control Not implemented → Planned → Implemented → Verified. <Role>AppSec / Owner</Role></>,
          <><strong>Risk Register</strong> — update a risk's status; expand to see mitigating controls + OWASP mapping. <Role>SOC / AppSec / Owner</Role></>,
          "The Dashboard AI Security Score updates live as posture changes.",
        ]} />
      </Card>

      <Card title="5. File Security Gateway — Scan A File">
        <Steps items={[
          "Pick an ingestion source and scan engine (Check Point Threat Emulation / TE File Scan).",
          "Drop a file — it's hashed locally and scanned.",
          <>Read the verdict; malicious/suspicious are <strong>blocked from retrieval</strong>. Open the evidence viewer or Retry. <Role>SOC / AppSec / Owner</Role></>,
        ]} />
        <Note>Demo tip: filenames containing <K>malware</K>, <K>.exe</K>, <K>macro</K>, or <K>invoice-</K> return bad verdicts.</Note>
      </Card>

      <Card title="6. Lakera Guard — Inspect A Prompt">
        <Steps items={[
          "Choose Input or Output stage; paste a prompt (or use a sample).",
          <>Click <strong>Send to Lakera Guard</strong> → risk score, decision (allow / block / redact / escalate), and violations; added to the Inspection Log. <Role>SOC / AppSec / Owner</Role></>,
        ]} />
      </Card>

      <Card title="7. Model Coverage — Register, Test & Evaluate">
        <Steps items={[
          <><strong>Register model</strong> — provider, deployment (hosted/local/custom), endpoint, environment, sensitivity, guardrails. <Role>AppSec / Owner</Role></>,
          <><strong>Test</strong> — confirms the endpoint is reachable (latency).</>,
          <><strong>Evaluate</strong> — runs an adversarial probe suite (injection, jailbreak, leakage, harmful, PII) and returns a resilience score with each probe's verdict and the model's real response.</>,
        ]} />
        <P>Evaluate a real local LLM:</P>
        <Code>{`ollama pull llama3.2:1b
# register endpoint http://localhost:11434/api/generate → Evaluate`}</Code>
      </Card>

      <Card title="8. Compliance & Reports">
        <Steps items={[
          <><strong>Compliance</strong> — review coverage across OWASP, NIST AI RMF, EU AI Act, ISO 42001, MITRE ATLAS; expand a requirement to see mapped controls; Export per-framework report.</>,
          <><strong>Report Generator</strong> — export the full assessment as Markdown or PDF.</>,
        ]} />
      </Card>

      <Card title="9. Settings">
        <Bullets items={[
          <><strong>Preferences</strong> — language, default project, notifications (saved to your account).</>,
          <><strong>User Management</strong> <Role>Owner</Role> — add users, change roles, reset passwords, delete (can't delete yourself or the last Owner).</>,
        ]} />
      </Card>

      <Card title="Quick Role Reference">
        <Table
          head={["Action", "Owner", "AppSec", "SOC", "Viewer"]}
          rows={[
            ["View everything", "✓", "✓", "✓", "✓"],
            ["Edit controls / models", "✓", "✓", "—", "—"],
            ["Edit risks / incidents", "✓", "✓", "✓", "—"],
            ["Run scans / inspections / evals", "✓", "✓", "✓", "—"],
            ["Toggle integrations", "✓", "—", "—", "—"],
            ["Manage users", "✓", "—", "—", "—"],
          ]}
        />
      </Card>
    </>
  );
}
