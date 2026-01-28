"""
인증 관련 스키마
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional


class UploadVerificationImageResponse(BaseModel):
    """학적 인증 이미지 업로드 응답"""
    file_path: str = Field(..., description="Storage 내 파일 경로")
    message: str = "이미지가 업로드되었습니다"


class SendVerificationRequest(BaseModel):
    """이메일 인증번호 발송 요청"""
    email: EmailStr = Field(..., description="서울과기대 이메일")
    
    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        if not v.endswith('@seoultech.ac.kr'):
            raise ValueError('서울과기대 이메일(@seoultech.ac.kr)만 사용 가능합니다')
        return v


class SendVerificationResponse(BaseModel):
    """이메일 인증번호 발송 응답"""
    message: str = "인증번호가 발송되었습니다"
    email: str


class VerifyEmailRequest(BaseModel):
    """이메일 인증 확인 요청"""
    email: EmailStr = Field(..., description="서울과기대 이메일")
    code: str = Field(..., min_length=6, max_length=6, description="6자리 인증번호")
    
    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        if not v.endswith('@seoultech.ac.kr'):
            raise ValueError('서울과기대 이메일(@seoultech.ac.kr)만 사용 가능합니다')
        return v


class VerifyEmailResponse(BaseModel):
    """이메일 인증 확인 응답"""
    message: str = "이메일 인증이 완료되었습니다"
    email: str


class CheckStudentIdRequest(BaseModel):
    """학번 중복 확인 요청"""
    student_id: str = Field(..., pattern=r'^\d{8,20}$', description="학번/수험번호 (8~20자리)")


class CheckStudentIdResponse(BaseModel):
    """학번 중복 확인 응답"""
    available: bool
    message: str


class SignupRequest(BaseModel):
    """회원가입 요청"""
    email: EmailStr = Field(..., description="인증 완료된 서울과기대 이메일")
    password: str = Field(
        ..., 
        min_length=8, 
        max_length=128,
        description="비밀번호 (최소 8자, 영문+숫자+특수문자 조합)"
    )
    name: str = Field(..., min_length=2, max_length=50, description="이름")
    student_id: str = Field(..., pattern=r'^\d{8,20}$', description="학번/수험번호 (8~20자리)")
    phone: str = Field(..., pattern=r'^010-?\d{4}-?\d{4}$', description="전화번호")
    department: str = Field(..., description="학과")
    turnstile_token: Optional[str] = Field(None, description="Cloudflare Turnstile 토큰")
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """비밀번호 강도 검증"""
        if not any(c.islower() for c in v):
            raise ValueError('비밀번호는 소문자를 포함해야 합니다')
        if not any(c.isdigit() for c in v):
            raise ValueError('비밀번호는 숫자를 포함해야 합니다')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v):
            raise ValueError('비밀번호는 특수문자를 포함해야 합니다')
        return v
    
    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        if not v.endswith('@seoultech.ac.kr'):
            raise ValueError('서울과기대 이메일(@seoultech.ac.kr)만 사용 가능합니다')
        return v
    
    @field_validator('phone')
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        # 하이픈 제거
        return v.replace('-', '')


class SignupResponse(BaseModel):
    """회원가입 응답"""
    message: str = "회원가입이 완료되었습니다. 관리자 승인을 기다려주세요."
    user_id: str
    email: str
    name: str


class LoginRequest(BaseModel):
    """로그인 요청"""
    student_id: str = Field(..., pattern=r'^\d{8,20}$', description="학번/수험번호 (8~20자리)")
    password: str
    turnstile_token: Optional[str] = Field(None, description="Cloudflare Turnstile 토큰")


class LoginResponse(BaseModel):
    """로그인 응답"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class LogoutResponse(BaseModel):
    """로그아웃 응답"""
    message: str = "로그아웃되었습니다"


class ForgotPasswordRequest(BaseModel):
    """비밀번호 찾기 요청"""
    student_id: str = Field(..., pattern=r'^\d{8,20}$', description="학번/수험번호 (8~20자리)")


class ForgotPasswordResponse(BaseModel):
    """비밀번호 찾기 응답"""
    message: str = "인증번호가 이메일로 발송되었습니다"
    email: str


class VerifyResetCodeRequest(BaseModel):
    """비밀번호 재설정 인증 코드 확인 요청"""
    student_id: str = Field(..., pattern=r'^\d{8,20}$', description="학번/수험번호 (8~20자리)")
    code: str = Field(..., min_length=6, max_length=6, description="6자리 인증번호")


class VerifyResetCodeResponse(BaseModel):
    """비밀번호 재설정 인증 코드 확인 응답"""
    message: str = "인증이 완료되었습니다. 새 비밀번호를 설정해주세요."
    student_id: str


class ResetPasswordRequest(BaseModel):
    """비밀번호 재설정 요청"""
    student_id: str = Field(..., pattern=r'^\d{8,20}$', description="학번/수험번호 (8~20자리)")
    new_password: str = Field(..., min_length=8, description="새 비밀번호 (8자 이상)")


class ResetPasswordResponse(BaseModel):
    """비밀번호 재설정 응답"""
    message: str = "비밀번호가 재설정되었습니다"


class ErrorResponse(BaseModel):
    """에러 응답"""
    detail: str
