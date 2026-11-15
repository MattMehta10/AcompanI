import uuid
from typing import Dict, Any, List
import yaml
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from org.schema import OrgChart, Role
from authority.enforcer import sync_policies_from_org
from agents.state import OrgState
from agents.worker import run_subagent_isolated, select_children_to_delegate
from agents.llm_router import get_llm, usage_tracker
from agents.context import count_tokens_approx

_memory_checkpointer = MemorySaver()


def load_org(path: str) -> OrgChart:
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return OrgChart(**data)


def _execute_hierarchy_node(role: Role, org: OrgChart, task: str, trace_acc: List[Dict[str, Any]]) -> str:
    """Recursively delegate or execute in isolated context, returning ONLY compact summaries upward."""
    children = org.children_of(role.id)
    if not children:
        output, entry = run_subagent_isolated(role, task)
        trace_acc.append(entry)
        return output

    chosen = select_children_to_delegate(role, children, task)
    child_summaries: List[str] = []
    for child in chosen:
        subtask = f"As {child.title}, complete your department's portion of: {task}"
        child_res = _execute_hierarchy_node(child, org, subtask, trace_acc)
        child_summaries.append(f"[{child.title}]: {child_res}")

    synth_prompt = (
        f"You are {role.title}. Synthesize a concise, coherent response from your team's outputs.\n"
        f"Original task: {task}\n\n"
        + "\n".join(child_summaries)
    )
    llm = get_llm(model_name=role.llm, role_type="router")
    resp = llm.invoke([HumanMessage(content=synth_prompt)])
    usage_tracker.record(
        role_id=f"{role.id}:synth",
        model_name=getattr(llm, "model", role.llm),
        input_tokens=count_tokens_approx(synth_prompt),
        output_tokens=count_tokens_approx(resp.content),
        tier="router",
    )
    trace_acc.append(
        {
            "role_id": role.id,
            "title": role.title,
            "model": role.llm,
            "tier": "router",
            "delegated_to": [c.id for c in chosen],
            "raw_tokens": count_tokens_approx(resp.content),
            "compacted_tokens": count_tokens_approx(resp.content),
            "output_preview": resp.content[:240],
        }
    )
    return resp.content


def build_langgraph(org: OrgChart, checkpointer=None):
    """Build a checkpointed LangGraph StateGraph orchestrating the given OrgChart."""
    sync_policies_from_org(org)
    builder = StateGraph(OrgState)
    root = org.root()

    def plan_delegation_node(state: OrgState) -> Dict[str, Any]:
        task = state["original_task"]
        children = org.children_of(root.id)
        chosen = select_children_to_delegate(root, children, task)
        subtasks = {
            c.id: f"As {c.title}, handle your department's part of: {task}" for c in chosen
        }
        return {
            "current_role": root.id,
            "subtasks": subtasks,
            "trace": [
                {
                    "role_id": root.id,
                    "title": root.title,
                    "model": root.llm,
                    "tier": "router",
                    "delegated_to": list(subtasks.keys()),
                    "output_preview": f"Planned delegation to: {list(subtasks.keys())}",
                }
            ],
        }

    def run_departments_node(state: OrgState) -> Dict[str, Any]:
        results: Dict[str, str] = {}
        traces: List[Dict[str, Any]] = []
        for child_id, subtask in state.get("subtasks", {}).items():
            child_role = org.get_role(child_id)
            if child_role:
                results[child_id] = _execute_hierarchy_node(child_role, org, subtask, traces)
        return {"results": results, "trace": traces}

    def synthesize_node(state: OrgState) -> Dict[str, Any]:
        results = state.get("results", {})
        aggregated = "\n".join(f"[{rid}]: {txt}" for rid, txt in results.items())
        synth_prompt = (
            f"You are {root.title}. Synthesize the final executive deliverable.\n"
            f"Original task: {state['original_task']}\n\n"
            f"Department summaries:\n{aggregated}"
        )
        llm = get_llm(model_name=root.llm, role_type="router")
        resp = llm.invoke([HumanMessage(content=synth_prompt)])
        usage_tracker.record(
            role_id=f"{root.id}:final_synth",
            model_name=getattr(llm, "model", root.llm),
            input_tokens=count_tokens_approx(synth_prompt),
            output_tokens=count_tokens_approx(resp.content),
            tier="router",
        )
        return {
            "final_answer": resp.content,
            "messages": [AIMessage(content=resp.content)],
            "trace": [
                {
                    "role_id": root.id,
                    "title": root.title,
                    "model": root.llm,
                    "tier": "router",
                    "output_preview": resp.content[:240],
                }
            ],
        }

    builder.add_node("plan_delegation", plan_delegation_node)
    builder.add_node("run_departments", run_departments_node)
    builder.add_node("synthesize", synthesize_node)

    builder.add_edge(START, "plan_delegation")
    builder.add_edge("plan_delegation", "run_departments")
    builder.add_edge("run_departments", "synthesize")
    builder.add_edge("synthesize", END)

    return builder.compile(checkpointer=checkpointer or _memory_checkpointer)


def run_company_task(
    task: str,
    org: OrgChart | None = None,
    org_path: str = "org/templates/default_org.yaml",
    thread_id: str | None = None,
) -> Dict[str, Any]:
    """Execute a task across the hierarchical LangGraph and return answer + trace + usage."""
    usage_tracker.reset()
    active_org = org or load_org(org_path)
    graph = build_langgraph(active_org)
    tid = thread_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": tid}}

    final_state = graph.invoke(
        {
            "messages": [HumanMessage(content=task)],
            "original_task": task,
            "current_role": active_org.root().id,
            "subtasks": {},
            "results": {},
            "trace": [],
            "final_answer": "",
        },
        config=config,
    )

    return {
        "thread_id": tid,
        "company_name": active_org.company_name,
        "final_answer": final_state["final_answer"],
        "subtasks": final_state["subtasks"],
        "department_results": final_state["results"],
        "trace": final_state["trace"],
        "usage": usage_tracker.summary(),
    }


if __name__ == "__main__":
    from rag.ingest import ingest_sample_kb

    ingest_sample_kb(reset=True)
    out = run_company_task("Set up a signup backend endpoint and launch an outreach email campaign.")
    print("FINAL ANSWER:\n", out["final_answer"])
    print("\nUSAGE:", out["usage"])

