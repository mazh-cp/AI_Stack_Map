// Builds the branded "Configuration & Operating Instructions" HTML, reusing the
// shared style + Check Point logo from admin-setup.html.
import { readFileSync, writeFileSync } from "node:fs";

const admin = readFileSync(new URL("./admin-setup.html", import.meta.url), "utf8");
const style = admin.match(/<style>([\s\S]*?)<\/style>/)[1];
const logo = admin.match(/<svg[\s\S]*?<\/svg>/)[0];

const extra = `
  .part { background:#ee0c5d; color:#fff; padding:9px 16px; font-size:16px; font-weight:bold; margin:18px 0 14px; }
  .step { background:#f2f2f2; border-left:4px solid #ee0c5d; padding:2px 12px 2px; margin:9px 0; }
  .step h3 { color:#41273c; margin:8px 0 4px; }
  .exp { color:#b70d4e; font-size:10px; margin:4px 0 8px; }
  .exp b { color:#b70d4e; }
`;

const body = `
  <div class="callout">
    Follow the parts in order: <strong>A. Configure</strong> the platform once, then
    <strong>B. Operate</strong> it day to day, and use <strong>C. Maintenance</strong>
    for upkeep. Commands run from the project root unless a step says otherwise.
  </div>

  <div class="part">Part A &middot; Configuration (one-time setup)</div>

  <div class="step"><h3>A1. Check prerequisites</h3>
    <ul>
      <li><strong>Node.js 20+</strong> and npm; <strong>Docker + Docker Compose</strong> for the container path.</li>
      <li><em>(Optional)</em> <strong>Ollama</strong> or an OpenAI-compatible runtime for live model evaluation.</li>
    </ul>
    <p class="exp"><b>Verify:</b> <code>node -v</code> prints v20+; <code>docker --version</code> succeeds.</p>
  </div>

  <div class="step"><h3>A2. Choose a deployment mode</h3>
    <table>
      <tr><th>Mode</th><th>Use when</th><th>URL</th></tr>
      <tr><td>Docker Compose</td><td>Realistic demo / shared env (Postgres)</td><td>http://localhost:8080</td></tr>
      <tr><td>Full stack (dev)</td><td>Local development (SQLite)</td><td>http://localhost:5173</td></tr>
      <tr><td>Frontend only</td><td>Quick offline preview (no login)</td><td>http://localhost:5173</td></tr>
    </table>
  </div>

  <div class="step"><h3>A3. Configure the backend environment</h3>
    <pre>cd server
cp .env.example .env</pre>
    <p>Edit <code>server/.env</code> — minimum for a real deployment:</p>
    <pre>DATABASE_URL="postgresql://user:pass@host:5432/stackmapper"   # or file:./dev.db
PORT=4000
CORS_ORIGIN="https://your-frontend-origin"
JWT_SECRET="&lt;a long random string&gt;"
NODE_ENV=production
# Vendor keys (leave blank to stay in mock mode):
CHECKPOINT_TE_API_KEY=
LAKERA_GUARD_API_KEY=</pre>
    <p class="exp"><b>Note:</b> with <code>NODE_ENV=production</code>, demo accounts are NOT seeded — you create the admin in A5.</p>
  </div>

  <div class="step"><h3>A4. Initialize the database</h3>
    <pre>npm install
npm run setup        # prisma generate + migrate deploy + seed (dev)
# production (no demo data): npx prisma generate &amp;&amp; npx prisma migrate deploy</pre>
    <p class="exp"><b>Verify:</b> migrations apply with no error; (dev) seed prints "Seeded: …".</p>
  </div>

  <div class="step"><h3>A5. Create the first administrator</h3>
    <pre>npm run create:admin -- --email you@org.com --name "You" --password 'StrongPass!23'</pre>
    <p class="exp"><b>Expected:</b> "Created owner you@org.com." In dev you may instead use the demo Owner <code>owner@imbsys.com</code> / <code>Demo!1234</code>.</p>
  </div>

  <div class="step"><h3>A6. Start the services</h3>
    <p><strong>Docker (recommended):</strong></p>
    <pre>docker compose up --build      # → http://localhost:8080</pre>
    <p><strong>Or full stack (dev):</strong></p>
    <pre>cd server &amp;&amp; npm start         # API on :4000
# new terminal:
npm install &amp;&amp; npm run dev      # UI on :5173</pre>
  </div>

  <div class="step"><h3>A7. Verify the platform is up</h3>
    <pre>curl http://localhost:4000/api/health      # {"ok":true,...}</pre>
    <p class="exp"><b>Expected:</b> opening the app shows the login screen and the header reads <strong>Backend online</strong>.</p>
  </div>

  <div class="step"><h3>A8. (Optional) Connect vendor integrations &amp; local LLM</h3>
    <ol>
      <li>Set <code>CHECKPOINT_*</code> / <code>LAKERA_*</code> keys in <code>.env</code> and restart the API.</li>
      <li>On the <strong>Integrations</strong> page the connector should switch from <em>mock</em> to <strong>connected</strong>.</li>
      <li>For local model evaluation: <code>ollama pull llama3.2:1b</code>.</li>
    </ol>
  </div>

  <div class="part">Part B &middot; Operating the Application</div>

  <div class="step"><h3>B1. Sign in</h3>
    <p>Open the app, enter your credentials (or a demo account), and click <strong>Sign in</strong>.</p>
    <p class="exp"><b>Expected:</b> the Dashboard loads; your name + role appear top-right.</p>
  </div>

  <div class="step"><h3>B2. Set your preferences</h3>
    <p><strong>Settings → Preferences:</strong> choose language, default project, notifications. These save to your account.</p>
  </div>

  <div class="step"><h3>B3. Register your LLM models <span style="color:#b70d4e">(AppSec/Owner)</span></h3>
    <ol>
      <li><strong>Model Coverage → Register model</strong>.</li>
      <li>Set provider, deployment (hosted/local/custom), endpoint, environment, sensitivity, owner, use case.</li>
      <li>Toggle the guardrails that apply (input/output/tool/logging).</li>
    </ol>
    <p class="exp"><b>Expected:</b> the model appears as a card with a computed risk level.</p>
  </div>

  <div class="step"><h3>B4. Test &amp; evaluate a model</h3>
    <ol>
      <li>Click <strong>Test</strong> — confirms the endpoint is reachable (latency).</li>
      <li>Click <strong>Evaluate</strong> — runs adversarial probes (injection, jailbreak, leakage, harmful, PII).</li>
    </ol>
    <p class="exp"><b>Expected:</b> a resilience score (e.g., "100% resilient") with each probe's verdict and the model's real response. Unreachable endpoints return a <em>simulated</em> result.</p>
  </div>

  <div class="step"><h3>B5. Scan a file before it enters RAG <span style="color:#b70d4e">(SOC/AppSec/Owner)</span></h3>
    <ol>
      <li><strong>File Security Gateway</strong> → pick source + scan engine.</li>
      <li>Drop a file. Read the verdict; malicious/suspicious are blocked from retrieval.</li>
    </ol>
  </div>

  <div class="step"><h3>B6. Inspect a prompt <span style="color:#b70d4e">(SOC/AppSec/Owner)</span></h3>
    <p><strong>Lakera Guard</strong> → choose Input/Output, paste a prompt, <strong>Send</strong>. Review the risk score, decision, and violations; tune thresholds in the Policy panel.</p>
  </div>

  <div class="step"><h3>B7. Assess controls &amp; review risks</h3>
    <ol>
      <li><strong>Layer Assessment</strong> — mark each control Not implemented → Planned → Implemented → Verified.</li>
      <li><strong>Risk Register</strong> — update risk status; expand to see mitigating controls.</li>
    </ol>
    <p class="exp"><b>Expected:</b> the Dashboard AI Security Score updates as posture changes.</p>
  </div>

  <div class="step"><h3>B8. Check compliance &amp; generate reports</h3>
    <ol>
      <li><strong>Compliance</strong> — review coverage across OWASP, NIST AI RMF, EU AI Act, ISO 42001, MITRE ATLAS; <strong>Export report</strong> per framework.</li>
      <li><strong>Report Generator</strong> — export the full assessment as Markdown or PDF.</li>
    </ol>
  </div>

  <div class="step"><h3>B9. Administer users <span style="color:#b70d4e">(Owner)</span></h3>
    <p><strong>Settings → User Management</strong>: <strong>Add user</strong>, change roles inline, reset passwords, or delete. You can't delete yourself or the last Owner.</p>
  </div>

  <div class="part">Part C &middot; Maintenance &amp; Operations</div>

  <div class="step"><h3>C1. Enforce the security-score gate (CI)</h3>
    <pre>cd server
SCORE_MIN=60 SCORE_PROJECT=proj-copilot npm run score:gate</pre>
    <p class="exp"><b>Result:</b> exits non-zero (fails the pipeline) if the project's score is below the threshold.</p>
  </div>

  <div class="step"><h3>C2. Back up &amp; restore data</h3>
    <ul>
      <li><strong>Postgres:</strong> <code>pg_dump</code> / <code>pg_restore</code> the database; the Docker volume is <code>pgdata</code>.</li>
      <li><strong>SQLite (dev):</strong> copy <code>server/prisma/dev.db</code>.</li>
    </ul>
  </div>

  <div class="step"><h3>C3. Update / re-deploy</h3>
    <pre>git pull
cd server &amp;&amp; npm install &amp;&amp; npx prisma migrate deploy   # apply new migrations
docker compose up --build -d                              # or restart the services</pre>
  </div>

  <div class="step"><h3>C4. Run tests &amp; stop the stack</h3>
    <pre>npm test &amp;&amp; (cd server &amp;&amp; npm test)      # verify before shipping
docker compose down                       # stop (add -v to drop the DB volume)</pre>
  </div>
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Configuration &amp; Operating Instructions — AI Security Stack Mapper</title>
<style>${style}${extra}</style>
</head>
<body>
  <div class="cover">
    <div>
      ${logo}
      <div class="eyebrow">AI Security Stack Mapper</div>
      <h1>Configuration &amp; Operating Instructions</h1>
      <div class="sub">Step-by-step: configure, run &amp; operate the platform</div>
    </div>
    <div class="ver"><span class="tag">v1.0.0</span><br />June 2026</div>
  </div>
  <div class="wrap">${body}</div>
  <div class="footer">
    <span>Check Point Software Technologies — AI Security Stack Mapper</span>
    <span>Configuration &amp; Operating Instructions · v1.0.0 · Confidential</span>
  </div>
</body>
</html>`;

writeFileSync(new URL("./operating-instructions.html", import.meta.url), html);
console.log("built operating-instructions.html (" + html.length + " bytes)");
