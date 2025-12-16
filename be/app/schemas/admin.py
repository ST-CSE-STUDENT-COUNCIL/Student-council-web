"""
관리자 승인 관련 Pydantic 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ApprovalRequest(BaseModel):
    """승인 요청"""
    user_id: str = Field(..., description="승인할 사용자 UUID")
    action: str = Field(..., description="승인 액션: approve 또는 reject")
    rejection_reason: Optional[str] = Field(None, description="거부 사유 (reject인 경우 필수)")
    
    @property
    def is_approve(self) -> bool:
        return self.action == "approve"
    
    @property
    def is_reject(self) -> bool:
        return self.action == "reject"


class PendingUserResponse(BaseModel):
    """승인 대기 사용자 정보"""
    id: str
    student_id: str
    name: str
    email: str
    department: Optional[str]
    phone: Optional[str]
    verification_image_url: Optional[str]
    verification_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ApprovalResponse(BaseModel):
    """승인 응답"""
    success: bool
    message: str
    user: Optional[PendingUserResponse] = None
