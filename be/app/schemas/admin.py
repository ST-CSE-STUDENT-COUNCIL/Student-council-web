"""
관리자 API 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ============================================================================
# 회원 관리
# ============================================================================

class UserListItem(BaseModel):
    """회원 목록 항목"""
    id: str
    student_id: str
    name: str
    email: str
    department: Optional[str] = None
    phone: Optional[str] = None
    role: str
    verification_status: str
    membership_paid: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class PendingUserItem(BaseModel):
    """승인 대기 회원 항목"""
    id: str
    student_id: str
    name: str
    email: str
    department: Optional[str] = None
    phone: Optional[str] = None
    verification_image_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """회원 목록 응답"""
    users: List[UserListItem]
    total: int


class PendingUserListResponse(BaseModel):
    """승인 대기 목록 응답"""
    users: List[PendingUserItem]
    total: int


class ApproveUserRequest(BaseModel):
    """회원 승인 요청"""
    pass  # 추가 파라미터 없음 (나중에 필요시 추가)


class ApproveUserResponse(BaseModel):
    """회원 승인 응답"""
    message: str = "회원이 승인되었습니다"
    user_id: str


class RejectUserRequest(BaseModel):
    """회원 거부 요청"""
    reason: str = Field(..., min_length=1, max_length=500, description="거부 사유")


class RejectUserResponse(BaseModel):
    """회원 거부 응답"""
    message: str = "회원 가입이 거부되었습니다"
    user_id: str


class UpdateRoleRequest(BaseModel):
    """역할 변경 요청"""
    role: str = Field(..., description="변경할 역할 (student, admin)")
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate_role
    
    @classmethod
    def validate_role(cls, v):
        if v not in ['student', 'admin']:
            raise ValueError('역할은 student, admin 중 하나여야 합니다')
        return v


class UpdateRoleResponse(BaseModel):
    """역할 변경 응답"""
    message: str = "역할이 변경되었습니다"
    user_id: str
    new_role: str


class UpdateMembershipRequest(BaseModel):
    """회비 납부 상태 변경 요청"""
    paid: bool = Field(..., description="회비 납부 여부")


class UpdateMembershipResponse(BaseModel):
    """회비 납부 상태 변경 응답"""
    message: str = "회비 납부 상태가 변경되었습니다"
    user_id: str
    paid: bool


class ErrorResponse(BaseModel):
    """에러 응답"""
    detail: str
