from pathlib import Path
from agents.build_graph import load_org
from authority.enforcer import sync_policies_from_org
from authority.audit_log import clear_audit_logs, read_audit_logs
from mcp_servers.registry import guarded_tool_call

ORG_PATH = str(Path(__file__).resolve().parent.parent / "org" / "templates" / "default_org.yaml")


def test_unauthorized_tool_is_denied_and_logged():
    clear_audit_logs()
    org = load_org(ORG_PATH)
    sync_policies_from_org(org)

    # backend_dev has no CRM or email tools
    res = guarded_tool_call(
        role_id="backend_dev",
        tool_name="create_lead",
        name="Malicious Lead",
        email="bad@example.com",
    )
    assert res.startswith("DENIED")

    logs = read_audit_logs(limit=10)
    assert any(
        entry["role"] == "backend_dev"
        and entry["resource"] == "create_lead"
        and entry["allowed"] is False
        for entry in logs
    )


def test_authorized_tool_is_allowed_and_human_gate_blocks_send_email():
    org = load_org(ORG_PATH)
    sync_policies_from_org(org)

    allowed_res = guarded_tool_call(
        role_id="sales_rep",
        tool_name="create_lead",
        name="Priya Nair",
        email="priya@acme.io",
    )
    assert "Lead created" in allowed_res

    # sales_rep cannot send_email (not in tools)
    denied_send = guarded_tool_call(
        role_id="sales_rep",
        tool_name="send_email",
        human_approval_required=True,
        approved=False,
        to="priya@acme.io",
        subject="Hi",
        body="Hello",
    )
    assert denied_send.startswith("DENIED")

