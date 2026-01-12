"""
공지사항 관련 API 엔드포인트
boards + posts 통합 API
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query, File, UploadFile, Form
from typing import Optional
from datetime import datetime
import math
from app.schemas.notices import (
    NoticeListResponse,
    NoticeDetailResponse,
    NoticeCreateRequest,
    NoticeUpdateRequest,
    PaginationMeta
)
from app.schemas.auth import ErrorResponse
from app.utils.auth import require_verified_user, require_admin
from app.utils.r2_storage import (
    upload_post_attachment,
    delete_post_attachments,
    generate_presigned_url,
    validate_file_extension,
    get_bucket_url
)
from app.database import supabase
import uuid
import os


router = APIRouter(tags=["공지사항"])


# 영어-한글 매핑
CATEGORY_MAP = {
    "student_council": "학생회",
    "democracy": "민주자치"
}

SUBCATEGORY_MAP = {
    "event": "행사",
    "welfare": "복지",
    "announcement": "공고",
    "notice": "고시",
    "meeting": "대표자회의",
    "rules": "학생회칙"
}


@router.get(
    "/notices",
    response_model=NoticeListResponse,
    status_code=status.HTTP_200_OK,
    summary="공지사항 목록 조회",
    description="""
    공지사항 목록을 조회합니다. 로그인 없이 접근 가능합니다.
    
    쿼리 파라미터:
    - mainCategory: 대분류 (student_council, democracy)
    - subCategory: 소분류 (all, event, welfare, announcement, notice, meeting, rules)
    - page: 페이지 번호 (기본값: 1)
    - page_size: 페이지당 항목 수 (기본값: 20)
    - search: 검색어 (제목 + 내용)
    - sort: 정렬 (newest/oldest)
    """
)
async def get_notices(
    mainCategory: Optional[str] = Query(None, description="대분류: student_council, democracy"),
    subCategory: Optional[str] = Query(None, description="소분류: all, event, welfare, announcement, notice, meeting, rules"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    search: Optional[str] = Query(None, description="검색어"),
    sort: str = Query("newest", regex="^(newest|oldest)$", description="정렬")
):
    """
    공지사항 목록 조회 (페이지네이션)
    
    mainCategory로 게시판 필터링, subCategory로 게시글 필터링
    subCategory='all'이면 해당 mainCategory의 모든 글 조회
    """
    try:
        # 영어 -> 한글 변환
        main_category_kr = CATEGORY_MAP.get(mainCategory) if mainCategory else None
        sub_category_kr = SUBCATEGORY_MAP.get(subCategory) if subCategory and subCategory != "all" else None
        
        # 대분류 필터가 있으면 먼저 board_id 찾기
        board_ids = None
        if main_category_kr:
            board_result = supabase.table('boards')\
                .select('id')\
                .eq('category', main_category_kr)\
                .execute()
            board_ids = [b['id'] for b in board_result.data] if board_result.data else []
            if not board_ids:
                # 해당 카테고리의 게시판이 없으면 빈 결과 반환
                return NoticeListResponse(
                    notices=[],
                    pagination=PaginationMeta(
                        total=0,
                        page=page,
                        page_size=page_size,
                        total_pages=0,
                        has_next=False,
                        has_prev=False
                    )
                )
        
        # 쿼리 시작 - boards와 posts 조인
        query = supabase.table('posts')\
            .select('*')\
            .eq('is_deleted', False)
        
        # board_id 필터링
        if board_ids:
            query = query.in_('board_id', board_ids)
        
        # 소분류 필터링 (게시글 서브카테고리)
        # subCategory='all'이면 필터링 안함
        if sub_category_kr:
            query = query.eq('subcategory', sub_category_kr)
        
        # 검색
        if search:
            query = query.or_(f'title.ilike.%{search}%,content.ilike.%{search}%')
        
        # 정렬
        if sort == "newest":
            query = query.order('is_pinned', desc=True).order('created_at', desc=True)
        else:
            query = query.order('is_pinned', desc=True).order('created_at', desc=False)
        
        # 페이지네이션
        offset = (page - 1) * page_size
        query = query.range(offset, offset + page_size - 1)
        
        result = query.execute()
        
        posts_data = result.data if result.data else []
        
        # board와 author 정보 추가
        notices = []
        for post in posts_data:
            # board 정보 조회
            board_result = supabase.table('boards')\
                .select('id, name, category')\
                .eq('id', post['board_id'])\
                .single()\
                .execute()
            
            # author 정보 조회
            author_result = supabase.table('users')\
                .select('id, name')\
                .eq('id', post['author_id'])\
                .single()\
                .execute()
            
            notices.append({
                **post,
                'board': board_result.data if board_result.data else {'id': post['board_id'], 'name': '', 'category': ''},
                'author': author_result.data if author_result.data else {'id': post['author_id'], 'name': '알 수 없음'}
            })
        
        # 전체 개수 조회 (필터 적용)
        count_query = supabase.table('posts')\
            .select('id')\
            .eq('is_deleted', False)
        
        if main_category_kr:
            # board의 category로 필터링하려면 조인 필요
            board_result = supabase.table('boards')\
                .select('id')\
                .eq('category', main_category_kr)\
                .execute()
            board_ids = [b['id'] for b in board_result.data] if board_result.data else []
            if board_ids:
                count_query = count_query.in_('board_id', board_ids)
        
        if sub_category_kr:
            count_query = count_query.eq('subcategory', sub_category_kr)
        
        count_result = count_query.execute()
        total = len(count_result.data) if count_result.data else 0
        
        # 페이지 메타 정보
        total_pages = math.ceil(total / page_size)
        
        return NoticeListResponse(
            notices=notices,
            pagination=PaginationMeta(
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
                has_next=page < total_pages,
                has_prev=page > 1
            )
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"공지사항 조회 실패: {str(e)}"
        )


@router.get(
    "/notices/{notice_id}",
    response_model=NoticeDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="공지사항 상세 조회",
    description="공지사항 상세를 조회합니다. 로그인 없이 접근 가능합니다.",
    responses={
        404: {"model": ErrorResponse, "description": "공지사항을 찾을 수 없음"}
    }
)
async def get_notice(
    notice_id: int
):
    """공지사항 상세 조회"""
    try:
        # 게시글 조회
        result = supabase.table('posts')\
            .select('*')\
            .eq('id', notice_id)\
            .eq('is_deleted', False)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="공지사항을 찾을 수 없습니다"
            )
        
        post = result.data
        
        # board 정보 조회
        board_result = supabase.table('boards')\
            .select('id, name, category')\
            .eq('id', post['board_id'])\
            .single()\
            .execute()
        
        # author 정보 조회
        author_result = supabase.table('users')\
            .select('id, name')\
            .eq('id', post['author_id'])\
            .single()\
            .execute()
        
        # 첨부파일 조회
        attachments_result = supabase.table('attachments')\
            .select('id, filename, file_url, file_size, mime_type, created_at')\
            .eq('post_id', notice_id)\
            .execute()
        
        notice = {
            **post,
            'board': board_result.data if board_result.data else {'id': post['board_id'], 'name': '', 'category': ''},
            'author': author_result.data if author_result.data else {'id': post['author_id'], 'name': '알 수 없음'},
            'attachments': attachments_result.data if attachments_result.data else []
        }
        
        # 첨부파일 URL은 이미 public URL이므로 그대로 사용
        # post-attachments bucket이 public이므로 signed URL 불필요
        
        return NoticeDetailResponse(**notice)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"공지사항 조회 실패: {str(e)}"
        )


@router.post(
    "/admin/notices/presigned-url",
    summary="공지사항 첨부파일 업로드용 Presigned URL 발급 (관리자)",
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse, "description": "권한 없음"}
    }
)
async def get_notice_attachment_presigned_url(
    filename: str,
    post_id: int,
    current_user: dict = Depends(require_admin)
):
    """공지사항 첨부파일 업로드를 위한 Presigned URL 발급"""
    file_ext = validate_file_extension(filename, {'.jpg', '.jpeg', '.png', '.pdf'})
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_key = f"post-{post_id}/{unique_filename}"
    
    presigned_url = generate_presigned_url(
        bucket_name="post-attachments",
        file_key=file_key,
        expires_in=300
    )
    
    base_url = get_bucket_url("post-attachments")
    public_url = f"{base_url}/{file_key}"
    
    return {
        "presigned_url": presigned_url,
        "public_url": public_url,
        "file_key": file_key,
        "filename": filename
    }


@router.post(
    "/admin/notices",
    response_model=NoticeDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="공지사항 작성 (관리자)",
    description="관리자만 공지사항을 작성할 수 있습니다 (Presigned URL로 첨부파일 업로드)",
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse, "description": "권한 없음"}
    }
)
async def create_notice(
    body: NoticeCreateRequest,
    current_user: dict = Depends(require_admin)
):
    """
    공지사항 작성 (관리자 전용, Presigned URL 사용)
    
    - title: 제목
    - content: 내용
    - board_id: 게시판 ID (1: 학생회, 2: 민주자치)
    - subcategory: 소분류 (행사, 복지 등)
    - is_pinned: 상단 고정 여부
    - attachment_urls: 첨부파일 정보 리스트
    """
    try:
        # 게시글 생성
        post_data = {
            "board_id": body.board_id,
            "author_id": str(current_user["id"]),
            "title": body.title,
            "content": body.content,
            "subcategory": body.subcategory,
            "is_pinned": body.is_pinned
            "content": body.content,
            "subcategory": body.subcategory,
            "is_pinned": body.is_pinned
        }
        
        result = supabase.table('posts').insert(post_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="공지사항 생성 실패"
            )
        
        post_id = result.data[0]['id']
        
        # 첨부파일 정보 저장
        if body.attachment_urls:
            for att in body.attachment_urls[:5]:  # 최대 5개
                supabase.table('attachments').insert({
                    "post_id": post_id,
                    "filename": att.filename,
                    "file_url": att.public_url,
                    "file_size": att.file_size,
                    "mime_type": att.mime_type
                }).execute()
        
        # 생성된 공지사항 조회
        return await get_notice(post_id)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"공지사항 작성 실패: {str(e)}"
        )


@router.patch(
    "/admin/notices/{notice_id}",
    response_model=NoticeDetailResponse,
    summary="공지사항 수정 (관리자)",
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse}
    }
)
async def update_notice(
    notice_id: int,
    request: NoticeUpdateRequest,
    current_user: dict = Depends(require_admin)
):
    """공지사항 수정 (관리자 전용)"""
    try:
        # 공지사항 존재 확인
        existing = supabase.table('posts')\
            .select('id')\
            .eq('id', notice_id)\
            .eq('is_deleted', False)\
            .single()\
            .execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="공지사항을 찾을 수 없습니다"
            )
        
        # 수정 데이터
        update_data = request.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table('posts')\
            .update(update_data)\
            .eq('id', notice_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="공지사항 수정 실패"
            )
        
        return await get_notice(notice_id)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"공지사항 수정 실패: {str(e)}"
        )


@router.delete(
    "/admin/notices/{notice_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="공지사항 삭제 (관리자)",
    description="Soft delete - 실제 삭제하지 않고 is_deleted 플래그만 변경",
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        404: {"model": ErrorResponse}
    }
)
async def delete_notice(
    notice_id: int,
    current_user: dict = Depends(require_admin)
):
    """공지사항 삭제 (Soft Delete)"""
    try:
        # 공지사항 존재 확인
        existing = supabase.table('posts')\
            .select('id')\
            .eq('id', notice_id)\
            .eq('is_deleted', False)\
            .single()\
            .execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="공지사항을 찾을 수 없습니다"
            )
        
        # Soft Delete
        supabase.table('posts')\
            .update({
                "is_deleted": True,
                "deleted_at": datetime.utcnow().isoformat(),
                "deleted_by": str(current_user["id"])
            })\
            .eq('id', notice_id)\
            .execute()
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"공지사항 삭제 실패: {str(e)}"
        )
