from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class GenerateOrgRequest(BaseModel):
    business_summary: str = Field(..., min_length=1)


class DeployOrgRequest(BaseModel):
    org_chart: Dict[str, Any]


class TaskRequest(BaseModel):
    task: str = Field(..., min_length=1)
    thread_id: Optional[str] = None


class IngestDocRequest(BaseModel):
    department: str = Field(..., min_length=1)
    source: str = "custom_upload.txt"
    text: str = Field(..., min_length=1)


class ApproveToolRequest(BaseModel):
    role_id: str
    tool_name: str
    kwargs: Dict[str, Any] = Field(default_factory=dict)


class RoleToolTestRequest(BaseModel):
    role_id: str
    tool_name: str
    approved: bool = False


class ScopedSearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    role_id: Optional[str] = None
    department: Optional[str] = None
    k: int = 4


