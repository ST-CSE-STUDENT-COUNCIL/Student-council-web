"""
사용자 프로필 관련 라우트
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from typing import Optional
from app.schemas.users import (
    UserProfileResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    UploadVerificationImageResponse
)
from app.schemas.auth import ErrorResponse
from app.utils.auth import get_current_user
from app.utils.storage import upload_verification_image
from app.utils.r2_storage import (
    generate_presigned_url,
    validate_file_extension,
    get_bucket_url
)
import uuid
import os
from app.database import supabase
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/mypage", tags=["마이페이지"])
limiter = Limiter(key_func=get_remote_address)


@router.get(
    "",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="내 프로필 조회",
    description="현재 로그인한 사용자의 프로필 정보를 조회합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
    }
)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """내 프로필 조회"""
    return UserProfileResponse(**current_user)


@router.post(
    "/password",
    response_model=ChangePasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="비밀번호 변경",
    description="현재 비밀번호를 확인하고 새 비밀번호로 변경합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        400: {"model": ErrorResponse, "description": "현재 비밀번호 불일치"},
    }
)
async def change_password(
    body: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """비밀번호 변경"""
    try:
        # 1. 현재 비밀번호로 재인증
        try:
            supabase.auth.sign_in_with_password({
                "email": current_user['email'],
                "password": body.current_password
            })
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="현재 비밀번호가 올바르지 않습니다"
            )
        
        # 2. 새 비밀번호로 변경
        try:
            supabase.auth.admin.update_user_by_id(
                current_user['id'],
                {"password": body.new_password}
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="비밀번호 변경 실패"
            )
        
        return ChangePasswordResponse()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"비밀번호 변경 중 오류 발생: {str(e)}"
        )


@router.post(
    "/verification-image/presigned-url",
    summary="학적 인증 이미지 업로드용 Presigned URL 발급",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"}
    }
)
async def get_verification_image_presigned_url(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    """학적 인증 이미지 업로드를 위한 Presigned URL 발급"""
    file_ext = validate_file_extension(filename, {'.jpg', '.jpeg', '.png'})
    user_id = current_user["id"]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_key = f"verifications/user-{user_id}/{unique_filename}"
    
    # event-images 버킷 사용 (또는 별도 버킷)
    presigned_url = generate_presigned_url(
        bucket_name="event-images",
        file_key=file_key,
        expires_in=300
    )
    
    base_url = get_bucket_url("event-images")
    public_url = f"{base_url}/{file_key}"
    
    return {
        "presigned_url": presigned_url,
        "public_url": public_url,
        "file_key": file_key
    }


@router.post(
    "/verification-image",
    response_model=UploadVerificationImageResponse,
    status_code=status.HTTP_200_OK,
    summary="학적 인증 이미지 업로드 완료",
    description="Presigned URL로 업로드한 학적 인증 이미지를 DB에 저장합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        400: {"model": ErrorResponse, "description": "잘못된 요청"},
        500: {"model": ErrorResponse, "description": "저장 실패"}
    }
)
async def complete_verification_image_upload(
    image_url: str = Form(..., description="이미지 URL (Presigned URL로 업로드 후 받은 public_url)"),
    current_user: dict = Depends(get_current_user)
):
    """
    학적 인증 이미지 업로드 완료 (Presigned URL 사용)
    
    Presigned URL로 업로드 완료 후 이 API를 호출하여 DB에 저장합니다.
    """
    try:
        # 이미 승인된 사용자는 업로드 불가
        if current_user.get('verification_status') == 'approved':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 승인된 사용자는 학적 인증 이미지를 재업로드할 수 없습니다"
            )
        
        # users 테이블에 이미지 URL 저장
        supabase.table('users')\
            .update({'verification_image_url': image_url, 'verification_status': 'pending'})\
            .eq('id', current_user['id'])\
            .execute()
        
        return UploadVerificationImageResponse(
            file_path=image_url
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 정보 저장 실패: {str(e)}"
        )
