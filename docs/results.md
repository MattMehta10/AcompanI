# Evaluation Results & Benchmarks

Run the evaluation suite with:
```powershell
cd "MINOR PROJECT\ai-company"
.\.venv\Scripts\python.exe -m pytest evals -v
```

## Summary Table (Verified in `mock` provider mode — 9/9 passed in 20.18s)
| Evaluation | Goal | Observed Outcome | Status |
|---|---|---|---|
| `evals/test_rag_scoping.py` | Prevent cross-department knowledge leakage | 3/3 passed (`backend_dev` gets 0 Finance secrets; `sales_rep` gets only Sales playbook; empty scope returns `[]`) | PASSED |
| `evals/test_permission_enforcement.py` | Deny unauthorized MCP tool calls via Casbin RBAC | 2/2 passed (`backend_dev` calling `create_lead` returns `DENIED` & logs to `audit_log.jsonl`; `sales_rep` `send_email` denied) | PASSED |
| `evals/test_org_validator.py` | Catch cyclic / over-privileged orgs & generate distinct valid orgs | 2/2 passed (cycle + `"all"` scope violations caught; e-commerce vs. SaaS summaries yield distinct valid orgs) | PASSED |
| `evals/test_delegation_and_routing.py` | Verify hierarchical delegation + cheap-router vs. worker split | 1/1 passed (`router_calls >= 1`, `worker_calls >= 1`, `total_tokens > 0`) | PASSED |
| `evals/test_cost_routing.py` | Compare tiered routing cost vs. all-worker baseline | 1/1 passed (`tiered_cost < all_worker_cost` with `router_calls >= 3`) | PASSED |

*(Next step: set `LLM_PROVIDER=openai_compatible` in `.env` with a free Groq or Gemini API key, re-run `pytest evals -v`, and add screenshots from `http://127.0.0.1:8000`.)*
