# Configuration & Operating Instructions

Step-by-step: configure, run, and operate the AI Security Stack Mapper. v1.1.0.
Run commands from the project root unless a step says otherwise.

---

## Part A — Configuration (one-time setup)

**A1. Check prerequisites** — Node.js 20+, npm; Docker + Docker Compose for the
container path. *(Optional)* Ollama / OpenAI-compatible runtime for live model
evaluation. *Verify:* `node -v` ≥ 20, `docker --version` works.

**A2. Choose a deployment mode**

| Mode | Use when | URL |
| --- | --- | --- |
| Docker Compose | Realistic demo / shared env (Postgres) | http://localhost:8080 |
| Full stack (dev) | Local development (SQLite) | http://localhost:5173 |
| Frontend only | Quick offline preview (no login) | http://localhost:5173 |

**A3. Configure the backend environment**
```bash
cd server
cp .env.example .env
```
Edit `server/.env` (minimum for a real deployment):
```
DATABASE_URL="postgresql://user:pass@host:5432/stackmapper"   # or file:./dev.db
PORT=4000
CORS_ORIGIN="https://your-frontend-origin"
JWT_SECRET="<a long random string>"
NODE_ENV=production
CHECKPOINT_TE_API_KEY=        # blank → mock mode
LAKERA_GUARD_API_KEY=
```
> With `NODE_ENV=production`, demo accounts are **not** seeded — create the admin in A5.

**A4. Initialize the database**
```bash
npm install
npm run setup        # dev: prisma generate + migrate deploy + seed
# production (no demo data): npx prisma generate && npx prisma migrate deploy
```

**A5. Create the first administrator**
```bash
npm run create:admin -- --email you@org.com --name "You" --password 'StrongPass!23'
```
*Dev shortcut:* demo Owner `owner@imbsys.com` / `Demo!1234`.

**A6. Start the services**
```bash
docker compose up --build          # → http://localhost:8080
# or full stack:
cd server && npm start             # API :4000
npm install && npm run dev         # UI :5173 (separate terminal)
```

**A7. Verify** — `curl http://localhost:4000/api/health` → `{"ok":true}`; the app
shows the login screen and the header reads **Backend online**.

**A8. (Optional) Integrations & local LLM** — set `CHECKPOINT_*` / `LAKERA_*` keys
and restart (Integrations page flips to **connected**); `ollama pull llama3.2:1b`
for live evaluation.

---

## Part B — Operating the application

1. **Sign in** → Dashboard loads; role shown top-right.
2. **Settings → Preferences** — language, default project, notifications (saved to your account).
3. **Model Coverage → Register model** *(AppSec/Owner)* — provider, deployment, endpoint, guardrails.
4. **Test** (reachability) then **Evaluate** (adversarial probes → resilience score with real responses).
5. **File Security Gateway** *(SOC/AppSec/Owner)* — scan a file; malicious/suspicious are blocked from RAG.
6. **Lakera Guard** *(SOC/AppSec/Owner)* — inspect a prompt; review score/decision/violations.
7. **Layer Assessment** — set control maturity; **Risk Register** — update risk status. The score updates live.
8. **Compliance** — review framework coverage + export; **Report Generator** — export the full assessment (MD/PDF).
9. **Settings → User Management** *(Owner)* — add users, change roles, reset passwords, delete.

---

## Part C — Maintenance & operations

- **Score gate (CI):** `cd server && SCORE_MIN=60 npm run score:gate` — fails below threshold.
- **Backup/restore:** Postgres via `pg_dump`/`pg_restore` (Docker volume `pgdata`); SQLite by copying `server/prisma/dev.db`.
- **Update/redeploy:** `git pull` → `npm install && npx prisma migrate deploy` → `docker compose up --build -d`.
- **Test & stop:** `npm test && (cd server && npm test)`; `docker compose down` (`-v` drops the DB volume).
