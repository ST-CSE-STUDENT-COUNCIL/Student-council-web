"""
통합 검색 API 라우트
- 활동(Activities), 공지사항(Posts), 동아리(Clubs) 통합 검색
- DB 호출 병렬화로 응답 속도 최적화
"""
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
import asyncio
from app.schemas.search import SearchResultItem, SearchResponse
from app.database import get_supabase


router = APIRouter(tags=["검색"])


def _search_activities(supabase, safe_q: str, limit: int):
    """활동 검색 (동기 — to_thread로 호출)"""
    return supabase.table("activities")\
        .select("id, type, title, description, created_at, thumbnail_url")\
        .eq("is_deleted", False)\
        .eq("is_active", True)\
        .or_(f"title.ilike.%{safe_q}%,description.ilike.%{safe_q}%")\
        .order("created_at", desc=True)\
        .limit(limit)\
        .execute()


def _search_notices(supabase, safe_q: str, limit: int):
    """공지사항 검색 (동기 — to_thread로 호출)"""
    # board_id 조회 + posts 검색을 한 번에 (in_ 사용)
    boards = supabase.table("boards")\
        .select("id")\
        .in_("slug", ["student-council", "democracy"])\
        .execute()
    board_ids = [b["id"] for b in boards.data] if boards.data else []
    if not board_ids:
        return None

    return supabase.table("posts")\
        .select("id, title, content, created_at")\
        .in_("board_id", board_ids)\
        .eq("is_deleted", False)\
        .or_(f"title.ilike.%{safe_q}%,content.ilike.%{safe_q}%")\
        .order("created_at", desc=True)\
        .limit(limit)\
        .execute()


def _search_clubs(supabase, safe_q: str, limit: int):
    """동아리 검색 (동기 — to_thread로 호출)"""
    return supabase.table("clubs")\
        .select("id, name, description, created_at, image_url")\
        .or_(f"name.ilike.%{safe_q}%,description.ilike.%{safe_q}%")\
        .order("created_at", desc=True)\
        .limit(limit)\
        .execute()


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
    - **최적화**: 3개 카테고리 DB 쿼리를 병렬 실행
    """
    supabase = get_supabase()

    # 검색어에 % 등 특수문자가 있으면 이스케이프
    safe_q = q.replace("%", "\\%").replace("_", "\\_")

    try:
        # 3개 카테고리를 병렬로 동시 검색 (순차 대비 ~3배 빠름)
        activities_result, notices_result, clubs_result = await asyncio.gather(
            asyncio.to_thread(_search_activities, supabase, safe_q, limit),
            asyncio.to_thread(_search_notices, supabase, safe_q, limit),
            asyncio.to_thread(_search_clubs, supabase, safe_q, limit),
        )

        results: list[SearchResultItem] = []

        # 활동 결과 처리
        for item in activities_result.data:
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

        # 공지사항 결과 처리
        if notices_result and notices_result.data:
            for item in notices_result.data:
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

        # 동아리 결과 처리
        for item in clubs_result.data:
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

        # Cache-Control: 검색 결과는 30초간 캐시
        response = JSONResponse(
            content=SearchResponse(results=results, total_count=len(results)).model_dump(mode="json")
        )
        response.headers["Cache-Control"] = "public, max-age=30, stale-while-revalidate=60"
        return response

    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="검색 중 오류가 발생했습니다",
        )
