# AcompanI — Enterprise End-to-End User Testing Manual & Verification Guide

> **AcompanI Autonomous Operating System**  
> **Target Audience:** User / QA / Enterprise Executive / Technical Evaluator  
> **System Status:** All 9 Core Evals Passing • Production DAG & Security Gate Verified  
> **Brand Identity:** Electric Persimmon (`#EA5F2D`) & Deep Charcoal on Pitch Black

---

## 🚀 Quick Start (Local Server Execution)

Open PowerShell in the project directory (`MINOR PROJECT\ai-company`) and run:

```powershell
.\run_acompani.ps1
```

*(Alternative direct launch)*:
```powershell
.\.venv\Scripts\uvicorn.exe api.main:app --host 127.0.0.1 --port 8000 --reload
```

Once started, open your web browser to:
👉 **`http://127.0.0.1:8000`**

---

## 🧭 Master Navigation & Views Overview

| View Name | Primary Function | Keyboard Shortcut |
| :--- | :--- | :--- |
| **Product Showcase** | Landing page, 3D emblem constellation, ROI calculator, interactive mini-simulators | Press `Home` in palette |
| **Tab 1: Command Center** | Real-time OpenRouter metrics, cost telemetry, quick executive tasks, compliance seal | `Ctrl + K` $\rightarrow$ `1` |
| **Tab 2: Org Architect Studio** | LLM-driven DAG synthesis, node inspector, interactive Casbin RBAC sandbox | `Ctrl + K` $\rightarrow$ `2` |
| **Tab 3: Task Orchestrator** | Hierarchical LangGraph execution, tiered router-worker cost arbitrage, run history | `Ctrl + K` $\rightarrow$ `3` |
| **Tab 4: Knowledge Vault** | Scoped ChromaDB RAG, cross-tenant isolation audit, custom document ingestion | `Ctrl + K` $\rightarrow$ `4` |
| **Tab 5: Security & Governance** | Automated 3-stage red-team exploit suite, Casbin policy matrix, tamper-evident audit stream | `Ctrl + K` $\rightarrow$ `5` |

---

## 🧪 Comprehensive Step-by-Step Test Scenarios (With Sample Inputs)

---

### Phase 1: Brand & Landing Page Integrity Check

1. **Brand Emblem & Typography:**
   - Look at the top-left navigation:
     - Notice the **AcompanI** emblem (no borders, no square box).
     - Notice the brand text **`AcompanI`**: The **A** and **I** are glowing persimmon (`#EA5F2D`), while `compan` is clean white, with **0px gap**.
2. **Hero 3D Particle Constellation:**
   - Move your mouse around the rotating central metallic badge: Observe the ember particle web dynamically connect and follow your cursor coordinates.
3. **Interactive Mini-Simulator (Section 1):**
   - Click the preset button: **`FinTech`**.
   - Click **`Synthesize Org Chart`**: Watch the DAG nodes (`CEO`, `Eng Manager`, `Fraud Specialist`, `Sales Rep`) populate dynamically.
   - Click **`Animate Delegation`**: Watch the step-by-step telemetry packet stream print router decomposition, scoping, compaction, and arbitrage savings.
4. **Interactive ROI Economics Calculator:**
   - Drag **Monthly Workflow Executions** to `50,000`.
   - Drag **Specialist Subagents** to `12`.
   - Observe the live annual savings projection update dynamically.

---

### Phase 2: Enter Enterprise Management Studio

Click **`Launch Console`** in the top navbar (or press `Ctrl + K` and press `1`).

---

### Tab 1: Command Center (`Activity & Telemetry`)

#### Test 1.1: Live OpenRouter Telemetry Cards
- **What to look for:**
  - **Total Spend Card:** Shows calculated token spend.
  - **Requests:** Count of API transactions.
  - **Zero-Leak Rate:** Displays `100.0%` with a green shield.
  - **Blended Rate:** Displays cost per 1M tokens.

#### Test 1.2: Quick Task Execution & Formatted Executive Briefing
- **Sample Input (Copy & Paste):**
  ```text
  Analyze our Q3 customer acquisition velocity, evaluate API infrastructure bottlenecks, and synthesize an executive strategic brief for the board.
  ```
- **Action:** Paste into the **Quick Task** input box and click **`Execute Task`**.
- **Expected Result:**
  - A loading indicator displays with real-time millisecond elapsed timer.
  - Returns a structured **Executive Synthesis** card with clear bullet points and action items.
  - **Layout Check:** Verify that the dashboard maintains clean margins and **no horizontal scrollbar appears**.
  - Click **`Copy Brief`**: A toast notification appears confirming: `Brief copied to clipboard!`.

#### Test 1.3: Cryptographic Audit Certificate Seal
- **Action:** Click the **`Audit Certificate`** button in the top-right toolbar.
- **Expected Result:**
  - A modal opens displaying the **AcompanI Official Compliance Seal**.
  - Notice the **Certificate ID** (`ACMP-ENT-...`), **Signature Hash** (`SHA256:...`), **Zero-Trust Grade** (`A+ ZERO-TRUST VERIFIED`), and DAG validity status.
  - Click **`Print / Save PDF`** to test the print styling, then click **`✕`** to close.

---

### Tab 2: Org Architect Studio (`Org Hierarchy & RBAC`)

Click **`Org Architect`** in the sidebar or press `Ctrl + K` $\rightarrow$ `2`.

#### Test 2.1: Synthesize a Brand-New Enterprise Organization DAG
- **Sample Input 1 (Healthcare SaaS):**
  ```text
  A HIPAA-compliant healthcare workflow platform requiring secure patient database engineering, clinical compliance auditing, hospital enterprise sales, and physician customer success.
  ```
- **Action:** Paste the text above into the **Business Summary & Strategic Objective** textarea and click **`Generate Org Chart`**.
- **Expected Result:**
  - The backend synthesizes a custom multi-tier hierarchy:
    - Root: `Chief Executive Officer` / `CEO`
    - Routers: `Engineering Manager`, `Compliance Manager`, `Sales Manager`
    - Workers: `HIPAA Dev`, `Clinical Auditor`, `Sales Rep`
  - The **Interactive Node Graph** renders the hierarchical DAG with SVG connector lines.
  - Graph controls:
    - Click **`+`** to zoom in.
    - Click **`−`** to zoom out.
    - Click **`Fit`** to re-center.
    - Click on any node (e.g. `Engineering Manager`): The **Role Inspector** updates on the right with that node's exact data scopes, tools, and supervisor chain.

#### Test 2.2: Interactive RBAC Tool Sandbox
Test how Casbin deterministic security gates enforce least privilege in real time:

- **Case A: Permitted Tool Execution**
  - **Role:** Select `Sales Representative (sales_representative)` or `sales_rep`.
  - **Tool:** Select `draft_email` (or click quick pill `⚡ draft_email (Allow)`).
  - **Click:** **`Test Call`**.
  - **Expected Result:** Glowing green **`✓ PERMITTED`** badge appears with draft email content and Casbin confirmation: `sales_representative -> draft_email: ALLOWED`.

- **Case B: Human-in-the-Loop (HITL) Quarantine Gate**
  - **Role:** Keep `Sales Representative` or `Sales Manager`.
  - **Tool:** Click the quick pill **`⚠️ send_email (HITL Approval)`**.
  - **Expected Result:**
    - Glowing amber **`⚠️ HITL GATE TRIGGERED`** badge appears.
    - A yellow warning card appears: *"Pending human supervisor sign-off before dispatching external email"*.
    - Click **`Approve & Execute`**: Status instantly transitions to green **`✓ APPROVED & EXECUTED`** with confirmation: *"Human approval confirmed. Outbound email dispatched."*

- **Case C: Least-Privilege Denial**
  - **Role:** Switch role to `Engineering Manager (engineering_manager)`.
  - **Tool:** Click the red quick pill **`🚫 create_lead (Deny)`** (or select `create_lead` and click `Test Call`).
  - **Expected Result:** Glowing red **`✕ ACCESS DENIED`** badge appears with policy reason: `DENIED: role 'engineering_manager' is not authorized to execute 'create_lead'`.

#### Test 2.3: Deploy to Runtime
- **Action:** Click **`Deploy to Runtime & Sync Casbin`**.
- **Expected Result:** Toast confirms: `Org chart deployed to runtime! Casbin policies synced.`

---

### Tab 3: Task Orchestrator & Cost Telemetry

Click **`Task Orchestrator`** in the sidebar or press `Ctrl + K` $\rightarrow$ `3`.

#### Test 3.1: Execute Hierarchical Multi-Agent Task
- **Sample Input (Paste into Dispatch Objective):**
  ```text
  Design the rate-limited FastAPI endpoint architecture based on engineering standards and draft a merchant integration update.
  ```
- **Action:** Click **`Execute Across Hierarchy`**.
- **Expected Result:**
  - Notice the execution thread identifier (e.g. `Thread a1ea4323 • 53230ms`).
  - **Delegation & Compaction Waterfall (Right Column):**
    - `CEO` decomposes the task and delegates to `Engineering Manager`.
    - `Engineering Manager` routes to `Backend Developer`.
    - `Backend Developer` performs scoped vector retrieval and compacts raw worker tokens down to concise facts.
    - Response bubbles back up to `CEO` for executive synthesis.
  - **Cost Arbitrage Economics (Left Column):**
    - Displays exact **Router Calls** vs. **Worker Calls**.
    - Token split shows ~**75% - 85% routed via cheap supervisor models**.
    - Projected cost bar demonstrates **69% - 85% savings** vs. monolithic models.
  - **Session Orchestration History (Bottom Table):**
    - The table updates with a new row showing: `THREAD ID`, `COMPANY`, `OBJECTIVE PREVIEW`, `TIER SPLIT`, and `TOKENS`.

---

### Tab 4: Department Knowledge Vault (Scoped ChromaDB RAG)

Click **`Knowledge Vault`** in the sidebar or press `Ctrl + K` $\rightarrow$ `4`.

#### Test 4.1: Authorized Department Query
- **Role Dropdown:** Select `Engineering Manager (engineering_manager)`.
- **Query Input:** Click the preset button **`🛠️ Engineering Specs`** (or type `"What is the database connection string and API gateway architecture?"`).
- **Click:** **`Test Scoped Query`**.
- **Expected Result:**
  - Button shows `<span class="spinner-sm"></span> Searching...` and smoothly resets to `Test Scoped Query`.
  - Top badge displays:
    `Scopes: engineering` | `Blocked Partitions: finance, sales (Zero-Leak Verified)`.
  - **2 Relevant Engineering Chunks Return:**
    - `engineering.txt` — FastAPI v0.115+ specs and rate limiting middleware (~58% relevance).
    - `engineering.txt` — Internal database host `pg-prod-internal.acme.local` (~57% relevance).

#### Test 4.2: Cross-Tenant Isolation Audit (Quarantine Test)
- **Role Dropdown:** Select `Sales Representative (sales_representative)`.
- **Query Input:** Click the preset button **`🛡️ ACME-FIN-9921-SECRET (Quarantine Test)`** (or type `"ACME-FIN-9921-SECRET"`).
- **Click:** **`Test Scoped Query`**.
- **Expected Result:**
  - Top badge displays:
    `Scopes: sales` | `Blocked Partitions: engineering, finance (Zero-Leak Verified)`.
  - Exactly **0 chunks** return from the unauthorized `finance` partition.
  - A prominent glowing green banner appears:
    > **🛡️ Zero-Leak Policy Enforced [PASSED AUDIT]**  
    > *Role `sales_representative` is restricted to department scopes: `[sales]`.*  
    > *Restricted memory partitions `[engineering, finance]` were quarantined.*  
    > **✓ Target secret quarantined: Exactly 0 memory chunks leaked across departments.**

#### Test 4.3: Custom Scoped Document Ingestion
- **Under "Ingest Scoped Document" (Bottom Left Card):**
  - **Department Scope:** `hr`
  - **Source Filename:** `benefits_policy_2026.txt`
  - **Document Content (Copy & Paste):**
    ```text
    AcompanI Employee Benefits & Stipends Guide:
    - Annual Wellness Stipend: $1,200 per employee for gym, ergonomic setup, and mental health.
    - Continuous Learning Budget: $2,500 annually for books, conferences, and certifications.
    - Confidential HR Concierge: hr-concierge@acompani.internal.
    ```
  - Click **`Index into ChromaDB`**.
- **Expected Result:**
  - Status updates: `Indexed 1 chunk(s) under 'hr'`.
  - The partition chart on the right reflects the newly indexed department.
  - *(To restore the pristine default KB at any time, simply click `[Re-Seed Sample KB]` in the top-right).*

---

### Tab 5: Security & RBAC Matrix (`Guardrails & Red-Team`)

Click **`Security`** in the sidebar or press `Ctrl + K` $\rightarrow$ `5`.

#### Test 5.1: Automated Red-Team Isolation Suite
- **Action:** Click **`Run Red-Team Suite`** in the top bar.
- **Expected Result:** 3 live adversarial attacks run in parallel with real-time verdicts:
  1. **RAG Scope Isolation:** Displays <span style="color:#22c55e; font-weight:bold;">PASS (0 leaks)</span> — `Query for ACME-FIN-9921-SECRET blocked (0 leaks)`.
  2. **Casbin Tool Guard:** Displays <span style="color:#ef4444; font-weight:bold;">DENIED</span> — `engineering_manager -> create_lead: DENIED (not authorized)`.
  3. **Human-Approval Gate:** Displays <span style="color:#f59e0b; font-weight:bold;">GATED</span> — `sales_manager -> send_email: PENDING_APPROVAL (requires human approval)`.

#### Test 5.2: Live Tamper-Evident Audit Stream
- **Action:** Scroll down to **Audit Stream (`authority/audit_log.jsonl`)**.
- **Features to Verify:**
  - Displays structured telemetry: `ROLE`, `ACTION`, `RESOURCE`, `DECISION`, and `POLICY REASON`.
  - **Filter Dropdown:** Switch the dropdown from `All Decisions` to `DENIED Only` (verifies least-privilege denials) and `ALLOWED Only` (verifies authorized operations).
  - Click **`Refresh Logs`**: Refetches the latest telemetry.

---

### Phase 3: Global Hotkeys & Quality-of-Life Controls

1. **Global Command Palette (`Ctrl + K`):**
   - Press **`Ctrl + K`** on your keyboard from any view.
   - Type `"task"` $\rightarrow$ press **Enter** to jump immediately to the Task Orchestrator.
   - Press **`Ctrl + K`**, type `"cert"` $\rightarrow$ press **Enter** to pop open the Audit Certificate Modal.
2. **Procedural Audio Effects:**
   - Click the speaker icon in the top-right header to enable or disable tactile sound effects for button clicks, approval transitions, and security blocks.
3. **Top Bar Quick Actions:**
   - Click **`Sync`** in the top bar to synchronize metrics across components.
   - Click **`Red-Team Audit`** to trigger the automated security verification suite from anywhere in the app.

---

## 🎯 Verification Sign-Off Checklist

- [ ] **Branding:** AcompanI logo and typography render with zero borders and zero gaps.
- [ ] **Org DAG:** LLM synthesizes valid directed acyclic graphs without cycles.
- [ ] **Tool Sandbox:** Permitted tools execute; unauthorized tools are rejected with red badges; sensitive tools pause for human approval.
- [ ] **Task Orchestrator:** Token usage reflects router-worker tiered savings with responsive, non-overflowing executive synthesis.
- [ ] **Scoped RAG:** Engineering specs return for engineering roles; financial secrets are completely quarantined for non-finance roles with 0 leaks.
- [ ] **Red-Team Suite:** Automated attack probes pass with 100% containment.
- [ ] **Audit Trail:** JSONL telemetry stream records all deterministic security decisions.
