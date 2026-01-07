"""
동아리 관련 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException, status
from app.schemas.clubs import (
    ClubListResponse,
    ClubDetail,
    ErrorResponse
)
from app.database import supabase


router = APIRouter(prefix="/clubs", tags=["동아리"])


@router.get(
    "",
    response_model=ClubListResponse,
    status_code=status.HTTP_200_OK,
    summary="동아리 목록 조회",
    description="등록된 모든 동아리 목록을 조회합니다.",
    responses={
        500: {"model": ErrorResponse, "description": "서버 오류"}
    }
)
async def get_clubs():
    """
    동아리 목록 조회
    
    모든 동아리의 기본 정보를 최신순으로 반환합니다.
    """
    try:
        result = supabase.table('clubs')\
            .select('*')\
            .order('created_at', desc=True)\
            .execute()
        
        clubs = result.data if result.data else []
        
        return ClubListResponse(
            clubs=clubs,
            total=len(clubs)
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"동아리 목록 조회 실패: {str(e)}"
        )


@router.get(
    "/{club_id}",
    response_model=ClubDetail,
    status_code=status.HTTP_200_OK,
    summary="동아리 상세 조회",
    description="특정 동아리의 상세 정보를 조회합니다.",
    responses={
        404: {"model": ErrorResponse, "description": "동아리를 찾을 수 없음"},
        500: {"model": ErrorResponse, "description": "서버 오류"}
    }
)
async def get_club(club_id: int):
    """
    동아리 상세 조회
    
    - **club_id**: 동아리 ID
    """
    try:
        result = supabase.table('clubs')\
            .select('*')\
            .eq('id', club_id)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="동아리를 찾을 수 없습니다"
            )
        
        return result.data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"동아리 조회 실패: {str(e)}"
        )
