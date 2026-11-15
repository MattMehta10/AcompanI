# AcompanI — API Reference

> **Base URL:** `http://127.0.0.1:8000`  
> **OpenAPI Docs:** `http://127.0.0.1:8000/docs` (Swagger UI, auto-generated)  
> **ReDoc:** `http://127.0.0.1:8000/redoc`  
> **Content-Type:** `application/json` for all POST bodies  
> **Authentication:** None (local deployment)

---

## Telemetry Endpoints

### GET `/api/health`

Returns the system health status and current active company.

**Response 200:**
```json
{
  "status": "ok",
  "brand": "AcompanI",
  "version": "1.0.0",
  "active_company": "AcompanI",
  "llm_provider": "mock"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always `"ok"` if server is running |
| `brand` | string | Always `"AcompanI"` |
| `version` | string | Semantic version of the platform |
| `active_company` | string | `company_name` from the currently deployed org |
| `llm_provider` | string | Active LLM provider: `mock`, `openai_compatible`, or `ollama` |

---

### GET `/api/metrics/summary`

Returns a live dashboard summary: roles, RAG chunk counts by department, security audit totals, and run history count.

**Response 200:**
```json
{
  "company_name": "AcompanI",
  "llm_provider": "mock",
  "roles": {
    "total": 6,
    "routers": 3,
    "workers": 3
  },
  "rag": {
    "total_chunks": 24,
    "by_department": {
      "engineering": 8,
      "sales": 8,
      "finance": 8
    }
  },
  "security": {
    "total_checks": 47,
    "allowed": 32,
    "denied": 15
  },
  "runs_completed": 3
}
```

**Notes:**
- `routers` = roles where `permissions.can_delegate == true`
- `workers` = roles where `permissions.can_delegate == false`
- `total_checks` reads the last 500 audit log entries
- `runs_completed` is in-memory; resets on server restart

---

### GET `/api/reports/certificate`

Generates a real-time executive compliance certificate with SHA-256 signature derived from org state.

**Response 200:**
```json
{
  "certificate_id": "ACMP-ENT-A3F72B1C",
  "signature_hash": "SHA256:A3F72B1C9D4E5F6A",
  "issued_at": "2026-11-15 12:00:00 UTC",
  "company_name": "AcompanI",
  "security_grade": "A+ ZERO-TRUST VERIFIED",
  "dag_valid": true,
  "roles_count": 6,
  "vector_chunks": 24,
  "audit_summary": {
    "total_checks": 47,
    "allowed": 32,
    "denied": 15
  },
  "eval_suite": "9 / 9 Automated Suites Passed (DAG, RBAC, Scoped RAG, Cost Arbitrage)",
  "roles": [
    {
      "id": "ceo",
      "title": "Chief Executive Officer",
      "reports_to": null,
      "scopes": ["all"],
      "tools": [],
      "hitl": false
    }
  ]
}
```

**Signature computation:**
```python
seed = f"{company_name}:{num_roles}:{vector_chunks}"
sig = hashlib.sha256(seed.encode()).hexdigest()[:16].upper()
certificate_id = f"ACMP-ENT-{sig[:8]}"
```

---

## Organization Endpoints

### GET `/api/org/current`

Returns the full active org chart as a JSON object.

**Response 200:**
```json
{
  "org_chart": {
    "company_name": "AcompanI",
    "roles": [
      {
        "id": "ceo",
        "title": "Chief Executive Officer",
        "goal": "Orchestrate all departments...",
        "reports_to": null,
        "tools": [],
        "permissions": {
          "can_delegate": true,
          "can_spend": true,
          "data_scopes": ["all"]
        },
        "llm": "qwen2.5:1.5b",
        "human_approval_required": false
      }
    ]
  }
}
```

---

### POST `/api/org/generate`

Generate a new org chart from a free-text business summary using the LLM generator.

**Request:**
```json
{
  "business_summary": "A SaaS startup building B2B project management tools with an engineering team of 5 and a sales team of 3."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `business_summary` | string | ✅ | Free-text description of the company (non-empty) |

**Response 200:**
```json
{
  "org_chart": {
    "company_name": "AcompanI",
    "roles": [ ... ]
  },
  "validation_errors": []
}
```

**Error 400** — empty `business_summary`:
```json
{"detail": "business_summary cannot be empty"}
```

**Notes:**
- The generated org chart is NOT automatically deployed. Call `/api/org/deploy` to activate it.
- `validation_errors` will be non-empty if the generated org has structural issues. The UI shows these before allowing deployment.

---

### POST `/api/org/deploy`

Validate and deploy a new org chart. Rebuilds Casbin policies and updates the active org in memory. Persists to `org/templates/generated_active.yaml`.

**Request:**
```json
{
  "org_chart": {
    "company_name": "My Startup",
    "roles": [
      {
        "id": "ceo",
        "title": "CEO",
        "goal": "Lead the company",
        "reports_to": null,
        "tools": [],
        "permissions": {"can_delegate": true, "data_scopes": ["all"]},
        "llm": "qwen2.5:1.5b",
        "human_approval_required": false
      },
      {
        "id": "eng",
        "title": "Engineer",
        "goal": "Build products",
        "reports_to": "ceo",
        "tools": ["create_lead"],
        "permissions": {"can_delegate": false, "data_scopes": ["engineering"]},
        "llm": "qwen2.5:3b",
        "human_approval_required": false
      }
    ]
  }
}
```

**Response 200:**
```json
{
  "status": "deployed",
  "company_name": "My Startup",
  "roles_count": 2
}
```

**Error 422** — validation failure:
```json
{
  "detail": {
    "validation_errors": [
      "Org chart contains a reporting cycle.",
      "Least-privilege violation: non-root role 'eng' cannot have 'all' data_scope."
    ]
  }
}
```

---

## Execution Endpoints

### POST `/api/tasks`

Execute a natural-language task across the entire company hierarchy. Returns the final synthesized answer plus full delegation trace and token usage.

**Request:**
```json
{
  "task": "Set up a user authentication system and draft an email announcing the launch.",
  "thread_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `task` | string | ✅ | Natural language task description |
| `thread_id` | string | ❌ | UUID for conversation continuity; auto-generated if omitted |

**Response 200:**
```json
{
  "thread_id": "550e8400-...",
  "company_name": "AcompanI",
  "final_answer": "Executive Summary: Engineering team has implemented the auth endpoint using JWT...",
  "subtasks": {
    "vp_eng": "As VP of Engineering, handle the technical portion of: ...",
    "vp_sales": "As VP of Sales, handle the marketing portion of: ..."
  },
  "department_results": {
    "vp_eng": "JWT auth endpoint implemented with rate limiting...",
    "vp_sales": "Launch email drafted targeting 500 B2B prospects..."
  },
  "trace": [
    {
      "role_id": "ceo",
      "title": "Chief Executive Officer",
      "model": "qwen2.5:1.5b",
      "tier": "router",
      "delegated_to": ["vp_eng", "vp_sales"],
      "output_preview": "Planned delegation to: ['vp_eng', 'vp_sales']"
    },
    {
      "role_id": "backend_dev",
      "title": "Senior Backend Developer",
      "model": "qwen2.5:3b",
      "tier": "worker",
      "raw_tokens": 142,
      "compacted_tokens": 142,
      "output_preview": "[mock] Executed task: implement auth endpoint..."
    }
  ],
  "usage": {
    "total_calls": 6,
    "router_calls": 3,
    "worker_calls": 3,
    "total_tokens": 1240,
    "router_tokens": 420,
    "worker_tokens": 820,
    "calls": [ ... ]
  }
}
```

**Error 400** — empty task:
```json
{"detail": "task cannot be empty"}
```

---

### GET `/api/tasks/history`

Returns the last 20 task runs (most recent first) from the in-memory run history.

**Response 200:**
```json
{
  "runs": [
    {
      "thread_id": "550e8400-...",
      "task": "Set up auth endpoint and launch email...",
      "company_name": "AcompanI",
      "usage": { "total_calls": 6, "total_tokens": 1240, ... }
    }
  ]
}
```

**Note:** Run history is in-memory and resets on server restart. Persisted runs are in the audit log.

---

## Knowledge Vault Endpoints

### POST `/api/rag/ingest-samples`

Reset and re-ingest the three built-in sample knowledge bases (engineering, sales, finance).

**Request:** No body required.

**Response 200:**
```json
{
  "status": "ingested",
  "chunks_per_department": {
    "engineering": 8,
    "sales": 8,
    "finance": 8
  }
}
```

**Note:** `reset=True` — this clears all existing vectors before re-ingesting. Use only when you want to restore the default knowledge base.

---

### POST `/api/rag/ingest`

Ingest a custom document into a specific department's partition.

**Request:**
```json
{
  "department": "engineering",
  "text": "The new microservices architecture uses gRPC for inter-service communication. Each service exposes a health endpoint at /health. Circuit breakers are implemented via Resilience4j.",
  "source": "architecture_decision_record_2026"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `department` | string | ✅ | Target partition: `engineering`, `sales`, `finance`, `hr`, `operations` |
| `text` | string | ✅ | Document content to chunk and embed |
| `source` | string | ❌ | Source identifier for metadata (default: `"manual_upload"`) |

**Response 200:**
```json
{
  "status": "ingested",
  "department": "engineering",
  "chunks": 3
}
```

**Error 400:**
```json
{"detail": "department and text are required"}
```

---

### POST `/api/rag/search`

Live scoped vector search — demonstrates ChromaDB partition enforcement. Returns results with similarity distances, metadata, and a list of blocked departments.

**Request:**
```json
{
  "query": "What is the monthly burn rate?",
  "role_id": "backend_dev",
  "department": null,
  "k": 4
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | ✅ | Natural language search query |
| `role_id` | string | ❌ | Look up scopes from active org role |
| `department` | string | ❌ | Explicit department scope (used if no `role_id`) |
| `k` | integer | ❌ | Number of results (1–10, default 4) |

**Response 200 (role_id="backend_dev" — engineering scope only):**
```json
{
  "role_id": "backend_dev",
  "allowed_departments": ["engineering"],
  "all_departments": ["engineering", "finance", "sales"],
  "blocked_departments": ["finance", "sales"],
  "results": [
    {
      "text": "The backend stack uses FastAPI + PostgreSQL. Redis handles session caching...",
      "department": "engineering",
      "source": "engineering_kb",
      "distance": 0.4821,
      "relevance": 76
    }
  ]
}
```

**Note:** Even if the query mentions "burn rate" (a finance keyword), `backend_dev` will never receive finance documents because the `$in: ["engineering"]` filter is enforced at the ChromaDB query layer.

---

## Security & Governance Endpoints

### POST `/api/security/probe`

Run three simultaneous zero-trust attack probes against the active org. Demonstrates RAG isolation, RBAC denial, and HITL gate enforcement in one call.

**Request:** No body required.

**Response 200:**
```json
{
  "rag_isolation": {
    "role_tested": "backend_dev",
    "scopes": ["engineering"],
    "finance_secret_leaked": false,
    "status": "PASS (0 leaks)"
  },
  "rbac_tool_denial": {
    "role_tested": "backend_dev",
    "tool_attempted": "create_lead",
    "result": "DENIED: backend_dev lacks permission for create_lead"
  },
  "human_gate_probe": {
    "role_tested": "sales_rep",
    "tool_attempted": "send_email",
    "result": "PENDING_APPROVAL: send_email requires human sign-off"
  }
}
```

---

### GET `/api/security/matrix`

Returns the full Casbin RBAC authorization matrix for every role × every tool.

**Response 200:**
```json
{
  "tools": ["create_lead", "update_lead_status", "list_leads", "draft_email", "send_email"],
  "roles": [
    {
      "role_id": "ceo",
      "title": "Chief Executive Officer",
      "tier": "ROOT",
      "data_scopes": ["all"],
      "human_approval_required": false,
      "tools": {
        "create_lead": {
          "status": "DENIED",
          "rule": "DENY (ceo lacks create_lead)"
        },
        "send_email": {
          "status": "DENIED",
          "rule": "DENY (ceo lacks send_email)"
        }
      }
    },
    {
      "role_id": "sales_rep",
      "title": "Sales Representative",
      "tier": "WORKER",
      "data_scopes": ["sales"],
      "human_approval_required": false,
      "tools": {
        "create_lead": {
          "status": "ALLOWED",
          "rule": "p, sales_rep, create_lead, execute"
        },
        "send_email": {
          "status": "DENIED",
          "rule": "DENY (sales_rep lacks send_email)"
        }
      }
    }
  ]
}
```

**Status values:**
| Status | Meaning |
|--------|---------|
| `ALLOWED` | Casbin permits execution |
| `DENIED` | Casbin has no matching policy |
| `HITL_REQUIRED` | Casbin allows, but `human_approval_required=true` and tool is `send_email` |

---

### POST `/api/tools/test`

Interactive sandbox: test whether a specific role can execute a specific MCP tool. Uses the full RBAC + HITL guard stack.

**Request:**
```json
{
  "role_id": "sales_rep",
  "tool_name": "create_lead",
  "approved": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role_id` | string | ✅ | Role ID to test |
| `tool_name` | string | ✅ | One of: `create_lead`, `update_lead_status`, `list_leads`, `draft_email`, `send_email` |
| `approved` | boolean | ❌ | HITL approval flag (default: false) |

**Response 200 — allowed:**
```json
{
  "role_id": "sales_rep",
  "tool_name": "create_lead",
  "result": "Lead created: Enterprise Prospect <buyer@enterprise.io>"
}
```

**Response 200 — denied:**
```json
{
  "role_id": "backend_dev",
  "tool_name": "create_lead",
  "result": "DENIED: backend_dev lacks permission for create_lead"
}
```

**Error 404** — unknown role:
```json
{"detail": "Role 'nonexistent' not found in active org"}
```

---

### POST `/api/tools/approve`

Execute a tool that requires HITL approval. Passes `approved=True` through the full guard stack.

**Request:**
```json
{
  "role_id": "sales_manager",
  "tool_name": "send_email",
  "kwargs": {
    "to": "vip@acme.io",
    "subject": "Partnership Proposal",
    "body": "Following up on our conversation..."
  }
}
```

**Response 200:**
```json
{
  "status": "executed",
  "result": "Email sent to vip@acme.io | Subject: Partnership Proposal"
}
```

---

### GET `/api/audit-logs`

Read the most recent audit log entries.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Number of entries to return (max 500) |

**Response 200:**
```json
{
  "logs": [
    {
      "timestamp": "2026-11-15T12:34:56.789Z",
      "role": "backend_dev",
      "action_type": "tool_call",
      "resource": "create_lead",
      "allowed": false,
      "reason": "casbin_rbac_deny"
    },
    {
      "timestamp": "2026-11-15T12:35:01.123Z",
      "role": "sales_rep",
      "action_type": "rag_access",
      "resource": "kb:sales",
      "allowed": true,
      "reason": "returned_3_chunks"
    }
  ]
}
```

**Audit entry fields:**
| Field | Type | Values |
|-------|------|--------|
| `timestamp` | ISO 8601 string | UTC datetime |
| `role` | string | Role ID |
| `action_type` | string | `tool_call` or `rag_access` |
| `resource` | string | Tool name or `kb:{departments}` |
| `allowed` | boolean | True/False |
| `reason` | string | `casbin_rbac_allow`, `casbin_rbac_deny`, `returned_N_chunks`, `empty_data_scopes` |

---

### DELETE `/api/audit-logs`

Clear all audit log entries. Irreversible.

**Response 200:**
```json
{"status": "cleared"}
```

---

## Static Assets

### GET `/`
Returns the full SPA `index.html`. Served by FastAPI `HTMLResponse`.

### GET `/static/styles.css`
Returns the design system stylesheet (40 KB).

### GET `/static/app.js`
Returns the client-side application logic (46 KB).

---

## Error Reference

| HTTP Status | Scenario |
|-------------|----------|
| 200 | Successful operation |
| 400 | Invalid request data (empty required field) |
| 404 | Role ID not found in active org |
| 422 | Org chart validation failure (structural errors) |
| 500 | Internal server error (unexpected) |

All errors follow FastAPI's standard `{"detail": "..."}` format, except 422 which uses `{"detail": {"validation_errors": [...]}}`.

