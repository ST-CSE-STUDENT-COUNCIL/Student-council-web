"""
관리자 API 엔드포인트
회원 승인, 역할 관리, 회비 납부 처리 등 관리자 전용 기능
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from app.schemas.admin import (
    UserListResponse,
    PendingUserListResponse,
    ApproveUserRequest,
    ApproveUserResponse,
    RejectUserRequest,
    RejectUserResponse,
    UpdateRoleRequest,
    UpdateRoleResponse,
    UpdateMembershipRequest,
    UpdateMembershipResponse,
    ErrorResponse
)
from app.utils.auth import require_admin
from app.utils.storage import create_signed_url
from app.utils.login_security import unblock_user
from app.database import supabase, get_supabase_admin
from postgrest.exceptions import APIError


# 관리자 라우터 생성 (모든 엔드포인트에 관리자 권한 필요)
router = APIRouter(
    prefix="/admin",
    tags=["관리자"],
    dependencies=[Depends(require_admin)]
)


@router.get(
    "/users/pending",
    response_model=PendingUserListResponse,
    summary="승인 대기 회원 목록 조회",
    description="관리자 승인을 기다리는 회원 목록을 조회합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"}
    }
)
async def get_pending_users():
    """
    승인 대기 회원 목록 조회
    
    verification_status가 'pending' 또는 'submitted'인 회원들을 조회합니다.
    생성일 기준 오래된 순으로 정렬합니다.
    학적 인증 이미지가 있는 경우 Signed URL을 생성하여 반환합니다.
    """
    try:
        # 승인 대기 중인 회원 조회 (pending + submitted)
        result = supabase.table('users')\
            .select('id, student_id, name, email, department, phone, verification_image_url, created_at')\
            .in_('verification_status', ['pending', 'submitted'])\
            .order('created_at', desc=False)\
            .execute()
        
        users = result.data if result.data else []
        
        # 각 사용자의 이미지에 대한 Signed URL 생성
        for user in users:
            original_url = user.get('verification_image_url')
            if original_url:
                # Private Storage이므로 Signed URL 생성 (1시간 유효)
                signed_url = create_signed_url(original_url, expires_in=3600)
                if signed_url:
                    user['verification_image_url'] = signed_url
                else:
                    # 실패 시 None 유지
                    user['verification_image_url'] = None
        
        return PendingUserListResponse(
            users=users,
            total=len(users)
        )
    
    except Exception as e:
        print(f"[API ERROR] get_pending_users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"승인 대기 목록 조회 실패: {str(e)}"
        )


@router.get(
    "/rejected-users",
    summary="거절된 회원 목록 조회",
    description="가입이 거절된 회원의 목록을 조회합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"}
    }
)
async def get_rejected_users(
    page: int = 1,
    page_size: int = 20
):
    """
    거절된 회원 목록 조회
    
    rejected_users 테이블에서 거절된 회원 목록을 조회합니다.
    """
    try:
        admin_supabase = get_supabase_admin()
        offset = (page - 1) * page_size
        
        # 전체 개수 조회
        count_result = admin_supabase.table('rejected_users')\
            .select('id', count='exact')\
            .execute()
        
        total = count_result.count or 0
        
        # 목록 조회
        result = admin_supabase.table('rejected_users')\
            .select('*')\
            .order('rejected_at', desc=True)\
            .range(offset, offset + page_size - 1)\
            .execute()
        
        return {
            "items": result.data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0
        }
    
    except Exception as e:
        print(f"[API ERROR] get_rejected_users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"거절된 회원 목록 조회 실패: {str(e)}"
        )

@router.get(
    "/users",
    response_model=UserListResponse,
    summary="전체 회원 목록 조회",
    description="모든 회원의 목록을 조회합니다. 쿼리 파라미터로 필터링 가능합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"}
    }
)
async def get_all_users(
    role: Optional[str] = None,
    verification_status: Optional[str] = None,
    membership_paid: Optional[bool] = None
):
    """
    전체 회원 목록 조회
    
    Args:
        role: 역할 필터 (student, admin)
        verification_status: 승인 상태 필터 (pending, approved, rejected)
        membership_paid: 회비 납부 여부 필터 (true, false)
    
    Returns:
        회원 목록과 총 개수
    """
    try:
        # 기본 쿼리
        query = supabase.table('users')\
            .select('id, student_id, name, email, department, phone, role, verification_status, membership_paid, created_at')
        
        # 필터 적용
        if role:
            query = query.eq('role', role)
        if verification_status:
            query = query.eq('verification_status', verification_status)
        if membership_paid is not None:
            query = query.eq('membership_paid', membership_paid)
        
        # 정렬 및 실행
        result = query.order('created_at', desc=True).execute()
        
        users = result.data if result.data else []
        
        return UserListResponse(
            users=users,
            total=len(users)
        )
    
    except Exception as e:
        print(f"[API ERROR] get_users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회원 목록 조회 실패: {str(e)}"
        )


@router.post(
    "/users/{user_id}/approve",
    response_model=ApproveUserResponse,
    summary="회원 승인",
    description="승인 대기 중인 회원을 승인합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "사용자를 찾을 수 없음"}
    }
)
async def approve_user(user_id: str):
    """
    회원 승인
    
    해당 회원의 verification_status를 'approved'로 변경하고,
    verified_at에 현재 시각을 기록합니다.
    승인 후 회원은 모든 기능을 사용할 수 있습니다.
    
    Args:
        user_id: 승인할 회원의 UUID
    
    Returns:
        승인 완료 메시지와 user_id
    """
    try:
        # 1. 사용자 존재 확인
        user_check = supabase.table('users')\
            .select('id, verification_status')\
            .eq('id', user_id)\
            .single()\
            .execute()
        
        if not user_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다"
            )
        
        # 2. 이미 승인된 회원인지 확인
        if user_check.data['verification_status'] == 'approved':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 승인된 회원입니다"
            )
        
        # 3. 승인 처리
        from datetime import timezone, timedelta
        kst = timezone(timedelta(hours=9))
        now_kst = datetime.now(kst).isoformat()
        
        admin_supabase = get_supabase_admin()
        result = admin_supabase.table('users')\
            .update({
                'verification_status': 'approved',
                'verified_at': now_kst,
                'rejection_reason': None,  # 거부 사유가 있었다면 초기화
                'updated_at': now_kst
            })\
            .eq('id', user_id)\
            .execute()
        
        # 승인 완료 후 인증 이미지 삭제 (개인정보 보호)
        if user['verification_image_url']:
            try:
                from app.database import supabase
                supabase.storage.from_('verification-images').remove([user['verification_image_url']])
            except Exception as e:
                # 이미지 삭제 실패해도 승인은 유지 (로그만 남김)
                print(f"[APPROVE INFO] 이미지 삭제 실패 (무시됨): {str(e)}")
        
        return ApproveUserResponse(user_id=user_id)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] approve_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회원 승인 실패: {str(e)}"
        )


@router.post(
    "/users/{user_id}/reject",
    response_model=RejectUserResponse,
    summary="회원 거부",
    description="승인 대기 중인 회원을 거부합니다. 거부 사유는 필수입니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "사용자를 찾을 수 없음"}
    }
)
async def reject_user(user_id: str, request: RejectUserRequest):
    """
    회원 거부
    
    해당 회원을 rejected_users 테이블로 이동하고,
    users 및 auth.users에서 삭제합니다.
    거부된 회원은 재가입이 가능합니다.
    
    Args:
        user_id: 거부할 회원의 UUID
        request: 거부 사유 (필수)
    
    Returns:
        거부 완료 메시지와 user_id
    """
    try:
        admin_supabase = get_supabase_admin()
        
        # 1. 사용자 정보 조회
        user_check = admin_supabase.table('users')\
            .select('*')\
            .eq('id', user_id)\
            .single()\
            .execute()
        
        if not user_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다"
            )
        
        user_data = user_check.data
        
        # 2. rejected_users 테이블에 아카이브
        archive_data = {
            'original_user_id': user_id,
            'email': user_data.get('email'),
            'name': user_data.get('name'),
            'student_id': user_data.get('student_id'),
            'department': user_data.get('department'),
            'phone': user_data.get('phone'),
            'rejection_reason': request.reason
        }
        
        admin_supabase.table('rejected_users').insert(archive_data).execute()
        
        # 3. users 테이블에서 삭제
        admin_supabase.table('users').delete().eq('id', user_id).execute()
        
        # 4. Supabase Auth에서 삭제 (새 클라이언트 사용)
        try:
            from app.database import get_fresh_admin_client
            fresh_client = get_fresh_admin_client()
            fresh_client.auth.admin.delete_user(user_id)
        except Exception as auth_error:
            # Auth 삭제 실패 로깅
            print(f"[ADMIN REJECT ERROR] Auth 삭제 실패: {str(auth_error)}")
        
        # 5. email_verifications 삭제 (재가입 허용) - 직접 삭제
        try:
            user_email = user_data.get('email')
            # 해당 이메일의 모든 레코드 삭제 (verified 상태와 무관하게)
            result = admin_supabase.table('email_verifications').delete().eq('email', user_email).execute()
        except Exception as ev_error:
            pass  # 삭제 실패 무시
        
        return RejectUserResponse(user_id=user_id)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] reject: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회원 거부 실패: {str(e)}"
        )


@router.patch(
    "/users/{user_id}/role",
    response_model=UpdateRoleResponse,
    summary="회원 역할 변경",
    description="회원의 역할을 변경합니다 (student, admin)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "사용자를 찾을 수 없음"}
    }
)
async def update_user_role(user_id: str, request: UpdateRoleRequest):
    """
    회원 역할 변경
    
    회원의 role을 변경합니다.
    - student: 일반 학생 (기본)
    - admin: 관리자 (모든 권한)
    
    Args:
        user_id: 역할을 변경할 회원의 UUID
        request: 새로운 역할 (student, admin)
    
    Returns:
        변경 완료 메시지, user_id, 새로운 역할
    """
    try:
        # 1. 역할 유효성 검증
        if request.role not in ['student', 'admin']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="역할은 student, admin 중 하나여야 합니다"
            )
        
        # 2. 사용자 존재 확인
        user_check = supabase.table('users')\
            .select('id, role')\
            .eq('id', user_id)\
            .single()\
            .execute()
        
        if not user_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다"
            )
        
        # 3. 이미 같은 역할인지 확인
        if user_check.data['role'] == request.role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"이미 {request.role} 역할입니다"
            )
        
        # 4. 역할 변경
        from datetime import timezone, timedelta
        kst = timezone(timedelta(hours=9))
        
        admin_supabase = get_supabase_admin()
        result = admin_supabase.table('users')\
            .update({
                'role': request.role,
                'updated_at': datetime.now(kst).isoformat()
            })\
            .eq('id', user_id)\
            .execute()
        
        return UpdateRoleResponse(
            user_id=user_id,
            new_role=request.role
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] update_user_role: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"역할 변경 실패: {str(e)}"
        )


@router.patch(
    "/users/{user_id}/membership",
    response_model=UpdateMembershipResponse,
    summary="회비 납부 상태 변경",
    description="회원의 4년 회비 납부 상태를 변경합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "사용자를 찾을 수 없음"}
    }
)
async def update_membership_status(user_id: str, request: UpdateMembershipRequest):
    """
    회비 납부 상태 변경
    
    회원의 membership_paid 상태를 변경합니다.
    회비 납부자만 참여 가능한 행사가 있을 수 있습니다.
    
    Args:
        user_id: 회비 상태를 변경할 회원의 UUID
        request: 납부 여부 (true/false)
    
    Returns:
        변경 완료 메시지, user_id, 납부 여부
    """
    try:
        # 1. 사용자 존재 확인
        user_check = supabase.table('users')\
            .select('id, membership_paid')\
            .eq('id', user_id)\
            .single()\
            .execute()
        
        if not user_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다"
            )
        
        # 2. 회비 납부 상태 변경
        from datetime import timezone, timedelta
        kst = timezone(timedelta(hours=9))
        now_kst = datetime.now(kst).isoformat()
        update_data = {
            'membership_paid': request.paid,
            'updated_at': now_kst
        }
        
        # 납부로 변경하는 경우 납부 일시 기록
        if request.paid and not user_check.data['membership_paid']:
            update_data['membership_paid_at'] = now_kst
        
        admin_supabase = get_supabase_admin()
        result = admin_supabase.table('users')\
            .update(update_data)\
            .eq('id', user_id)\
            .execute()
        
        return UpdateMembershipResponse(
            user_id=user_id,
            paid=request.paid
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] update_membership_status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회비 상태 변경 실패: {str(e)}"
        )


@router.get(
    "/users/blocked",
    summary="차단된 사용자 목록 조회",
    description="로그인 실패로 차단된 사용자 목록을 조회합니다 (IP 로그 포함)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"}
    }
)
async def get_blocked_users():
    """
    차단된 사용자 목록 조회
    
    로그인 실패로 차단된 사용자와 최근 로그인 시도 IP 로그를 함께 반환합니다.
    관리자가 실제 본인의 시도인지 악의적인 공격인지 판단할 수 있습니다.
    """
    try:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        
        # 실제 차단된 사용자 조회 (block_reason이 있는 경우)
        blocks_result = supabase.table('login_blocks')\
            .select('*')\
            .not_.is_('block_reason', 'null')\
            .execute()
        
        if not blocks_result.data:
            return {
                'blocked_users': [],
                'total': 0
            }
        
        # 현재 차단 중인 사용자만 필터링 (영구차단 또는 block_until > 현재시간)
        active_blocks = []
        for block in blocks_result.data:
            block_reason = block.get('block_reason')
            block_until_str = block.get('block_until')
            
            # 영구 차단은 항상 표시
            if block_reason == 'permanent':
                active_blocks.append(block)
                continue
            
            # 일시 차단은 block_until이 현재보다 미래인 경우만 표시
            if block_until_str:
                try:
                    block_until = datetime.fromisoformat(block_until_str.replace('Z', '+00:00'))
                    if block_until > now:
                        active_blocks.append(block)
                except:
                    pass
        
        if not active_blocks:
            return {
                'blocked_users': [],
                'total': 0
            }
        
        # N+1 방지: 모든 student_id를 수집하여 한 번에 조회
        student_ids = [block['student_id'] for block in active_blocks]
        
        # 사용자 정보 한 번에 조회
        users_result = supabase.table('users')\
            .select('student_id, name, email, department')\
            .in_('student_id', student_ids)\
            .execute()
        user_map = {u['student_id']: u for u in (users_result.data or [])}
        
        # 로그인 시도 기록 한 번에 조회 (각 student_id별 최근 20개는 클라이언트에서 필터링)
        attempts_result = supabase.table('login_attempts')\
            .select('*')\
            .in_('student_id', student_ids)\
            .order('attempt_time', desc=True)\
            .execute()
        
        # student_id별로 로그인 시도 그룹화
        attempts_map: dict[str, list] = {}
        for attempt in (attempts_result.data or []):
            sid = attempt['student_id']
            if sid not in attempts_map:
                attempts_map[sid] = []
            if len(attempts_map[sid]) < 20:  # 최대 20개
                attempts_map[sid].append(attempt)
        
        blocked_users = []
        for block in active_blocks:
            student_id = block['student_id']
            user_info = user_map.get(student_id, {})
            attempts = attempts_map.get(student_id, [])
            
            blocked_users.append({
                'student_id': student_id,
                'name': user_info.get('name'),
                'email': user_info.get('email'),
                'department': user_info.get('department'),
                'failed_attempts': block.get('failed_attempts', 0),
                'block_reason': block.get('block_reason'),
                'block_until': block.get('block_until'),
                'created_at': block.get('created_at'),
                'recent_attempts': attempts  # IP 로그 포함
            })
        
        return {
            'blocked_users': blocked_users,
            'total': len(blocked_users)
        }
    
    except Exception as e:
        print(f"[API ERROR] get_blocked_users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"차단 목록 조회 실패: {str(e)}"
        )


@router.post(
    "/users/{student_id}/unblock",
    summary="사용자 차단 해제",
    description="로그인 차단된 사용자의 차단을 해제합니다 (IP 로그 확인 후 본인 확인 시)",
    responses={
        200: {"description": "차단 해제 성공"},
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "사용자 없음"}
    }
)
async def unblock_user_by_admin(student_id: str):
    """
    사용자 차단 해제
    
    관리자가 IP 로그를 확인하여 실제 본인의 시도로 판단한 경우
    차단을 해제하고 로그인 실패 횟수를 초기화합니다.
    """
    try:
        # 차단 정보 존재 확인
        block_result = supabase.table('login_blocks')\
            .select('id')\
            .eq('student_id', student_id)\
            .execute()
        
        if not block_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="해당 학번의 차단 정보가 없습니다"
            )
        
        # 차단 해제
        await unblock_user(student_id)
        
        return {
            'student_id': student_id,
            'message': '차단이 해제되었습니다'
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] unblock_user_login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"차단 해제 실패: {str(e)}"
        )


# ============================================================================
# 프로필 변경 요청 관리
# ============================================================================

@router.get(
    "/profile-updates",
    summary="프로필 변경 요청 목록",
    description="관리자 승인 대기 중인 프로필 변경 요청을 조회합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"}
    }
)
async def get_profile_update_requests(
    status_filter: Optional[str] = None
):
    """프로필 변경 요청 목록 조회"""
    try:
        query = supabase.table('profile_update_requests')\
            .select('*, users!user_id(name, student_id, email)')
        
        if status_filter:
            query = query.eq('status', status_filter)
        else:
            query = query.eq('status', 'pending')  # 기본: 대기 중인 것만
        
        result = query.order('created_at', desc=True).execute()
        
        # Signed URL 생성
        requests = []
        for req in (result.data or []):
            signed_url = create_signed_url(req.get('verification_image_url'))
            req['verification_image_signed_url'] = signed_url
            requests.append(req)
        
        return {"requests": requests}
    
    except Exception as e:
        print(f"[API ERROR] get_profile_update_requests: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"조회 실패: {str(e)}"
        )


@router.get(
    "/profile-updates/rejected",
    summary="거부된 프로필 변경 요청 목록",
    description="거부된 프로필 변경 요청을 조회합니다"
)
async def get_rejected_profile_updates():
    """거부된 프로필 변경 요청 목록"""
    try:
        result = supabase.table('profile_update_requests')\
            .select('*, users!user_id(name, student_id, email)')\
            .eq('status', 'rejected')\
            .order('updated_at', desc=True)\
            .execute()
        
        requests = []
        for req in (result.data or []):
            signed_url = create_signed_url(req.get('verification_image_url'))
            req['verification_image_signed_url'] = signed_url
            requests.append(req)
        
        return {"requests": requests, "total": len(requests)}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"조회 실패: {str(e)}"
        )


@router.get(
    "/profile-updates/approved",
    summary="승인된 프로필 변경 요청 목록",
    description="승인된 프로필 변경 요청을 조회합니다"
)
async def get_approved_profile_updates():
    """승인된 프로필 변경 요청 목록"""
    try:
        result = supabase.table('profile_update_requests')\
            .select('*, users!user_id(name, student_id, email)')\
            .eq('status', 'approved')\
            .order('updated_at', desc=True)\
            .execute()
        
        requests = []
        for req in (result.data or []):
            signed_url = create_signed_url(req.get('verification_image_url'))
            req['verification_image_signed_url'] = signed_url
            requests.append(req)
        
        return {"requests": requests, "total": len(requests)}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"조회 실패: {str(e)}"
        )


@router.post(
    "/profile-updates/{request_id}/approve",
    summary="프로필 변경 승인",
    description="프로필 변경 요청을 승인하고 사용자 정보를 업데이트합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "요청을 찾을 수 없음"}
    }
)
async def approve_profile_update(
    request_id: int,
    current_user: dict = Depends(require_admin)
):
    """프로필 변경 승인"""
    try:
        admin_supabase = get_supabase_admin()
        
        # 요청 조회
        req_result = admin_supabase.table('profile_update_requests')\
            .select('*')\
            .eq('id', request_id)\
            .eq('status', 'pending')\
            .single()\
            .execute()
        
        if not req_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="처리할 요청이 없습니다"
            )
        
        request_data = req_result.data
        
        # 사용자 정보 업데이트
        admin_supabase.table('users')\
            .update({request_data['field_name']: request_data['new_value']})\
            .eq('id', request_data['user_id'])\
            .execute()
        
        # 요청 상태 업데이트
        from datetime import timezone
        admin_supabase.table('profile_update_requests')\
            .update({
                'status': 'approved',
                'processed_at': datetime.now(timezone.utc).isoformat(),
                'processed_by': current_user['id']
            })\
            .eq('id', request_id)\
            .execute()
        
        return {
            "request_id": request_id,
            "status": "approved",
            "message": "프로필 변경이 승인되었습니다"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] approve_profile_update: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"승인 처리 실패: {str(e)}"
        )


@router.post(
    "/profile-updates/{request_id}/reject",
    summary="프로필 변경 거부",
    description="프로필 변경 요청을 거부합니다 (사유 필수)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "요청을 찾을 수 없음"},
        400: {"model": ErrorResponse, "description": "거부 사유 필수"}
    }
)
async def reject_profile_update(
    request_id: int,
    reason: str,
    current_user: dict = Depends(require_admin)
):
    """프로필 변경 거부"""
    try:
        if not reason or len(reason.strip()) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="거부 사유를 입력해주세요"
            )
        
        admin_supabase = get_supabase_admin()
        
        # 요청 조회
        req_result = admin_supabase.table('profile_update_requests')\
            .select('id')\
            .eq('id', request_id)\
            .eq('status', 'pending')\
            .single()\
            .execute()
        
        if not req_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="처리할 요청이 없습니다"
            )
        
        # 요청 상태 업데이트
        from datetime import timezone
        admin_supabase.table('profile_update_requests')\
            .update({
                'status': 'rejected',
                'rejection_reason': reason.strip(),
                'processed_at': datetime.now(timezone.utc).isoformat(),
                'processed_by': current_user['id']
            })\
            .eq('id', request_id)\
            .execute()
        
        return {
            "request_id": request_id,
            "status": "rejected",
            "rejection_reason": reason.strip(),
            "message": "프로필 변경 요청이 거부되었습니다"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] reject_profile_update: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"거부 처리 실패: {str(e)}"
        )


# ============================================================================
# 개인정보 총책임자 정보 관리 (학생회장)
# ============================================================================

@router.get(
    "/privacy-officer",
    summary="개인정보 총책임자 정보 조회",
    description="개인정보 총책임자(학생회장) 정보를 조회합니다"
)
async def get_privacy_officer_info():
    """개인정보 총책임자 정보 조회"""
    try:
        result = supabase.table('privacy_officer_info').select('*').eq('id', 1).single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="개인정보 총책임자 정보가 없습니다")
        
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"조회 실패: {str(e)}"
        )


@router.put(
    "/privacy-officer",
    summary="개인정보 총책임자 정보 수정",
    description="개인정보 총책임자(학생회장) 정보를 수정합니다"
)
async def update_privacy_officer_info(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    office_address: Optional[str] = None,
    description: Optional[str] = None
):
    """개인정보 총책임자 정보 수정"""
    try:
        admin_supabase = get_supabase_admin()
        
        update_data = {}
        if name is not None:
            update_data['name'] = name
        if phone is not None:
            update_data['phone'] = phone
        if email is not None:
            update_data['email'] = email
        if office_address is not None:
            update_data['office_address'] = office_address
        if description is not None:
            update_data['description'] = description
        
        if not update_data:
            raise HTTPException(status_code=400, detail="수정할 데이터가 없습니다")
        
        update_data['updated_at'] = datetime.utcnow().isoformat()
        
        result = admin_supabase.table('privacy_officer_info').update(update_data).eq('id', 1).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="수정 실패")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"수정 실패: {str(e)}"
        )
