from typing import Dict
from fastmcp import FastMCP

mcp = FastMCP("CRM")
_fake_crm_db: Dict[str, Dict[str, str]] = {
    "alex@northstar.io": {"name": "Alex Rivera", "status": "qualified"},
}


def create_lead_fn(name: str, email: str) -> str:
    """Create a new sales lead in the CRM."""
    _fake_crm_db[email] = {"name": name, "status": "new"}
    return f"Lead created: {name} ({email}) [status=new]"


def update_lead_status_fn(email: str, status: str) -> str:
    """Update the status of an existing sales lead."""
    if email not in _fake_crm_db:
        return f"Lead not found: {email}"
    _fake_crm_db[email]["status"] = status
    return f"Updated {email} status to {status}"


def list_leads_fn() -> str:
    """List all current leads in the CRM."""
    if not _fake_crm_db:
        return "No leads in CRM."
    return "; ".join(f"{v['name']} <{k}> ({v['status']})" for k, v in _fake_crm_db.items())


mcp.tool(name="create_lead")(create_lead_fn)
mcp.tool(name="update_lead_status")(update_lead_status_fn)
mcp.tool(name="list_leads")(list_leads_fn)

if __name__ == "__main__":
    mcp.run()
