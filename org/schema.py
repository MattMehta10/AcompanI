from typing import List, Optional
from pydantic import BaseModel, Field


class RolePermissions(BaseModel):
    can_delegate: bool = False
    can_spend: bool = False
    data_scopes: List[str] = Field(default_factory=list)


class Role(BaseModel):
    id: str
    title: str
    goal: str
    reports_to: Optional[str] = None
    tools: List[str] = Field(default_factory=list)
    permissions: RolePermissions = Field(default_factory=RolePermissions)
    llm: str = "qwen2.5:3b"
    human_approval_required: bool = False


class OrgChart(BaseModel):
    company_name: str = "AcompanI"
    roles: List[Role]

    def get_role(self, role_id: str) -> Optional[Role]:
        for r in self.roles:
            if r.id == role_id:
                return r
        return None

    def children_of(self, role_id: str) -> List[Role]:
        return [r for r in self.roles if r.reports_to == role_id]

    def root(self) -> Role:
        roots = [r for r in self.roles if r.reports_to is None]
        if len(roots) != 1:
            raise ValueError(f"Org chart must have exactly 1 root, found {len(roots)}")
        return roots[0]

