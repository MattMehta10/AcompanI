# AcompanI — Comprehensive Feature Checklist & End-to-End User Testing Guide

> **Autonomous Hierarchical Multi-Agent Organization Operating System**  
> *Verification Date:* November 2026 • *Build Status:* **ALL SYSTEMS GREEN (9/9 Evals Passed, 100% Core Verification)**

---

## 📋 Master System Feature Checklist

| # | System Subsystem | Feature Description | Automated Status | UI Status |
|---|---|---|:---:|:---:|
| **1** | **Brand & Visuals** | Logo (`logo.webp`) without bounding boxes/card borders | ✅ VERIFIED | ✅ ACTIVE |
| **2** | **Brand Typography** | Unified `<span class="brand-text">AcompanI</span>` (0px gap between A, compan, I) | ✅ VERIFIED | ✅ ACTIVE |
| **3** | **Color Theme** | Electric Cyber Persimmon (`#EA5F2D`) on pitch black (`#000000`) | ✅ VERIFIED | ✅ ACTIVE |
| **4** | **3D Constellation** | Orbital satellite nodes (`Eng`, `Sales`, `Fin`, `Llama 3.3 70B`) + Particle Web | ✅ VERIFIED | ✅ ACTIVE |
| **5** | **Org Architect** | Dynamic LLM-driven organizational DAG synthesis (`/api/org/generate`) | ✅ VERIFIED | ✅ ACTIVE |
| **6** | **Runtime Deploy** | Direct org chart compilation to LangGraph StateGraph (`/api/org/deploy`) | ✅ VERIFIED | ✅ ACTIVE |
| **7** | **Interactive DAG** | Pan, zoom (`+`, `−`, `Fit`), node inspection, and dynamic edge rendering | ✅ VERIFIED | ✅ ACTIVE |
| **8** | **Casbin RBAC** | Strict deny-by-default role-to-tool permission boundary (`/api/tools/test`) | ✅ VERIFIED | ✅ ACTIVE |
| **9** | **HITL Quarantine** | Human-in-the-loop approval workflow for high-risk tools (`deploy_service`) | ✅ VERIFIED | ✅ ACTIVE |
| **10** | **ChromaDB RAG** | Department-partitioned vector memory (`engineering`, `sales`, `finance`) | ✅ VERIFIED | ✅ ACTIVE |
| **11** | **Tenant Isolation** | RAG query scope isolation (Sales/Eng blocked from reading payroll secrets) | ✅ VERIFIED | ✅ ACTIVE |
| **12** | **Task Pipeline** | Hierarchical supervisor-worker execution with tiered cost routing (`/api/tasks`)| ✅ VERIFIED | ✅ ACTIVE |
| **13** | **Red-Team Probes** | Automated 3-stage security exploit simulator (`/api/security/probe`) | ✅ VERIFIED | ✅ ACTIVE |
| **14** | **Governance Seal** | Cryptographic compliance certificate with printable audit modal (`/cert`) | ✅ VERIFIED | ✅ ACTIVE |
| **15** | **Telemetry Stream** | Real-time structured audit logs with time-filtering and sync (`/api/audit/logs`) | ✅ VERIFIED | ✅ ACTIVE |
| **16** | **Command Palette** | Global keyboard shortcut `Ctrl + K` with instant command search | ✅ VERIFIED | ✅ ACTIVE |

---

## 🧪 Step-by-Step User Testing Follow-Along Guide

Follow these steps directly in your web browser (`http://127.0.0.1:8000`) to test and demonstrate every feature as an end-user.

### Prerequisites: Start the Platform
In your terminal, execute:
```powershell
.\run_acompani.ps1
```
*(Or run `.\.venv\Scripts\uvicorn.exe api.main:app --host 127.0.0.1 --port 8000 --reload`)*.  
Then open your browser to **`http://127.0.0.1:8000`**.

---

### Phase 1: Public Showcase & Branding Inspection
1. **Check the Brand & Logo:**
   - Look at the top-left navbar: Notice the custom **AcompanI emblem** glowing with a subtle persimmon reflection.
   - Verify that **A** and **I** in **`AcompanI`** are orange (`#EA5F2D`), while `compan` is clean white, with **no gap** between the letters.
2. **Hero 3D Orbital Constellation:**
   - Observe the center of the hero section: The transparent metallic emblem rotates seamlessly in the center with zero outer borders or square card boxes.
   - Move your mouse across the canvas: Watch the interactive ember particle web link and track your cursor.
3. **Interactive Mini-Simulator:**
   - Scroll down to the **Interactive Organization Simulator** card.
   - Click the preset chips: **`B2B SaaS`**, **`E-Commerce`**, or **`FinTech`**.
   - Click **`Synthesize Org Chart`**: Watch the roles dynamically populate in the window.
   - Click **`Animate Delegation`**: Watch the live step-by-step trace waterfall execute from Router to Worker.
4. **Interactive ROI Calculator:**
   - Scroll down to **Provable Economics**.
   - Drag the **Monthly Workflow Executions** and **Specialist Subagents** sliders.
   - Watch the **Annual Cost Savings** and **AcompanI Tiered Mesh** numbers compute live in real time.
5. **Interactive Attack Simulator (Showcase):**
   - Under **Attack Arena**, click **`Simulate RAG Exploit →`** (watch the prompt injection attempt get blocked with zero leaks).
   - Click **`Simulate Escalation →`** (watch Casbin RBAC intercept unauthorized database migration).
   - Click **`Test HITL Quarantine →`** (watch the production deployment tool freeze until human signoff).

---

### Phase 2: Enter the Enterprise Management Studio
Click the **`Launch Console`** button in the navbar (or press **`Ctrl + K`** and select *Go to Command Center*).

#### Tab 1: Command Center (`Activity & Telemetry`)
1. **5 OpenRouter Metric Cards:**
   - Inspect the top cards: **Total spend**, **Requests**, **Token volume**, **Zero-leak rate**, and **Blended $/1M**.
   - Notice the live SVG sparklines on active cards.
2. **Top Apps & Top Agent Roles:**
   - Review the two split panels showing live token distribution and tool gateways.
3. **Quick Task Launch & Formatted Executive Synthesis:**
   - Type a prompt in the Quick Task box (e.g., `"Analyze Q3 customer acquisition cost and draft a summary"`).
   - Click **`Execute Task`**:
     - Notice the execution status and millisecond latency tracker.
     - The output is rendered in a bounded, scrollable **Executive Synthesis briefing card** with highlighted headings and bullets.
     - **Layout Integrity:** Notice that no matter how long the synthesis is, the dashboard **never expands horizontally** and **no horizontal scrollbar appears**.
   - Click **`Copy Brief`** to quickly copy the plain text deliverable to your clipboard.
4. **Audit Certificate Seal:**
   - Click **`Audit Certificate`** in the top-right:
   - Notice your **AcompanI Logo** stamped on the official enterprise governance seal.
   - Click **`Print / Save PDF`** to test the printer stylesheet, or click **`✕`** to close.

---

### Tab 2: Org Architect (`Trends` or Sidebar `Org Architect`)
1. **Generate a New Org Hierarchy:**
   - Click the chip **`Preset: FinTech`** (or type any business description into the input box).
   - Click **`Generate Org Chart`**:
   - Watch the backend synthesize a custom organizational structure and render the **Interactive Node Graph**.
2. **Test Graph Interactions:**
   - Click the **`+`** button to zoom in, **`−`** to zoom out, and **`Fit`** to re-center.
   - Click on any role node in the graph: Notice the Inspector panel on the right updates with that agent's exact permissions, data scopes, and allowed tools.
3. **Interactive RBAC Tool Sandbox (With Role Switcher & 1-Click Tests):**
   - You can test any role directly using the **Switch Role to Test** dropdown or by clicking nodes in the graph.
   - **Test 1: Permitted Tool Execution (`sales_rep`):**
     - Select `sales_rep`. Notice the recommended 1-click test pills appear.
     - Click **`⚡ draft_email (Allow)`** or select `draft_email` and click **`Test Call`**.
     - Notice the loading state (`Evaluating...`), followed by a glowing green **`✓ PERMITTED`** badge with policy confirmation.
   - **Test 2: Human-in-the-Loop Quarantine Gate (`send_email`):**
     - Click **`⚠️ send_email (HITL Approval)`**.
     - Notice the glowing amber **`⚠️ HITL GATE TRIGGERED`** badge appears, and the Human-in-the-Loop approval card pops up.
     - Click **`Approve & Execute`**: Watch the status change to **`✓ APPROVED & EXECUTED`** with a success notification.
   - **Test 3: Least-Privilege Access Denial (`engineering_manager`):**
     - Switch role to `engineering_manager`.
     - Click **`🚫 create_lead (Deny)`** (or any CRM tool).
     - Notice the glowing red **`✕ ACCESS DENIED`** badge confirming Casbin least-privilege enforcement.
4. **Deploy to Runtime:**
   - Click **`Deploy to Runtime & Sync Casbin`**: Watch the toast confirm live deployment.

---

### Tab 3: Task Orchestrator (`Execute Task →` or Sidebar `Task Orchestrator`)
1. **Run Multi-Agent Task:**
   - Click the chip **`Cross-Dept Launch`** (or **`Backend Spec`**).
   - Click **`Execute Across Hierarchy`**.
   - Watch the real-time execution telemetry:
     - **Router Model:** Llama 3.1 8B (fast orchestration)
     - **Worker Model:** Llama 3.3 70B (high-accuracy specialist synthesis)
     - **Usage Breakdown:** Router tokens, Worker tokens, and cost savings bar.
   - Notice the synthesis is contained in an executive viewport that **never blows out the viewport width or causes horizontal scrolling**.
2. **Copy Result:**
   - Click **`Copy Output`**: Notice the success toast confirming clipboard copy.

---

### Tab 4: Knowledge Vault / ChromaDB RAG (`Explore` or Sidebar `Knowledge Vault`)
1. **Re-Seed Sample Knowledge:**
   - Click **`Re-Seed Sample KB`**: Seeds ChromaDB with partitioned department docs.
2. **Test Scoped Query:**
   - Select role **`Engineering Manager`** and click the quick preset chip **`🛠️ Engineering Specs`**.
   - Notice the button changes to **`Searching...`** with an animated spinner.
   - Watch relevant engineering architectural chunks return with similarity scores.
3. **Test Cross-Tenant Isolation (Quarantine & Zero-Leak Audit):**
   - Select role **`Sales Representative`** (has no finance scope).
   - Click the preset chip **`🛡️ ACME-FIN-9921-SECRET (Quarantine Test)`** (or type `ACME-FIN-9921-SECRET` and press **Enter**).
   - Notice the instant loading feedback, followed by a prominent glowing green security banner:
     **`🛡️ Zero-Leak Policy Enforced (PASSED AUDIT)`**
     Explaining that the financial secret was quarantined from `sales_rep` and **exactly 0 chunks leaked**.
4. **Index Custom Knowledge:**
   - Type a custom document title and content, select a department, and click **`Index into ChromaDB`**.
   - Notice the instant vector indexing confirmation.

---

### Tab 5: Security & RBAC Matrix (`Guardrails` or Sidebar `Security`)
1. **Automated Red-Team Probe Suite:**
   - Click **`Run Red-Team Suite`**:
   - Three automated probes execute immediately:
     1. Cross-department vector leak attempt → **Blocked (0 leaks)**.
     2. Unauthorized tool escalation → **DENIED by Casbin**.
     3. High-risk production tool bypass → **GATED by Human Quarantine**.
2. **Inspect RBAC Policy Matrix:**
   - Scroll through the **Casbin Enforcement Matrix** table to view every active `(Role, Resource, Action)` permission rule.
3. **Audit Log Stream:**
   - Scroll through the live **Audit Logs**:
   - Inspect timestamps, caller roles, action types, and deterministic `ALLOW` / `DENY` verdicts.
   - Click **`Refresh Logs`** to fetch latest telemetry, or **`Clear Logs`** to reset the view.

---

### Global Controls & Hotkeys
- **Command Palette:** Press **`Ctrl + K`** anywhere to open the command palette. Type to filter, press `Enter` or click to jump anywhere instantly. Press `Escape` to close.
- **Audio Synthesis:** Click the speaker icon in the top navbar to toggle procedural sound synthesis for clicks, approvals, and security alerts.
- **Top Sync Button:** Click **`Sync`** in the topbar to synchronize metrics across all open tabs.
- **Red-Team Shortcut:** Click **`Red-Team Audit`** in the topbar to immediately trigger a full security verification run.
