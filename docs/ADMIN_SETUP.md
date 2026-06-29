# Admin Setup Guide

AI Security Stack Mapper — installation, configuration, and administration.
Version 1.0.0.

---

## 1. Prerequisites

- **Node.js 20+** and npm
- **Docker + Docker Compose** (for the one-command full-stack / Postgres path)
- *(Optional)* **Ollama** or any OpenAI-compatible local LLM runtime, to use live
  model evaluation

---

## 2. Choose how to run it

### Option A — Docker Compose (recommended for a real demo)
One command brings up **Postgres + API + nginx-served frontend**:

```bash
docker compose up --build      # → http://localhost:8080
```

The API auto-applies the schema and seeds demo data. Tear down with
`docker compose down` (add `-v` to drop the database volume).

### Option B — Full stack, local dev (SQLite)
```bash
# 1) Backend
cd server
npm install
cp .env.example .env
npm run setup        # prisma generate + migrate deploy + seed
npm start            # API on http://localhost:4000

# 2) Frontend (separate terminal)
cd ..
npm install
npm run dev          # http://localhost:5173  (proxies /api → :4000)
```

### Option C — Frontend only (offline demo)
```bash
npm install && npm run dev     # http://localhost:5173
```
Runs entirely on seed data + in-browser mocks — the header shows **Local mode**
and no login is required.

---

## 3. Environment variables (`server/.env`)

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | Prisma connection string | `file:./dev.db` (SQLite) |
| `PORT` | API port | `4000` |
| `CORS_ORIGIN` | Allowed browser origin(s), comma-separated | `http://localhost:5173` |
| `JWT_SECRET` | Session signing secret — **set in production** | ephemeral (resets on restart) |
| `NODE_ENV` | `production` blocks demo seeding (see §5) | unset |
| `ALLOW_SEED` | `true` to allow seeding even in production | unset |
| `CHECKPOINT_TE_API_KEY` / `_BASE_URL` | Check Point Threat Emulation | mock if unset |
| `CHECKPOINT_FILE_SCAN_API_KEY` / `_BASE_URL` | Check Point TE File Scan | mock if unset |
| `LAKERA_GUARD_API_KEY` / `_BASE_URL` | Lakera Guard | mock if unset |

> Secrets are read at runtime and never hardcoded. In production, supply them via
> your platform's secret store and terminate TLS in front of the API so the
> `Secure` session cookies apply.

---

## 4. Database & migrations

- Schema lives in [`server/prisma/schema.prisma`](../server/prisma/schema.prisma);
  migrations are committed under `server/prisma/migrations/`.
- Apply migrations: `npm run db:migrate` (`prisma migrate deploy`).
- Seed demo data: `npm run db:seed`. `npm run setup` does generate + migrate + seed.
- **Postgres:** point `DATABASE_URL` at Postgres (the Docker path does this). The
  schema is provider-portable; generate Postgres migrations with
  `prisma migrate dev` against your Postgres instance for production.

---

## 5. First admin & demo accounts

**Demo accounts** (dev/seed only) — all use password `Demo!1234`:

| Email | Role |
| --- | --- |
| `owner@imbsys.com` | Owner |
| `appsec@imbsys.com` | AppSec |
| `soc@imbsys.com` | SOC |
| `viewer@imbsys.com` | Viewer |

**Production:** seeding is blocked when `NODE_ENV=production` (unless
`ALLOW_SEED=true`). Create your first **Owner** with the bootstrap CLI:

```bash
cd server
npm run create:admin -- --email you@org.com --name "You" --password 'StrongPass!23'
# or: ADMIN_EMAIL=you@org.com ADMIN_PASSWORD='StrongPass!23' npm run create:admin
```

The same command resets an existing user to Owner with a new password. After
that, manage everyone else from the in-app **Settings → User Management**.

---

## 6. Roles & permissions

| Role | Can do |
| --- | --- |
| **Owner** | Everything, incl. integration toggles and user management |
| **AppSec** | Edit controls, risks, models; run file scans & prompt inspections |
| **SOC** | Edit risks/incidents; run scans & inspections; read-only elsewhere |
| **Viewer** | Read-only |

Enforced server-side (`requirePerm` → 401/403) and mirrored in the UI.

---

## 7. Vendor integrations (mock → live)

Integrations run in **mock mode** until keys are configured (§3). Once a key +
base URL are set, the matching integration flips to **live** automatically and
calls run server-side (keys never reach the browser). Status is visible on the
**Integrations** page.

---

## 8. Local LLM evaluation (optional)

To run **live** model evaluation against a locally-installed LLM:

```bash
ollama pull llama3.2:1b        # any small model
```
Then in the app: **Model Coverage → Register model** with deployment **local**,
endpoint `http://localhost:11434/api/generate`, model name `llama3.2:1b`, and
click **Evaluate**. OpenAI-compatible runtimes (vLLM, LM Studio, LocalAI, TGI)
work too — use their `/v1/chat/completions` or `/v1/completions` endpoint.
Unreachable endpoints fall back to a simulated evaluation.

---

## 9. CI & the security-score gate

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs type-check, build,
unit + integration tests, and an **AI Security Score gate** that fails the build
below a threshold:

```bash
cd server
SCORE_MIN=60 SCORE_PROJECT=proj-copilot npm run score:gate
```

---

## 10. Production hardening checklist

- [ ] Set a strong `JWT_SECRET` and `NODE_ENV=production`.
- [ ] Terminate **TLS** in front of the API (enables `Secure` cookies).
- [ ] Use managed **Postgres** with committed migrations + backups.
- [ ] Replace demo accounts; create the real Owner via `create:admin`.
- [ ] Supply vendor keys from a secret store; confirm integrations show **live**.
- [ ] Lock `CORS_ORIGIN` to your real frontend origin.
- [ ] Run `npm test` (frontend + server) and the score gate in CI.

---

## 11. Tests

```bash
npm test                 # frontend unit (Vitest)
cd server && npm test    # backend unit + API integration
npm run test:e2e         # Playwright (needs: npx playwright install chromium)
```

---

## 12. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Login screen won't accept demo creds | DB not seeded — run `npm run db:seed` |
| Logged out after API restart | `JWT_SECRET` not set (ephemeral secret rotated) — set it |
| Header shows **Local mode** | Backend not reachable — start the API / check `CORS_ORIGIN` |
| Integration shows **mock** | No API key configured for that vendor (expected) |
| Evaluation says **simulated** | Model endpoint unreachable from the server |
| Docker API container exits | Check `docker compose logs api` (DB must be healthy first) |
