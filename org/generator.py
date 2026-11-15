import json
import re
from typing import Dict, Any, Tuple, List
from agents.llm_router import get_llm, is_mock_mode
from org.validator import validate_org_chart

GENERATION_PROMPT = """You are designing an AI agent organization for a business based on its summary.
Output ONLY valid JSON (no markdown fences, no prose) matching this exact schema:
{{
  "company_name": "Short Name",
  "roles": [
    {{
      "id": "snake_case_id",
      "title": "Role Title",
      "goal": "Clear role objective",
      "reports_to": null,
      "tools": [],
      "permissions": {{
        "can_delegate": true,
        "can_spend": false,
        "data_scopes": ["engineering", "sales"]
      }},
      "llm": "qwen2.5:1.5b",
      "human_approval_required": false
    }}
  ]
}}

Rules:
1. Exactly ONE root role (CEO-equivalent) with "reports_to": null and "llm": "qwen2.5:1.5b".
2. Include 2 department managers reporting to root (can_delegate: true, llm: "qwen2.5:1.5b").
3. Include 1-2 specialist workers per manager (can_delegate: false, llm: "qwen2.5:3b").
4. Allowed tools ONLY from: ["create_lead", "update_lead_status", "list_leads", "draft_email", "send_email"].
5. Allowed data_scopes ONLY from: ["engineering", "sales", "finance", "hr", "operations"]. Non-root roles must NOT use "all".
6. Apply least privilege: only give sales roles CRM/email tools, and keep scopes narrow.

Business summary:
{summary}
"""


def _extract_json(text: str) -> Dict[str, Any]:
    cleaned = text.strip()
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
    if fence_match:
        cleaned = fence_match.group(1)
    else:
        brace_start = cleaned.find("{")
        brace_end = cleaned.rfind("}")
        if brace_start != -1 and brace_end != -1:
            cleaned = cleaned[brace_start : brace_end + 1]
    return json.loads(cleaned)


def _deterministic_org_from_summary(summary: str) -> Dict[str, Any]:
    """Fast heuristic fallback when running in offline/mock mode or after LLM repair exhaustion."""
    lower = summary.lower()
    if any(k in lower for k in ["shop", "ecommerce", "e-commerce", "store", "retail", "product"]):
        return {
            "company_name": "Generated E-Commerce Org",
            "roles": [
                {
                    "id": "ceo",
                    "title": "Founder & CEO",
                    "goal": "Align storefront engineering, growth marketing, and customer conversion",
                    "reports_to": None,
                    "tools": [],
                    "permissions": {"can_delegate": True, "can_spend": True, "data_scopes": ["engineering", "sales", "operations"]},
                    "llm": "qwen2.5:1.5b",
                    "human_approval_required": False,
                },
                {
                    "id": "tech_lead",
                    "title": "Platform Engineering Lead",
                    "goal": "Manage storefront reliability, checkout APIs, and inventory systems",
                    "reports_to": "ceo",
                    "tools": [],
                    "permissions": {"can_delegate": True, "can_spend": False, "data_scopes": ["engineering"]},
                    "llm": "qwen2.5:1.5b",
                    "human_approval_required": False,
                },
                {
                    "id": "growth_mgr",
                    "title": "Growth & Sales Manager",
                    "goal": "Drive B2B wholesale leads and customer retention campaigns",
                    "reports_to": "ceo",
                    "tools": ["list_leads", "update_lead_status", "draft_email"],
                    "permissions": {"can_delegate": True, "can_spend": False, "data_scopes": ["sales"]},
                    "llm": "qwen2.5:1.5b",
                    "human_approval_required": False,
                },
                {
                    "id": "checkout_dev",
                    "title": "Checkout Engineer",
                    "goal": "Build and optimize payment and order-tracking backend endpoints",
                    "reports_to": "tech_lead",
                    "tools": [],
                    "permissions": {"can_delegate": False, "can_spend": False, "data_scopes": ["engineering"]},
                    "llm": "qwen2.5:3b",
                    "human_approval_required": False,
                },
                {
                    "id": "outreach_rep",
                    "title": "Customer Outreach Specialist",
                    "goal": "Onboard new wholesale leads and draft promotional outreach emails",
                    "reports_to": "growth_mgr",
                    "tools": ["create_lead", "draft_email"],
                    "permissions": {"can_delegate": False, "can_spend": False, "data_scopes": ["sales"]},
                    "llm": "qwen2.5:3b",
                    "human_approval_required": True,
                },
            ],
        }
    return {
        "company_name": "Generated SaaS Org",
        "roles": [
            {
                "id": "ceo",
                "title": "Chief Executive Officer",
                "goal": "Coordinate product engineering and enterprise sales execution",
                "reports_to": None,
                "tools": [],
                "permissions": {"can_delegate": True, "can_spend": True, "data_scopes": ["engineering", "sales", "finance"]},
                "llm": "qwen2.5:1.5b",
                "human_approval_required": False,
            },
            {
                "id": "vp_eng",
                "title": "VP of Engineering",
                "goal": "Lead platform API development and reliability",
                "reports_to": "ceo",
                "tools": [],
                "permissions": {"can_delegate": True, "can_spend": False, "data_scopes": ["engineering"]},
                "llm": "qwen2.5:1.5b",
                "human_approval_required": False,
            },
            {
                "id": "vp_sales",
                "title": "VP of Sales",
                "goal": "Manage enterprise pipeline and outbound campaigns",
                "reports_to": "ceo",
                "tools": ["create_lead", "update_lead_status", "list_leads", "draft_email"],
                "permissions": {"can_delegate": True, "can_spend": False, "data_scopes": ["sales"]},
                "llm": "qwen2.5:1.5b",
                "human_approval_required": False,
            },
            {
                "id": "platform_dev",
                "title": "Platform Developer",
                "goal": "Design API endpoints and technical architecture",
                "reports_to": "vp_eng",
                "tools": [],
                "permissions": {"can_delegate": False, "can_spend": False, "data_scopes": ["engineering"]},
                "llm": "qwen2.5:3b",
                "human_approval_required": False,
            },
            {
                "id": "sdr",
                "title": "Sales Development Rep",
                "goal": "Qualify leads and draft personalized outreach emails",
                "reports_to": "vp_sales",
                "tools": ["create_lead", "draft_email"],
                "permissions": {"can_delegate": False, "can_spend": False, "data_scopes": ["sales"]},
                "llm": "qwen2.5:3b",
                "human_approval_required": True,
            },
        ],
    }


def generate_org_chart(business_summary: str, max_retries: int = 2) -> Tuple[Dict[str, Any], List[str]]:
    """Generate and validate an org chart JSON from a business summary."""
    if is_mock_mode():
        data = _deterministic_org_from_summary(business_summary)
        return data, validate_org_chart(data)

    llm = get_llm(role_type="worker")
    prompt = GENERATION_PROMPT.format(summary=business_summary)
    last_errors: List[str] = []

    for attempt in range(max_retries + 1):
        try:
            raw = llm.invoke(prompt).content
            data = _extract_json(raw)
            errors = validate_org_chart(data)
            if not errors:
                return data, []
            last_errors = errors
            prompt = (
                f"Your previous JSON failed validation with errors: {errors}.\n"
                f"Fix ONLY those issues and output valid JSON matching the schema.\n"
                f"Previous output:\n{json.dumps(data)}"
            )
        except Exception as exc:
            last_errors = [f"JSON parse error on attempt {attempt + 1}: {exc}"]
            prompt = GENERATION_PROMPT.format(summary=business_summary) + "\nIMPORTANT: Output raw JSON only."

    # Fallback so UI/pipeline stays resilient if local small model fails formatting
    fallback = _deterministic_org_from_summary(business_summary)
    return fallback, last_errors

