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
from app.database import supabase
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
    
    verification_status가 'pending'인 회원들을 조회합니다.
    생성일 기준 오래된 순으로 정렬합니다.
    학적 인증 이미지가 있는 경우 Signed URL을 생성하여 반환합니다.
    """
    try:
        # 승인 대기 중인 회원 조회
        result = supabase.table('users')\
            .select('id, student_id, name, email, department, phone, verification_image_url, created_at')\
            .eq('verification_status', 'pending')\
            .order('created_at', desc=False)\
            .execute()
        
        users = result.data if result.data else []
        
        # 각 사용자의 이미지에 대한 Signed URL 생성
        for user in users:
            if user.get('verification_image_url'):
                # Private Storage이므로 Signed URL 생성 (1시간 유효)
                signed_url = create_signed_url(user['verification_image_url'], expires_in=3600)
                user['verification_image_url'] = signed_url
        
        return PendingUserListResponse(
            users=users,
            total=len(users)
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"승인 대기 목록 조회 실패: {str(e)}"
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
        role: 역할 필터 (student, council, admin)
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
        result = supabase.table('users')\
            .update({
                'verification_status': 'approved',
                'verified_at': datetime.utcnow().isoformat(),
                'rejection_reason': None,  # 거부 사유가 있었다면 초기화
                'updated_at': datetime.utcnow().isoformat()
            })\
            .eq('id', user_id)\
            .execute()
        
        return ApproveUserResponse(user_id=user_id)
    
    except HTTPException:
        raise
    except Exception as e:
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
    
    해당 회원의 verification_status를 'rejected'로 변경하고,
    거부 사유를 기록합니다. 거부된 회원은 로그인할 수 없습니다.
    
    Args:
        user_id: 거부할 회원의 UUID
        request: 거부 사유 (필수)
    
    Returns:
        거부 완료 메시지와 user_id
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
        
        # 2. 거부 처리
        result = supabase.table('users')\
            .update({
                'verification_status': 'rejected',
                'rejection_reason': request.reason,
                'updated_at': datetime.utcnow().isoformat()
            })\
            .eq('id', user_id)\
            .execute()
        
        return RejectUserResponse(user_id=user_id)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회원 거부 실패: {str(e)}"
        )


@router.patch(
    "/users/{user_id}/role",
    response_model=UpdateRoleResponse,
    summary="회원 역할 변경",
    description="회원의 역할을 변경합니다 (student, council, admin)",
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
    - council: 일반 학생회 (게시글 삭제 가능)
    - admin: 관리자 (모든 권한)
    
    Args:
        user_id: 역할을 변경할 회원의 UUID
        request: 새로운 역할 (student, council, admin)
    
    Returns:
        변경 완료 메시지, user_id, 새로운 역할
    """
    try:
        # 1. 역할 유효성 검증
        if request.role not in ['student', 'council', 'admin']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="역할은 student, council, admin 중 하나여야 합니다"
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
        result = supabase.table('users')\
            .update({
                'role': request.role,
                'updated_at': datetime.utcnow().isoformat()
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
        update_data = {
            'membership_paid': request.paid,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # 납부로 변경하는 경우 납부 일시 기록
        if request.paid and not user_check.data['membership_paid']:
            update_data['membership_paid_at'] = datetime.utcnow().isoformat()
        
        result = supabase.table('users')\
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
        # 차단된 사용자 조회
        blocks_result = supabase.table('login_blocks')\
            .select('*')\
            .execute()
        
        if not blocks_result.data:
            return {
                'blocked_users': [],
                'total': 0
            }
        
        blocked_users = []
        for block in blocks_result.data:
            student_id = block['student_id']
            
            # 사용자 정보 조회
            user_result = supabase.table('users')\
                .select('name, email, department')\
                .eq('student_id', student_id)\
                .single()\
                .execute()
            
            user_info = user_result.data if user_result.data else {}
            
            # 최근 로그인 시도 이력 조회 (최근 20개)
            attempts_result = supabase.table('login_attempts')\
                .select('*')\
                .eq('student_id', student_id)\
                .order('attempt_time', desc=True)\
                .limit(20)\
                .execute()
            
            attempts = attempts_result.data if attempts_result.data else []
            
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
        # 1. 사용자 존재 확인
        user_result = supabase.table('users')\
            .select('id')\
            .eq('student_id', student_id)\
            .single()\
            .execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다"
            )
        
        # 2. 차단 해제
        await unblock_user(student_id)
        
        return {
            'student_id': student_id,
            'message': '차단이 해제되었습니다'
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"차단 해제 실패: {str(e)}"
        )
