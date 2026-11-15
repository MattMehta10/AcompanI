from typing import Callable, Dict, Any
from authority.enforcer import check_permission
from authority.audit_log import log_decision
from mcp_servers.crm_server import create_lead_fn, update_lead_status_fn, list_leads_fn
from mcp_servers.email_server import draft_email_fn, send_email_fn

TOOL_IMPLEMENTATIONS: Dict[str, Callable[..., str]] = {
    "create_lead": create_lead_fn,
    "update_lead_status": update_lead_status_fn,
    "list_leads": list_leads_fn,
    "draft_email": draft_email_fn,
    "send_email": send_email_fn,
}


def guarded_tool_call(
    role_id: str,
    tool_name: str,
    human_approval_required: bool = False,
    approved: bool = False,
    **kwargs: Any,
) -> str:
    """Execute a tool only if Casbin RBAC allows it and any required human approval is satisfied."""
    if tool_name not in TOOL_IMPLEMENTATIONS:
        log_decision(role_id, "tool_call", tool_name, False, "unknown_tool")
        return f"DENIED: unknown tool '{tool_name}'"

    if not check_permission(role_id, tool_name, action="execute"):
        return f"DENIED: role '{role_id}' is not authorized to execute '{tool_name}'"

    if human_approval_required and tool_name == "send_email" and not approved:
        log_decision(role_id, "tool_call", tool_name, False, "human_approval_required")
        return f"PENDING_APPROVAL: '{role_id}' requires human approval before calling '{tool_name}'"

    fn = TOOL_IMPLEMENTATIONS[tool_name]
    return fn(**kwargs)
