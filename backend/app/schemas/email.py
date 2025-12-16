"""
이메일 인증 관련 Pydantic 스키마
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime


class SendVerificationCodeRequest(BaseModel):
    """인증 코드 전송 요청"""
    email: EmailStr = Field(..., description="학교 이메일 (@seoultech.ac.kr)")
    student_id: str = Field(..., min_length=8, max_length=20, description="학번")
    
    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        """학교 이메일 도메인 검증"""
        if not v.endswith('@seoultech.ac.kr'):
            raise ValueError('학교 이메일(@seoultech.ac.kr)만 사용 가능합니다')
        return v


class VerifyCodeRequest(BaseModel):
    """인증 코드 확인 요청"""
    email: EmailStr = Field(..., description="학교 이메일")
    code: str = Field(..., min_length=6, max_length=6, description="6자리 인증 코드")


class VerificationResponse(BaseModel):
    """인증 응답"""
    success: bool
    message: str
    data: Optional[dict] = None
