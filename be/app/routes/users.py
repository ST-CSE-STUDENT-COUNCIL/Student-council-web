"""
사용자 프로필 관련 라우트
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form, Query
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from app.utils.logger import get_logger

logger = get_logger(__name__)

from app.schemas.users import (
    UserProfileResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    UploadVerificationImageRequest,
    UploadVerificationImageResponse,
    WithdrawRequest,
    WithdrawResponse,
    ProfileUpdateRequest,
    ProfileUpdateResponse,
    ProfileUpdateStatusResponse,
    EmailChangeRequest,
    EmailChangeVerifyRequest,
    EmailChangeResponse,
    EmailChangeVerifyResponse,
    PhoneChangeRequest,
    PhoneChangeResponse
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
        # 새 클라이언트 생성 (싱글톤 오염 방지)
        from app.database import get_fresh_admin_client
        fresh_client = get_fresh_admin_client()
        
        # 1. 현재 비밀번호로 재인증 (fresh 클라이언트 사용)
        try:
            fresh_client.auth.sign_in_with_password({
                "email": current_user['email'],
                "password": body.current_password
            })
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="현재 비밀번호가 올바르지 않습니다"
            )
        
        # 2. 새 비밀번호로 변경 (같은 fresh 클라이언트로 admin API 호출)
        try:
            fresh_client.auth.admin.update_user_by_id(
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
        401: {"model": ErrorResponse, "description": "인증 필요"},
        429: {"model": ErrorResponse, "description": "요청 횟수 초과"}
    }
)
@limiter.limit("30/hour")  # 공용 IP 고려
async def upload_verification_image_direct(
    request: Request,
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
            # 싱글톤 오염 방지를 위해 새 클라이언트 생성
            from app.database import get_fresh_admin_client
            fresh_client = get_fresh_admin_client()
            
            fresh_client.auth.sign_in_with_password({
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
        
        # 2. PostgreSQL 함수로 사용자 완전 삭제 (users + auth.users + 관련 데이터)
        try:
            admin_supabase.rpc('delete_user_completely', {'target_user_id': user_id}).execute()
        except Exception as rpc_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"회원탈퇴 처리 실패: {str(rpc_error)}"
            )
        
        # 3. email_verifications 삭제 (재가입 허용)
        try:
            admin_supabase.table('email_verifications')\
                .delete()\
                .eq('email', user_email)\
                .execute()
        except Exception as email_del_error:
            logger.info(f"email_verifications 삭제: {str(email_del_error)}")
        
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
            .eq("user_id", user_id)  # type: ignore
        
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


# ============================================================================
# 프로필 변경 API (이름/학번 - 관리자 승인)
# ============================================================================

@router.post(
    "/profile-update/image/upload",
    summary="프로필 변경용 학적 인증 이미지 업로드",
    description="프로필 변경 요청에 필요한 학적 인증 이미지를 업로드합니다. 이미 승인된 사용자도 업로드 가능합니다.",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        400: {"model": ErrorResponse, "description": "잘못된 파일 형식"},
        429: {"model": ErrorResponse, "description": "요청 횟수 초과"}
    }
)
@limiter.limit("30/hour")  # 공용 IP 고려
async def upload_profile_update_image(
    request: Request,
    file: UploadFile,
    current_user: dict = Depends(get_current_user)
):
    """
    프로필 변경용 학적 인증 이미지 업로드 (Private Storage)
    
    - 승인 여부와 관계없이 업로드 가능
    - Rate limit: 시간당 10회
    """
    from app.utils.storage import upload_verification_image
    
    try:
        # 파일 업로드 (profile-updates 폴더에 저장)
        try:
            file_path = await upload_verification_image(file, current_user['id'], folder="profile-updates")
        except Exception:
            raise
        
        return {
            "file_path": file_path,
            "message": "이미지 업로드 성공. 프로필 변경 요청 시 이 경로를 사용하세요."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 업로드 실패: {str(e)}"
        )


@router.post(
    "/profile-update",
    summary="프로필 변경 요청 (이름/학번)",
    description="이름 또는 학번 변경을 요청합니다. 학적 증명 이미지 첨부 필수, 관리자 승인 후 반영됩니다.",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        400: {"model": ErrorResponse, "description": "잘못된 요청"}
    }
)
async def request_profile_update(
    body: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """프로필 변경 요청 생성"""
    
    # [Rate Limit] DB 기반 중복/연타 방지 (최근 5초 내 요청 금지)
    try:
        limit_time = (datetime.now(timezone.utc) - timedelta(seconds=5)).isoformat()
        
        recent_check = supabase.table("profile_update_requests")\
            .select("id", count="exact")\
            .eq("user_id", current_user["id"])\
            .gte("created_at", limit_time)\
            .execute()
            
        if recent_check.count and recent_check.count > 0:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="잠시 후 다시 시도해주세요. (중복 제출 방지)"
            )
    except HTTPException:
        raise
    except Exception:
        # DB 오류시 진행 허용 (Fail Open - 중복 제출 방지 보다 사용자 경험 우선)
        pass
    
    try:
        admin_supabase = get_supabase_admin()
        
        # 현재 값 가져오기
        current_value = current_user.get(body.field_name)
        
        # 같은 필드에 대해 pending 상태인 요청이 있는지 확인
        existing = admin_supabase.table('profile_update_requests')\
            .select('id')\
            .eq('user_id', current_user['id'])\
            .eq('field_name', body.field_name)\
            .eq('status', 'pending')\
            .execute()
        
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 대기 중인 변경 요청이 있습니다"
            )
        
        # 요청 생성
        result = admin_supabase.table('profile_update_requests').insert({
            'user_id': current_user['id'],
            'field_name': body.field_name,
            'current_value': current_value,
            'new_value': body.new_value,
            'verification_image_url': body.verification_image_url,
            'status': 'pending'
        }).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="변경 요청 생성 실패"
            )
        
        data = result.data[0]
        return {
            "id": data['id'],
            "field_name": data['field_name'],
            "current_value": data['current_value'],
            "new_value": data['new_value'],
            "status": data['status'],
            "created_at": data['created_at'],
            "message": "변경 요청이 접수되었습니다. 관리자 승인을 기다려주세요."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"변경 요청 실패: {str(e)}"
        )


@router.get(
    "/profile-update",
    summary="내 프로필 변경 요청 조회",
    description="내가 요청한 프로필 변경 상태를 조회합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"}
    }
)
async def get_my_profile_updates(
    current_user: dict = Depends(get_current_user)
):
    """내 프로필 변경 요청 목록"""
    try:
        result = supabase.table('profile_update_requests')\
            .select('id, field_name, current_value, new_value, status, rejection_reason, created_at, processed_at')\
            .eq('user_id', current_user['id'])\
            .order('created_at', desc=True)\
            .execute()
        
        return {"requests": result.data or []}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"조회 실패: {str(e)}"
        )


# ============================================================================
# 이메일 변경 API
# ============================================================================

@router.post(
    "/email/send-verification",
    summary="이메일 변경 인증번호 발송",
    description="새 이메일로 6자리 인증번호를 발송합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        400: {"model": ErrorResponse, "description": "이미 사용 중인 이메일"},
        429: {"model": ErrorResponse, "description": "요청 횟수 초과"}
    }
)
@limiter.limit("10/minute")  # 공용 IP 고려
async def send_email_change_verification(
    body: EmailChangeRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """이메일 변경용 인증번호 발송"""
    from app.utils.email import create_email_verification, send_verification_email
    
    try:
        new_email = body.new_email
        
        # 현재 이메일과 같은지 확인
        if new_email == current_user['email']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="현재 사용 중인 이메일과 동일합니다"
            )
        
        # 다른 사용자가 이미 사용 중인지 확인
        existing = supabase.table('users')\
            .select('id')\
            .eq('email', new_email)\
            .execute()
        
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 이메일입니다"
            )
        
        # 인증번호 생성 및 발송
        code = await create_email_verification(new_email)
        send_verification_email(new_email, code)
        
        return {"message": "인증번호가 발송되었습니다. 5분 내에 입력해주세요."}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"인증번호 발송 실패: {str(e)}"
        )


@router.post(
    "/email/verify",
    summary="이메일 변경 인증 확인",
    description="인증번호 확인 후 이메일을 변경합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        400: {"model": ErrorResponse, "description": "인증번호 불일치 또는 만료"}
    }
)
async def verify_email_change(
    body: EmailChangeVerifyRequest,
    current_user: dict = Depends(get_current_user)
):
    """이메일 변경 인증 확인 및 변경"""
    from app.utils.email import verify_email_code
    
    try:
        # 인증번호 확인
        is_valid = await verify_email_code(body.new_email, body.code)
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="인증번호가 올바르지 않거나 만료되었습니다"
            )
        
        # 이메일 변경 (users 테이블 + Supabase Auth)
        admin_supabase = get_supabase_admin()
        
        # 1. users 테이블 업데이트
        admin_supabase.table('users')\
            .update({'email': body.new_email})\
            .eq('id', current_user['id'])\
            .execute()
        
        # 2. Supabase Auth 이메일 업데이트
        admin_supabase.auth.admin.update_user_by_id(
            current_user['id'],
            {'email': body.new_email}
        )
        
        # 인증 기록 사용 처리
        admin_supabase.table('email_verifications')\
            .update({'used': True})\
            .eq('email', body.new_email)\
            .eq('verified', True)\
            .execute()
        
        return {
            "new_email": body.new_email,
            "message": "이메일이 성공적으로 변경되었습니다. 다시 로그인해주세요."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이메일 변경 실패: {str(e)}"
        )


# ============================================================================
# 전화번호 변경 API
# ============================================================================

@router.patch(
    "/phone",
    summary="전화번호 변경",
    description="비밀번호 확인 후 전화번호를 즉시 변경합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        400: {"model": ErrorResponse, "description": "비밀번호 불일치"}
    }
)
async def change_phone(
    body: PhoneChangeRequest,
    current_user: dict = Depends(get_current_user)
):
    """전화번호 변경"""
    from app.database import get_fresh_admin_client
    
    try:
        # 비밀번호 확인
        try:
            fresh_client = get_fresh_admin_client()
            fresh_client.auth.sign_in_with_password({
                "email": current_user['email'],
                "password": body.password
            })
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="비밀번호가 올바르지 않습니다"
            )
        
        # 전화번호 정규화 (하이픈 제거)
        new_phone = body.new_phone.replace('-', '')
        
        # 전화번호 업데이트
        admin_supabase = get_supabase_admin()
        admin_supabase.table('users')\
            .update({'phone': new_phone})\
            .eq('id', current_user['id'])\
            .execute()
        
        return {
            "new_phone": new_phone,
            "message": "전화번호가 성공적으로 변경되었습니다."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"전화번호 변경 실패: {str(e)}"
        )
