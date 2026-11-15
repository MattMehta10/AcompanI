# AcompanI

**Autonomous Hierarchical Multi-Agent Organization Platform**

> *Deploy a full AI-powered company. One task. Every department. Zero data leakage.*

---

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi)
![LangGraph](https://img.shields.io/badge/LangGraph-0.4-orange)
![ChromaDB](https://img.shields.io/badge/ChromaDB-0.6-purple)
![Casbin](https://img.shields.io/badge/Casbin-RBAC-red)
![Tests](https://img.shields.io/badge/Tests-9%2F9%20Passed-brightgreen)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## What is AcompanI?

AcompanI is an enterprise-grade **autonomous AI operating system** that replicates a full company hierarchy using large language model agents. Submit a natural-language task — the system automatically delegates it through a CEO → VP → Manager → Worker chain, executes in departmental isolation, and returns a synthesized executive deliverable.

**Key properties:**
- 🔐 **Zero-Trust Security** — ChromaDB partition filters enforce data isolation at the vector-database level (not the prompt level)
- ⚡ **85% Cost Savings** — Cheap router LLMs (8B) handle delegation; expensive models (70B) execute only at leaf workers
- 🏛️ **Casbin RBAC** — Tool permissions are policy-as-code (CSV), auto-rebuilt on every org deployment
- 🛑 **Human-in-the-Loop** — High-risk actions (send_email) require explicit human approval
- 📋 **Immutable Audit Log** — Every agent action, tool call, and RAG query recorded as append-only JSONL
- 🧪 **9/9 Tests Passing** — Full automated evaluation suite (DAG, RBAC, Scoped RAG, Cost Arbitrage)
- 🌐 **100% Offline** — Runs entirely in mock mode with pre-cached ONNX embeddings

---

## Quick Start

```powershell
# 1. Navigate to project
Set-Location "MINOR PROJECT\ai-company"

# 2. Launch (opens browser automatically)
.\run_acompani.ps1

# → App: http://127.0.0.1:8000
# → Swagger: http://127.0.0.1:8000/docs
```

**Run tests:**
```powershell
.\.venv\Scripts\python.exe -m pytest evals -v
# Expected: 9 passed in ~14s
```

**Switch to live LLM (Groq — free):**
```env
# .env
LLM_PROVIDER=openai_compatible
OPENAI_API_KEY=your_groq_key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
DEFAULT_ROUTER_MODEL=llama-3.1-8b-instant
DEFAULT_WORKER_MODEL=llama-3.3-70b-versatile
```

---

## Architecture

```
Task Input (CEO)
     │
     ├──► VP Engineering ──► Backend Dev    (engineering KB only)
     │                  └──► Tech Lead      (engineering KB only)
     │
     └──► VP Sales ──────► Sales Rep        (sales KB only)
                      └──► Growth Manager  (sales KB only)
     │
 CEO Synthesizes Final Answer
```

Every arrow represents:
- An isolated LLM context (no cross-department prompt pollution)
- A ChromaDB `$in` metadata filter (no cross-department document retrieval)
- A Casbin policy check (no unauthorized tool execution)
- An audit log entry

---

## Features

### 🏢 Org Architect
Generate a custom org chart from any free-text business description. Validate for DAG integrity (cycle detection, single root, least-privilege enforcement). Deploy in one click — Casbin policies rebuild automatically.

### ⚡ Task Orchestrator
Submit any task. Watch the full delegation trace: who delegated to whom, tokens used at each tier, model called, department-level outputs, and the CEO's final synthesis.

### 🧠 Knowledge Vault
Ingest documents into department partitions. Run scoped vector searches — observe in real time which chunks are returned vs. blocked per role. See similarity distances and department tags.

### 🔒 Security Studio
- **Live Zero-Trust Probe** — 3 simultaneous attack vectors (RAG leak attempt, RBAC denial, HITL gate)
- **Full RBAC Matrix** — Every role × every tool × ALLOWED/DENIED/HITL_REQUIRED
- **Audit Log Browser** — Timestamps, role IDs, resources, decisions, reasons
- **Executive Certificate** — SHA-256 signed compliance report

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent Orchestration | LangGraph `StateGraph` + `MemorySaver` |
| LLM Interface | LangChain (mock / OpenAI-compatible / Ollama) |
| Vector Store | ChromaDB (embedded) + all-MiniLM-L6-v2 ONNX |
| Authorization | Casbin (ACL model, CSV policies) |
| Tool Protocol | FastMCP |
| REST API | FastAPI + Pydantic v2 |
| Frontend | Vanilla JS/CSS SPA (no build step) |
| Package Manager | `uv` (10–100× faster than pip) |

---

## Project Structure

```
ai-company/
├── agents/          # LangGraph DAG + LLM router + worker execution
├── org/             # OrgChart schema, validator, generator
├── rag/             # ChromaDB ingest + scoped retriever + KB samples
├── authority/       # Casbin RBAC + audit log
├── mcp_servers/     # FastMCP CRM + email tools + guarded registry
├── api/             # FastAPI endpoints + SPA static files
├── evals/           # 9 automated tests (pytest)
├── docs/            # Full documentation suite
├── run_acompani.ps1 # One-click launcher
└── .env.example     # Configuration template
```

---

## Evaluation Results

| Test | Category | Result |
|------|----------|--------|
| `test_cost_routing_saves_tokens_on_supervisor_tier` | Performance | ✅ PASSED |
| `test_end_to_end_delegation_and_cost_routing` | Integration | ✅ PASSED |
| `test_validator_catches_cycle_and_least_privilege_violation` | Security | ✅ PASSED |
| `test_two_business_summaries_generate_distinct_valid_orgs` | Functional | ✅ PASSED |
| `test_unauthorized_tool_is_denied_and_logged` | Security | ✅ PASSED |
| `test_authorized_tool_is_allowed_and_human_gate_blocks_send_email` | Security | ✅ PASSED |
| `test_engineering_cannot_retrieve_finance_secrets` | Privacy | ✅ PASSED |
| `test_sales_can_retrieve_sales_playbook_only` | Privacy | ✅ PASSED |
| `test_empty_scope_returns_nothing` | Edge Case | ✅ PASSED |

**9 / 9 passed · 13.99 seconds · Python 3.12.13 · Windows**

---

## Documentation

| Document | Description |
|----------|-------------|
| [PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) | Problem statement, novelty, tech stack rationale |
| [ARCHITECTURE_DEEP_DIVE.md](docs/ARCHITECTURE_DEEP_DIVE.md) | Every subsystem, algorithms, state machine, math |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | All 18 endpoints with request/response schemas |
| [EVAL_RESULTS.md](docs/EVAL_RESULTS.md) | Full test documentation + benchmark data |
| [VIVA_PREPARATION.md](docs/VIVA_PREPARATION.md) | 30+ Q&A, 2-min demo script, comparisons |
| [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) | Setup, extension guide, troubleshooting |
| [SUBMISSION_TRACKER.md](SUBMISSION_TRACKER.md) | Submission readiness audit |

---

## Security Model

```
Tool Call Path:
  Agent requests tool → Casbin RBAC check → HITL gate (if required) → Execute

RAG Query Path:
  Agent queries KB → ChromaDB $in filter (dept partitions) → Return scoped docs only

Both paths log to: authority/audit_log.jsonl (append-only)
```

**Zero secrets leaked across 9 automated attack scenarios.**

---

## License

MIT License — 7th Semester Minor Project · 2026
