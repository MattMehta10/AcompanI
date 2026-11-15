from org.validator import validate_org_chart
from org.generator import generate_org_chart


def test_validator_catches_cycle_and_least_privilege_violation():
    bad_org = {
        "company_name": "Broken Corp",
        "roles": [
            {
                "id": "ceo",
                "title": "CEO",
                "goal": "Lead",
                "reports_to": None,
                "tools": [],
                "permissions": {"can_delegate": True, "data_scopes": ["all"]},
            },
            {
                "id": "mgr_a",
                "title": "Manager A",
                "goal": "Manage A",
                "reports_to": "mgr_b",
                "tools": [],
                "permissions": {"can_delegate": True, "data_scopes": ["all"]},
            },
            {
                "id": "mgr_b",
                "title": "Manager B",
                "goal": "Manage B",
                "reports_to": "mgr_a",
                "tools": [],
                "permissions": {"can_delegate": True, "data_scopes": ["sales"]},
            },
        ],
    }
    errors = validate_org_chart(bad_org)
    assert any("cycle" in e.lower() for e in errors)
    assert any("least-privilege" in e.lower() for e in errors)


def test_two_business_summaries_generate_distinct_valid_orgs():
    ecom, ecom_errs = generate_org_chart("An online ecommerce retail shop selling sneakers and wholesale orders.")
    saas, saas_errs = generate_org_chart("A B2B SaaS analytics platform for enterprise engineering teams.")
    assert ecom_errs == []
    assert saas_errs == []
    assert ecom["company_name"] != saas["company_name"]
    assert validate_org_chart(ecom) == []
    assert validate_org_chart(saas) == []

