# Usage Guide

A step-by-step walkthrough of the AI Security Stack Mapper. Version 1.0.0.

> Roles in brackets indicate who can perform an action. **Viewers** can see
> everything but editing/run actions are hidden or disabled. In **Local mode**
> (no backend) everything is enabled for a single user.

---

## 1. Sign in

1. Open the app (`http://localhost:5173` in dev, `http://localhost:8080` via Docker).
2. Enter your email + password, or click a **demo account** (password `Demo!1234`).
3. You land on the **Dashboard**. Your session is private (httpOnly cookie); your
   role appears top-right. Sign out from the account menu.

---

## 2. Dashboard — read your posture

- **Top row:** protected layers, open risks, critical gaps, active incidents.
- **Vendor Protection & Model Coverage:** files scanned, malicious blocked,
  injections blocked, models covered, local protected, unguarded, high-risk.
- **AI Security Score** ring with the bonuses/penalties that produced it.
- **Layer Posture** bars and **Recent Incidents** / **Compliance Status**.

Use the **project selector** (top-left) to switch projects; pick a default in
Settings.

---

## 3. LLM Stack Map — see the architecture

1. Open **LLM Stack Map**.
2. Pan/zoom the defense-in-depth flow; nodes are colored by status.
3. **Click any node** to open the inspector. *(Editors)* change status, owner,
   evidence link, notes, or delete the control.

---

## 4. Layer Assessment — mark maturity

1. Open **Layer Assessment**.
2. For each control, set **Not implemented → Planned → Implemented → Verified**
   *(AppSec/Owner)*. Per-layer coverage % updates instantly, and the score
   recalculates.

---

## 5. Risk Register — track threats

1. Open **Risk Register**.
2. Filter by severity; expand a risk to see mitigating controls + OWASP mapping.
3. *(SOC/AppSec/Owner)* change a risk's **status** (Open → Mitigating →
   Mitigated / Accepted).

---

## 6. Control Library & Architecture Builder

- **Control Library** — browse/filter all controls; *(AppSec/Owner)* **Add
  control** or change status inline.
- **Architecture Builder** — *(AppSec/Owner)* drag controls from the palette onto
  the canvas and arrange them; click a node to edit details.

---

## 7. File Security Gateway — scan a file *(SOC/AppSec/Owner)*

1. Open **File Security Gateway**.
2. Choose an **ingestion source** and **scan engine** (Check Point Threat
   Emulation / TE File Scan).
3. **Drop a file** (or click to browse). It's hashed locally and scanned.
4. Read the **verdict** (clean / suspicious / malicious / unknown); malicious &
   suspicious files are **blocked from retrieval**. Open the **evidence viewer**
   or **Retry** as needed.
   - *Demo tip:* filenames containing `malware`, `.exe`, `macro`, or `invoice-`
     return bad verdicts so blocking is demonstrable.

---

## 8. Lakera Guard — inspect a prompt *(SOC/AppSec/Owner)*

1. Open **Lakera Guard**.
2. Pick **Input** or **Output** stage, paste a prompt (or use a sample).
3. Click **Send to Lakera Guard**. You get a **risk score**, **decision**
   (allow / block / redact / escalate), and violation categories; it's added to
   the **Inspection Log**. Tune thresholds in the **Policy** panel.

---

## 9. Model Coverage — register, test & evaluate a model

1. Open **Model Coverage**.
2. *(AppSec/Owner)* **Register model** — provider, deployment (hosted/local/
   custom), endpoint, environment, sensitivity, owner, use case. For **local**
   models you also get network-isolation / internet-access / integrity controls.
3. Toggle guardrails (input/output/tool/logging); per-model **risk level** updates.
4. **Test** — checks the endpoint is reachable (latency).
5. **Evaluate** *(AppSec/Owner)* — runs an adversarial probe suite (prompt
   injection, system-prompt leakage, jailbreak, harmful content, PII) against the
   model and reports a **resilience score** with each probe's verdict and the
   model's actual response. Unreachable endpoints produce a **simulated** result.

**Evaluate a real local LLM (Ollama):**
```bash
ollama pull llama3.2:1b
```
Register a local model with endpoint `http://localhost:11434/api/generate` and
model name `llama3.2:1b`, then click **Evaluate** to see live results.

---

## 10. Integrations

Open **Integrations** to see each vendor connector's **status** (mock / connected),
auth method, base URL, and protected layers. *(Owner)* enable/disable a connector.
The **API Key Configuration** panel lists the environment variables to switch to
live mode.

---

## 11. Compliance — frameworks & reports

1. Open **Compliance**.
2. Pick a framework card — **OWASP LLM Top 10, NIST AI RMF, EU AI Act, ISO/IEC
   42001, MITRE ATLAS**. Each shows coverage %, and covered/partial/gap counts.
3. Expand a requirement to see the **controls mapped** to it and their status.
4. **Export report** downloads a per-framework Markdown compliance report.

---

## 12. Report Generator

Open **Report Generator** for the full assessment (executive summary, architecture
overview, layer findings, control status, gaps, remediation plan). Export as
**Markdown** or **PDF** (Print).

---

## 13. Settings

- **Profile & Session** — your name, email, role, and session info.
- **Preferences** — language, default project, notifications. These save to **your
  account** and follow you across devices/sessions.
- **User Management** *(Owner only)* —
  1. Click **Add user** → email, name, role, temporary password → **Create**.
  2. Change a user's **role** inline, **reset password** (key icon), or **delete**
     (trash icon). You can't delete yourself or the last Owner.

---

## Quick role reference

| Action | Owner | AppSec | SOC | Viewer |
| --- | :---: | :---: | :---: | :---: |
| View everything | ✅ | ✅ | ✅ | ✅ |
| Edit controls / models | ✅ | ✅ | — | — |
| Edit risks / incidents | ✅ | ✅ | ✅ | — |
| Run file scans / prompt inspections / model evals | ✅ | ✅ | ✅ | — |
| Toggle integrations | ✅ | — | — | — |
| Manage users | ✅ | — | — | — |
