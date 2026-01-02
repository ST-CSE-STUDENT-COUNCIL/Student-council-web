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
SHOW_AUTHOR_TO_COUNCIL = True


def should_show_author(role: str) -> bool:
    """
    작성자 정보 노출 여부 확인
    
    admin은 항상 작성자 확인 가능, council은 설정값에 따라 결정됩니다.
    """
    if role == "admin":
        return True
    if role == "council" and SHOW_AUTHOR_TO_COUNCIL:
        return True
    return False


def can_view_admin_notes(is_admin: bool, is_author: bool) -> bool:
    """
    반려/승인 사유 노출 여부 확인
    
    관리자 또는 작성자 본인만 열람 가능합니다.
    """
    return is_admin or is_author


def should_mask_title(is_author: bool, can_view_all: bool) -> bool:
    """
    제목 마스킹 여부 확인
    
    작성자가 아니고 전체 조회 권한이 없으면 제목을 마스킹합니다.
    """
    return not is_author and not can_view_all


@router.post(
    "",
    response_model=SuggestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="건의함 작성",
    description="""
건의함을 작성합니다.

**권한:**
- 승인된 사용자만 가능

**익명 처리:**
- 작성자는 기본 익명 처리됩니다.
- 관리자만 작성자를 확인할 수 있습니다.

**주의:**
- 첨부파일은 지원하지 않습니다.
    """,
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "승인 대기 중"}
    }
)
async def create_suggestion(
    body: SuggestionCreateRequest,
    current_user: dict = Depends(require_verified_user)
) -> SuggestionResponse:
    """
    건의함 작성
    
    승인된 사용자만 작성할 수 있습니다.
    """
    try:
        suggestion_data = {
            "author_id": current_user["id"],
            "title": body.title,
            "content": body.content,
            "status": "received",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("suggestions").insert(suggestion_data).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="건의함 작성 실패"
            )
        
        suggestion = result.data[0]
        
        # 작성자는 기본 익명, 권한 있는 경우에만 실명 표시
        author_name = (
            current_user.get("name") or "익명"
            if should_show_author(current_user.get("role", ""))
            else "익명"
        )
        author_id = current_user["id"] if should_show_author(current_user.get("role", "")) else None
        
        return SuggestionResponse(
            id=suggestion["id"],
            author_id=author_id,
            author_name=author_name,
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
- admin/council: 전체 목록 조회 가능 (작성자 정보는 admin만)
- 일반 사용자: 본인 작성 건만 조회 가능
    """,
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "승인 대기 중"}
    }
)
async def get_suggestions(
    status_filter: Optional[str] = Query(None, description="상태 필터 (received, in_progress, rejected, approved)"),
    page: int = Query(1, ge=1, description="페이지 번호 (1부터 시작)"),
    limit: int = Query(20, ge=1, le=100, description="페이지당 항목 수 (기본 20, 최대 100)"),
    current_user: dict = Depends(require_verified_user)
) -> SuggestionListResponse:
    """
    건의함 목록 조회
    """
    try:
        role = current_user.get("role", "")
        is_admin = role == "admin"
        is_council = role == "council"
        can_view_all = is_admin or is_council
        
        if status_filter and status_filter not in ALLOWED_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="유효하지 않은 상태 값입니다"
            )
        
        count_query = supabase.table("suggestions").select("id")
        if not can_view_all:
            count_query = count_query.eq("author_id", current_user["id"])
        if status_filter:
            count_query = count_query.eq("status", status_filter)
        
        count_result = count_query.execute()
        total = len(count_result.data) if count_result.data else 0
        
        query = supabase.table("suggestions")\
            .select("*")\
            .order("created_at", desc=True)
        
        if not can_view_all:
            query = query.eq("author_id", current_user["id"])
        if status_filter:
            query = query.eq("status", status_filter)
        
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        suggestions_data = result.data if result.data else []
        
        items = []
        for suggestion in suggestions_data:
            is_author = suggestion.get("author_id") == current_user["id"]
            show_author = should_show_author(role)
            author_name = current_user.get("name") or "익명" if show_author and is_author else "익명"
            author_id = suggestion.get("author_id") if show_author else None
            
            if show_author and not is_author and can_view_all:
                # 작성자 조회는 권한이 있을 때만 수행
                author_result = supabase.table("users")\
                    .select("name")\
                    .eq("id", suggestion.get("author_id"))\
                    .single()\
                    .execute()
                if author_result.data:
                    author_name = author_result.data["name"]
            
            # 작성자/관리자만 반려/승인 사유 확인 가능
            can_view_notes = can_view_admin_notes(is_admin, is_author)
            masked_title = "익명 글입니다" if should_mask_title(is_author, can_view_all) else suggestion["title"]
            items.append(SuggestionListItem(
                id=suggestion["id"],
                author_id=author_id,
                author_name=author_name,
                title=masked_title,
                status=suggestion["status"],
                rejection_reason=suggestion.get("rejection_reason") if can_view_notes else None,
                resolution_note=suggestion.get("resolution_note") if can_view_notes else None,
                created_at=suggestion["created_at"]
            ))
        
        total_pages = math.ceil(total / limit) if total > 0 else 0
        
        return SuggestionListResponse(
            suggestions=items,
            pagination=PaginationMeta(
                page=page,
                limit=limit,
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
- admin/council: 전체 조회 가능 (작성자 정보는 admin만)
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
) -> SuggestionResponse:
    """
    건의함 상세 조회
    """
    try:
        role = current_user.get("role", "")
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
        if not can_view_all and not is_author:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="열람 권한이 없습니다"
            )
        
        # 작성자 정보 노출 여부는 역할 기준으로 제한
        show_author = should_show_author(role)
        author_name = "익명"
        author_id = None
        
        if show_author:
            author_id = suggestion.get("author_id")
            if author_id:
                author_result = supabase.table("users")\
                    .select("name")\
                    .eq("id", author_id)\
                    .single()\
                    .execute()
                if author_result.data:
                    author_name = author_result.data["name"]
        
        # 반려/승인 사유는 작성자 또는 관리자만 노출
        can_view_notes = can_view_admin_notes(is_admin, is_author)
        
        masked_title = "익명 글입니다" if should_mask_title(is_author, can_view_all) else suggestion["title"]
        return SuggestionResponse(
            id=suggestion["id"],
            author_id=author_id if show_author else None,
            author_name=author_name,
            title=masked_title,
            content=suggestion["content"],
            status=suggestion["status"],
            rejection_reason=suggestion.get("rejection_reason") if can_view_notes else None,
            resolution_note=suggestion.get("resolution_note") if can_view_notes else None,
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
- rejected: 반려 (rejection_reason 필요)
- approved: 승인 (resolution_note 필요)
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
) -> SuggestionResponse:
    """
    건의함 상태 변경 (관리자 전용)
    """
    try:
        if body.status not in ALLOWED_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="유효하지 않은 상태 값입니다"
            )
        
        if body.status == "rejected" and not body.rejection_reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="반려 사유가 필요합니다"
            )
        
        if body.status == "approved" and not body.resolution_note:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="승인/반영 내용이 필요합니다"
            )
        
        update_data: dict[str, Optional[str]] = {
            "status": body.status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if body.status == "rejected":
            update_data["rejection_reason"] = body.rejection_reason
            update_data["resolution_note"] = None
        elif body.status == "approved":
            update_data["resolution_note"] = body.resolution_note
            update_data["rejection_reason"] = None
        else:
            update_data["rejection_reason"] = None
            update_data["resolution_note"] = None
        
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
        author_result = supabase.table("users")\
            .select("name")\
            .eq("id", updated.get("author_id"))\
            .single()\
            .execute()
        author_name = author_result.data.get("name") if author_result.data else "익명"
        author_name = author_name or "익명"
        
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
