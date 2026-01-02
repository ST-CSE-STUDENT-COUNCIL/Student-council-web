"""
건의함 관련 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import Optional
from datetime import datetime
import math
from app.schemas.suggestions import (
    SuggestionCreateRequest,
    SuggestionStatusUpdateRequest,
    SuggestionResponse,
    SuggestionListResponse,
    SuggestionListItem,
    PaginationMeta,
    ErrorResponse
)
from app.utils.auth import require_verified_user, require_admin
from app.database import supabase


router = APIRouter(prefix="/suggestions", tags=["건의함"])

ALLOWED_STATUSES = {"received", "in_progress", "rejected", "approved"}


def _get_author_name(author_id: str) -> str:
    """작성자 이름 조회 (helper function)"""
    try:
        result = supabase.table("users")\
            .select("name")\
            .eq("id", author_id)\
            .single()\
            .execute()
        return result.data["name"] if result.data else "익명"
    except:
        return "익명"


@router.post(
    "",
    response_model=SuggestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="건의함 작성",
    description="건의함을 작성합니다. 작성자는 기본 익명 처리되며, 관리자만 작성자를 확인할 수 있습니다.",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "승인 대기 중"}
    }
)
async def create_suggestion(
    body: SuggestionCreateRequest,
    current_user: dict = Depends(require_verified_user)
):
    """건의함 작성 (승인된 사용자만 가능)"""
    try:
        suggestion_data = {
            "author_id": current_user["id"],
            "title": body.title,
            "content": body.content,
            "status": "received"
        }
        
        result = supabase.table("suggestions").insert(suggestion_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="건의함 작성 실패"
            )
        
        suggestion = result.data[0]
        
        # 작성자 본인에게만 실명 표시
        return SuggestionResponse(
            id=suggestion["id"],
            author_id=current_user["id"],
            author_name=current_user.get("name", "익명"),
            title=suggestion["title"],
            content=suggestion["content"],
            status=suggestion["status"],
            rejection_reason=None,
            resolution_note=None,
            created_at=suggestion["created_at"],
            updated_at=suggestion["updated_at"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"건의함 작성 실패: {str(e)}"
        )


@router.get(
    "",
    response_model=SuggestionListResponse,
    status_code=status.HTTP_200_OK,
    summary="건의함 목록 조회",
    description="""
    건의함 목록을 조회합니다.
    
    **권한:**
    - admin: 전체 목록 조회 가능, 작성자 실명 표시
    - council: 전체 목록 조회 가능, 작성자 익명
    - 일반 사용자: 본인 작성 건만 조회 가능
    """,
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "승인 대기 중"}
    }
)
async def get_suggestions(
    status_filter: Optional[str] = Query(None, description="상태 필터 (received, in_progress, rejected, approved)"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    current_user: dict = Depends(require_verified_user)
):
    """건의함 목록 조회"""
    try:
        role = current_user.get("role", "student")
        is_admin = role == "admin"
        is_council = role == "council"
        can_view_all = is_admin or is_council
        
        if status_filter and status_filter not in ALLOWED_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"유효하지 않은 상태 값입니다. 허용: {', '.join(ALLOWED_STATUSES)}"
            )
        
        # 전체 개수 조회
        count_query = supabase.table("suggestions").select("id")
        if not can_view_all:
            count_query = count_query.eq("author_id", current_user["id"])
        if status_filter:
            count_query = count_query.eq("status", status_filter)
        
        count_result = count_query.execute()
        total = len(count_result.data) if count_result.data else 0
        
        # 목록 조회
        query = supabase.table("suggestions")\
            .select("*")\
            .order("created_at", desc=True)
        
        if not can_view_all:
            query = query.eq("author_id", current_user["id"])
        if status_filter:
            query = query.eq("status", status_filter)
        
        offset = (page - 1) * page_size
        query = query.range(offset, offset + page_size - 1)
        
        result = query.execute()
        suggestions_data = result.data if result.data else []
        
        # 응답 데이터 구성
        items = []
        for suggestion in suggestions_data:
            is_author = suggestion.get("author_id") == current_user["id"]
            
            # 작성자 정보: admin만 실명, 나머지는 익명
            author_name = "익명"
            author_id = None
            if is_admin and suggestion.get("author_id"):
                author_name = _get_author_name(suggestion["author_id"])
                author_id = suggestion["author_id"]
            elif is_author:
                author_name = current_user.get("name", "익명")
                author_id = current_user["id"]
            
            # 제목: 본인 또는 관리자/학생회만 볼 수 있음
            title = suggestion["title"] if (is_author or can_view_all) else "익명 건의사항"
            
            # 반려/승인 사유: 작성자 또는 관리자만
            show_notes = is_author or is_admin
            
            items.append(SuggestionListItem(
                id=suggestion["id"],
                author_id=author_id,
                author_name=author_name,
                title=title,
                status=suggestion["status"],
                rejection_reason=suggestion.get("rejection_reason") if show_notes else None,
                resolution_note=suggestion.get("resolution_note") if show_notes else None,
                created_at=suggestion["created_at"]
            ))
        
        total_pages = math.ceil(total / page_size) if total > 0 else 0
        
        return SuggestionListResponse(
            suggestions=items,
            pagination=PaginationMeta(
                page=page,
                limit=page_size,
                total=total,
                total_pages=total_pages
            )
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"건의함 목록 조회 실패: {str(e)}"
        )


@router.get(
    "/{suggestion_id}",
    response_model=SuggestionResponse,
    status_code=status.HTTP_200_OK,
    summary="건의함 상세 조회",
    description="""
    건의함 상세를 조회합니다.
    
    **권한:**
    - admin: 전체 조회 가능, 작성자 실명 표시
    - council: 전체 조회 가능, 작성자 익명
    - 일반 사용자: 본인 작성 건만 조회 가능
    """,
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "권한 부족"},
        404: {"model": ErrorResponse, "description": "건의함을 찾을 수 없음"}
    }
)
async def get_suggestion(
    suggestion_id: int,
    current_user: dict = Depends(require_verified_user)
):
    """건의함 상세 조회"""
    try:
        role = current_user.get("role", "student")
        is_admin = role == "admin"
        is_council = role == "council"
        can_view_all = is_admin or is_council
        
        result = supabase.table("suggestions")\
            .select("*")\
            .eq("id", suggestion_id)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="건의함을 찾을 수 없습니다"
            )
        
        suggestion = result.data
        is_author = suggestion.get("author_id") == current_user["id"]
        
        # 권한 체크: 작성자 또는 관리자/학생회만 조회 가능
        if not can_view_all and not is_author:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="열람 권한이 없습니다"
            )
        
        # 작성자 정보: admin만 실명
        author_name = "익명"
        author_id = None
        if is_admin and suggestion.get("author_id"):
            author_name = _get_author_name(suggestion["author_id"])
            author_id = suggestion["author_id"]
        elif is_author:
            author_name = current_user.get("name", "익명")
            author_id = current_user["id"]
        
        # 제목: 본인 또는 관리자/학생회
        title = suggestion["title"] if (is_author or can_view_all) else "익명 건의사항"
        
        # 반려/승인 사유: 작성자 또는 관리자만
        show_notes = is_author or is_admin
        
        return SuggestionResponse(
            id=suggestion["id"],
            author_id=author_id,
            author_name=author_name,
            title=title,
            content=suggestion["content"],
            status=suggestion["status"],
            rejection_reason=suggestion.get("rejection_reason") if show_notes else None,
            resolution_note=suggestion.get("resolution_note") if show_notes else None,
            created_at=suggestion["created_at"],
            updated_at=suggestion["updated_at"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"건의함 조회 실패: {str(e)}"
        )


@router.patch(
    "/{suggestion_id}/status",
    response_model=SuggestionResponse,
    status_code=status.HTTP_200_OK,
    summary="건의함 상태 변경 (관리자 전용)",
    description="""
    건의함 상태를 변경합니다.
    
    **상태:**
    - received: 접수
    - in_progress: 처리중
    - rejected: 반려 (rejection_reason 필수)
    - approved: 승인 (resolution_note 필수)
    """,
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "건의함을 찾을 수 없음"}
    }
)
async def update_suggestion_status(
    suggestion_id: int,
    body: SuggestionStatusUpdateRequest,
    current_user: dict = Depends(require_admin)
):
    """건의함 상태 변경 (관리자 전용)"""
    try:
        # 유효성 검사
        if body.status not in ALLOWED_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"유효하지 않은 상태 값입니다. 허용: {', '.join(ALLOWED_STATUSES)}"
            )
        
        if body.status == "rejected" and not body.rejection_reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="반려 상태로 변경 시 rejection_reason이 필요합니다"
            )
        
        if body.status == "approved" and not body.resolution_note:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="승인 상태로 변경 시 resolution_note가 필요합니다"
            )
        
        # 업데이트 데이터 구성
        update_data: dict[str, str | None] = {
            "status": body.status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # 상태별 처리
        if body.status == "rejected":
            update_data["rejection_reason"] = body.rejection_reason
            update_data["resolution_note"] = None
        elif body.status == "approved":
            update_data["resolution_note"] = body.resolution_note
            update_data["rejection_reason"] = None
        else:
            # received, in_progress
            update_data["rejection_reason"] = None
            update_data["resolution_note"] = None
        
        # 업데이트 실행
        result = supabase.table("suggestions")\
            .update(update_data)\
            .eq("id", suggestion_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="건의함을 찾을 수 없습니다"
            )
        
        updated = result.data[0]
        author_name = _get_author_name(updated.get("author_id"))
        
        return SuggestionResponse(
            id=updated["id"],
            author_id=updated.get("author_id"),
            author_name=author_name,
            title=updated["title"],
            content=updated["content"],
            status=updated["status"],
            rejection_reason=updated.get("rejection_reason"),
            resolution_note=updated.get("resolution_note"),
            created_at=updated["created_at"],
            updated_at=updated["updated_at"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"건의함 상태 변경 실패: {str(e)}"
        )
