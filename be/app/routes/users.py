"""
사용자 프로필 관련 라우트
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from app.schemas.users import (
    UserProfileResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    UploadVerificationImageResponse
)
from app.schemas.auth import ErrorResponse
from app.utils.auth import get_current_user
from app.utils.storage import upload_verification_image
from app.database import supabase
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/users", tags=["사용자"])
limiter = Limiter(key_func=get_remote_address)


@router.get(
    "/me",
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
    "/me/password",
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
    "/me/verification-image",
    response_model=UploadVerificationImageResponse,
    status_code=status.HTTP_200_OK,
    summary="학적 인증 이미지 업로드",
    description="마이페이지에서 학적 인증 이미지를 업로드합니다 (JPG, PNG만 허용, 최대 5MB, 1시간에 3회 제한)",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        400: {"model": ErrorResponse, "description": "파일 형식 또는 크기 오류"},
        429: {"model": ErrorResponse, "description": "요청 횟수 초과"},
        500: {"model": ErrorResponse, "description": "업로드 실패"}
    }
)
@limiter.limit("3/hour")  # 1시간에 3회만 허용 (스팸 방지)
async def upload_my_verification_image(
    request: Request,
    file: UploadFile = File(..., description="학적 인증 이미지 파일"),
    current_user: dict = Depends(get_current_user)
):
    """
    학적 인증 이미지 업로드 (로그인 필수)
    
    통합정보시스템 학적 정보 캡처 이미지를 업로드합니다.
    업로드된 이미지는 Private Storage에 저장되며, 관리자만 확인 가능합니다.
    업로드 후 자동으로 users 테이블의 verification_image_url에 저장됩니다.
    """
    try:
        # 이미지 업로드 및 검증
        file_path = await upload_verification_image(file)
        
        # users 테이블에 이미지 경로 저장
        supabase.table('users')\
            .update({'verification_image_url': file_path})\
            .eq('id', current_user['id'])\
            .execute()
        
        return UploadVerificationImageResponse(
            file_path=file_path
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 업로드 실패: {str(e)}"
        )
