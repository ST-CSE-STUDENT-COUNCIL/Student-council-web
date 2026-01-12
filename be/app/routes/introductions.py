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
from app.utils.r2_storage import (
    upload_file_to_r2 as upload_file_to_supabase,
    generate_presigned_url,
    validate_file_extension,
    get_bucket_url
)
from app.database import supabase
import uuid
import os


router = APIRouter(tags=["학생회 소개"])


@router.get(
    "/introductions/images",
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
    "/admin/introductions/images/presigned-url",
    summary="학생회 소개 이미지 업로드용 Presigned URL 발급 (관리자)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"}
    }
)
async def get_introduction_image_presigned_url(
    filename: str,
    current_user: dict = Depends(require_admin)
):
    """학생회 소개 이미지 업로드를 위한 Presigned URL 발급"""
    file_ext = validate_file_extension(filename, {'.jpg', '.jpeg', '.png'})
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_key = f"introductions/{unique_filename}"
    
    presigned_url = generate_presigned_url(
        bucket_name="introduction-images",
        file_key=file_key,
        expires_in=300
    )
    
    base_url = get_bucket_url("introduction-images")
    public_url = f"{base_url}/{file_key}"
    
    return {
        "presigned_url": presigned_url,
        "public_url": public_url,
        "file_key": file_key
    }


@router.post(
    "/admin/introductions/images",
    response_model=IntroductionImageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="학생회 소개 이미지 업로드 (관리자)",
    description="학생회 소개 이미지를 업로드합니다 (관리자 전용)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        500: {"model": ErrorResponse, "description": "업로드 실패"}
    }
)
async def create_introduction_image(
    title: str = Form(..., max_length=100),
    image_url: str = Form(..., description="이미지 URL (Presigned URL로 업로드 후 받은 public_url)"),
    display_order: int = Form(default=0),
    current_user: dict = Depends(require_admin)
):
    """학생회 소개 이미지 업로드 (관리자 전용, Presigned URL 사용)"""
    try:
        # 이미지 정보 저장
        image_data = {
            'title': title,
            'image_url': image_url,
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
    "/admin/introductions/images/{image_id}",
    response_model=IntroductionImageResponse,
    summary="학생회 소개 이미지 수정 (관리자)",
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
    "/admin/introductions/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="학생회 소개 이미지 삭제 (관리자)",
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
