from typing import List, Dict, Any

ALLOWED_TOOLS = {"create_lead", "update_lead_status", "list_leads", "draft_email", "send_email"}
ALLOWED_SCOPES = {"engineering", "sales", "finance", "hr", "operations", "all"}


def validate_org_chart(data: Dict[str, Any]) -> List[str]:
    """Validate structural integrity (single root, valid refs, no cycles) and least-privilege constraints."""
    errors: List[str] = []
    roles = data.get("roles", [])
    if not roles or not isinstance(roles, list):
        return ["Org chart must contain a non-empty 'roles' list."]

    ids = [r.get("id") for r in roles]
    if len(ids) != len(set(ids)):
        errors.append("Duplicate role IDs found.")
    id_set = set(ids)

    roots = [r for r in roles if r.get("reports_to") is None]
    if len(roots) != 1:
        errors.append(f"Expected exactly 1 root role (reports_to: null), found {len(roots)}.")

    for r in roles:
        rid = r.get("id", "<missing>")
        parent = r.get("reports_to")
        if parent is not None and parent not in id_set:
            errors.append(f"Role '{rid}' reports_to unknown role '{parent}'.")
        if parent == rid:
            errors.append(f"Role '{rid}' cannot report to itself.")

        for tool in r.get("tools", []):
            if tool not in ALLOWED_TOOLS:
                errors.append(f"Role '{rid}' requests unknown tool '{tool}'.")

        perms = r.get("permissions", {})
        scopes = perms.get("data_scopes", [])
        # Least privilege check: non-root roles shouldn't claim 'all' data scope
        if parent is not None and "all" in scopes:
            errors.append(f"Least-privilege violation: non-root role '{rid}' cannot have 'all' data_scope.")

        for scope in scopes:
            if scope not in ALLOWED_SCOPES:
                errors.append(f"Role '{rid}' has invalid data_scope '{scope}'.")

    # Cycle detection via DFS
    parent_map = {r.get("id"): r.get("reports_to") for r in roles if r.get("id")}
    visited, stack = set(), set()

    def has_cycle(node: str | None) -> bool:
        if node is None or node not in parent_map:
            return False
        if node in stack:
            return True
        if node in visited:
            return False
        visited.add(node)
        stack.add(node)
        res = has_cycle(parent_map.get(node))
        stack.discard(node)
        return res

    if any(has_cycle(rid) for rid in parent_map):
        errors.append("Org chart contains a reporting cycle.")

    return errors

