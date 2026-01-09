"""
학생회 소개 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile, Form
from typing import Optional
from datetime import datetime
from app.schemas.introductions import (
    IntroductionImageCreate,
    IntroductionImageUpdate,
    IntroductionImageResponse,
    IntroductionImageListResponse,
    ErrorResponse
)
from app.utils.auth import require_admin
from app.utils.r2_storage import upload_file_to_r2 as upload_file_to_supabase
from app.database import supabase


router = APIRouter(prefix="/introductions", tags=["학생회 소개"])


@router.get(
    "/images",
    response_model=IntroductionImageListResponse,
    status_code=status.HTTP_200_OK,
    summary="학생회 소개 이미지 목록 조회",
    description="학생회 소개 이미지 목록을 조회합니다 (공개, 로그인 불필요)",
    responses={
        500: {"model": ErrorResponse, "description": "서버 오류"}
    }
)
async def get_introduction_images(
    active_only: bool = True
):
    """학생회 소개 이미지 목록 조회 (공개)"""
    try:
        query = supabase.table('introduction_images').select('*')
        
        if active_only:
            query = query.eq('is_active', True)
        
        result = query.order('display_order').execute()
        
        images = result.data if result.data else []
        
        return IntroductionImageListResponse(
            images=images,
            total=len(images)
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 목록 조회 실패: {str(e)}"
        )


@router.post(
    "/images",
    response_model=IntroductionImageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="학생회 소개 이미지 업로드",
    description="학생회 소개 이미지를 업로드합니다 (관리자 전용, multipart/form-data)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        413: {"model": ErrorResponse, "description": "파일 크기 초과"},
        500: {"model": ErrorResponse, "description": "업로드 실패"}
    }
)
async def create_introduction_image(
    title: str = Form(..., max_length=100),
    display_order: int = Form(default=0),
    image: UploadFile = File(...),
    current_user: dict = Depends(require_admin)
):
    """학생회 소개 이미지 업로드 (관리자 전용)"""
    try:
        # 파일 업로드
        file_path = await upload_file_to_supabase(
            file=image,
            bucket_name="introduction-images",
            allowed_extensions={".jpg", ".jpeg", ".png"},
            max_size_mb=10
        )
        
        # 이미지 정보 저장
        image_data = {
            'title': title,
            'image_url': file_path,
            'display_order': display_order,
            'is_active': True
        }
        
        result = supabase.table('introduction_images').insert(image_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="이미지 정보 저장 실패"
            )
        
        return IntroductionImageResponse(**result.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 업로드 실패: {str(e)}"
        )


@router.patch(
    "/images/{image_id}",
    response_model=IntroductionImageResponse,
    summary="학생회 소개 이미지 수정",
    description="학생회 소개 이미지 정보를 수정합니다 (관리자 전용)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "이미지를 찾을 수 없음"},
        500: {"model": ErrorResponse, "description": "수정 실패"}
    }
)
async def update_introduction_image(
    image_id: int,
    body: IntroductionImageUpdate,
    current_user: dict = Depends(require_admin)
):
    """학생회 소개 이미지 수정 (관리자 전용)"""
    try:
        # 이미지 존재 확인
        check_result = supabase.table('introduction_images')\
            .select('id')\
            .eq('id', image_id)\
            .single()\
            .execute()
        
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="이미지를 찾을 수 없습니다"
            )
        
        # 수정할 데이터 구성
        update_data = body.model_dump(exclude_unset=True)
        update_data['updated_at'] = datetime.utcnow().isoformat()
        
        result = supabase.table('introduction_images')\
            .update(update_data)\
            .eq('id', image_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="이미지 수정 실패"
            )
        
        return IntroductionImageResponse(**result.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 수정 실패: {str(e)}"
        )


@router.delete(
    "/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="학생회 소개 이미지 삭제",
    description="학생회 소개 이미지를 삭제합니다 (관리자 전용)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "이미지를 찾을 수 없음"},
        500: {"model": ErrorResponse, "description": "삭제 실패"}
    }
)
async def delete_introduction_image(
    image_id: int,
    current_user: dict = Depends(require_admin)
):
    """학생회 소개 이미지 삭제 (관리자 전용)"""
    try:
        # 이미지 존재 확인
        check_result = supabase.table('introduction_images')\
            .select('id')\
            .eq('id', image_id)\
            .single()\
            .execute()
        
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="이미지를 찾을 수 없습니다"
            )
        
        # 삭제
        supabase.table('introduction_images')\
            .delete()\
            .eq('id', image_id)\
            .execute()
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 삭제 실패: {str(e)}"
        )
