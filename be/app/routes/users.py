"""
사용자 프로필 관련 라우트
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from typing import Optional
from app.schemas.users import (
    UserProfileResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    UploadVerificationImageRequest,
    UploadVerificationImageResponse,
    WithdrawRequest,
    WithdrawResponse
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
from app.database import supabase, get_supabase_admin
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
    "/verification-image/upload",
    summary="학적 인증 이미지 직접 업로드",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"}
    }
)
async def upload_verification_image_direct(
    file: UploadFile,
    current_user: dict = Depends(get_current_user)
):
    """
    학적 인증 이미지 직접 업로드 (Supabase Storage)
    
    Private 버킷 'verification-images'에 업로드합니다.
    """
    from app.utils.storage import upload_verification_image
    
    try:
        # 이미 승인된 사용자는 업로드 불가
        if current_user.get('verification_status') == 'approved':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 승인된 사용자는 학적 인증 이미지를 재업로드할 수 없습니다"
            )

        # 파일 업로드
        try:
            file_path = await upload_verification_image(file, current_user['id'])
        except Exception:
            raise
        
        # users 테이블에 파일 경로 저장 및 상태를 'submitted'로 변경 (admin 권한 사용)
        from app.database import get_supabase_admin
        admin_supabase = get_supabase_admin()
        
        try:
            admin_supabase.table('users')\
                .update({'verification_image_url': file_path, 'verification_status': 'submitted'})\
                .eq('id', current_user['id'])\
                .execute()
        except Exception:
            raise

        return {
            "file_path": file_path,
            "message": "학적 인증 이미지 업로드 성공. 관리자 승인을 기다려주세요."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 업로드 실패: {str(e)}"
        )


# 기존 Presigned URL 방식 엔드포인트 제거됨
# 이제 /verification-image/upload로 직접 업로드 사용


@router.delete(
    "",
    response_model=WithdrawResponse,
    status_code=status.HTTP_200_OK,
    summary="회원탈퇴",
    description="현재 로그인한 사용자의 계정을 삭제합니다 (비밀번호 확인 필요)",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        400: {"model": ErrorResponse, "description": "비밀번호 불일치"},
    }
)
async def withdraw(
    body: WithdrawRequest,
    current_user: dict = Depends(get_current_user)
):
    """회원탈퇴"""
    try:
        # 1. 비밀번호 확인
        try:
            supabase.auth.sign_in_with_password({
                "email": current_user['email'],
                "password": body.password
            })
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="비밀번호가 올바르지 않습니다"
            )
        
        user_id = current_user['id']
        user_email = current_user['email']
        admin_supabase = get_supabase_admin()
        
        # 2. users 테이블에서 삭제
        admin_supabase.table('users').delete().eq('id', user_id).execute()
        
        # 3. Supabase Auth에서 삭제
        try:
            admin_supabase.auth.admin.delete_user(user_id)
        except Exception:
            # Auth 삭제 실패해도 진행
            pass
        
        # 4. email_verifications 삭제 (재가입 허용)
        try:
            admin_supabase.table('email_verifications')\
                .delete()\
                .eq('email', user_email)\
                .execute()
        except Exception:
            pass
        
        return WithdrawResponse()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회원탈퇴 처리 중 오류 발생: {str(e)}"
        )

