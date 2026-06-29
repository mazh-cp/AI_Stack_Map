# AI Security Stack Mapper

A cybersecurity architecture dashboard that helps teams **map, assess, and secure every layer of an LLM application stack** — input, retrieval, secrets, model, tools, output, delivery, and monitoring. It visualizes an LLM application as a defense-in-depth diagram, showing how prompts flow through security controls, where attacks happen, and which controls mitigate each risk.

![SOC dashboard](public/shield.svg)

## Tech stack

- **React 18 + TypeScript** (Vite)
- **Tailwind CSS + DaisyUI** — clean, professional light theme: soft alabaster (`#F9FAFB`) background, cool-gray (`#F3F4F6`) cards, slate (`#374151`) text, teal (`#4EB5A9`) CTA
- **React Flow** — interactive architecture diagram & drag-and-drop builder
- **Zustand** (with `persist`) — state + localStorage persistence
- **lucide-react** — icons

## Screens

| Route | Screen | What it does |
| --- | --- | --- |
| `/` | **Dashboard** | Overall AI security score, protected layers, open risks, critical gaps, recent incidents, OWASP compliance status |
| `/stack-map` | **LLM Stack Map** | Interactive React Flow diagram of the 8 defense-in-depth zones; color-coded by control status; click a node to inspect |
| `/assessment` | **Layer Assessment** | Mark every control as Not implemented / Planned / Implemented / Verified |
| `/risks` | **Risk Register** | Prompt injection, jailbreaks, data leakage, unsafe tool execution, retrieval poisoning, secret exposure, insecure output, missing audit logs |
| `/controls` | **Control Library** | Controls mapped to the OWASP Top 10 for LLM Apps; filter by layer/status/OWASP; add controls |
| `/builder` | **Architecture Builder** | Drag controls from a palette onto the canvas; arrange and edit them in the inspector |
| `/compliance` | **Compliance Frameworks** | Coverage across OWASP LLM Top 10, NIST AI RMF, EU AI Act, ISO/IEC 42001 & MITRE ATLAS — requirement-level status mapped to your controls, with per-framework Markdown export |
| `/file-gateway` | **File Security Gateway** | Upload/ingest files → scan with Check Point Threat Emulation / TE File Scan → verdict, hash, evidence viewer, retry, block-from-RAG |
| `/lakera` | **Lakera Guard** | Prompt firewall: inspect prompts/outputs for injection, jailbreak, leakage; risk score, decision (allow/block/redact/escalate), policy panel, inspection log |
| `/models` | **LLM Coverage Management** | Register hosted & local LLMs (OpenAI, Azure, Anthropic, Gemini, Llama, Mistral, Cohere, local runtimes); guardrail toggles, local-LLM controls, per-model risk; **live connection test** + **adversarial security evaluation** |
| `/integrations` | **Integrations** | Vendor integration status, enable toggles, supported layers, env-var configuration |
| `/report` | **Report Generator** | Executive summary, architecture diagram, layer findings, control status, critical gaps, remediation plan — export as **Markdown** or **PDF** (print) |
| `/settings` | **Settings** | Per-user profile, preferences (language, default project, notifications — saved to the account); **owners** also get user management (create/edit-role/reset-password/delete) |

## Vendor & security integrations

All integrations are **mock-first** and **env-var ready** — they return synthetic
responses until real credentials are supplied, and never hardcode keys.

| Integration | Purpose | Service |
| --- | --- | --- |
| **Check Point Threat Emulation** | Sandbox-detonate suspicious files before they reach the RAG pipeline | [`checkpointThreatEmulationService.ts`](src/services/checkpointThreatEmulationService.ts) |
| **Check Point TE File Scan** | File reputation + AV/sandbox analysis for documents & attachments | [`checkpointFileScanService.ts`](src/services/checkpointFileScanService.ts) |
| **Lakera Guard** | Prompt/response screening for injection, jailbreak, unsafe content, leakage | [`lakeraGuardService.ts`](src/services/lakeraGuardService.ts) |
| **LLM Coverage** | Per-model posture, connection test, risk derivation | [`llmCoverageService.ts`](src/services/llmCoverageService.ts) |

### Configuration

Copy `.env.example` and set keys to switch an integration out of mock mode:

```
CHECKPOINT_TE_API_KEY / CHECKPOINT_TE_BASE_URL
CHECKPOINT_FILE_SCAN_API_KEY / CHECKPOINT_FILE_SCAN_BASE_URL
LAKERA_GUARD_API_KEY / LAKERA_GUARD_BASE_URL
```

**Security:** keys are read from env at runtime, never committed, and all live
calls use HTTPS. In this Vite frontend only `VITE_`-prefixed vars reach the
browser — for production, proxy these calls through a backend that holds the
unprefixed secrets server-side. See [`src/services/config.ts`](src/services/config.ts).

## Security score

The score (0–100) combines weighted control coverage with targeted penalties for the
highest-impact gaps:

- Implemented & verified controls (weighted credit)
- Unresolved **critical** risks
- Missing SIEM / audit logging
- Missing output moderation (content moderation / PII redaction)
- Missing tool restrictions (allow-list / least privilege)
- Missing secrets management (vault)

It also rewards vendor protections and a healthy model posture, and penalizes gaps:
**bonuses** for Check Point file scanning, Lakera Guard input/output protection,
fully-guardrailed production models, network-isolated local LLMs, and per-model
tool restriction; **penalties** for files entering RAG unscanned, models missing
input/output guardrails or logging, and local LLMs with internet access or
unrestricted tools.

See [`src/lib/score.ts`](src/lib/score.ts).

## Data model

Entities in [`src/types/index.ts`](src/types/index.ts): `Project`, `StackLayer`,
`SecurityControl`, `Risk`, `Assessment`, `Evidence`, `Incident`, `ComplianceMapping`,
plus the integration layer: `Integration`, `ModelCoverage`, `FileScan`, `PromptInspection`.

Demo data lives in [`src/data/seed.ts`](src/data/seed.ts) and seeds the app on first load.

## Documentation

- **[Admin Setup Guide](docs/ADMIN_SETUP.md)** — install, configure, deploy, first admin, hardening.
- **[Usage Guide](docs/USAGE_GUIDE.md)** — step-by-step walkthrough of every screen, by role.
- **[Executive Summary](EXECUTIVE_SUMMARY.md)** ([PDF](docs/AI-Security-Stack-Mapper-Executive-Summary.pdf)) — problem, solution, flow.
- **[Changelog](CHANGELOG.md)** — release notes (current: **v1.1.0**).

## Run

### Frontend only (local-first, offline)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

The app runs fully standalone against seed data and in-browser mock services —
the header shows **Local mode**.

### Full stack (frontend + backend)

```bash
# 1) Backend — Express + Prisma + SQLite
cd server
npm install
cp .env.example .env
npm run setup        # prisma generate + migrate deploy + seed
npm start            # API on http://localhost:4000

# 2) Frontend (in another terminal)
cd ..
npm run dev          # http://localhost:5173 (proxies /api → :4000)
```

### One-command demo (Docker Compose — Postgres + API + nginx)

```bash
docker compose up --build       # → http://localhost:8080
```

Brings up **Postgres**, the **API** (auto-pushes schema + seeds), and the
**nginx-served frontend** (which proxies `/api`). Cookies are non-secure over
plain HTTP here; for real deployment terminate TLS and set `NODE_ENV=production`
(cookies become `Secure`). Tear down with `docker compose down` (add `-v` to drop
the database volume).

With the backend running, the header shows **Backend online**: the app hydrates
from the API and mirrors mutations server-side. Vendor calls (file scan, prompt
inspect) execute on the server so API keys never reach the browser.

## Authentication & RBAC

When the backend is online the app requires sign-in (JWT, bcrypt-hashed
passwords). Four demo accounts are seeded — all use password **`Demo!1234`**:

| Email | Role | Can do |
| --- | --- | --- |
| `owner@imbsys.com` | **Owner** | Everything (incl. integration toggles, admin) |
| `appsec@imbsys.com` | **AppSec** | Edit controls, risks, models; run scans/inspections |
| `soc@imbsys.com` | **SOC** | Edit risks/incidents; run scans/inspections; read-only elsewhere |
| `viewer@imbsys.com` | **Viewer** | Read-only |

Permissions are enforced **server-side** (`requirePerm` middleware → 401/403) and
mirrored in the UI (actions hidden/disabled by role). In **Local mode** (backend
offline) there is no login — it's a standalone single-user demo.

**Users & per-user settings.** Owners manage users from **Settings** (`/api/users`
CRUD, `users:manage` permission, guards against deleting yourself or the last
owner). Every user has a private session (httpOnly cookies) and **server-stored
preferences** (`/api/users/me/settings` — language, default project,
notifications) that follow the account across devices rather than living in the
browser.

**Session security:** JWTs are delivered as **httpOnly cookies** (access +
refresh), so tokens are never readable by JavaScript (XSS-safe); the client
transparently refreshes on expiry. Set `JWT_SECRET` in `server/.env` for stable
sessions (otherwise an ephemeral secret is generated — no secret is ever
hardcoded). See [`server/src/auth.ts`](server/src/auth.ts).

**Hardening:** the API uses `helmet` security headers, tightened CORS (with
credentials), **zod request validation** on every mutating route
([`server/src/validation.ts`](server/src/validation.ts)), and **rate-limited
login**. Demo seeding is blocked in `NODE_ENV=production` unless `ALLOW_SEED=true`.

## Local LLM testing & evaluation

Registered models can be **tested and security-evaluated** directly from Model
Coverage. The backend connector ([`server/src/localLlm.ts`](server/src/localLlm.ts))
calls the model's endpoint server-side (so it can reach `localhost` / internal
IPs the browser can't) and supports **Ollama** (`/api/generate`, `/api/chat`)
and **OpenAI-compatible** runtimes (vLLM, LM Studio, LocalAI, TGI —
`/v1/chat/completions`, `/v1/completions`).

- **Test** (`POST /api/models/:id/test`) — live reachability + latency.
- **Evaluate** (`POST /api/models/:id/evaluate`) — fires an adversarial probe
  suite (prompt injection, system-prompt leakage, jailbreak, harmful-content,
  PII fabrication) at the model, classifies each response as **resilient**
  (refused / no disallowed output) or **vulnerable** (complied), and returns a
  resilience score. The latest summary is stored on the model.
- If the endpoint isn't reachable, the evaluation falls back to a **simulated**
  result derived from the model's configured guardrails, so the feature is
  demonstrable without a running model.

**Try it live with Ollama:**

```bash
ollama pull llama3.2:1b          # any small model
# Register a model in the UI with endpoint http://localhost:11434/api/generate
# and model name "llama3.2:1b", then click Evaluate.
```

## Compliance frameworks

Beyond OWASP LLM Top 10, the **Compliance** page maps your control assessment to
**NIST AI RMF**, the **EU AI Act** (high-risk obligations), **ISO/IEC 42001**, and
**MITRE ATLAS**. Each framework's requirements are mapped to existing controls
(by id, OWASP category, or layer), and coverage is derived from control status —
so one assessment drives every framework's report. Each framework exports a
Markdown compliance report. See [`src/lib/frameworks.ts`](src/lib/frameworks.ts).

## Frontend quality

- **Code-split** — routes are lazy-loaded; the initial bundle is ~233 kB (gzip
  ~73 kB) and React Flow loads only on the map/builder routes.
- **Responsive** — the sidebar collapses to a drawer + hamburger on small screens.
- **i18n** — a lightweight provider ([`src/i18n`](src/i18n)) with a language
  switcher (English / Español); new strings convert by wrapping in `t()`.
- **Accessibility** — skip-to-content link, ARIA labels on icon-only buttons,
  and `role="alert"`/`status` on toasts.

## Testing

```bash
npm test                 # frontend unit tests (Vitest)
cd server && npm test    # backend unit + API integration tests (Vitest + supertest)
npm run test:e2e         # Playwright e2e (needs: npx playwright install chromium)
```

- **Unit** — score engine, RBAC `can()` matrix, JSON serialize layer, framework
  coverage engine.
- **Integration** — login/refresh, 401 without cookie, 403 for a viewer write,
  validation 400s, rate-limit 429 (via supertest against the exported app).
- **E2E** — login → navigate Dashboard → Risk Register → Compliance.

## Database migrations

The dev database uses **committed Prisma migrations** (`prisma/migrations/`).
`npm run setup` runs `prisma migrate deploy` + seed; CI does the same. (The
Docker/Postgres path uses `prisma db push` for provider portability — generate
Postgres migrations with `prisma migrate dev` against Postgres for production.)

## CI: AI Security Score gate

A CI job fails the build when a project's score drops below a threshold:

```bash
cd server
SCORE_MIN=60 SCORE_PROJECT=proj-copilot npm run score:gate   # exits non-zero if below
```

Score logic is computed server-side ([`server/src/score.ts`](server/src/score.ts),
a faithful port of the frontend engine) and exposed at `GET /api/score?projectId=…`.
The [GitHub Actions workflow](.github/workflows/ci.yml) type-checks + builds the
frontend and runs the gate against a freshly seeded database.

## Architecture & persistence

- **Local-first.** The Zustand store persists to `localStorage` and works
  offline. On startup it calls `hydrate()` → `GET /api/bootstrap`; if the backend
  is unreachable it stays on local data. Mutations apply locally first, then sync
  to the backend when online.
- **Backend** ([`server/`](server)): Express REST API + Prisma over SQLite.
  Generic CRUD for all resources, `/api/bootstrap`, and server-side integration
  endpoints (`/api/file-scans/scan`, `/api/prompt-inspections/inspect`) that hold
  vendor keys server-side. See [`server/src/index.ts`](server/src/index.ts).
- The data model in [`server/prisma/schema.prisma`](server/prisma/schema.prisma)
  mirrors the frontend domain types; swap SQLite for Postgres by changing the
  datasource.
