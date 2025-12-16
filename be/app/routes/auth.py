"""
회원가입 및 인증 API 엔드포인트
이메일 인증 후 회원가입, 학생증 이미지 업로드를 처리합니다.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from supabase import Client
from datetime import datetime
from typing import Optional
import uuid
import io
from PIL import Image

from app.database import get_supabase
from app.schemas.auth import SignupRequest, AuthResponse, ProfileResponse
from app.utils.auth import get_current_user
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["인증"])


@router.post("/signup", response_model=AuthResponse)
async def signup(
    request: SignupRequest,
    supabase: Client = Depends(get_supabase)
):
    """
    회원가입 (이메일 인증 완료 후)
    
    - 이메일 인증이 완료된 경우에만 가입 가능
    - Supabase Auth로 계정 생성
    - profiles 테이블에 추가 정보 저장
    - 관리자 승인 대기 상태 (verification_status='pending')
    """
    # 1. 이메일 인증 확인
    verification_response = supabase.table("email_verifications")\
        .select("*")\
        .eq("email", request.email)\
        .eq("student_id", request.student_id)\
        .eq("verified", True)\
        .execute()
    
    if not verification_response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이메일 인증이 완료되지 않았습니다"
        )
    
    # 2. 이메일 중복 재확인
    existing_profile = supabase.table("profiles").select("id").eq("email", request.email).execute()
    if existing_profile.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 이메일입니다"
        )
    
    # 3. 학번 중복 재확인
    existing_student = supabase.table("profiles").select("id").eq("student_id", request.student_id).execute()
    if existing_student.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 학번입니다"
        )
    
    try:
        # 4. Supabase Auth로 사용자 생성
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="계정 생성에 실패했습니다"
            )
        
        user_id = auth_response.user.id
        
        # 5. profiles 테이블에 추가 정보 저장
        profile_data = {
            "id": user_id,
            "student_id": request.student_id,
            "name": request.name,
            "email": request.email,
            "department": request.department,
            "phone": request.phone,
            "role": "student",
            "is_verified": False,
            "verification_status": "pending",
            "membership_paid": False,
        }
        
        profile_response = supabase.table("profiles").insert(profile_data).execute()
        
        if not profile_response.data:
            # 프로필 생성 실패 시 Auth 사용자도 삭제 (롤백)
            # 주의: Supabase Auth는 자동 롤백이 안되므로 수동으로 처리
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="프로필 생성에 실패했습니다"
            )
        
        # 6. 사용된 인증 코드 삭제
        supabase.table("email_verifications").delete().eq("email", request.email).execute()
        
        profile_data: dict = profile_response.data[0]  # type: ignore
        return AuthResponse(
            success=True,
            message="회원가입이 완료되었습니다. 학생증 이미지를 업로드하고 관리자 승인을 기다려주세요.",
            user=ProfileResponse(**profile_data),
            session={"access_token": auth_response.session.access_token if auth_response.session else None}
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회원가입 처리 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/upload-verification-image")
async def upload_verification_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    학생증 이미지 업로드 (통합정보시스템 학적 캡쳐)
    
    - 인증된 사용자만 업로드 가능
    - 이미지 파일만 허용 (jpg, jpeg, png)
    - Supabase Storage에 저장
    - profiles 테이블의 verification_image_url 업데이트
    """
    # 1. 이미 승인된 사용자는 업로드 불가
    if current_user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 승인된 사용자입니다"
        )
    
    # 2. 파일 확장자 검증
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="파일명이 없습니다"
        )
    
    allowed_extensions = ["jpg", "jpeg", "png"]
    file_extension = file.filename.split(".")[-1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="jpg, jpeg, png 파일만 업로드 가능합니다"
        )
    
    # 3. 이미지 파일 검증 (PIL로 실제 이미지인지 확인)
    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        image.verify()
        
        # 파일 포인터 리셋
        await file.seek(0)
        image_data = await file.read()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효한 이미지 파일이 아닙니다"
        )
    
    # 4. 파일명 생성 (UUID + 확장자)
    user_id = current_user["id"]
    filename = f"verification/{user_id}/{uuid.uuid4()}.{file_extension}"
    
    try:
        # 5. Supabase Storage에 업로드
        storage_response = supabase.storage.from_("student-verifications").upload(
            path=filename,
            file=image_data,
            file_options={"content-type": f"image/{file_extension}"}
        )
        
        # 6. 공개 URL 생성
        public_url = supabase.storage.from_("student-verifications").get_public_url(filename)
        
        # 7. profiles 테이블 업데이트
        update_response = supabase.table("profiles")\
            .update({"verification_image_url": public_url})\
            .eq("id", user_id)\
            .execute()
        
        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="이미지 URL 저장에 실패했습니다"
            )
        
        return {
            "success": True,
            "message": "학생증 이미지가 업로드되었습니다. 관리자 승인을 기다려주세요.",
            "data": {
                "image_url": public_url,
                "verification_status": "pending"
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 업로드에 실패했습니다: {str(e)}"
        )


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: dict = Depends(get_current_user)
):
    """
    현재 로그인한 사용자 프로필 조회
    
    - JWT 토큰으로 사용자 인증
    - 본인의 프로필 정보 반환
    """
    return ProfileResponse(**current_user)


@router.post("/login")
async def login(
    email: str = Form(...),
    password: str = Form(...),
    supabase: Client = Depends(get_supabase)
):
    """
    로그인
    
    - Supabase Auth로 로그인
    - JWT 토큰 반환
    """
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="이메일 또는 비밀번호가 올바르지 않습니다"
            )
        
        # 프로필 정보 조회
        profile_response = supabase.table("profiles")\
            .select("*")\
            .eq("id", auth_response.user.id)\
            .single()\
            .execute()
        
        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자 프로필을 찾을 수 없습니다"
            )
        
        return {
            "success": True,
            "message": "로그인 성공",
            "user": profile_response.data,
            "session": {
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token,
                "expires_at": auth_response.session.expires_at
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"로그인에 실패했습니다: {str(e)}"
        )
