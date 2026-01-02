"""
게시판 관련 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.boards import BoardListResponse, BoardResponse
from app.schemas.auth import ErrorResponse
from app.utils.auth import require_verified_user
from app.database import supabase


router = APIRouter(prefix="/boards", tags=["게시판"])


@router.get(
    "",
    response_model=BoardListResponse,
    status_code=status.HTTP_200_OK,
    summary="게시판 목록 조회",
    description="모든 게시판 목록을 조회합니다. 승인된 사용자만 접근 가능합니다.",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "승인 대기 중"}
    }
)
async def get_boards(current_user: dict = Depends(require_verified_user)):
    """
    게시판 목록 조회
    
    학생회, 민주자치, 건의함 등 모든 게시판 정보를 반환합니다.
    각 게시판의 권한 정보도 포함되어 있습니다.
    
    Returns:
        게시판 목록 및 총 개수
    """
    try:
        # 모든 게시판 조회 (삭제되지 않은 것만)
        result = supabase.table('boards')\
            .select('*')\
            .order('id')\
            .execute()
        
        boards = result.data if result.data else []
        
        return BoardListResponse(
            boards=boards,
            total=len(boards)
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"게시판 목록 조회 실패: {str(e)}"
        )


@router.get(
    "/{board_id}",
    response_model=BoardResponse,
    status_code=status.HTTP_200_OK,
    summary="게시판 상세 조회",
    description="특정 게시판의 상세 정보를 조회합니다.",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "승인 대기 중"},
        404: {"model": ErrorResponse, "description": "게시판을 찾을 수 없음"}
    }
)
async def get_board(board_id: int, current_user: dict = Depends(require_verified_user)):
    """
    게시판 상세 조회
    
    게시판 ID로 특정 게시판의 상세 정보를 조회합니다.
    
    Args:
        board_id: 게시판 ID
    
    Returns:
        게시판 상세 정보
    """
    try:
        result = supabase.table('boards')\
            .select('*')\
            .eq('id', board_id)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="게시판을 찾을 수 없습니다"
            )
        
        return BoardResponse(**result.data)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"게시판 조회 실패: {str(e)}"
        )
