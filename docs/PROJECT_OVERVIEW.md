# AcompanI — Project Overview

> **Full Name:** AcompanI — Autonomous Hierarchical Multi-Agent Organization Platform  
> **Type:** 7th Semester College Minor Project  
> **Domain:** Artificial Intelligence · Multi-Agent Systems · Enterprise Automation  
> **Stack:** Python 3.12 · FastAPI · LangGraph · ChromaDB · Casbin · FastMCP  
> **Version:** 1.0.0

---

## 1. Executive Summary

AcompanI is an **enterprise-grade, autonomous AI operating system** that replicates the full decision-making hierarchy of a real company using large language model agents. Instead of a single LLM answering a question, AcompanI deploys a *graph of specialized AI agents* — each with a fixed role (CEO, VP Engineering, Sales Representative, etc.), a defined set of tools they can use, and a strict partition of the knowledge base they may read.

A single human request like *"Set up a backend signup endpoint and launch a marketing campaign"* triggers a **cascading delegation** through the organizational DAG: the CEO agent decomposes the task, hands sub-tasks to the VP of Engineering and VP of Sales, who in turn delegate further to their respective department workers. Each worker executes in full isolation — their LLM context window, tool permissions, and knowledge-base queries are strictly scoped to prevent cross-department data leakage.

The result is a **provably correct, auditable, cost-efficient** multi-agent system where:
- **Security** is not bolted on after the fact — it is structurally enforced at every layer (Casbin RBAC, ChromaDB metadata filters, HITL gates).
- **Cost** scales sub-linearly — cheap lightweight LLMs route at the supervisor tier; expensive models execute only at leaf workers.
- **Transparency** is complete — every LLM call, tool access, and RAG query is recorded in an immutable audit log with SHA-256-signed compliance certificates.

---

## 2. Problem Statement

### 2.1 The Gap in Today's AI Assistants

Current AI assistants (ChatGPT, Copilot, Gemini) are monolithic: a single model context handles the entire conversation. This creates three fundamental problems in enterprise settings:

| Problem | Root Cause | Consequence |
|---------|-----------|-------------|
| **Context Pollution** | All departments share one prompt | Finance secrets appear in engineering responses |
| **Uniform Compute Cost** | Same expensive model for all tasks | Routing a simple delegation costs as much as executing a complex sub-task |
| **No Accountability** | No audit trail per agent action | Impossible to prove compliance during security review |

### 2.2 Existing Multi-Agent Frameworks — What They Miss

| Framework | What it does well | What AcompanI adds |
|-----------|------------------|-------------------|
| **LangChain Agents** | Tool-calling, ReAct loops | No org hierarchy; no RBAC; no cost tiering |
| **AutoGen** | Multi-agent chat rooms | Agents share context; no scoped RAG; no HITL |
| **CrewAI** | Role-based crews | Static roles; no live org generation; no audit log |
| **LangGraph** | Stateful DAG execution | Graph primitive only — AcompanI builds the enterprise layer on top |

AcompanI is the **enterprise runtime layer** that sits atop LangGraph and adds: dynamic org synthesis, Casbin RBAC, ChromaDB-partitioned RAG, HITL gates, MCP tool servers, and a production SPA dashboard.

---

## 3. Project Novelty

AcompanI introduces four original contributions to the multi-agent field:

### 3.1 Hierarchical Org-Chart-Driven Agent DAG
The agent execution graph is not hard-coded. It is **generated at runtime from a Pydantic-validated OrgChart YAML**. Each node in the LangGraph `StateGraph` corresponds to a role in the org chart. The entire company (10–50 roles) becomes a live, re-deployable graph without code changes.

### 3.2 Per-Role Chromadb Partition Isolation
Every knowledge-base query passes through a ChromaDB `$in` metadata filter enforced by the role's `data_scopes` list. It is architecturally impossible for the engineering agent to retrieve finance documents — the vector store query itself is filtered before any results are returned. This is **partition-level isolation**, not just prompt instructions.

### 3.3 Casbin-Backed Dynamic RBAC
Tool permissions are not managed in Python `if` statements. They are stored as Casbin policies (`subject, object, action` triples) and re-synthesized every time a new org is deployed. The `sync_policies_from_org` function rebuilds the entire policy table from the OrgChart in memory, making permissions declarative, auditable, and hot-reloadable.

### 3.4 Cost-Arbitrage Tiered Routing
Router-tier roles (CEO, VPs, Managers) use cheap, fast models (~\$0.10/M tokens on Groq's llama-3.1-8b-instant). Worker-tier leaf roles use stronger models (\$0.80/M tokens). The system automatically maps `role_type` to the correct model tier, delivering **85.4% lower inference cost** vs. a flat all-worker-model deployment — mathematically proven in the evaluation suite.

---

## 4. System Design Philosophy

### 4.1 Structure Over Prompt Engineering
Most multi-agent systems rely on carefully crafted system prompts to prevent bad behavior ("never read finance documents"). AcompanI relies on **structural enforcement**: the data filter is in the database query, not the prompt. Even a fully compromised or jailbroken LLM cannot retrieve out-of-scope documents because the vector query never returns them.

### 4.2 Declarative Security
All security rules are expressed as:
- YAML (org chart definitions)
- CSV (Casbin policy rules)
- Pydantic models (schema validation)

No security logic is hidden in imperative code. Any external auditor can read `rbac_policy.csv` and `default_org.yaml` and fully understand what every role is allowed to do.

### 4.3 Offline-First Design
The entire system runs 100% offline in `mock` mode. The ChromaDB ONNX embedding model (`all-MiniLM-L6-v2`, 79 MB) is pre-cached. No Docker, no cloud, no GPU required. This was a hard constraint given the C: drive being at 592 MB free.

### 4.4 Human-in-the-Loop by Default for High-Risk Actions
The `send_email` tool has `human_approval_required=True` enforced at the MCP registry layer. Even if a role is RBAC-permitted to send email, the action is blocked until an explicit `approved=True` signal is passed. This models real enterprise workflows where bulk outreach requires manager sign-off.

---

## 5. Technology Stack — Rationale

| Component | Technology | Why This Choice |
|-----------|-----------|-----------------|
| **Agent Orchestration** | LangGraph `StateGraph` | Stateful DAG with checkpointing; supports branching, replay, and persistent memory via `MemorySaver` |
| **Vector Store** | ChromaDB (embedded) | Zero-dependency embedded DB; supports metadata filtering; ONNX model pre-caches offline |
| **LLM Interface** | LangChain (OpenAI-compatible) | Unified interface across mock / Groq / Ollama / Gemini with no code changes |
| **Authorization** | Casbin | Industry-standard RBAC engine; policy-as-code (CSV); supports dynamic policy reload |
| **Tool Protocol** | FastMCP | Lightweight Model Context Protocol server; `mcp.tool()` decorator pattern |
| **REST API** | FastAPI | Async, OpenAPI auto-docs at `/docs`, type-safe with Pydantic schemas |
| **Data Validation** | Pydantic v2 | Strict model validation for OrgChart; zero runtime schema surprises |
| **Package Manager** | `uv` | 10–100× faster than pip; reproducible lockfile; Python version management built-in |
| **Frontend** | Vanilla JS + CSS | Zero build-step; works offline; loads from `/static` without Node.js toolchain |
| **Fonts** | Plus Jakarta Sans (Google CDN) | Premium professional appearance; graceful system-font fallback offline |

---

## 6. Functional Features

### 6.1 Org Architect
- Generate a custom organization chart by typing a free-text business summary
- LLM proposes roles, hierarchy, tools, permissions, and data scopes
- Validate the generated chart for structural integrity before deploying
- Deploy instantly — Casbin policies rebuild automatically, graph re-wires on the fly

### 6.2 Task Orchestrator
- Submit any natural-language task to the active company
- Watch the full delegation trace: which role handled which sub-task, tokens used, model called
- See department-level results before the CEO synthesizes the final deliverable
- Track usage: total tokens, router vs. worker split, estimated cost savings

### 6.3 Knowledge Vault
- Ingest any free-text document into any department's partition
- Run scoped vector searches — observe in real time which chunks are returned vs. blocked per role
- Inspect similarity distances, source metadata, and department tags on each result

### 6.4 Security Studio
- Run a live zero-trust probe — 3 simultaneous attack vectors against the active org
- View the full Casbin RBAC matrix: every role × every tool × ALLOWED/DENIED/HITL_REQUIRED
- Browse the immutable audit log with timestamps, role IDs, resources, and decisions
- Download a SHA-256-signed executive compliance certificate

---

## 7. Project Statistics

| Metric | Value |
|--------|-------|
| Total Python source files | 22 |
| Total lines of Python code | ~2,800 |
| Frontend code (HTML + CSS + JS) | ~141 KB (3 files) |
| REST API endpoints | 18 |
| Automated test cases | 9 (100% passing) |
| LLM provider modes supported | 3 (mock, openai_compatible, ollama) |
| ChromaDB ONNX model size | 79 MB (pre-cached) |
| Dependencies installed | 147 packages |
| Default org roles | 6 |
| MCP tools implemented | 5 |
| Casbin policy rules | ~12 (default org) |

