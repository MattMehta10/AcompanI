from typing import List, Dict, Any, Annotated
import operator
from langgraph.graph import MessagesState


class OrgState(MessagesState):
    original_task: str
    current_role: str
    subtasks: Dict[str, str]
    results: Dict[str, str]
    trace: Annotated[List[Dict[str, Any]], operator.add]
    final_answer: str

