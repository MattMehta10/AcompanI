import pytest
from rag.ingest import ingest_sample_kb
from rag.retriever import retrieve_scoped


@pytest.fixture(scope="module", autouse=True)
def seed_kb():
    ingest_sample_kb(reset=True)


def test_engineering_cannot_retrieve_finance_secrets():
    docs = retrieve_scoped(
        query="What is the monthly burn rate, executive salary, and bank account routing code?",
        allowed_departments=["engineering"],
        role_id="backend_dev",
        k=5,
    )
    joined = "\n".join(docs)
    assert "ACME-FIN-9921-SECRET" not in joined
    assert "$1,420,000" not in joined
    assert "$195,000" not in joined


def test_sales_can_retrieve_sales_playbook_only():
    docs = retrieve_scoped(
        query="What is the launch offer and CRM hygiene rule?",
        allowed_departments=["sales"],
        role_id="sales_rep",
        k=3,
    )
    joined = "\n".join(docs)
    assert "14-day free Pro trial" in joined
    assert "ACME-FIN-9921-SECRET" not in joined
    assert "pg-prod-internal.acme.local" not in joined


def test_empty_scope_returns_nothing():
    docs = retrieve_scoped(
        query="signup endpoint",
        allowed_departments=[],
        role_id="unprivileged_guest",
        k=3,
    )
    assert docs == []

