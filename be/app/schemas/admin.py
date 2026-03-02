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
    is_banned: Optional[bool] = False
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


class BanUserRequest(BaseModel):
    """회원 밴 요청"""
    reason: str = Field(..., min_length=1, max_length=500, description="밴 사유")


class BanUserResponse(BaseModel):
    """회원 밴 응답"""
    message: str = "회원이 차단되었습니다"
    user_id: str


class UnbanUserRequest(BaseModel):
    """회원 밴 해제 요청"""
    note: Optional[str] = Field(None, max_length=500, description="해제 메모")


class UnbanUserResponse(BaseModel):
    """회원 밴 해제 응답"""
    message: str = "회원 차단이 해제되었습니다"
    user_id: str


class DeleteUserResponse(BaseModel):
    """회원 삭제 응답"""
    message: str = "회원이 삭제되었습니다"
    user_id: str


# ============================================================================
# 통계
# ============================================================================

class UserStatsResponse(BaseModel):
    """회원 통계 응답"""
    total_users: int = Field(..., description="전체 가입 회원 수 (users 테이블)")
    pending_users: int = Field(..., description="승인 대기 회원 수 (pending/submitted)")
    approved_users: int = Field(..., description="승인 완료 회원 수")
    rejected_users: int = Field(..., description="거절된 회원 수 (rejected_users 테이블)")
    membership_paid: int = Field(..., description="회비 납부 완료 회원 수")
    banned_users: int = Field(..., description="차단된 회원 수")
