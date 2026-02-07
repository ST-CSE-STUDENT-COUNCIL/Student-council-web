"""
통합 검색 API 라우트
- 활동(Activities), 공지사항(Posts), 동아리(Clubs) 통합 검색
"""
from fastapi import APIRouter, HTTPException, Query, status
from datetime import datetime, timezone
from app.schemas.search import SearchResultItem, SearchResponse
from app.database import get_supabase


router = APIRouter(tags=["검색"])


@router.get(
    "/search",
    response_model=SearchResponse,
    summary="통합 검색 (공개)",
    description="활동, 공지사항, 동아리를 키워드로 통합 검색합니다.",
    responses={
        200: {"description": "검색 결과"},
        400: {"description": "검색어 누락"},
    }
)
async def search(
    q: str = Query(..., min_length=1, description="검색어"),
    limit: int = Query(20, ge=1, le=50, description="최대 결과 수")
):
    """
    통합 검색 API

    - **공개 API**: 인증 불필요
    - **검색 대상**: 활동(제목/설명), 공지사항(제목/내용), 동아리(이름/설명)
    - **정렬**: 최신순
    """
    supabase = get_supabase()
    results: list[SearchResultItem] = []

    # 검색어에 % 등 특수문자가 있으면 이스케이프
    safe_q = q.replace("%", "\\%").replace("_", "\\_")

    try:
        # 1. 활동(Activities) 검색 — 삭제되지 않은 활성 활동만
        activities = supabase.table("activities")\
            .select("id, type, title, description, created_at, thumbnail_url")\
            .eq("is_deleted", False)\
            .eq("is_active", True)\
            .or_(f"title.ilike.%{safe_q}%,description.ilike.%{safe_q}%")\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()

        for item in activities.data:
            desc = item.get("description") or ""
            results.append(SearchResultItem(
                id=item["id"],
                type="activity",
                title=item["title"],
                description=desc[:100] + "..." if len(desc) > 100 else desc or None,
                url=f"/activities?id={item['id']}",
                date=item["created_at"],
                thumbnail_url=item.get("thumbnail_url"),
            ))

        # 2. 공지사항(Posts) 검색 — 공지 게시판(student-council, democracy)의 게시글
        # boards 테이블에서 공지 board_id 조회
        boards = supabase.table("boards")\
            .select("id")\
            .in_("slug", ["student-council", "democracy"])\
            .execute()

        notice_board_ids = [b["id"] for b in boards.data] if boards.data else []

        if notice_board_ids:
            for board_id in notice_board_ids:
                notices = supabase.table("posts")\
                    .select("id, title, content, created_at")\
                    .eq("board_id", board_id)\
                    .eq("is_deleted", False)\
                    .or_(f"title.ilike.%{safe_q}%,content.ilike.%{safe_q}%")\
                    .order("created_at", desc=True)\
                    .limit(limit)\
                    .execute()

                for item in notices.data:
                    content = item.get("content") or ""
                    results.append(SearchResultItem(
                        id=item["id"],
                        type="notice",
                        title=item["title"],
                        description=content[:100] + "..." if len(content) > 100 else content or None,
                        url=f"/notices/{item['id']}",
                        date=item["created_at"],
                        thumbnail_url=None,
                    ))

        # 3. 동아리(Clubs) 검색
        clubs = supabase.table("clubs")\
            .select("id, name, description, created_at, image_url")\
            .or_(f"name.ilike.%{safe_q}%,description.ilike.%{safe_q}%")\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()

        for item in clubs.data:
            desc = item.get("description") or ""
            results.append(SearchResultItem(
                id=item["id"],
                type="club",
                title=item["name"],
                description=desc[:100] + "..." if len(desc) > 100 else desc or None,
                url=f"/clubs",
                date=item["created_at"],
                thumbnail_url=item.get("image_url"),
            ))

        # 최신순 정렬 (date가 None인 항목은 맨 뒤로)
        results.sort(
            key=lambda x: x.date or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )

        # 전체 limit 적용
        results = results[:limit]

        return SearchResponse(results=results, total_count=len(results))

    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="검색 중 오류가 발생했습니다",
        )
