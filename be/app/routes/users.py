"""
사용자 프로필 관련 라우트
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form, Query
from typing import Optional, List
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
from app.schemas.activities import MyActivitiesResponse
from app.utils.auth import get_current_user, require_verified_user
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
        
        # 3. Supabase Auth에서 삭제 (새 클라이언트 사용 - 인증 상태 오염 방지)
        try:
            from app.database import get_fresh_admin_client
            fresh_client = get_fresh_admin_client()
            fresh_client.auth.admin.delete_user(user_id)
        except Exception as auth_del_error:
            # Auth 삭제 실패 로그
            print(f"[WITHDRAW ERROR] Auth 삭제 실패: {str(auth_del_error)}")
        
        # 4. email_verifications 삭제 (재가입 허용)
        try:
            admin_supabase.table('email_verifications')\
                .delete()\
                .eq('email', user_email)\
                .execute()
        except Exception as email_del_error:
            print(f"[WITHDRAW ERROR] email_verifications 삭제 실패: {str(email_del_error)}")
        
        return WithdrawResponse()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회원탈퇴 처리 중 오류 발생: {str(e)}"
        )


@router.get(
    "/activities",
    response_model=MyActivitiesResponse,
    summary="내 활동 목록 조회",
    description="로그인한 회원이 신청한 활동(행사) 목록을 조회합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "승인 필요"}
    }
)
async def get_my_activities(
    status_filter: Optional[str] = Query(
        None,
        description="신청 상태 필터 (pending, approved, rejected, cancelled)",
        alias="status"
    ),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    current_user: dict = Depends(require_verified_user)
):
    """
    내 활동 목록 조회
    
    현재 로그인한 사용자가 신청한 모든 활동(행사)을 조회합니다.
    활동 정보와 신청 상태를 함께 반환합니다.
    """
    try:
        user_id = current_user['id']
        
        # 기본 쿼리: 내 신청 목록 + 활동 정보 조인
        query = supabase.table("activity_registrations")\
            .select(
                "id, status, created_at, updated_at, "
                "activities(id, type, title, description, thumbnail_url, "
                "registration_start, registration_end, max_capacity, current_count, "
                "require_membership, is_active)"
            )\
            .eq("user_id", user_id)
        
        # 상태 필터 적용
        if status_filter and status_filter in ['pending', 'approved', 'rejected', 'cancelled']:
            query = query.eq("status", status_filter)
        
        # 정렬: 최신순
        query = query.order("created_at", desc=True)
        
        # 전체 개수 조회
        count_result = supabase.table("activity_registrations")\
            .select("id", count="exact")\
            .eq("user_id", user_id)
        
        if status_filter and status_filter in ['pending', 'approved', 'rejected', 'cancelled']:
            count_result = count_result.eq("status", status_filter)
        
        count_result = count_result.execute()
        total = count_result.count or 0
        
        # 페이지네이션 적용
        offset = (page - 1) * page_size
        query = query.range(offset, offset + page_size - 1)
        
        result = query.execute()
        
        # 응답 데이터 가공
        items = []
        for reg in (result.data or []):
            activity = reg.get("activities") or {}
            items.append({
                "registration_id": reg.get("id"),
                "status": reg.get("status"),
                "registered_at": reg.get("created_at"),
                "updated_at": reg.get("updated_at"),
                "activity": {
                    "id": activity.get("id"),
                    "type": activity.get("type"),
                    "title": activity.get("title"),
                    "description": activity.get("description"),
                    "thumbnail_url": activity.get("thumbnail_url"),
                    "registration_start": activity.get("registration_start"),
                    "registration_end": activity.get("registration_end"),
                    "max_capacity": activity.get("max_capacity"),
                    "current_count": activity.get("current_count"),
                    "require_membership": activity.get("require_membership"),
                    "is_active": activity.get("is_active")
                }
            })
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"활동 목록 조회 실패: {str(e)}"
        )
