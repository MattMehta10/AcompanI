import os
from dataclasses import dataclass, field
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

_cache: Dict[str, Any] = {}


@dataclass
class UsageTracker:
    calls: List[Dict[str, Any]] = field(default_factory=list)

    def record(self, role_id: str, model_name: str, input_tokens: int, output_tokens: int, tier: str) -> None:
        self.calls.append(
            {
                "role_id": role_id,
                "model": model_name,
                "tier": tier,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
            }
        )

    def summary(self) -> Dict[str, Any]:
        router_calls = [c for c in self.calls if c["tier"] == "router"]
        worker_calls = [c for c in self.calls if c["tier"] == "worker"]
        total_tokens = sum(c["total_tokens"] for c in self.calls)
        router_tokens = sum(c["total_tokens"] for c in router_calls)
        worker_tokens = sum(c["total_tokens"] for c in worker_calls)
        return {
            "total_calls": len(self.calls),
            "router_calls": len(router_calls),
            "worker_calls": len(worker_calls),
            "total_tokens": total_tokens,
            "router_tokens": router_tokens,
            "worker_tokens": worker_tokens,
            "calls": list(self.calls),
        }

    def reset(self) -> None:
        self.calls.clear()


usage_tracker = UsageTracker()


class _MockResponse:
    def __init__(self, content: str):
        self.content = content


class MockChatModel:
    """Deterministic offline LLM for instant smoke testing and fallback demos."""

    def __init__(self, model_name: str):
        self.model = model_name

    def invoke(self, messages: Any) -> _MockResponse:
        if isinstance(messages, list):
            prompt = "\n".join(getattr(m, "content", str(m)) for m in messages)
        else:
            prompt = str(messages)
        lower = prompt.lower()

        if "delegate" in lower and "json" in lower:
            # Supervisor routing decision
            selected = []
            for key in ["eng_manager", "tech_lead", "vp_eng", "sales_manager", "growth_mgr", "vp_sales"]:
                if key in prompt:
                    selected.append(key)
            if not selected:
                selected = ["all"]
            return _MockResponse('{"selected_children": ' + str(selected).replace("'", '"') + "}")

        if "summarize this result" in lower:
            return _MockResponse("Summary: Subagent completed assigned task within role scope.")

        if "synthes" in lower:
            return _MockResponse(
                "Executive Summary: Delegated tasks across relevant departments completed cleanly "
                "using role-scoped knowledge and least-privilege tool access."
            )

        return _MockResponse(
            f"[{self.model}] Executed task based on scoped context: "
            + prompt.splitlines()[-1][:140]
        )


def is_mock_mode() -> bool:
    return os.getenv("LLM_PROVIDER", "mock").lower() == "mock"


def get_llm(model_name: str | None = None, role_type: str = "worker") -> Any:
    provider = os.getenv("LLM_PROVIDER", "mock").lower()
    default_router = os.getenv("DEFAULT_ROUTER_MODEL", "qwen2.5:1.5b")
    default_worker = os.getenv("DEFAULT_WORKER_MODEL", "qwen2.5:3b")

    if model_name is None:
        model_name = default_router if role_type == "router" else default_worker
    elif provider == "openai_compatible" and ":" in model_name:
        # Map local Ollama tag defaults (e.g. qwen2.5:1.5b) to configured cloud tier models
        model_name = default_router if role_type == "router" else default_worker

    cache_key = f"{provider}:{model_name}"
    if cache_key in _cache:
        return _cache[cache_key]

    if provider == "mock":
        llm = MockChatModel(model_name)
    elif provider == "openai_compatible":
        from langchain_openai import ChatOpenAI

        headers = {
            "HTTP-Referer": "https://github.com/MattMehta10/AcompanI",
            "X-Title": "AcompanI Platform",
        }
        llm = ChatOpenAI(
            model=model_name,
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.groq.com/openai/v1"),
            default_headers=headers,
            temperature=0.2,
            timeout=30,
            max_retries=2,
        )
    else:
        from langchain_ollama import ChatOllama

        llm = ChatOllama(
            model=model_name,
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            temperature=0.2,
        )

    _cache[cache_key] = llm
    return llm

