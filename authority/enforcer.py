from pathlib import Path
import casbin
from authority.audit_log import log_decision
from org.schema import OrgChart

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = str(BASE_DIR / "rbac_model.conf")
POLICY_PATH = str(BASE_DIR / "rbac_policy.csv")

_enforcer = casbin.Enforcer(MODEL_PATH, POLICY_PATH)


def get_enforcer() -> casbin.Enforcer:
    return _enforcer


def sync_policies_from_org(org: OrgChart) -> None:
    """Rebuild Casbin policies dynamically from an OrgChart (keeps generated orgs in sync)."""
    global _enforcer
    e = casbin.Enforcer(MODEL_PATH)
    for role in org.roles:
        for tool_name in role.tools:
            e.add_policy(role.id, tool_name, "execute")
        for scope in role.permissions.data_scopes:
            e.add_policy(role.id, f"kb:{scope}", "read")
    _enforcer = e


def check_permission(role_id: str, tool_name: str, action: str = "execute") -> bool:
    allowed = bool(_enforcer.enforce(role_id, tool_name, action))
    log_decision(
        role_id=role_id,
        action_type="tool_call" if action == "execute" else "rag_access",
        resource=tool_name,
        allowed=allowed,
        reason="casbin_rbac_allow" if allowed else "casbin_rbac_deny",
    )
    return allowed

