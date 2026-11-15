from agents.llm_router import get_llm, usage_tracker


def count_tokens_approx(text: str) -> int:
    return max(1, len(text) // 4)


def summarize_if_long(
    text: str,
    role_id: str = "compactor",
    threshold_tokens: int = 250,
) -> str:
    """Compact long subagent responses so parent context windows never bloat."""
    if count_tokens_approx(text) < threshold_tokens:
        return text
    cheap_llm = get_llm(role_type="router")
    prompt = (
        "Summarize this result in 3 concise bullet points. "
        "Keep only concrete decisions, outputs, and facts:\n\n" + text
    )
    resp = cheap_llm.invoke(prompt)
    usage_tracker.record(
        role_id=f"{role_id}:compactor",
        model_name=getattr(cheap_llm, "model", "router"),
        input_tokens=count_tokens_approx(prompt),
        output_tokens=count_tokens_approx(resp.content),
        tier="router",
    )
    return resp.content

