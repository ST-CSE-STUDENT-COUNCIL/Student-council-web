"""
동아리 관련 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile, Form
from typing import Optional
from datetime import datetime
from app.schemas.clubs import (
    ClubListResponse,
    ClubDetail,
    ClubCreate,
    ClubUpdate,
    ErrorResponse
)
from app.utils.auth import require_admin
from app.utils.r2_storage import upload_file_to_r2 as upload_file_to_supabase
from app.database import supabase


router = APIRouter(prefix="/clubs", tags=["동아리"])
admin_router = APIRouter(prefix="/clubs", tags=["동아리(관리자)"])


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


@admin_router.post(
    "",
    response_model=ClubDetail,
    status_code=status.HTTP_201_CREATED,
    summary="동아리 추가",
    description="새로운 동아리를 추가합니다 (관리자 전용, multipart/form-data)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        413: {"model": ErrorResponse, "description": "파일 크기 초과"},
        500: {"model": ErrorResponse, "description": "추가 실패"}
    }
)
async def create_club(
    name: str = Form(..., max_length=100),
    description: str = Form(...),
    website_url: Optional[str] = Form(None),
    image: UploadFile = File(...),
    current_user: dict = Depends(require_admin)
):
    """동아리 추가 (관리자 전용)"""
    try:
        # 이미지 업로드
        file_path = await upload_file_to_supabase(
            file=image,
            bucket_name="club-images",
            allowed_extensions={".jpg", ".jpeg", ".png"},
            max_size_mb=5
        )
        
        # 동아리 정보 저장
        club_data = {
            'name': name,
            'description': description,
            'image_url': file_path,
            'website_url': website_url
        }
        
        result = supabase.table('clubs').insert(club_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="동아리 추가 실패"
            )
        
        return ClubDetail(**result.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"동아리 추가 실패: {str(e)}"
        )


@admin_router.patch(
    "/{club_id}",
    response_model=ClubDetail,
    summary="동아리 정보 수정",
    description="동아리 정보를 수정합니다 (관리자 전용)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "동아리를 찾을 수 없음"},
        500: {"model": ErrorResponse, "description": "수정 실패"}
    }
)
async def update_club(
    club_id: int,
    body: ClubUpdate,
    current_user: dict = Depends(require_admin)
):
    """동아리 정보 수정 (관리자 전용)"""
    try:
        # 동아리 존재 확인
        check_result = supabase.table('clubs')\
            .select('id')\
            .eq('id', club_id)\
            .single()\
            .execute()
        
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="동아리를 찾을 수 없습니다"
            )
        
        # 수정할 데이터 구성
        update_data = body.model_dump(exclude_unset=True)
        update_data['updated_at'] = datetime.utcnow().isoformat()
        
        result = supabase.table('clubs')\
            .update(update_data)\
            .eq('id', club_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="동아리 수정 실패"
            )
        
        return ClubDetail(**result.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"동아리 수정 실패: {str(e)}"
        )


@admin_router.delete(
    "/{club_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="동아리 삭제",
    description="동아리를 삭제합니다 (관리자 전용)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "동아리를 찾을 수 없음"},
        500: {"model": ErrorResponse, "description": "삭제 실패"}
    }
)
async def delete_club(
    club_id: int,
    current_user: dict = Depends(require_admin)
):
    """동아리 삭제 (관리자 전용)"""
    try:
        # 동아리 존재 확인
        check_result = supabase.table('clubs')\
            .select('id')\
            .eq('id', club_id)\
            .single()\
            .execute()
        
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="동아리를 찾을 수 없습니다"
            )
        
        # 삭제
        supabase.table('clubs')\
            .delete()\
            .eq('id', club_id)\
            .execute()
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"동아리 삭제 실패: {str(e)}"
        )
