"""
관리자 승인 API 엔드포인트
학생 인증 승인/거부를 처리합니다.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from datetime import datetime
from typing import List

from app.database import get_supabase
from app.schemas.admin import ApprovalRequest, PendingUserResponse, ApprovalResponse
from app.utils.auth import require_admin, get_current_user

router = APIRouter(prefix="/admin", tags=["관리자"])


@router.get("/pending-users", response_model=List[PendingUserResponse])
async def get_pending_users(
    admin_user: dict = Depends(require_admin),
    supabase: Client = Depends(get_supabase)
):
    """
    승인 대기 중인 사용자 목록 조회
    
    - 관리자 권한 필요
    - verification_status='pending'인 사용자만 조회
    - 학생증 이미지가 업로드된 사용자 우선 표시
    """
    try:
        # pending 상태인 사용자 조회
        response = supabase.table("profiles")\
            .select("*")\
            .eq("verification_status", "pending")\
            .order("created_at", desc=False)\
            .execute()
        
        if not response.data:
            return []
        
        # 이미지 업로드한 사용자 우선 정렬
        users_list: list[dict] = response.data  # type: ignore
        pending_users = sorted(
            users_list,
            key=lambda x: (x.get("verification_image_url") is None, x.get("created_at"))
        )
        
        return [PendingUserResponse(**user) for user in pending_users]  # type: ignore
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"승인 대기 목록 조회 실패: {str(e)}"
        )


@router.post("/approve-user", response_model=ApprovalResponse)
async def approve_or_reject_user(
    request: ApprovalRequest,
    admin_user: dict = Depends(require_admin),
    supabase: Client = Depends(get_supabase)
):
    """
    사용자 승인 또는 거부
    
    - 관리자 권한 필요
    - 승인(approve): is_verified=True, verification_status='approved'
    - 거부(reject): is_verified=False, verification_status='rejected', 거부 사유 저장
    """
    # 1. 요청 유효성 검증
    if request.is_reject and not request.rejection_reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="거부 시 거부 사유를 입력해주세요"
        )
    
    # 2. 대상 사용자 조회
    user_response = supabase.table("profiles")\
        .select("*")\
        .eq("id", request.user_id)\
        .single()\
        .execute()
    
    if not user_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )
    
    user: dict = user_response.data  # type: ignore
    
    # 3. 이미 처리된 사용자 확인
    if user["verification_status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"이미 {user['verification_status']} 상태입니다"
        )
    
    # 4. 학생증 이미지 확인
    if not user.get("verification_image_url"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="학생증 이미지가 업로드되지 않았습니다"
        )
    
    try:
        # 5. 승인 처리
        if request.is_approve:
            update_data = {
                "is_verified": True,
                "verification_status": "approved",
                "verified_by": admin_user["id"],
                "verified_at": datetime.utcnow().isoformat(),
                "rejection_reason": None
            }
            message = f"{str(user.get('name'))}({str(user.get('student_id'))}) 학생의 가입이 승인되었습니다"
        
        # 6. 거부 처리
        else:
            update_data = {
                "is_verified": False,
                "verification_status": "rejected",
                "verified_by": admin_user["id"],
                "verified_at": datetime.utcnow().isoformat(),
                "rejection_reason": request.rejection_reason
            }
            message = f"{str(user.get('name'))}({str(user.get('student_id'))}) 학생의 가입이 거부되었습니다"
        
        # 7. DB 업데이트
        update_response = supabase.table("profiles")\
            .update(update_data)\
            .eq("id", request.user_id)\
            .execute()
        
        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="승인 처리에 실패했습니다"
            )
        
        updated_user: dict = update_response.data[0]  # type: ignore
        return ApprovalResponse(
            success=True,
            message=message,
            user=PendingUserResponse(**updated_user)
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"승인 처리 중 오류 발생: {str(e)}"
        )


@router.get("/rejected-users", response_model=List[PendingUserResponse])
async def get_rejected_users(
    admin_user: dict = Depends(require_admin),
    supabase: Client = Depends(get_supabase)
):
    """
    거부된 사용자 목록 조회
    
    - 관리자 권한 필요
    - verification_status='rejected'인 사용자 조회
    """
    try:
        response = supabase.table("profiles")\
            .select("*")\
            .eq("verification_status", "rejected")\
            .order("verified_at", desc=True)\
            .execute()
        
        if not response.data:
            return []
        
        users_list: list[dict] = response.data  # type: ignore
        return [PendingUserResponse(**user) for user in users_list]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"거부 목록 조회 실패: {str(e)}"
        )


@router.post("/update-membership")
async def update_membership_status(
    user_id: str,
    membership_paid: bool,
    admin_user: dict = Depends(require_admin),
    supabase: Client = Depends(get_supabase)
):
    """
    회비 납부 상태 업데이트
    
    - 관리자 권한 필요
    - 4년 회비 납부 여부 관리
    """
    try:
        update_data: dict = {
            "membership_paid": membership_paid,
        }
        
        if membership_paid:
            update_data["membership_paid_at"] = datetime.utcnow().isoformat()
        else:
            update_data["membership_paid_at"] = None
        
        response = supabase.table("profiles")\
            .update(update_data)\
            .eq("id", user_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다"
            )
        
        return {
            "success": True,
            "message": f"회비 납부 상태가 {'완료'if membership_paid else '미납'}로 변경되었습니다",
            "data": response.data[0]
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회비 상태 업데이트 실패: {str(e)}"
        )


@router.post("/update-role")
async def update_user_role(
    user_id: str,
    role: str,
    admin_user: dict = Depends(require_admin),
    supabase: Client = Depends(get_supabase)
):
    """
    사용자 권한 변경
    
    - 관리자 권한 필요
    - role: student, council, admin
    """
    allowed_roles = ["student", "council", "admin"]
    
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"허용되지 않은 권한입니다. 가능한 값: {', '.join(allowed_roles)}"
        )
    
    try:
        response = supabase.table("profiles")\
            .update({"role": role})\
            .eq("id", user_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다"
            )
        
        return {
            "success": True,
            "message": f"권한이 {role}로 변경되었습니다",
            "data": response.data[0]
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"권한 변경 실패: {str(e)}"
        )
