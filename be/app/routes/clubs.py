"""
동아리 관련 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile, Form, Response
from typing import Optional
from datetime import datetime
from app.schemas.clubs import (
    ClubListResponse,
    ClubDetail,
    ClubCreate,
    ClubUpdate,
    ClubIntroImageCreate,
    ClubIntroImageUpdate,
    ClubIntroImageResponse,
    ClubIntroImageListResponse,
    ErrorResponse
)
from app.utils.auth import require_admin
from app.utils.r2_storage import (
    upload_file_to_r2 as upload_file_to_supabase,
    generate_presigned_url,
    validate_file_extension,
    get_bucket_url,
    BROAD_ALLOWED_EXTENSIONS
)
from app.database import supabase, get_supabase_admin
import uuid
import os


router = APIRouter(tags=["동아리"])


@router.get(
    "/clubs",
    response_model=ClubListResponse,
    status_code=status.HTTP_200_OK,
    summary="동아리 목록 조회",
    description="등록된 모든 동아리 목록을 조회합니다.",
    responses={
        500: {"model": ErrorResponse, "description": "서버 오류"}
    }
)
async def get_clubs(response: Response):
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
        
        response.headers["Cache-Control"] = "public, max-age=3600, stale-while-revalidate=600"
        return ClubListResponse(
            clubs=clubs,
            total=len(clubs)
        )
    
    except Exception as e:
        print(f"[API ERROR] get_clubs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="동아리 목록 조회 실패"
        )


@router.get(
    "/clubs/{club_id}",
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
        print(f"[API ERROR] get_club: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="동아리 조회 실패"
        )


@router.post(
    "/admin/clubs/presigned-url",
    summary="동아리 이미지 업로드용 Presigned URL 발급 (관리자)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"}
    }
)
async def get_club_image_presigned_url(
    filename: str,
    current_user: dict = Depends(require_admin)
):
    """동아리 이미지 업로드를 위한 Presigned URL 발급"""
    file_ext = validate_file_extension(filename, BROAD_ALLOWED_EXTENSIONS)
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_key = f"clubs/{unique_filename}"
    
    presigned_url = generate_presigned_url(
        bucket_name="club-images",
        file_key=file_key,
        expires_in=300
    )
    
    base_url = get_bucket_url("club-images")
    public_url = f"{base_url}/{file_key}"
    
    return {
        "presigned_url": presigned_url,
        "public_url": public_url,
        "file_key": file_key
    }


@router.post(
    "/admin/clubs",
    response_model=ClubDetail,
    status_code=status.HTTP_201_CREATED,
    summary="동아리 추가 (관리자)",
    description="새로운 동아리를 추가합니다 (관리자 전용)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        500: {"model": ErrorResponse, "description": "추가 실패"}
    }
)
async def create_club(
    body: ClubCreate,
    current_user: dict = Depends(require_admin)
):
    """동아리 추가 (관리자 전용, Presigned URL 사용)"""
    try:
        # 관리자 작업이므로 RLS 우회 클라이언트 사용
        admin_supabase = get_supabase_admin()
        
        # 동아리 정보 저장
        club_data = {
            'name': body.name,
            'description': body.description,
            'image_url': body.image_url,
            'website_url': body.website_url
        }
        
        result = admin_supabase.table('clubs').insert(club_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="동아리 추가 실패"
            )
        
        return ClubDetail(**result.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] create_club: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="동아리 추가 실패"
        )


@router.patch(
    "/admin/clubs/{club_id}",
    response_model=ClubDetail,
    summary="동아리 정보 수정 (관리자)",
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
        # 관리자 작업이므로 RLS 우회 클라이언트 사용
        admin_supabase = get_supabase_admin()
        
        # 동아리 존재 확인
        check_result = admin_supabase.table('clubs')\
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
        from datetime import timezone, timedelta
        kst = timezone(timedelta(hours=9))
        update_data['updated_at'] = datetime.now(kst).isoformat()
        
        result = admin_supabase.table('clubs')\
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
        print(f"[API ERROR] update_club: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="동아리 수정 실패"
        )


@router.delete(
    "/admin/clubs/{club_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="동아리 삭제 (관리자)",
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
        # 관리자 작업이므로 RLS 우회 클라이언트 사용
        admin_supabase = get_supabase_admin()
        
        # 동아리 존재 확인
        check_result = admin_supabase.table('clubs')\
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
        admin_supabase.table('clubs')\
            .delete()\
            .eq('id', club_id)\
            .execute()
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] delete_club: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="동아리 삭제 실패"
        )


# ============================================================================
# 동아리 소개 이미지 API
# ============================================================================

@router.get(
    "/clubs/{club_id}/images",
    response_model=ClubIntroImageListResponse,
    summary="동아리 소개 이미지 목록 조회"
)
async def get_club_intro_images(club_id: int):
    """동아리 소개 이미지 목록 조회 (공개)"""
    try:
        result = supabase.table('club_introduction_images')\
            .select('*')\
            .eq('club_id', club_id)\
            .order('display_order')\
            .execute()
        
        images = result.data if result.data else []
        
        return ClubIntroImageListResponse(
            images=images,
            total=len(images)
        )
    except Exception as e:
        print(f"[API ERROR] get_club_intro_images: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="이미지 목록 조회 실패"
        )


@router.post(
    "/admin/clubs/{club_id}/images/presigned-url",
    summary="동아리 소개 이미지 업로드용 Presigned URL 발급 (관리자)"
)
async def get_club_intro_image_presigned_url(
    club_id: int,
    filename: str,
    current_user: dict = Depends(require_admin)
):
    """동아리 소개 이미지 Presigned URL 발급"""
    file_ext = validate_file_extension(filename, BROAD_ALLOWED_EXTENSIONS)
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_key = f"clubs/{club_id}/intro/{unique_filename}"
    
    presigned_url = generate_presigned_url(
        bucket_name="club-images",
        file_key=file_key,
        expires_in=300
    )
    
    base_url = get_bucket_url("club-images")
    public_url = f"{base_url}/{file_key}"
    
    return {
        "presigned_url": presigned_url,
        "public_url": public_url,
        "file_key": file_key
    }


@router.post(
    "/admin/clubs/{club_id}/images",
    response_model=ClubIntroImageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="동아리 소개 이미지 추가 (관리자)"
)
async def create_club_intro_image(
    club_id: int,
    body: ClubIntroImageCreate,
    current_user: dict = Depends(require_admin)
):
    """동아리 소개 이미지 추가"""
    try:
        admin_supabase = get_supabase_admin()
        
        # 동아리 존재 확인
        check = admin_supabase.table('clubs').select('id').eq('id', club_id).execute()
        if not check.data:
            raise HTTPException(status_code=404, detail="동아리를 찾을 수 없습니다")
        
        image_data = {
            'club_id': club_id,
            'image_url': body.image_url,
            'caption': body.caption,
            'display_order': body.display_order
        }
        
        result = admin_supabase.table('club_introduction_images').insert(image_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="이미지 추가 실패")
        
        return ClubIntroImageResponse(**result.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] create_club_intro_image: {str(e)}")
        raise HTTPException(status_code=500, detail="이미지 추가 실패")


@router.patch(
    "/admin/clubs/{club_id}/images/{image_id}",
    response_model=ClubIntroImageResponse,
    summary="동아리 소개 이미지 수정 (관리자)"
)
async def update_club_intro_image(
    club_id: int,
    image_id: int,
    body: ClubIntroImageUpdate,
    current_user: dict = Depends(require_admin)
):
    """동아리 소개 이미지 수정"""
    try:
        admin_supabase = get_supabase_admin()
        
        update_data = body.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="수정할 항목이 없습니다")
        
        result = admin_supabase.table('club_introduction_images')\
            .update(update_data)\
            .eq('id', image_id)\
            .eq('club_id', club_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다")
        
        return ClubIntroImageResponse(**result.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] update_club_intro_image: {str(e)}")
        raise HTTPException(status_code=500, detail="이미지 수정 실패")


@router.delete(
    "/admin/clubs/{club_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="동아리 소개 이미지 삭제 (관리자)"
)
async def delete_club_intro_image(
    club_id: int,
    image_id: int,
    current_user: dict = Depends(require_admin)
):
    """동아리 소개 이미지 삭제"""
    try:
        admin_supabase = get_supabase_admin()
        
        result = admin_supabase.table('club_introduction_images')\
            .delete()\
            .eq('id', image_id)\
            .eq('club_id', club_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다")
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[API ERROR] delete_club_intro_image: {str(e)}")
        raise HTTPException(status_code=500, detail="이미지 삭제 실패")
