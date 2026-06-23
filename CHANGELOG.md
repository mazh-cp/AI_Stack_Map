# Changelog

## 1.0.0 — 2026-06-23

First full release of the **AI Security Stack Mapper** — map, assess, and secure
every layer of an LLM application stack.

### Core application
- Dashboard with live **AI Security Score** (weighted coverage + bonuses/penalties),
  protected layers, open risks, critical gaps, incidents, and vendor/model widgets.
- **Interactive LLM Stack Map** (React Flow) across 13 defense-in-depth zones,
  color-coded by status, with a click-to-inspect detail panel.
- **Layer Assessment**, **Risk Register** (OWASP LLM Top 10), **Control Library**,
  and a drag-and-drop **Architecture Builder**.
- **Report Generator** — executive report export as Markdown or PDF.

### Vendor & security integrations (mock-first, env-ready)
- **Check Point Threat Emulation** and **TE File Scan** — File Security Gateway
  with verdicts, evidence viewer, retry, and block-from-RAG.
- **Lakera Guard** — prompt firewall with risk score, decision (allow/block/
  redact/escalate), policy panel, and inspection log.
- **Model Coverage** for hosted & local LLMs, incl. local-LLM controls.

### Local LLM testing & evaluation
- Server-side connector for **Ollama** and **OpenAI-compatible** runtimes.
- **Connection test** and **adversarial security evaluation** (prompt injection,
  system-prompt leakage, jailbreak, harmful-content, PII) with a resilience
  score; simulated fallback when no endpoint is reachable.

### Compliance
- Coverage across **OWASP LLM Top 10, NIST AI RMF, EU AI Act, ISO/IEC 42001,
  MITRE ATLAS**, mapped to controls, with per-framework Markdown reports.

### Backend & platform
- **Express + Prisma** API (SQLite for dev, **Postgres** via Docker Compose),
  REST + `/api/bootstrap`, server-side integration endpoints, committed
  **migrations**, and a seed dataset.
- **Auth & RBAC** — httpOnly cookie sessions (access + refresh), four roles
  (Owner/AppSec/SOC/Viewer) enforced server-side and mirrored in the UI.
- **Settings** — user management (owner) + per-user, server-stored preferences.
- **Hardening** — helmet, CORS w/ credentials, zod request validation,
  login rate-limiting, prod-gated demo seeding, first-admin bootstrap CLI.

### Quality & ops
- **Tests** — Vitest unit (score, RBAC, frameworks, serialize), supertest
  integration (auth/RBAC/validation/rate-limit), Playwright e2e.
- **CI** — type-check + build + tests + an **AI Security Score gate**.
- **Docker Compose** one-command stack (Postgres + API + nginx).

### UI / theme
- Clean, professional light theme (alabaster + cool-gray + slate + teal CTA),
  code-split bundles, responsive sidebar, accessibility pass, and i18n (EN/ES).
