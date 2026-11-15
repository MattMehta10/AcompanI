# System Architecture — Virtual AI Company

## Overview
This project implements a **Hierarchical Multi-Agent Organization Generator** that converts a plain-text business knowledge base summary into a validated, role-scoped multi-agent organization backed by LangGraph, ChromaDB, Casbin RBAC, and FastMCP tools.

## Five Core Subsystems
1. **Org Definition & Auto-Generation (`org/`)**
   - `schema.py`: Pydantic `OrgChart` and `Role` models (goal, reporting line, allowed tools, `data_scopes`, assigned LLM, and `human_approval_required`).
   - `generator.py`: Prompts an LLM to synthesize an org chart JSON from a business summary with validation-feedback retry loops.
   - `validator.py`: Enforces single-root tree structure, valid `reports_to` references, DFS cycle freedom, and least-privilege constraints (non-root roles cannot hold `"all"` scope).
2. **Hierarchical LangGraph Orchestration (`agents/`)**
   - `build_graph.py`: Compiles a checkpointed `StateGraph` (`MemorySaver`) dynamically from any `OrgChart`.
   - `worker.py` & `context.py`: Executes each child role in an isolated message context (`run_subagent_isolated`) and compacts long outputs (`summarize_if_long`) so parent supervisors never suffer context bloat.
   - `llm_router.py`: Cost-aware routing assigns lightweight models (`qwen2.5:1.5b`) to supervisor delegation/compaction and stronger worker models (`qwen2.5:3b` / `7b`) to leaf task execution, recording token usage per tier.
3. **Role-Scoped RAG (`rag/`)**
   - `ingest.py`: Chunks and indexes departmental documents (`engineering`, `sales`, `finance`) into persistent ChromaDB with `department` metadata.
   - `retriever.py`: Filters every similarity query with `where={"department": {"$in": allowed_departments}}` and logs access to `authority/audit_log.jsonl`.
4. **Authority & Tool Execution (`authority/`, `mcp_servers/`)**
   - `enforcer.py`: Casbin RBAC enforcer dynamically synchronized with the deployed `OrgChart` (`sync_policies_from_org`).
   - `crm_server.py` & `email_server.py`: FastMCP tool servers wrapped by `guarded_tool_call` in `registry.py` with deny-by-default authorization and a `human_approval_required` gate on high-risk actions (`send_email`).
5. **Web Studio & Audit Dashboard (`api/`)**
   - FastAPI backend + interactive SVG Org Chart Studio, live task trace viewer, cost-routing counters, and real-time RBAC audit table.

