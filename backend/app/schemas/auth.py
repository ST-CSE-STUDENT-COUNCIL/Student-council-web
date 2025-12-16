"""
회원가입 및 인증 관련 Pydantic 스키마
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime


class SignupRequest(BaseModel):
    """회원가입 요청 (이메일 인증 완료 후)"""
    email: EmailStr = Field(..., description="인증된 학교 이메일")
    student_id: str = Field(..., min_length=8, max_length=20, description="학번")
    password: str = Field(..., min_length=8, description="비밀번호")
    name: str = Field(..., min_length=2, max_length=100, description="이름")
    department: Optional[str] = Field(None, max_length=100, description="학과")
    phone: Optional[str] = Field(None, max_length=20, description="연락처")
    
    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        """학교 이메일 도메인 검증"""
        if not v.endswith('@seoultech.ac.kr'):
            raise ValueError('학교 이메일(@seoultech.ac.kr)만 사용 가능합니다')
        return v


class UploadVerificationImageRequest(BaseModel):
    """학생증 이미지 업로드 메타데이터"""
    user_id: str = Field(..., description="사용자 UUID")


class ProfileResponse(BaseModel):
    """사용자 프로필 응답"""
    id: str
    student_id: str
    name: str
    email: str
    department: Optional[str]
    phone: Optional[str]
    role: str
    is_verified: bool
    verification_status: str
    membership_paid: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """인증 응답"""
    success: bool
    message: str
    user: Optional[ProfileResponse] = None
    session: Optional[dict] = None
