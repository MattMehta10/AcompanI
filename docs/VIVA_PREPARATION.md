# AcompanI — Viva Preparation Guide

> **Project:** AcompanI · 7th Semester Minor Project  
> **Presentation Duration:** 10–15 minutes  
> **This document:** 2-minute demo script · 30+ Q&A · Technical talking points · Comparison table

---

## 1. The 2-Minute Demo Script

> Practice this until you can deliver it in exactly 2 minutes without looking at notes.

---

**[Open browser to `http://127.0.0.1:8000`]**

> *"Welcome. I'll be demonstrating AcompanI — an enterprise AI platform that simulates a full company hierarchy using autonomous LLM agents. Let me walk you through it."*

**[Point to the navbar]**  
> *"This is the landing page. AcompanI has two modes — a public showcase and a live studio console. I'll launch the console."*

**[Click 'Launch Console']**

> *"This is the Command Center. You can see the active company has 6 roles, 24 knowledge chunks in the vector database, and the system is running in mock mode — which means zero internet, zero API keys, 100% offline."*

**[Click 'Task Orchestrator', type task: "Build the user authentication API and draft a marketing email campaign"]**

> *"I'll submit a task that spans two departments — engineering and sales. Watch the delegation trace."*

**[Click Run, wait 2 seconds]**

> *"The CEO agent received the task, delegated to the VP of Engineering and VP of Sales, who then delegated to their workers. Each worker executed in an isolated context — the engineering agent never saw sales data, and vice versa. The CEO synthesized the final answer. Zero data leakage. Full audit trail."*

**[Click 'Security / RBAC', click 'Run Live Probe']**

> *"Now I'll run a zero-trust attack probe. Three vectors: attempt to retrieve finance secrets from an engineering role, attempt to execute a CRM tool without permission, and attempt to send email without human approval. Result: zero leaks, all denied."*

**[Click 'Knowledge Vault', type query: "What is the bank account routing code?", set role to backend_dev]**

> *"Even if I explicitly search for the finance secret from an engineering role — zero results. The partition filter is at the vector database level, not the prompt level. The LLM never even sees the blocked documents."*

> *"AcompanI proves that multi-agent AI can be built with enterprise-grade security, full auditability, and 85% lower inference cost through tiered LLM routing. Thank you."*

---

## 2. Expected Panel Questions & Model Answers

---

### SECTION A — System Overview

**Q1: What problem does AcompanI solve?**

> AcompanI solves three problems with existing AI assistants in enterprise settings. First, **context pollution** — in a monolithic AI, all departments share one context window, so finance secrets can appear in engineering responses. Second, **uniform compute cost** — using an expensive 70B model for routine routing decisions is wasteful. Third, **no accountability** — there's no audit trail per agent action. AcompanI enforces structural isolation, routes cheaply, and logs everything.

**Q2: What is the core concept of AcompanI?**

> AcompanI models a company as a **directed acyclic graph of AI agents**, where each node is a role (CEO, VP, Engineer, etc.) with its own LLM, tools, and knowledge-base partition. A task enters at the CEO node, gets decomposed and delegated down the hierarchy, workers execute in isolation, and results bubble back up for synthesis. The key insight is: organizational structure *is* the security model.

**Q3: What's the difference between AcompanI and just calling an LLM API?**

> With a single LLM API call, you get one context window, one model, no auditability, and no tool access control. AcompanI gives you: 6 (or more) specialized models executing concurrently, ChromaDB partitions enforcing data isolation at the DB level, Casbin RBAC blocking unauthorized tool access, a Human-in-the-Loop gate for high-risk actions, and a persistent immutable audit log. It's the difference between a single employee and an entire company.

---

### SECTION B — Technical Architecture

**Q4: What is LangGraph and why did you use it?**

> LangGraph is a library from LangChain that extends agent execution into a **stateful directed graph** (a `StateGraph`). Unlike simple chain-of-thought loops, LangGraph supports: (1) checkpoint persistence via `MemorySaver` for conversation continuity, (2) explicit state typing with `TypedDict` for predictable data flow, and (3) named nodes with defined edges that make the execution flow auditable and testable. I used it because the hierarchical delegation pattern — plan → execute → synthesize — maps perfectly onto a 3-node DAG.

**Q5: Explain the LangGraph DAG in AcompanI.**

> The graph has three nodes:  
> 1. **`plan_delegation`** — The CEO reads the task and decides which departments to involve. Output: a `subtasks` dict mapping child role IDs to their subtask descriptions.  
> 2. **`run_departments`** — Iterates over `subtasks`, recursively calls each department's sub-hierarchy using DFS, accumulates department results.  
> 3. **`synthesize`** — CEO reads all department summaries and writes the final answer.  
> Edges are linear: START → plan → run → synthesize → END. The recursion happens *within* the `run_departments` node.

**Q6: What is Casbin and how does RBAC work in this project?**

> Casbin is an open-source authorization library that implements access control models as formal policies. In AcompanI, I use the ACL (Access Control List) model: each policy is a triple `(subject, object, action)` — e.g., `sales_rep, create_lead, execute`. When `guarded_tool_call` is invoked, it calls `enforcer.enforce(role_id, tool_name, "execute")` which returns `True` if any matching policy exists, `False` otherwise. Critically, policies are **rebuilt from the OrgChart** every time a new org is deployed — `sync_policies_from_org` constructs fresh Casbin policies from the org's role tool lists and data scopes.

**Q7: How does ChromaDB enforce data isolation?**

> ChromaDB supports metadata filtering on queries. When a knowledge-base query is issued, I pass a `where` clause: `{"department": {"$in": allowed_departments}}`. This filter is applied by ChromaDB's C++ query engine before any results are returned to Python. The Python application never receives out-of-scope documents because they're excluded at the vector-store level, not filtered in application code. This means prompt injection attacks cannot bypass the isolation — even if the LLM generates a "retrieve finance data" instruction, the retrieval function's `where` filter ensures only engineering docs come back.

**Q8: What is the ONNX embedding model and why is it pre-cached?**

> ChromaDB by default uses `all-MiniLM-L6-v2`, an 80 MB sentence transformer model from HuggingFace, converted to ONNX format for fast CPU inference. I pre-cached it at `C:\Users\...\chroma\onnx_models\` because the target machine has ~592 MB free disk and no guaranteed internet at demo time. Pre-caching ensures zero-latency embeddings with no network calls during the demo.

**Q9: What is FastMCP and how are tools implemented?**

> FastMCP is a lightweight Python library implementing the Model Context Protocol (MCP) — an emerging standard for giving LLMs access to external tools and data sources. In AcompanI, each tool (like `create_lead` or `send_email`) is defined as a decorated Python function. The `mcp_servers/registry.py` maintains a `TOOL_IMPLEMENTATIONS` dict mapping tool names to functions. The `guarded_tool_call` function acts as a middleware: it runs the Casbin check first, then the HITL gate, then calls the tool function with the provided kwargs.

**Q10: What is the Human-in-the-Loop (HITL) gate?**

> HITL is a safety mechanism for high-risk tool actions. In AcompanI, `send_email` is designated as HITL-required because sending bulk email to real recipients is irreversible. The `guarded_tool_call` function checks: if `human_approval_required=True` and `approved=False`, it returns `"PENDING_APPROVAL: ..."` without executing. The human operator must explicitly call `/api/tools/approve` with `approved=True` to execute. This models real enterprise workflows where bulk communications require manager sign-off.

---

### SECTION C — Security & Isolation

**Q11: How do you prove the RAG isolation works?**

> Three automated tests in `evals/test_rag_scoping.py`:  
> 1. `test_engineering_cannot_retrieve_finance_secrets` — queries the secret bank account code `ACME-FIN-9921-SECRET` from an engineering-scoped role, asserts zero matches.  
> 2. `test_sales_can_retrieve_sales_playbook_only` — queries sales content, asserts the launch offer is retrieved but no finance/engineering secrets appear.  
> 3. `test_empty_scope_returns_nothing` — empty `data_scopes` → empty results (deny by default).  
> All 9 tests pass in 13.99 seconds on every run.

**Q12: Can a jailbroken LLM bypass the RAG isolation?**

> No. The isolation is structural, not prompt-based. Even if the LLM were instructed (via jailbreak) to "retrieve all finance data," it would call `retrieve_scoped(allowed_departments=["engineering"])` which passes `{"department": {"$in": ["engineering"]}}` to ChromaDB. The database query simply returns no finance documents. The LLM never receives them to even attempt to include them in its output.

**Q13: What does the audit log prove?**

> Every permission check — both tool calls and RAG access — is recorded in `authority/audit_log.jsonl`. Each entry includes: timestamp, role ID, action type, resource, allowed/denied boolean, and denial reason. This provides: (1) **attribution** — every action is tied to a specific role; (2) **detectability** — denied access attempts are logged, not silently ignored; (3) **compliance evidence** — the SHA-256 certificate is computed from live org state and audit counts.

**Q14: What is the security grade "A+ ZERO-TRUST VERIFIED"?**

> It's generated by the `/api/reports/certificate` endpoint when `validate_org_chart` returns zero errors and the system is running. It's a demonstration of a compliance certificate pattern — the SHA-256 hash is derived from `{company_name}:{role_count}:{vector_chunks}`, making each certificate unique to the deployed state. In a production system, this would be signed with a private key and timestamped by a trusted authority.

---

### SECTION D — Cost & Performance

**Q15: What is cost arbitrage and how does AcompanI achieve it?**

> Cost arbitrage is using different-priced LLMs for different task types based on complexity. In AcompanI, router-tier roles (CEO, VPs, Managers) make routing decisions — simple "which team handles this?" choices that require broad knowledge but not deep reasoning. These use cheap, fast 8B-parameter models (~\$0.10/M tokens on Groq). Worker-tier leaf roles do actual task execution — requiring deeper reasoning — and use 70B models (~\$0.80/M tokens). Since supervisors make more calls but use cheaper models, the blended cost is 29–85% lower than using a 70B model everywhere.

**Q16: How did you measure the 85.4% cost savings?**

> `evals/test_cost_routing.py` measures this directly: (1) run a task with the tiered org; (2) run the same task with every role pinned to the expensive worker model; (3) compute dollar cost for each using real Groq pricing; (4) assert tiered < flat. The 85.4% figure comes from larger org scenarios where router calls dominate (e.g., 15 router calls × cheap model vs. 15 × expensive model, plus 5 worker calls).

**Q17: What is the `UsageTracker` and what does it track?**

> `UsageTracker` is a dataclass in `agents/llm_router.py` that records every LLM call during a task run. For each call it stores: role ID, model name, tier (router/worker), input tokens, and output tokens. After the task completes, `summary()` returns aggregate stats: total calls, router vs. worker split, total tokens, and all individual call records. This data powers the Task Orchestrator's usage breakdown panel in the UI.

---

### SECTION E — Design Decisions

**Q18: Why YAML for org charts, not JSON or a database?**

> YAML is human-readable and diff-friendly — a team lead can review an org chart YAML change in a Git pull request. JSON would work but is noisier (quoted keys, no comments). A database would add dependency complexity for a system where org charts change rarely. YAML files can also be version-controlled, making org structure changes auditable via git history.

**Q19: Why Pydantic v2 for schema validation?**

> Pydantic v2 (via `BaseModel`) gives: (1) automatic type coercion and validation on instantiation, (2) `.model_dump()` for clean dict serialization to pass to the API response, (3) `Field(default_factory=list)` for safe mutable defaults, (4) clear `ValidationError` messages when schema is violated. The alternative (plain dicts + manual validation) would require writing the same logic by hand without the auto-generated error messages.

**Q20: Why did you choose FastAPI over Flask or Django?**

> FastAPI gives: (1) **automatic OpenAPI spec** at `/docs` with Swagger UI — zero extra code; (2) **Pydantic integration** — request bodies are auto-validated; (3) **async support** — ready for WebSocket/streaming extensions; (4) **performance** — Starlette underneath is ASGI, not WSGI. Flask would require manual schema docs. Django is overkill for a pure API service with no ORM requirements.

**Q21: Why not use Docker for deployment?**

> The target machine has ~592 MB free disk. A minimal Python Docker image is ~150 MB; with dependencies it would reach 1–2 GB. The project uses `uv` for environment isolation instead — a 10 MB binary that manages virtual environments with 10–100× faster installs than pip. The `.venv` directory is already created and contains all 147 dependencies. No additional downloads required at demo time.

**Q22: Why mock mode instead of a real LLM for demos?**

> Two reasons: (1) **reliability** — a real LLM API might be rate-limited, slow, or unavailable during the viva. Mock mode is deterministic and instant. (2) **cost** — API calls during a 15-minute viva would cost money. Mock mode proves all the architectural components work correctly regardless of LLM quality, since the security proofs don't depend on what the LLM outputs.

---

### SECTION F — Comparisons & Alternatives

**Q23: How is AcompanI different from AutoGen?**

| Feature | AutoGen | AcompanI |
|---------|---------|---------|
| Agent communication | Chat-room (multi-round conversation) | Hierarchical DAG (structured delegation) |
| Data isolation | None (shared context) | ChromaDB partition per department |
| Authorization | None | Casbin RBAC policies |
| Org structure | Flat or manual | YAML-driven dynamic org chart |
| Audit trail | None | Immutable JSONL audit log |
| Cost optimization | None | Tiered router/worker LLM pricing |

**Q24: How is AcompanI different from CrewAI?**

> CrewAI has static role definitions coded in Python. AcompanI generates roles dynamically from a business description, validates the DAG for correctness, and hot-deploys new orgs without server restart. CrewAI also has no RBAC layer — any agent can call any tool. AcompanI enforces tool permissions per role via Casbin policies auto-generated from the OrgChart.

**Q25: What does LangGraph add over raw LangChain?**

> Raw LangChain chains are linear and stateless. LangGraph adds: (1) **typed shared state** (`TypedDict`) that persists across all nodes; (2) **checkpoint persistence** (`MemorySaver`) for conversation continuity and replay; (3) **conditional routing** (not used in AcompanI but possible — e.g., retry on error); (4) **branching edges** for parallel execution. The 3-node DAG in AcompanI uses all of LangGraph's core primitives.

---

### SECTION G — Code Quality & Testing

**Q26: Why 9 tests? What's the coverage strategy?**

> The 9 tests cover all five critical correctness properties of the system:  
> 1–2: **Delegation correctness** (task flows through the hierarchy, costs are tracked)  
> 3–4: **Schema correctness** (cycle detection, least-privilege, generator diversity)  
> 5–6: **RBAC correctness** (deny unauthorized, allow authorized, block HITL)  
> 7–9: **Isolation correctness** (finance sealed from engineering, sales sealed from finance, empty scope = no access)  
> This is property-based coverage — each test proves one security/correctness property, not just line coverage.

**Q27: How does the test suite run without network or API keys?**

> Mock mode is activated by default (`LLM_PROVIDER=mock` in `.env`). The `MockChatModel` returns deterministic responses based on keyword matching. ChromaDB embeddings use the pre-cached ONNX model — no network. The `ingest_sample_kb(reset=True)` fixture in `test_rag_scoping.py` populates ChromaDB before tests run. Total external dependencies at test time: zero.

**Q28: What would you add given more time?**

> Top 3 extensions:  
> 1. **WebSocket streaming** — stream delegation trace events to the UI in real time rather than waiting for the full run to complete.  
> 2. **Persistent run history** — store task runs to SQLite instead of in-memory list, so history survives server restarts.  
> 3. **Role performance analytics** — track which roles produce the best output quality (using an LLM-as-judge evaluator), and automatically promote them to higher-tier models.

---

### SECTION H — Project Management

**Q29: How long did this project take to build?**

> The core backend (org engine, LangGraph DAG, RAG, RBAC, MCP tools, test suite) was built in approximately 2 weeks of active development. The frontend UI (landing page, studio console, ROI calculator, security studio) took an additional week. Documentation was written last.

**Q30: What was the hardest part to implement?**

> The hardest part was the **context compaction strategy** in the recursive delegation. The initial naive approach passed the full LLM output from each child up to the parent, causing context windows to grow exponentially with org depth. The fix was to have each parent synthesize children's outputs into a compact summary before passing it up the chain — implemented in `_execute_hierarchy_node`. This is the core algorithmic insight that makes deep org hierarchies feasible.

**Q31: What would you do differently if starting over?**

> I would use **async FastAPI endpoints** (`async def`) from the start instead of synchronous handlers. With synchronous handlers, the entire server blocks during task execution. Async would allow multiple concurrent task runs. The switch would require `asyncio.to_thread()` wrappers around LangGraph's synchronous `graph.invoke()`.

---

## 3. Key Technical Talking Points (for spontaneous questions)

- **"The security is structural, not prompt-based"** — isolation enforced at DB query layer, not LLM instructions
- **"The org chart is the policy"** — Casbin policies auto-derive from YAML, not hand-coded
- **"Mock mode proves architecture, not AI quality"** — all security properties hold regardless of LLM provider
- **"Cost arbitrage is mathematically proven"** — not just claimed; `test_cost_routing.py` measures it
- **"9/9 tests pass on every run"** — deterministic because mock mode; CI-safe
- **"Zero external services at demo time"** — ChromaDB embedded, ONNX cached, mock LLM

---

## 4. Demo Checklist (Pre-Viva)

```
Before the presentation:
[ ] Run .\run_acompani.ps1 — wait for "Application startup complete"
[ ] Verify http://127.0.0.1:8000 loads the landing page
[ ] Run the test suite: .\.venv\Scripts\python.exe -m pytest evals -v (all 9 pass)
[ ] Open Swagger docs: http://127.0.0.1:8000/docs
[ ] In Task Orchestrator: pre-type the demo task
[ ] In Security Studio: verify "Run Live Probe" button is visible
[ ] Have docs/ARCHITECTURE_DEEP_DIVE.md open in a text editor as backup reference
```

