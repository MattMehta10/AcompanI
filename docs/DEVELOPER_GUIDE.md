# AcompanI — Developer Guide

> **Audience:** Developers extending, debugging, or deploying AcompanI  
> **Assumes:** Python 3.12, Windows PowerShell, basic LangChain familiarity

---

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.12.x | Runtime |
| `uv` | latest | Package manager + venv |
| PowerShell | 5.1+ | Windows shell |
| Git | any | Version control |
| A text editor | — | Config editing |

**Optional (for live LLM):**
- Groq API key (free tier at [console.groq.com](https://console.groq.com))
- Gemini API key (free tier at [aistudio.google.com](https://aistudio.google.com))

---

## 2. Initial Setup

### 2.1 Clone / Navigate to Project

```powershell
Set-Location "c:\Users\Yash\Desktop\INTERSHIP+PROJECT\MINOR PROJECT\ai-company"
```

### 2.2 Create Virtual Environment (first time only)

```powershell
# Install uv if not present
pip install uv

# Create venv with Python 3.12
uv venv --python 3.12 .venv

# Install all dependencies
uv pip install -r requirements.txt
```

### 2.3 Configure Environment

```powershell
# Copy example env
Copy-Item .env.example .env

# Edit .env — for offline mock mode, change to:
# LLM_PROVIDER=mock
# (no API key needed)

notepad .env
```

**`.env` reference:**
```env
# Offline demo mode (zero internet, zero API key)
LLM_PROVIDER=mock

# Live cloud LLM via Groq (free tier)
# LLM_PROVIDER=openai_compatible
# OPENAI_API_KEY=your_groq_key_here
# OPENAI_BASE_URL=https://api.groq.com/openai/v1
# DEFAULT_ROUTER_MODEL=llama-3.1-8b-instant
# DEFAULT_WORKER_MODEL=llama-3.3-70b-versatile

# Embedding model (pre-cached offline ONNX)
EMBEDDING_PROVIDER=chroma_default
```

### 2.4 Pre-populate ChromaDB (first time only)

The server does this automatically on startup via `ingest_sample_kb(reset=False)`, but you can also pre-populate manually:

```powershell
Set-Location "c:\Users\Yash\Desktop\INTERSHIP+PROJECT\MINOR PROJECT\ai-company"
.\.venv\Scripts\python.exe -c "from rag.ingest import ingest_sample_kb; ingest_sample_kb(reset=True); print('KB seeded')"
```

---

## 3. Running the Server

### Option A — Launch Script (Recommended)
```powershell
Set-Location "c:\Users\Yash\Desktop\INTERSHIP+PROJECT\MINOR PROJECT\ai-company"
.\run_acompani.ps1
# Opens http://127.0.0.1:8000 in browser and starts uvicorn
```

### Option B — Direct Uvicorn
```powershell
Set-Location "c:\Users\Yash\Desktop\INTERSHIP+PROJECT\MINOR PROJECT\ai-company"
.\.venv\Scripts\uvicorn.exe api.main:app --host 127.0.0.1 --port 8000 --reload
```

### Option C — Python module
```powershell
.\.venv\Scripts\python.exe -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

**Server URLs:**
| URL | Description |
|-----|-------------|
| `http://127.0.0.1:8000` | Main SPA UI |
| `http://127.0.0.1:8000/docs` | Swagger interactive API docs |
| `http://127.0.0.1:8000/redoc` | ReDoc API reference |

---

## 4. Running Tests

```powershell
Set-Location "c:\Users\Yash\Desktop\INTERSHIP+PROJECT\MINOR PROJECT\ai-company"

# Full suite (all 9 tests)
.\.venv\Scripts\python.exe -m pytest evals -v

# Single test file
.\.venv\Scripts\python.exe -m pytest evals/test_rag_scoping.py -v

# Single test function
.\.venv\Scripts\python.exe -m pytest evals/test_cost_routing.py::test_cost_routing_saves_tokens_on_supervisor_tier -v

# With stdout (see print statements)
.\.venv\Scripts\python.exe -m pytest evals -v -s

# Stop on first failure
.\.venv\Scripts\python.exe -m pytest evals -v -x
```

**Expected output:**
```
9 passed in 13.99s
```

---

## 5. Project Structure

```
ai-company/
├── .env                         # Active config (not committed)
├── .env.example                 # Config template
├── .venv/                       # Virtual environment (not committed)
├── pyproject.toml               # Package metadata + deps
├── requirements.txt             # Pip-compatible pinned deps
├── pytest.ini                   # Test config (testpaths=evals)
├── run_acompani.ps1             # One-click launch script
├── README.md                    # Quick-start README
├── SUBMISSION_TRACKER.md        # Submission readiness audit
│
├── org/                         # Organization engine
│   ├── schema.py                # Pydantic OrgChart + Role models
│   ├── validator.py             # DFS cycle detection + constraints
│   ├── generator.py             # LLM-driven org generation
│   └── templates/
│       ├── default_org.yaml     # 6-role default company
│       └── generated_active.yaml  # Last deployed custom org
│
├── agents/                      # LangGraph agent orchestration
│   ├── state.py                 # OrgState TypedDict
│   ├── llm_router.py            # LLM factory + UsageTracker
│   ├── context.py               # Token counting utility
│   ├── worker.py                # Subagent execution + delegation
│   └── build_graph.py           # LangGraph StateGraph + run_company_task
│
├── rag/                         # Knowledge vault
│   ├── chunking.py              # Text chunker (300 tokens, 50 overlap)
│   ├── ingest.py                # ChromaDB collection + sample KB loader
│   ├── retriever.py             # Scoped retrieval functions
│   └── kb_samples/
│       ├── engineering.txt      # Engineering knowledge base
│       ├── sales.txt            # Sales playbook
│       └── finance.txt          # Finance secrets (isolation proof)
│
├── authority/                   # Security + governance
│   ├── rbac_model.conf          # Casbin ACL model definition
│   ├── rbac_policy.csv          # Static seed policies
│   ├── enforcer.py              # Casbin enforcer + sync_policies_from_org
│   └── audit_log.py             # Append-only JSONL audit log
│
├── mcp_servers/                 # MCP tool implementations
│   ├── crm_server.py            # CRM tools (create_lead, etc.)
│   ├── email_server.py          # Email tools (draft, send)
│   └── registry.py              # guarded_tool_call + TOOL_IMPLEMENTATIONS
│
├── api/                         # FastAPI REST API
│   ├── main.py                  # 18 endpoints + lifespan
│   ├── schemas.py               # Pydantic request models
│   └── static/
│       ├── index.html           # SPA landing + studio (54 KB)
│       ├── styles.css           # Design system (40 KB)
│       └── app.js               # Client logic (46 KB)
│
├── evals/                       # Test suite
│   ├── test_cost_routing.py
│   ├── test_delegation_and_routing.py
│   ├── test_org_validator.py
│   ├── test_permission_enforcement.py
│   └── test_rag_scoping.py
│
└── docs/                        # Documentation
    ├── PROJECT_OVERVIEW.md
    ├── ARCHITECTURE_DEEP_DIVE.md
    ├── API_REFERENCE.md
    ├── EVAL_RESULTS.md
    ├── VIVA_PREPARATION.md
    ├── DEVELOPER_GUIDE.md        # This file
    └── (legacy) architecture.md, results.md, viva_qa.md
```

---

## 6. Adding a New Role to the Default Org

### Step 1: Edit `org/templates/default_org.yaml`

```yaml
# Add after the last role:
- id: hr_manager
  title: HR Manager
  goal: Handle hiring, onboarding, and employee relations
  reports_to: ceo          # or any existing role ID
  tools:
    - list_leads           # only allowed tools
  permissions:
    can_delegate: false
    can_spend: false
    data_scopes:
      - hr                 # must be in ALLOWED_SCOPES
  llm: qwen2.5:3b
  human_approval_required: false
```

### Step 2: Add HR Knowledge Base

```python
# Either via API (POST /api/rag/ingest):
{
  "department": "hr",
  "text": "Hiring process: 3 rounds — technical screen, culture fit, and VP approval...",
  "source": "hr_handbook_2026"
}

# Or add a file:
# rag/kb_samples/hr.txt
# Then update rag/ingest.py's ingest_sample_kb() to include it
```

### Step 3: (Optional) Add Casbin policy for the new role

If you want the HR manager to have additional tool access beyond what's in `default_org.yaml`, add to `authority/rbac_policy.csv`:
```csv
p, hr_manager, list_leads, execute
```

> Note: `sync_policies_from_org` will also auto-generate policies from `tools` in the YAML. The CSV is for static seed policies only.

### Step 4: Restart the server

```powershell
.\run_acompani.ps1
```

The new role will appear in the Org Architect and RBAC matrix immediately.

---

## 7. Adding a New MCP Tool

### Step 1: Implement the tool function

```python
# mcp_servers/analytics_server.py
_reports_store = []

def generate_report(report_type: str, period: str) -> str:
    report = {"type": report_type, "period": period, "generated_at": "..."}
    _reports_store.append(report)
    return f"Report generated: {report_type} for {period}"
```

### Step 2: Register in `mcp_servers/registry.py`

```python
from mcp_servers.analytics_server import generate_report

TOOL_IMPLEMENTATIONS = {
    "create_lead": ...,
    # ... existing tools ...
    "generate_report": generate_report,   # Add this
}
```

### Step 3: Add to validator whitelist in `org/validator.py`

```python
ALLOWED_TOOLS = {
    "create_lead", "update_lead_status", "list_leads",
    "draft_email", "send_email",
    "generate_report",    # Add this
}
```

### Step 4: Assign the tool to relevant roles in YAML

```yaml
- id: data_analyst
  tools:
    - generate_report
```

### Step 5: Add a sample args entry in `api/main.py` (optional, for the tool sandbox)

```python
sample_args = {
    # ... existing ...
    "generate_report": {"report_type": "sales_pipeline", "period": "Q4-2026"},
}
```

---

## 8. Adding a New Department to the RAG Knowledge Base

### Step 1: Create the KB sample file

```
rag/kb_samples/operations.txt

---
Operations Runbook — AcompanI
Deployment pipeline: GitHub Actions → staging → production (zero-downtime blue-green).
On-call rotation: 2-week shifts. PagerDuty escalation threshold: P1 within 5 minutes.
Infrastructure: AWS ECS (containers), RDS PostgreSQL, ElastiCache Redis.
SLA: 99.9% uptime — maximum 8.7 hours downtime per year.
```

### Step 2: Update `ingest_sample_kb` in `rag/ingest.py`

```python
SAMPLE_KB_FILES = [
    ("engineering", BASE_DIR / "rag/kb_samples/engineering.txt"),
    ("sales",       BASE_DIR / "rag/kb_samples/sales.txt"),
    ("finance",     BASE_DIR / "rag/kb_samples/finance.txt"),
    ("operations",  BASE_DIR / "rag/kb_samples/operations.txt"),  # Add this
]
```

### Step 3: Add to `ALLOWED_SCOPES` in `org/validator.py`

```python
ALLOWED_SCOPES = {"engineering", "sales", "finance", "hr", "operations", "all"}
# "operations" is already there — verify it's in the set
```

### Step 4: Re-seed the KB

```powershell
# Via API (POST /api/rag/ingest-samples) or:
.\.venv\Scripts\python.exe -c "from rag.ingest import ingest_sample_kb; ingest_sample_kb(reset=True)"
```

---

## 9. Configuration Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `mock` | `mock` / `openai_compatible` / `ollama` |
| `OPENAI_API_KEY` | — | Groq/Gemini/OpenAI API key |
| `OPENAI_BASE_URL` | Groq URL | Base URL for OpenAI-compatible API |
| `DEFAULT_ROUTER_MODEL` | `qwen2.5:1.5b` | Model for router-tier roles |
| `DEFAULT_WORKER_MODEL` | `qwen2.5:3b` | Model for worker-tier roles |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `EMBEDDING_PROVIDER` | `chroma_default` | `chroma_default` / `ollama` |

### pytest.ini

```ini
[pytest]
testpaths = evals
```

Runs all tests in the `evals/` directory.

---

## 10. Troubleshooting

### "Virtual environment not found"
```powershell
uv venv --python 3.12 .venv
uv pip install -r requirements.txt
```

### "Module not found: chromadb"
```powershell
.\.venv\Scripts\python.exe -m pip install chromadb
# Or reinstall all deps:
uv pip install -r requirements.txt
```

### "ONNX model download fails"
The ChromaDB ONNX model must be pre-downloaded. It should already be cached at:
`C:\Users\<username>\.cache\chroma\onnx_models\all-MiniLM-L6-v2\`

If missing (requires internet):
```powershell
.\.venv\Scripts\python.exe -c "from rag.ingest import get_collection; get_collection()"
# ChromaDB will download the ONNX model on first access
```

### "Port 8000 already in use"
```powershell
# Find the process using port 8000
netstat -ano | findstr :8000
# Kill it (replace PID)
Stop-Process -Id <PID> -Force
```

### "Casbin policy not syncing"
If a newly deployed org's RBAC matrix looks wrong, the server may have cached a stale enforcer. Restart the server:
```powershell
# Ctrl+C to stop, then:
.\run_acompani.ps1
```

### "Tests failing after org deploy"
The tests use `default_org.yaml`, not the active deployed org. Ensure `default_org.yaml` has not been modified. Run:
```powershell
git diff org/templates/default_org.yaml
```

---

## 11. Deployment Options

### Option A — Local Development (Current)
```
.\.venv\Scripts\uvicorn.exe api.main:app --host 127.0.0.1 --port 8000 --reload
```
Only accessible on localhost. `--reload` auto-restarts on code changes.

### Option B — LAN Accessible
```powershell
.\.venv\Scripts\uvicorn.exe api.main:app --host 0.0.0.0 --port 8000
```
Accessible from other devices on the same network at `http://<your-ip>:8000`.  
⚠️ Remove `--reload` in LAN mode.

### Option C — Production Workers
```powershell
# 4 worker processes for concurrent requests
.\.venv\Scripts\uvicorn.exe api.main:app --host 0.0.0.0 --port 8000 --workers 4
```
⚠️ `_active_org` and `_run_history` are in-memory — multiple workers won't share state. Use a Redis-backed state store for true multi-worker production.

### Option D — Gunicorn (Linux/Mac production)
```bash
gunicorn api.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 12. Extending the Schema

To add a new field to `Role` (e.g., `department_budget: float`):

1. **Add to `org/schema.py`:**
```python
class Role(BaseModel):
    # ... existing fields ...
    department_budget: float = 0.0   # New field with default
```

2. **Update `org/validator.py` if the field needs constraints:**
```python
budget = r.get("department_budget", 0.0)
if budget < 0:
    errors.append(f"Role '{rid}' has negative department_budget.")
```

3. **Update `org/templates/default_org.yaml`** to include the field for all roles.

4. **Add to relevant API schemas in `api/schemas.py`** if the field is exposed via API.

5. **Run tests** to verify nothing broke:
```powershell
.\.venv\Scripts\python.exe -m pytest evals -v
```

