# Viva Demo Script & Expected Q&A Cheat Sheet

## 2-Minute Live Demo Script
1. **Open the Studio (`http://127.0.0.1:8000`):** Show the default 3-level org (`Acme Tech Startup`: CEO → Engineering Manager / Sales Manager → Backend Dev / Sales Rep).
2. **Novelty Demo (Auto Org-Chart Generation):**
   - Paste: `"An online ecommerce sneaker store needing checkout backend APIs and B2B wholesale sales."`
   - Click **Generate Org Chart** → point out the new roles, narrow `data_scopes`, and tiered LLMs (`1.5b` managers vs. `3b` workers).
   - Click **Deploy Active Org** → explain that `org/validator.py` verified single-root DAG + least-privilege and `authority/enforcer.py` dynamically synced Casbin RBAC rules.
3. **Task Execution & Context Isolation:**
   - Click **Run Company Task** on `"Build checkout API and draft a wholesale outreach email."`
   - Point out the highlighted active nodes in the SVG graph, the **Router Calls vs. Worker Calls** stats, and the **Compaction Trace** (`raw_tokens → compacted_tokens`).
4. **Security & Audit Proof:**
   - Click **Run Red-Team Security Probe** → show `finance_secret_leaked: false` (RAG isolation) and `DENIED` in the Casbin Audit Log table when an engineering role attempts `create_lead`.

---

## Likely Panel Questions & Answers

**Q1: How is this different from ChatDev or MetaGPT?**
- ChatDev and MetaGPT use fixed, human-authored software-company roles. Our system **auto-generates** a custom org chart from any business summary, **validates** it as a single-root acyclic graph with least-privilege checks, and **compiles** it dynamically into a LangGraph `StateGraph` with synchronized Casbin RBAC policies.

**Q2: How do you prevent context bloat as tasks move up the hierarchy?**
- Every leaf subagent runs in an isolated fresh message context (`run_subagent_isolated` in `agents/worker.py`) and passes outputs through `summarize_if_long` (`agents/context.py`) before returning to its parent supervisor.

**Q3: How do you enforce security so an LLM agent can't leak data or call unauthorized tools?**
- Defense-in-depth across two layers:
  1. **Retrieval layer (`rag/retriever.py`):** Chroma queries apply a strict `where={"department": {"$in": allowed_departments}}` metadata filter per role.
  2. **Tool-calling layer (`authority/enforcer.py` + `mcp_servers/registry.py`):** Every tool call passes through Casbin (`check_permission`) deny-by-default before execution and logs every `ALLOWED`/`DENIED` attempt to `authority/audit_log.jsonl`.

**Q4: How do you control token cost in a multi-agent hierarchy?**
- `agents/llm_router.py` assigns lightweight models (`router` tier) to supervisors for delegation, compaction, and synthesis, reserving larger `worker` tier models only for leaf execution.

**Q5: What happens if the LLM generates an invalid org chart (e.g., a cycle or missing root)?**
- `org/validator.py` catches missing/multiple roots, unknown `reports_to` IDs, DFS reporting cycles, unknown tools, and non-root `"all"` data scopes—returning validation errors to a repair prompt loop before anything can deploy.

