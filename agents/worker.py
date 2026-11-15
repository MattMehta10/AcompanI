import json
import re
from typing import Dict, Any, Tuple, List
from langchain_core.messages import HumanMessage
from org.schema import Role
from agents.llm_router import get_llm, usage_tracker
from agents.context import count_tokens_approx, summarize_if_long
from rag.retriever import retrieve_scoped
from mcp_servers.registry import guarded_tool_call


def _maybe_run_role_tools(role: Role, task_description: str) -> List[str]:
    """Execute relevant guarded tools for the role when the task implies CRM/email actions."""
    outputs: List[str] = []
    lower = task_description.lower()

    # Check sales/CRM/email intents so both real and mock runs exercise Casbin enforcement
    if any(k in lower for k in ["lead", "crm", "signup", "prospect"]):
        if "create_lead" in role.tools or "sales" in role.permissions.data_scopes:
            res = guarded_tool_call(
                role_id=role.id,
                tool_name="create_lead",
                human_approval_required=role.human_approval_required,
                name="Sample Prospect",
                email="prospect@example.com",
            )
            outputs.append(f"[tool:create_lead] {res}")

    if any(k in lower for k in ["email", "pitch", "outreach", "campaign"]):
        tool_to_use = "send_email" if "send now" in lower else "draft_email"
        res = guarded_tool_call(
            role_id=role.id,
            tool_name=tool_to_use,
            human_approval_required=role.human_approval_required,
            to="prospect@example.com",
            subject="Product Launch Outreach",
            body="Quick intro to our automated platform and 14-day Pro trial.",
        )
        outputs.append(f"[tool:{tool_to_use}] {res}")

    return outputs


def run_subagent_isolated(role: Role, task_description: str) -> Tuple[str, Dict[str, Any]]:
    """Run an agent in an isolated fresh message context with scoped RAG + guarded tools."""
    rag_chunks = retrieve_scoped(
        query=task_description,
        allowed_departments=role.permissions.data_scopes,
        role_id=role.id,
        k=3,
    )
    tool_outputs = _maybe_run_role_tools(role, task_description)

    rag_block = "\n".join(f"- {c}" for c in rag_chunks) if rag_chunks else "(no scoped KB documents)"
    tool_block = "\n".join(tool_outputs) if tool_outputs else "(no tools invoked)"

    prompt = (
        f"You are the {role.title} (id={role.id}).\n"
        f"Goal: {role.goal}\n"
        f"Authorized Knowledge Context ({role.permissions.data_scopes}):\n{rag_block}\n\n"
        f"Tool Results:\n{tool_block}\n\n"
        f"Task: {task_description}\n"
        "Respond concisely with concrete deliverables based ONLY on your authorized context and tool results."
    )

    tier = "router" if role.permissions.can_delegate else "worker"
    llm = get_llm(model_name=role.llm, role_type=tier)
    resp = llm.invoke([HumanMessage(content=prompt)])
    raw_output = resp.content

    usage_tracker.record(
        role_id=role.id,
        model_name=getattr(llm, "model", role.llm),
        input_tokens=count_tokens_approx(prompt),
        output_tokens=count_tokens_approx(raw_output),
        tier=tier,
    )

    compacted = summarize_if_long(raw_output, role_id=role.id)
    trace_entry = {
        "role_id": role.id,
        "title": role.title,
        "model": role.llm,
        "tier": tier,
        "rag_chunks_used": len(rag_chunks),
        "tools_attempted": tool_outputs,
        "raw_tokens": count_tokens_approx(raw_output),
        "compacted_tokens": count_tokens_approx(compacted),
        "output_preview": compacted[:240],
    }
    return compacted, trace_entry


def select_children_to_delegate(supervisor: Role, children: List[Role], task: str) -> List[Role]:
    """Use the cheap router LLM (with keyword safety net) to select relevant child departments."""
    if not children:
        return []

    child_lines = "\n".join(f'- "{c.id}": {c.title} — {c.goal}' for c in children)
    prompt = (
        f"You are {supervisor.title}. Decide which direct reports should handle this task.\n"
        f"Task: {task}\n\n"
        f"Direct reports:\n{child_lines}\n\n"
        'Return ONLY JSON: {"selected_children": ["id1", ...]}'
    )
    router_llm = get_llm(model_name=supervisor.llm, role_type="router")
    resp = router_llm.invoke([HumanMessage(content=prompt)])
    usage_tracker.record(
        role_id=f"{supervisor.id}:router",
        model_name=getattr(router_llm, "model", supervisor.llm),
        input_tokens=count_tokens_approx(prompt),
        output_tokens=count_tokens_approx(resp.content),
        tier="router",
    )

    selected_ids: List[str] = []
    try:
        m = re.search(r"\{.*\}", resp.content, re.DOTALL)
        if m:
            parsed = json.loads(m.group(0))
            selected_ids = parsed.get("selected_children", [])
    except Exception:
        selected_ids = []

    if "all" in selected_ids:
        return children

    chosen = [c for c in children if c.id in selected_ids]
    # Keyword fallback if small local router returned empty
    if not chosen:
        lower = task.lower()
        for c in children:
            role_text = f"{c.id} {c.title} {c.goal}".lower()
            if any(w in lower for w in ["api", "backend", "endpoint", "code", "tech"] if any(t in role_text for t in ["eng", "tech", "dev"])):
                chosen.append(c)
            elif any(w in lower for w in ["sales", "lead", "crm", "email", "pitch", "marketing", "campaign"] if any(t in role_text for t in ["sales", "growth", "outreach"])):
                chosen.append(c)
    return chosen or children

