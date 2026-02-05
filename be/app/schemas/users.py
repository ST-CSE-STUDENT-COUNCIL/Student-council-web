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
    role: str = Field(..., description="권한 (student/admin)")
    verification_status: str = Field(..., description="승인 상태 (pending/submitted/approved/rejected)")
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


class WithdrawRequest(BaseModel):
    """회원탈퇴 요청"""
    password: str = Field(..., description="현재 비밀번호 확인")


class WithdrawResponse(BaseModel):
    """회원탈퇴 응답"""
    message: str = Field(default="회원탈퇴가 완료되었습니다.", description="결과 메시지")


# ============================================================================
# 프로필 변경 요청 스키마 (이름/학번 - 관리자 승인)
# ============================================================================

class ProfileUpdateRequest(BaseModel):
    """프로필 변경 요청 (이름/학번)"""
    field_name: str = Field(..., pattern="^(name|student_id)$", description="변경할 필드 (name 또는 student_id)")
    new_value: str = Field(..., min_length=1, max_length=100, description="새로운 값")
    verification_image_url: str = Field(..., description="학적 증명 이미지 Storage 경로")


class ProfileUpdateResponse(BaseModel):
    """프로필 변경 요청 응답"""
    id: int
    field_name: str
    current_value: Optional[str]
    new_value: str
    status: str
    created_at: datetime
    message: str = Field(default="변경 요청이 접수되었습니다. 관리자 승인을 기다려주세요.")


class ProfileUpdateStatusResponse(BaseModel):
    """내 프로필 변경 요청 상태"""
    id: int
    field_name: str
    current_value: Optional[str]
    new_value: str
    status: str
    rejection_reason: Optional[str]
    created_at: datetime
    processed_at: Optional[datetime]


# ============================================================================
# 이메일 변경 스키마
# ============================================================================

class EmailChangeRequest(BaseModel):
    """이메일 변경 인증번호 발송 요청"""
    new_email: EmailStr = Field(..., description="새 이메일 주소 (@seoultech.ac.kr)")


class EmailChangeVerifyRequest(BaseModel):
    """이메일 변경 인증 확인"""
    new_email: EmailStr = Field(..., description="새 이메일 주소")
    code: str = Field(..., min_length=6, max_length=6, description="6자리 인증번호")


class EmailChangeResponse(BaseModel):
    """이메일 변경 응답"""
    message: str = Field(default="인증번호가 발송되었습니다.", description="결과 메시지")


class EmailChangeVerifyResponse(BaseModel):
    """이메일 변경 완료 응답"""
    new_email: str
    message: str = Field(default="이메일이 성공적으로 변경되었습니다.", description="결과 메시지")


# ============================================================================
# 전화번호 변경 스키마
# ============================================================================

class PhoneChangeRequest(BaseModel):
    """전화번호 변경 요청"""
    new_phone: str = Field(..., pattern=r"^010-?\d{4}-?\d{4}$", description="새 전화번호")
    password: str = Field(..., description="현재 비밀번호")


class PhoneChangeResponse(BaseModel):
    """전화번호 변경 응답"""
    new_phone: str
    message: str = Field(default="전화번호가 성공적으로 변경되었습니다.", description="결과 메시지")
