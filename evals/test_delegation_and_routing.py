from pathlib import Path
from rag.ingest import ingest_sample_kb
from agents.build_graph import run_company_task

ORG_PATH = str(Path(__file__).resolve().parent.parent / "org" / "templates" / "default_org.yaml")


def test_end_to_end_delegation_and_cost_routing():
    ingest_sample_kb(reset=True)
    result = run_company_task(
        task="Build the POST /api/v1/signup backend endpoint and draft a sales outreach email for new leads.",
        org_path=ORG_PATH,
    )
    assert result["final_answer"]
    assert len(result["department_results"]) >= 1
    assert len(result["trace"]) >= 3

    usage = result["usage"]
    # Verify cost-aware routing: cheap router model handled supervisor/routing calls
    assert usage["router_calls"] >= 1
    assert usage["worker_calls"] >= 1
    assert usage["total_tokens"] > 0

