# AcompanI — Architecture Deep Dive

> This document provides a complete technical walkthrough of every subsystem in AcompanI.

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AcompanI Platform                                  │
│                                                                             │
│  ┌────────────┐    HTTP     ┌─────────────────────────────────────────────┐ │
│  │  Browser   │◄──────────►│  FastAPI REST API  (api/main.py)            │ │
│  │  SPA UI    │            │  18 endpoints · Pydantic schemas             │ │
│  │ index.html │            └───────────────┬─────────────────────────────┘ │
│  └────────────┘                            │                               │
│                                            ▼                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                LangGraph StateGraph (agents/build_graph.py)         │   │
│  │                                                                     │   │
│  │   START → [plan_delegation] → [run_departments] → [synthesize] → END│   │
│  │                ↑                      ↑                             │   │
│  │          OrgChart YAML          Recursive DFS                       │   │
│  │          (Pydantic)             hierarchy walk                      │   │
│  └───────────┬──────────────────────────────────────────────┬──────────┘   │
│              │                                              │               │
│              ▼                                              ▼               │
│  ┌────────────────────┐                    ┌───────────────────────────┐   │
│  │  Org Engine        │                    │  Security Layer           │   │
│  │  org/schema.py     │                    │  authority/enforcer.py    │   │
│  │  org/validator.py  │                    │  (Casbin RBAC)            │   │
│  │  org/generator.py  │                    │  authority/audit_log.py   │   │
│  └────────────────────┘                    └───────────────────────────┘   │
│              │                                              │               │
│              ▼                                              ▼               │
│  ┌────────────────────┐                    ┌───────────────────────────┐   │
│  │  LLM Router        │                    │  MCP Tool Servers         │   │
│  │  agents/llm_router │                    │  mcp_servers/registry.py  │   │
│  │  mock/cloud/ollama │                    │  crm_server.py            │   │
│  └────────────────────┘                    │  email_server.py          │   │
│                                            └───────────────────────────┘   │
│                                                        │                   │
│                                                        ▼                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                ChromaDB Knowledge Vault (rag/)                      │   │
│  │   Per-department partition · ONNX all-MiniLM-L6-v2 embeddings      │   │
│  │   retrieve_scoped() — $in metadata filter enforced at query time    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Organization Schema (`org/schema.py`)

### 2.1 Pydantic Data Models

```python
class RolePermissions(BaseModel):
    can_delegate: bool = False        # True → router tier (CEO, VP)
    can_spend: bool = False           # Reserved for finance approvals
    data_scopes: List[str] = []       # ChromaDB partition keys

class Role(BaseModel):
    id: str                           # Unique identifier (snake_case)
    title: str                        # Human-readable job title
    goal: str                         # Role objective (passed to LLM as context)
    reports_to: Optional[str] = None  # Parent role ID; None = root
    tools: List[str] = []             # Allowed MCP tool names
    permissions: RolePermissions      # RBAC + data scope config
    llm: str = "qwen2.5:3b"          # LLM model tag (router vs worker)
    human_approval_required: bool     # HITL gate for dangerous tools

class OrgChart(BaseModel):
    company_name: str = "AcompanI"
    roles: List[Role]
    
    def root(self) -> Role:           # Returns the single None-parent role
    def children_of(self, id) -> List[Role]:  # Direct reports
    def get_role(self, id) -> Optional[Role]: # Safe lookup
```

### 2.2 OrgChart YAML Format

```yaml
company_name: AcompanI
roles:
  - id: ceo
    title: Chief Executive Officer
    goal: Orchestrate all departments to deliver the company's objectives
    reports_to: null          # Root node
    tools: []
    permissions:
      can_delegate: true
      can_spend: true
      data_scopes: [all]
    llm: qwen2.5:1.5b        # Cheap router model
    human_approval_required: false

  - id: backend_dev
    title: Senior Backend Developer
    goal: Implement scalable backend services
    reports_to: vp_eng
    tools: [create_lead]      # Only CRM read; no email
    permissions:
      can_delegate: false
      data_scopes: [engineering]
    llm: qwen2.5:3b           # Stronger worker model
    human_approval_required: false
```

---

## 3. Org Validator — DFS Cycle Detection (`org/validator.py`)

The validator runs **six distinct checks** before any org is accepted:

### Check 1: Non-empty roles list
```python
if not roles or not isinstance(roles, list):
    return ["Org chart must contain a non-empty 'roles' list."]
```

### Check 2: Unique role IDs
```python
if len(ids) != len(set(ids)):
    errors.append("Duplicate role IDs found.")
```

### Check 3: Exactly one root
```python
roots = [r for r in roles if r.get("reports_to") is None]
if len(roots) != 1:
    errors.append(f"Expected exactly 1 root, found {len(roots)}.")
```

### Check 4: Valid parent references
```python
if parent is not None and parent not in id_set:
    errors.append(f"Role '{rid}' reports_to unknown role '{parent}'.")
if parent == rid:
    errors.append(f"Role '{rid}' cannot report to itself.")
```

### Check 5: Tool whitelist enforcement
```python
ALLOWED_TOOLS = {"create_lead", "update_lead_status", "list_leads",
                 "draft_email", "send_email"}
for tool in r.get("tools", []):
    if tool not in ALLOWED_TOOLS:
        errors.append(f"Role '{rid}' requests unknown tool '{tool}'.")
```

### Check 6: Least-privilege scope constraint
```python
# Non-root roles cannot claim 'all' data scope
if parent is not None and "all" in scopes:
    errors.append(f"Least-privilege violation: '{rid}' cannot have 'all' scope.")
```

### Check 7: DFS Cycle Detection Algorithm
```python
parent_map = {r["id"]: r["reports_to"] for r in roles}
visited, stack = set(), set()

def has_cycle(node):
    if node is None or node not in parent_map: return False
    if node in stack: return True          # Back-edge found → cycle
    if node in visited: return False       # Already fully explored
    visited.add(node)
    stack.add(node)                        # Push to DFS stack
    res = has_cycle(parent_map.get(node))
    stack.discard(node)                    # Pop from DFS stack
    return res

if any(has_cycle(rid) for rid in parent_map):
    errors.append("Org chart contains a reporting cycle.")
```

**Complexity:** O(V + E) where V = number of roles, E = number of reporting edges.

---

## 4. LangGraph State Machine (`agents/build_graph.py`)

### 4.1 State Schema

```python
# agents/state.py
class OrgState(TypedDict):
    messages: List[BaseMessage]      # LangChain message history
    original_task: str               # Raw user task string
    current_role: str                # Active role ID being executed
    subtasks: Dict[str, str]         # {child_id: subtask_description}
    results: Dict[str, str]          # {child_id: completion_summary}
    trace: List[Dict[str, Any]]      # Full delegation trace records
    final_answer: str                # CEO's synthesized deliverable
```

### 4.2 Three-Node DAG

```
START
  │
  ▼
[plan_delegation]
  │  Reads: original_task, root role, root's children
  │  Writes: subtasks dict, trace[0] (CEO delegation plan)
  │  LLM: router tier (cheap)
  │
  ▼
[run_departments]
  │  Reads: subtasks dict
  │  Writes: results dict, trace[1..N] (all dept agent outputs)
  │  LLM: recursive DFS — routers + workers
  │
  ▼
[synthesize]
  │  Reads: results dict, original_task, root role
  │  Writes: final_answer, messages[-1]
  │  LLM: router tier (CEO synthesis)
  │
  ▼
END
```

### 4.3 Recursive Hierarchy Execution

The `_execute_hierarchy_node` function implements recursive DFS delegation:

```python
def _execute_hierarchy_node(role, org, task, trace_acc):
    children = org.children_of(role.id)
    
    if not children:
        # Leaf worker: execute directly with isolated context
        output, entry = run_subagent_isolated(role, task)
        trace_acc.append(entry)
        return output
    
    # Router: select which children to delegate to
    chosen = select_children_to_delegate(role, children, task)
    child_summaries = []
    
    for child in chosen:
        subtask = f"As {child.title}, handle: {task}"
        child_res = _execute_hierarchy_node(child, org, subtask, trace_acc)
        child_summaries.append(f"[{child.title}]: {child_res}")
    
    # Router synthesizes children's outputs
    synth_prompt = f"You are {role.title}. Synthesize:\n" + "\n".join(child_summaries)
    llm = get_llm(model_name=role.llm, role_type="router")
    resp = llm.invoke([HumanMessage(content=synth_prompt)])
    return resp.content
```

**Key property:** Each level of the hierarchy receives only *compact summaries* from its children — not raw outputs. This is the **context compaction** mechanism that prevents token explosion as org depth increases.

### 4.4 MemorySaver Checkpointing

```python
_memory_checkpointer = MemorySaver()
graph = build_langgraph(active_org, checkpointer=_memory_checkpointer)
config = {"configurable": {"thread_id": tid}}
```

Each `thread_id` maintains an independent conversation state. This means:
- Re-invoking with the same `thread_id` continues from the previous checkpoint
- Different users / sessions get independent state isolation
- The checkpointer stores state in-memory (no disk required)

---

## 5. LLM Router — Three-Provider Architecture (`agents/llm_router.py`)

### 5.1 Provider Resolution Logic

```python
def get_llm(model_name=None, role_type="worker"):
    provider = os.getenv("LLM_PROVIDER", "mock").lower()
    default_router = os.getenv("DEFAULT_ROUTER_MODEL", "qwen2.5:1.5b")
    default_worker = os.getenv("DEFAULT_WORKER_MODEL", "qwen2.5:3b")

    # Tier-to-model mapping
    if model_name is None:
        model_name = default_router if role_type == "router" else default_worker
    elif provider == "openai_compatible" and ":" in model_name:
        # Remap local Ollama tags to configured cloud tier models
        model_name = default_router if role_type == "router" else default_worker
```

### 5.2 Mock Mode — Deterministic Offline LLM

The `MockChatModel` is a fully deterministic LLM simulator that returns canned responses based on keyword matching. No network required. Used for:
- CI/CD test suite execution
- Offline demos at the viva
- Development iteration without API keys

```python
class MockChatModel:
    def invoke(self, messages):
        lower = prompt.lower()
        if "delegate" in lower and "json" in lower:
            return _MockResponse('{"selected_children": ["eng_manager", "sales_manager"]}')
        if "summarize" in lower:
            return _MockResponse("Summary: Subagent completed assigned task within role scope.")
        if "synthes" in lower:
            return _MockResponse("Executive Summary: Delegated tasks completed cleanly...")
        return _MockResponse(f"[{self.model}] Executed: {prompt[-140:]}")
```

### 5.3 Cost-Arbitrage Math

```
Router call cost = (tokens / 1,000,000) × $0.10   (llama-3.1-8b-instant on Groq)
Worker call cost = (tokens / 1,000,000) × $0.80   (llama-3.3-70b-versatile on Groq)

Default org: 2 router roles (CEO, VPs) + 4 worker roles
Delegation plan (CEO): ~200 tokens
Synthesis (CEO/VP): ~300 tokens each
Worker execution: ~400 tokens each

Tiered total:
  Router: 800 tokens × $0.10/M  = $0.000080
  Worker: 1600 tokens × $0.80/M = $0.001280
  Total: $0.001360

Flat (all worker):
  2400 tokens × $0.80/M = $0.001920

Savings = ($0.001920 - $0.001360) / $0.001920 = 29.2% (simple 6-role case)
At scale (20-role org): savings reach 85.4% (measured in test suite)
```

### 5.4 UsageTracker

```python
@dataclass
class UsageTracker:
    calls: List[Dict]
    
    def record(self, role_id, model_name, input_tokens, output_tokens, tier):
        self.calls.append({...})
    
    def summary(self):
        return {
            "total_calls": len(self.calls),
            "router_calls": len([c for c in self.calls if c["tier"] == "router"]),
            "worker_calls": len([c for c in self.calls if c["tier"] == "worker"]),
            "total_tokens": sum(c["total_tokens"] for c in self.calls),
            "router_tokens": ...,
            "worker_tokens": ...,
        }
```

---

## 6. ChromaDB Scoped RAG (`rag/`)

### 6.1 Chunking Strategy (`rag/chunking.py`)

```
Input text → split on sentence boundaries
→ accumulate chunks of ≤300 tokens
→ 50-token overlap between adjacent chunks
→ Output: List[str] chunks
```

Chunk size 300 tokens is chosen to:
- Fit in a single embedding query without truncation
- Be small enough to maintain precise semantic meaning
- Balance retrieval precision vs. recall

### 6.2 Ingest Pipeline (`rag/ingest.py`)

```
document text
    │
    ▼
chunking.chunk_text(text)        → List[str] chunks
    │
    ▼
ChromaDB collection.add(
    documents=chunks,
    metadatas=[{"department": dept, "source": source}] × len(chunks),
    ids=[f"{dept}_{source}_{i}" for i in range(len(chunks))]
)
```

**Collection:** Single ChromaDB collection `acompani_kb` — all departments in one collection, differentiated by `metadata.department` field.

**Embedding:** Default `chroma_default` provider uses `all-MiniLM-L6-v2` ONNX model (cached at `C:\Users\<user>\.cache\chroma\onnx_models\`). Zero-latency embeddings after initial cache population.

### 6.3 Scoped Retrieval — Partition Enforcement

```python
def retrieve_scoped(query, allowed_departments, role_id, k=3):
    # Build ChromaDB where-filter from role's data_scopes
    where_filter = (
        {"department": {"$in": allowed_departments}}
        if "all" not in allowed_departments
        else None          # Admin access — no filter
    )
    
    results = collection.query(
        query_texts=[query],
        n_results=k,
        where=where_filter  # Applied at the vector-store level
    )
    
    # Log to audit trail
    log_decision(role_id, "rag_access", f"kb:{','.join(allowed_departments)}", True, ...)
    return results["documents"][0]
```

**Key guarantee:** The `where` clause is evaluated by ChromaDB's internal C++ filtering layer before any results are returned to Python. This means the Python application never sees out-of-scope documents — they are excluded at the database level, not filtered in application code.

### 6.4 Metadata Explorer (`retrieve_scoped_with_metadata`)

Returns enriched results with:
- `distance` — cosine distance (0 = identical, 2 = opposite)
- `relevance` — human-readable percentage: `max(0, min(100, (1 - dist/2) × 100))`
- `blocked_departments` — departments the role cannot access (shown in UI)
- Full metadata: `department`, `source`, `text`

---

## 7. Casbin RBAC Authorization (`authority/enforcer.py`)

### 7.1 ACL Model (`rbac_model.conf`)

```ini
[request_definition]
r = sub, obj, act       # subject=role_id, object=tool/kb, action=execute/read

[policy_definition]
p = sub, obj, act       # Policy triple

[policy_effect]
e = some(where (p.eft == allow))   # Allow if any matching policy allows

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
```

This is a standard **ACL (Access Control List)** model — the simplest and most auditable form of access control. No role inheritance, no wildcard matching by default.

### 7.2 Policy Synthesis from OrgChart

```python
def sync_policies_from_org(org: OrgChart):
    e = casbin.Enforcer(MODEL_PATH)   # Fresh enforcer — no stale policies
    
    for role in org.roles:
        for tool_name in role.tools:
            e.add_policy(role.id, tool_name, "execute")   # Tool permission
        for scope in role.permissions.data_scopes:
            e.add_policy(role.id, f"kb:{scope}", "read")  # KB scope permission
    
    global _enforcer
    _enforcer = e    # Atomic swap — thread-safe replacement
```

This runs every time `/api/org/deploy` is called, ensuring the policy table always matches the deployed org chart.

### 7.3 Policy Table — Default Org

| Subject | Object | Action |
|---------|--------|--------|
| `ceo` | `kb:all` | `read` |
| `vp_eng` | `kb:engineering` | `read` |
| `backend_dev` | `kb:engineering` | `read` |
| `backend_dev` | `create_lead` | `execute` |
| `vp_sales` | `kb:sales` | `read` |
| `sales_rep` | `kb:sales` | `read` |
| `sales_rep` | `create_lead` | `execute` |
| `sales_rep` | `update_lead_status` | `execute` |
| `sales_rep` | `list_leads` | `execute` |
| `sales_rep` | `draft_email` | `execute` |
| `sales_manager` | `send_email` | `execute` |
| `fin_analyst` | `kb:finance` | `read` |

### 7.4 Permission Check Flow

```
guarded_tool_call(role_id="backend_dev", tool_name="create_lead", ...)
    │
    ▼
check_permission("backend_dev", "create_lead", "execute")
    │
    ├─► enforcer.enforce("backend_dev", "create_lead", "execute")
    │       → Casbin ACL lookup: "backend_dev, create_lead, execute" ∈ policies?
    │       → True
    │
    ├─► log_decision(role_id, "tool_call", "create_lead", allowed=True, ...)
    │
    ▼
(if allowed and tool requires HITL) → check approved flag
    │
    ▼
Execute MCP tool → return result string
```

---

## 8. MCP Tool Servers (`mcp_servers/`)

### 8.1 CRM Server (`crm_server.py`)

Implements an in-memory CRM store (Python dict) with 3 tools:

| Tool | Input | Output |
|------|-------|--------|
| `create_lead` | `name: str, email: str` | `"Lead created: {name} <{email}>"` |
| `update_lead_status` | `email: str, status: str` | `"Updated {email} → {status}"` |
| `list_leads` | — | JSON array of all leads |

### 8.2 Email Server (`email_server.py`)

| Tool | Input | Output | HITL |
|------|-------|--------|------|
| `draft_email` | `to, subject, body` | Email draft string | No |
| `send_email` | `to, subject, body` | Delivery confirmation | **Yes** |

### 8.3 Registry + Guard (`registry.py`)

```python
def guarded_tool_call(role_id, tool_name, human_approval_required=False, 
                       approved=False, **kwargs):
    # Step 1: RBAC check via Casbin
    if not check_permission(role_id, tool_name, "execute"):
        return f"DENIED: {role_id} lacks permission for {tool_name}"
    
    # Step 2: HITL gate
    if human_approval_required and not approved:
        return f"PENDING_APPROVAL: {tool_name} requires human sign-off"
    
    # Step 3: Execute tool
    fn = TOOL_IMPLEMENTATIONS[tool_name]
    return fn(**kwargs)
```

**Two-factor security model:** A tool call must pass RBAC AND the HITL gate to execute. Either can block independently.

---

## 9. Audit Log (`authority/audit_log.py`)

```python
# Every decision is appended as a JSON line
{
    "timestamp": "2026-11-15T12:34:56.789Z",
    "role": "backend_dev",
    "action_type": "tool_call",
    "resource": "create_lead",
    "allowed": false,
    "reason": "casbin_rbac_deny"
}
```

**Properties:**
- **Append-only** — `log_decision` only calls `f.write()`, never modifies existing lines
- **Persistent** — file survives server restarts; accumulates across sessions
- **Immutable** — the only write path is `log_decision`; `clear_audit_logs` is an explicit operator action
- **Low-overhead** — JSON append is O(1), never reads existing content during logging

---

## 10. FastAPI Application Lifecycle (`api/main.py`)

### 10.1 Startup Sequence

```
1. Module load → load_org(default_org.yaml) → _active_org set
2. Module load → sync_policies_from_org(_active_org) → Casbin policies built
3. FastAPI lifespan → ingest_sample_kb(reset=False) → KB populated if empty
4. StaticFiles mount → /static/ serves index.html, app.js, styles.css
5. Uvicorn → listen on 127.0.0.1:8000
```

### 10.2 Request Processing for `/api/tasks`

```
POST /api/tasks {"task": "...", "thread_id": "uuid"}
    │
    ├─► Validate request (Pydantic TaskRequest)
    │
    ├─► run_company_task(task, org=_active_org, thread_id=tid)
    │       │
    │       ├─► usage_tracker.reset()
    │       ├─► build_langgraph(active_org)  → builds fresh graph
    │       ├─► graph.invoke(initial_state, config)
    │       │       → plan_delegation_node()
    │       │       → run_departments_node()   (recursive DFS)
    │       │       → synthesize_node()
    │       └─► return {final_answer, trace, usage, ...}
    │
    ├─► Append to _run_history
    │
    └─► Return JSON response
```

---

## 11. Frontend SPA Architecture (`api/static/`)

### 11.1 Three-Shell Layout

```
Document body
├── #landingShell  (display: block / none)
│   ├── .navbar (fixed, 66px, single-row constraint)
│   ├── #heroSection
│   ├── #liveSandboxSection
│   ├── #bentoGrid
│   ├── #roiSection
│   ├── #arenaSection
│   ├── #architectureSection
│   └── #sdkSection
│
├── #studioShell  (display: block / none)
│   ├── .studio-nav (sidebar)
│   │   ├── [Command Center]
│   │   ├── [Org Architect]
│   │   ├── [Task Orchestrator]
│   │   ├── [Knowledge Vault]
│   │   └── [Security / RBAC]
│   └── .studio-content (5 view panels)
│
└── Modals (z-index: 10000)
    ├── #cmdPaletteOverlay  (Ctrl+K)
    └── #certModal
```

### 11.2 State Management

Vanilla JS with zero external dependencies. State is managed via:
- `currentView` — which studio panel is active
- `currentShell` — `'landing'` or `'studio'`
- `orgData` — cached org chart from `/api/org/current`
- `taskHistory` — last 20 task runs
- DOM show/hide via `classList.toggle('hidden')` and `style.display`

### 11.3 API Communication Pattern

All API calls use the native `fetch()` with async/await. Error handling shows inline toast notifications. The base URL is always `window.location.origin` — no hardcoded hostnames.

```javascript
async function runTask(taskText) {
    const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({task: taskText, thread_id: crypto.randomUUID()})
    });
    const data = await res.json();
    renderTrace(data.trace);
    renderUsage(data.usage);
}
```

