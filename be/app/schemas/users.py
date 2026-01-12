"""
사용자 프로필 관련 스키마
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class UserProfileResponse(BaseModel):
    """사용자 프로필 조회 응답"""
    id: str = Field(..., description="사용자 UUID")
    email: EmailStr = Field(..., description="서울과기대 이메일")
    name: str = Field(..., description="이름")
    student_id: str = Field(..., description="학번")
    phone: str = Field(..., description="전화번호")
    department: str = Field(..., description="학과")
    role: str = Field(..., description="권한 (student/council/admin)")
    verification_status: str = Field(..., description="승인 상태 (pending/approved/rejected)")
    verification_image_url: Optional[str] = Field(None, description="학적 인증 이미지 경로")
    membership_paid: bool = Field(..., description="회비 납부 여부")
    rejection_reason: Optional[str] = Field(None, description="거절 사유")
    verified_at: Optional[datetime] = Field(None, description="승인 일시")
    created_at: datetime = Field(..., description="가입 일시")


class ChangePasswordRequest(BaseModel):
    """비밀번호 변경 요청"""
    current_password: str = Field(..., description="현재 비밀번호")
    new_password: str = Field(
        ..., 
        min_length=8, 
        max_length=128,
        description="새 비밀번호 (최소 8자, 영문+숫자+특수문자 조합)"
    )


class ChangePasswordResponse(BaseModel):
    """비밀번호 변경 응답"""
    message: str = Field(default="비밀번호가 성공적으로 변경되었습니다.", description="결과 메시지")


class UploadVerificationImageRequest(BaseModel):
    """학적 인증 이미지 업로드 요청"""
    image_url: str = Field(..., description="이미지 URL (Presigned URL로 업로드 후 받은 public_url)")


class UploadVerificationImageResponse(BaseModel):
    """학적 인증 이미지 업로드 응답"""
    file_path: str = Field(..., description="Storage에 저장된 파일 경로")
    message: str = Field(default="이미지 업로드 성공. 관리자 승인을 기다려주세요.", description="안내 메시지")
