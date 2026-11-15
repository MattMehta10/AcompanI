from pathlib import Path
from rag.ingest import ingest_sample_kb
from agents.build_graph import load_org, run_company_task
from org.schema import OrgChart

ORG_PATH = str(Path(__file__).resolve().parent.parent / "org" / "templates" / "default_org.yaml")

# Representative per-1M-token blended pricing ($) matching cheap router vs. stronger worker tiers
ROUTER_COST_PER_1M = 0.10
WORKER_COST_PER_1M = 0.80


def test_cost_routing_saves_tokens_on_supervisor_tier():
    ingest_sample_kb(reset=True)
    task = "Implement the POST /api/v1/signup endpoint and prepare a sales launch email draft."

    # 1. Tiered routing (cheap 1.5B router for CEO/Managers, stronger 3B/7B for leaf workers)
    tiered_res = run_company_task(task=task, org_path=ORG_PATH)
    tiered_usage = tiered_res["usage"]

    # 2. Baseline: every role pinned to the expensive worker model
    baseline_org: OrgChart = load_org(ORG_PATH)
    for role in baseline_org.roles:
        role.llm = "qwen2.5:3b"
    baseline_res = run_company_task(task=task, org=baseline_org)
    baseline_usage = baseline_res["usage"]

    tiered_cost = (
        (tiered_usage["router_tokens"] / 1_000_000) * ROUTER_COST_PER_1M
        + (tiered_usage["worker_tokens"] / 1_000_000) * WORKER_COST_PER_1M
    )
    all_worker_cost = (baseline_usage["total_tokens"] / 1_000_000) * WORKER_COST_PER_1M

    assert tiered_usage["router_calls"] >= 3
    assert tiered_usage["worker_calls"] >= 1
    assert tiered_cost < all_worker_cost

