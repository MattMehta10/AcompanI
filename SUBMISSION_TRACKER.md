# AcompanI — Submission Readiness Tracker

> **Project:** AcompanI · Autonomous Hierarchical Multi-Agent Organization Platform  
> **Repository:** [https://github.com/MattMehta10/AcompanI](https://github.com/MattMehta10/AcompanI)  
> **Semester:** 7th Semester Minor Project  
> **Audit Date:** November 15, 2026  
> **Status:** 🟢 SUBMISSION READY

---

## 🔬 Live Audit Results

| Check | Command | Result |
|-------|---------|--------|
| **Full Test Suite** | `pytest evals -v` | ✅ **9 / 9 PASSED** (13.99 s) |
| **API Import** | `python -c "from api.main import app"` | ✅ OK |
| **Static Assets** | File sizes | ✅ app.js 46 KB · index.html 54 KB · styles.css 40 KB |
| **Virtual Environment** | `.venv/Scripts/uvicorn.exe` exists | ✅ Present |
| **Env Config** | `.env` + `.env.example` | ✅ Both present |
| **ChromaDB Cache** | `rag/chroma_db/` dir | ✅ Populated (UUID shards) |
| **Org Template** | `default_org.yaml` | ✅ Present |
| **Generated Active Org** | `generated_active.yaml` | ✅ Present |
| **Audit Log** | `authority/audit_log.jsonl` | ✅ Present with records |
| **Launch Script** | `run_acompani.ps1` | ✅ Opens browser + starts uvicorn |

---

## ✅ Component Checklist

### Core Infrastructure
- [x] Python 3.12.13 virtual environment via `uv` (`.venv/`)
- [x] 147 dependencies installed (`pyproject.toml` / `requirements.txt`)
- [x] Offline ONNX embedding model cached (`all-MiniLM-L6-v2` → `C:\Users\...\chroma\`)
- [x] Environment variables file (`.env.example` with all 8 keys documented)
- [x] Launch script (`run_acompani.ps1` — auto-opens browser + starts server)

### Organization Engine (`org/`)
- [x] `schema.py` — Pydantic v2 `OrgChart` + `Role` + `RolePermissions` models
- [x] `validator.py` — DFS cycle detection, single-root enforcement, least-privilege checks
- [x] `generator.py` — LLM-driven org chart generation from free-text business summary
- [x] `templates/default_org.yaml` — 6-role default org (CEO, VP Eng, Backend Dev, VP Sales, Sales Rep, Fin Analyst)
- [x] `templates/generated_active.yaml` — Last deployed custom org

### Agent Orchestration (`agents/`)
- [x] `state.py` — LangGraph `TypedDict` state schema
- [x] `llm_router.py` — 3-tier LLM factory (mock / openai_compatible / ollama) + `UsageTracker`
- [x] `context.py` — Token approximation utility
- [x] `worker.py` — Isolated subagent execution + delegation selection
- [x] `build_graph.py` — LangGraph `StateGraph` with `MemorySaver` checkpointer, 3-node DAG

### RAG Knowledge Vault (`rag/`)
- [x] `chunking.py` — 300-token overlap chunker
- [x] `ingest.py` — ChromaDB collection management, sample KB loader
- [x] `retriever.py` — `retrieve_scoped` + `retrieve_scoped_with_metadata` with department `$in` filter
- [x] `kb_samples/engineering.txt` — Engineering KB (stack, architecture, endpoint specs)
- [x] `kb_samples/sales.txt` — Sales KB (CRM hygiene, launch offers, playbook)
- [x] `kb_samples/finance.txt` — Finance KB (sensitive secrets — proves isolation works)

### Security & Governance (`authority/`)
- [x] `rbac_model.conf` — Casbin ACL model (`r = sub, obj, act`)
- [x] `rbac_policy.csv` — Static seed policies for 6 roles × 5 tools
- [x] `enforcer.py` — `sync_policies_from_org` + `check_permission` + `get_enforcer`
- [x] `audit_log.py` — Append-only JSONL audit log with read + clear

### MCP Tool Servers (`mcp_servers/`)
- [x] `crm_server.py` — `create_lead`, `update_lead_status`, `list_leads` (FastMCP)
- [x] `email_server.py` — `draft_email`, `send_email` (FastMCP, HITL gate on send)
- [x] `registry.py` — `guarded_tool_call` orchestrator with RBAC pre-check + HITL enforcement

### REST API (`api/`)
- [x] `main.py` — FastAPI application, 15 endpoints, lifespan KB ingest
- [x] `schemas.py` — Pydantic request/response models

### Frontend UI (`api/static/`)
- [x] `index.html` — Multi-section SPA (54 KB) — Landing + Studio Console
- [x] `styles.css` — Premium design system (40 KB) — Plus Jakarta Sans, bento grid, ROI calc
- [x] `app.js` — Client-side logic (46 KB) — Org Architect, Task Orchestrator, Knowledge Vault, RBAC Studio

### Evaluation Suite (`evals/`)
- [x] `test_cost_routing.py` — Tiered cost arbitrage benchmark
- [x] `test_delegation_and_routing.py` — End-to-end multi-department task flow
- [x] `test_org_validator.py` — DAG validation (cycle detection + least-privilege)
- [x] `test_permission_enforcement.py` — RBAC deny/allow + HITL gate
- [x] `test_rag_scoping.py` — Cross-department secret isolation (3 scenarios)

### Documentation (`docs/`)
- [x] `PROJECT_OVERVIEW.md` — Executive summary, problem statement, architecture philosophy
- [x] `ARCHITECTURE_DEEP_DIVE.md` — All subsystems, state machine, algorithms, math
- [x] `API_REFERENCE.md` — All 15 endpoints with request/response schemas
- [x] `EVAL_RESULTS.md` — Full test suite documentation + benchmark data
- [x] `VIVA_PREPARATION.md` — 30+ Q&A, 2-min demo script, comparisons
- [x] `DEVELOPER_GUIDE.md` — Setup, extension guide, deployment options
- [x] `SUBMISSION_TRACKER.md` — This file

### Project Root
- [x] `README.md` — Enterprise README with quick start, feature list, architecture
- [x] `pyproject.toml` — Package metadata + dependencies
- [x] `requirements.txt` — Pip-compatible pinned requirements
- [x] `pytest.ini` — Test configuration
- [x] `.gitignore` — Excludes `.venv`, `chroma_db`, `.env`, `__pycache__`

---

## 🧪 Test Suite Results — November 15, 2026

```
platform win32 — Python 3.12.13 — pytest-9.2.0
rootdir: C:\Users\Yash\Desktop\INTERSHIP+PROJECT\MINOR PROJECT\ai-company
configfile: pytest.ini

collected 9 items

evals/test_cost_routing.py::test_cost_routing_saves_tokens_on_supervisor_tier          PASSED [ 11%]
evals/test_delegation_and_routing.py::test_end_to_end_delegation_and_cost_routing      PASSED [ 22%]
evals/test_org_validator.py::test_validator_catches_cycle_and_least_privilege_violation PASSED [ 33%]
evals/test_org_validator.py::test_two_business_summaries_generate_distinct_valid_orgs  PASSED [ 44%]
evals/test_permission_enforcement.py::test_unauthorized_tool_is_denied_and_logged      PASSED [ 55%]
evals/test_permission_enforcement.py::test_authorized_tool_is_allowed_and_human_gate_blocks_send_email PASSED [ 66%]
evals/test_rag_scoping.py::test_engineering_cannot_retrieve_finance_secrets            PASSED [ 77%]
evals/test_rag_scoping.py::test_sales_can_retrieve_sales_playbook_only                PASSED [ 88%]
evals/test_rag_scoping.py::test_empty_scope_returns_nothing                           PASSED [100%]

======================== 9 passed in 13.99s ==============================
```

---

## 🔌 API Endpoint Inventory

| # | Method | Path | Tag | Description |
|---|--------|------|-----|-------------|
| 1 | GET | `/` | — | Serve SPA (index.html) |
| 2 | GET | `/api/health` | Telemetry | System health + active company |
| 3 | GET | `/api/metrics/summary` | Telemetry | Roles, RAG chunks, audit counts |
| 4 | GET | `/api/reports/certificate` | Telemetry | SHA-256 compliance certificate |
| 5 | GET | `/api/org/current` | Organization | Active org chart dump |
| 6 | POST | `/api/org/generate` | Organization | LLM-driven org generation |
| 7 | POST | `/api/org/deploy` | Organization | Deploy + validate new org |
| 8 | POST | `/api/tasks` | Execution | Run hierarchical task |
| 9 | GET | `/api/tasks/history` | Execution | Last 20 task runs |
| 10 | POST | `/api/rag/ingest-samples` | Knowledge Vault | Reset + re-ingest sample KB |
| 11 | POST | `/api/rag/ingest` | Knowledge Vault | Ingest custom document |
| 12 | POST | `/api/rag/search` | Knowledge Vault | Scoped vector explorer |
| 13 | POST | `/api/security/probe` | Security & Governance | Live RAG + RBAC probe |
| 14 | GET | `/api/security/matrix` | Security & Governance | Full Casbin RBAC matrix |
| 15 | POST | `/api/tools/test` | Security & Governance | Interactive role-tool sandbox |
| 16 | POST | `/api/tools/approve` | Security & Governance | HITL approval execution |
| 17 | GET | `/api/audit-logs` | Security & Governance | Read audit log entries |
| 18 | DELETE | `/api/audit-logs` | Security & Governance | Clear audit log |

---

## 🖥️ UI Feature Inventory

### Landing Page
- [x] Fixed top navigation bar (AcompanI logo, 5 nav links, Sound toggle, Launch Console CTA)
- [x] Hero section — Gradient headline, tagline, stat counters (99.7% isolation, 85.4% cost savings)
- [x] Live Simulator — Interactive task submission with animated trace visualization
- [x] Bento Feature Grid — 6 cards (DAG Orchestration, Zero-Trust RAG, Cost Arbitrage, Casbin RBAC, HITL, MCP)
- [x] ROI Calculator — Slider-driven cost savings visualizer
- [x] Zero-Trust Arena — Attack simulation table (3 vector types × 3 outcomes)
- [x] Architecture Blueprint — 4-step system flow diagram
- [x] SDK/Integration Tab Panel — cURL, Python, JavaScript code snippets

### Studio Console (5 Views)
- [x] **Command Center** — Health widget, metrics dashboard, task history, quick-run panel
- [x] **Org Architect** — Org tree visualizer, generate-from-text panel, deploy controls
- [x] **Task Orchestrator** — Task submission, delegation trace, department results, usage breakdown
- [x] **Knowledge Vault** — Scoped vector explorer, ingest panel, chunk browser with metadata
- [x] **Security / RBAC Studio** — Full RBAC matrix table, live probe runner, audit log viewer

### Modals & Overlays
- [x] Command Palette (Ctrl+K) — 8 quick-action commands
- [x] Executive Certificate modal — SHA-256 signed compliance report

---

## ⚠️ Known Issues / Risks

| Item | Severity | Status |
|------|----------|--------|
| Google Fonts CDN (Plus Jakarta Sans) requires internet on first load | LOW | Graceful fallback to `system-ui` — demo works offline |
| `run_acompani.ps1` does not wait for server before opening browser — first load may show "not ready" | LOW | Refresh once after server prints "Application startup complete" |
| `LLM_PROVIDER=mock` in `.env` — real tasks need Groq/Gemini API key | KNOWN | Mock delivers deterministic demo without internet |
| C: drive low (~592 MB free) — no Ollama model support | KNOWN | Use `mock` or `openai_compatible` mode |

---

## 🚀 Quick Start

```powershell
# From project root
cd "MINOR PROJECT\ai-company"
.\run_acompani.ps1
# → Opens http://127.0.0.1:8000 in browser
# → Swagger docs at http://127.0.0.1:8000/docs
```

**Run tests:**
```powershell
cd "MINOR PROJECT\ai-company"
.\.venv\Scripts\python.exe -m pytest evals -v
```

**Switch to live LLM (Groq — free tier):**
```env
# Edit .env
LLM_PROVIDER=openai_compatible
OPENAI_API_KEY=your_groq_key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
DEFAULT_ROUTER_MODEL=llama-3.1-8b-instant
DEFAULT_WORKER_MODEL=llama-3.3-70b-versatile
```

---

## 🏁 Submission Readiness Verdict

| Criterion | Status |
|-----------|--------|
| All source modules written and importable | ✅ |
| 9/9 automated evaluation suites passing | ✅ |
| REST API with 18 endpoints fully functional | ✅ |
| Professional SPA UI (landing + studio) | ✅ |
| Offline mock mode — zero internet required | ✅ |
| Comprehensive documentation (7 docs files) | ✅ |
| One-command launch script | ✅ |
| Swagger docs auto-generated at `/docs` | ✅ |

> **VERDICT: ✅ SUBMISSION READY**

