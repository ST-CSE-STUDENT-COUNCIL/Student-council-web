"""
이메일 인증 API 엔드포인트
학교 이메일 인증 및 코드 검증을 처리합니다.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from datetime import datetime, timedelta
import random
import string

from app.database import get_supabase
from app.schemas.email import (
    SendVerificationCodeRequest,
    VerifyCodeRequest,
    VerificationResponse
)
from app.utils.email import send_verification_email
from app.config import get_settings

router = APIRouter(prefix="/email", tags=["이메일 인증"])


def generate_verification_code(length: int = 6) -> str:
    """랜덤 인증 코드 생성"""
    return ''.join(random.choices(string.digits, k=length))


@router.post("/send-code", response_model=VerificationResponse)
async def send_verification_code(
    request: SendVerificationCodeRequest,
    supabase: Client = Depends(get_supabase)
):
    """
    이메일 인증 코드 전송
    
    - 학교 이메일(@seoultech.ac.kr)로 6자리 인증 코드 전송
    - 코드 유효 시간: 5분
    - 이미 등록된 이메일이나 학번은 사용 불가
    """
    settings = get_settings()
    
    # 1. 이메일 중복 확인
    existing_profile = supabase.table("profiles").select("id").eq("email", request.email).execute()
    if existing_profile.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 이메일입니다"
        )
    
    # 2. 학번 중복 확인
    existing_student = supabase.table("profiles").select("id").eq("student_id", request.student_id).execute()
    if existing_student.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 학번입니다"
        )
    
    # 3. 기존 미인증 코드 삭제 (같은 이메일)
    supabase.table("email_verifications").delete().eq("email", request.email).eq("verified", False).execute()
    
    # 4. 인증 코드 생성
    code = generate_verification_code(settings.verification_code_length)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.verification_code_expiry_minutes)
    
    # 5. DB에 인증 코드 저장
    verification_data = {
        "email": request.email,
        "student_id": request.student_id,
        "code": code,
        "verified": False,
        "expires_at": expires_at.isoformat(),
    }
    
    insert_response = supabase.table("email_verifications").insert(verification_data).execute()
    
    if not insert_response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="인증 코드 저장에 실패했습니다"
        )
    
    # 6. 이메일 전송
    email_sent = await send_verification_email(request.email, code, request.student_id)
    
    if not email_sent:
        # 이메일 전송 실패 시 DB 레코드 삭제
        supabase.table("email_verifications").delete().eq("email", request.email).eq("code", code).execute()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요"
        )
    
    return VerificationResponse(
        success=True,
        message=f"인증 코드가 {request.email}로 전송되었습니다. 5분 이내에 입력해주세요.",
        data={"email": request.email, "expires_in_minutes": settings.verification_code_expiry_minutes}
    )


@router.post("/verify-code", response_model=VerificationResponse)
async def verify_code(
    request: VerifyCodeRequest,
    supabase: Client = Depends(get_supabase)
):
    """
    이메일 인증 코드 확인
    
    - 전송된 인증 코드와 입력한 코드 비교
    - 만료된 코드는 사용 불가
    - 인증 성공 시 verified=True로 업데이트
    """
    # 1. 인증 코드 조회
    verification_response = supabase.table("email_verifications")\
        .select("*")\
        .eq("email", request.email)\
        .eq("code", request.code)\
        .eq("verified", False)\
        .execute()
    
    if not verification_response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="잘못된 인증 코드입니다"
        )
    
    verification: dict = verification_response.data[0]  # type: ignore
    
    # 2. 만료 시간 확인
    expires_at = datetime.fromisoformat(str(verification["expires_at"]).replace('Z', '+00:00'))
    if datetime.utcnow() > expires_at.replace(tzinfo=None):
        # 만료된 코드 삭제
        supabase.table("email_verifications").delete().eq("id", verification["id"]).execute()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="인증 코드가 만료되었습니다. 새로운 코드를 요청해주세요"
        )
    
    # 3. 인증 완료 처리
    update_response = supabase.table("email_verifications")\
        .update({"verified": True, "verified_at": datetime.utcnow().isoformat()})\
        .eq("id", verification["id"])\
        .execute()
    
    if not update_response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="인증 처리에 실패했습니다"
        )
    
    return VerificationResponse(
        success=True,
        message="이메일 인증이 완료되었습니다. 회원가입을 계속 진행해주세요.",
        data={
            "email": request.email,
            "student_id": str(verification["student_id"]),
            "verified": True
        }
    )
