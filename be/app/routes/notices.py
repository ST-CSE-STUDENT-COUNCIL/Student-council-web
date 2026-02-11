"""
공지사항 관련 API 엔드포인트
boards + posts 통합 API
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query, File, UploadFile, Form
from typing import Optional
from datetime import datetime, timedelta, timezone
import math
from app.utils.logger import get_logger

logger = get_logger(__name__)

from app.schemas.notices import (
    NoticeListResponse,
    NoticeDetailResponse,
    NoticeCreateRequest,
    NoticeUpdateRequest,
    PaginationMeta,
    DraftCreateRequest
)
from app.schemas.auth import ErrorResponse
from app.utils.auth import require_verified_user, require_admin
from app.utils.r2_storage import (
    upload_post_attachment,
    delete_post_attachments,
    generate_presigned_url,
    generate_presigned_url_with_content_type,
    validate_file_extension,
    get_bucket_url,
    BROAD_ALLOWED_EXTENSIONS
)
from app.database import supabase, get_supabase_admin
import uuid
import os
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request


router = APIRouter(tags=["공지사항"])
limiter = Limiter(key_func=get_remote_address)


# 영어-한글 매핑
CATEGORY_MAP = {
    "student_council": "학생회",
    "democracy": "민주자치"
}

SUBCATEGORY_MAP = {
    "event": "행사",
    "welfare": "복지",
    "notification": "공지",
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
        # 영어 -> 한글 변환 (mainCategory만)
        main_category_kr = CATEGORY_MAP.get(mainCategory) if mainCategory else None
        # subcategory는 DB에 영어로 저장되어 있으므로 변환 없이 그대로 사용
        sub_category_filter = subCategory if subCategory and subCategory != "all" else None
        
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
        
        # 1. 전체 개수 조회 (Total Count) - 페이지네이션 및 번호 계산용
        # 검색 조건도 포함해야 정확한 개수가 나옴
        # 1. 전체 개수 조회 (Total Count) - 확실한 방법(ID 조회) 사용
        # 검색 조건도 포함해야 정확한 개수가 나옴
        # 주의: 데이터가 많아지면 count='exact', head=True 방식으로 복귀 고려
        count_query = supabase.table('posts').select('id').eq('is_deleted', False)
        
        if board_ids:
            count_query = count_query.in_('board_id', board_ids)
        
        if sub_category_filter:
            count_query = count_query.eq('subcategory', sub_category_filter)
            
        if search:
            count_query = count_query.or_(f'title.ilike.%{search}%,content.ilike.%{search}%')
            
        count_result = count_query.execute()
        total = len(count_result.data) if count_result.data else 0

        
        # 2. 목록 데이터 조회
        query = supabase.table('posts')\
            .select('*, boards:board_id(id, name, category), author:author_id(id, name)')\
            .eq('is_deleted', False)
        
        # board_id 필터링
        if board_ids:
            query = query.in_('board_id', board_ids)
        
        # 소분류 필터링
        if sub_category_filter:
            query = query.eq('subcategory', sub_category_filter)
        
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
        
        # 응답 데이터 구성
        notices = []
        for i, post in enumerate(posts_data):
            # 관계형 쿼리 결과에서 board, author 추출
            board_data = post.pop('boards', None)
            author_data = post.pop('author', None)
            
            # Pydantic 유효성 검사를 위한 안전한 기본값 처리
            board_info = board_data if board_data else {
                'id': post.get('board_id') or 0,  # None이면 0
                'name': '알 수 없음', 
                'category': 'Unknown'
            }
            
            author_info = author_data if author_data else {
                'id': post.get('author_id') or 'deleted-user', # None이면 문자열
                'name': '알 수 없음'
            }
            
            # [수정] 표시용 번호 계산
            # 공식: (전체 - 오프셋 - 인덱스)
            # total이 0이면 현재 페이지 결과 개수 기준으로 계산
            if total > 0:
                display_no = total - offset - i
            else:
                # fallback: 현재 페이지 내에서 역순 번호 (len - i)
                display_no = len(posts_data) - i
            
            notices.append({
                **post,
                'no': display_no,
                'board': board_info,
                'author': author_info
            })
        
        # 페이지 메타 정보
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        # total=0일때 total_pages=0이 되는 게 맞나? 보통 0 or 1인데, 위 코드는 1로 처리됨.
        # math.ceil(0/20) -> 0. 
        if total == 0: total_pages = 0
        
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
            detail="공지사항 조회 실패"
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
            detail="공지사항 조회 실패"
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
    content_type: str = Query("application/octet-stream", description="파일 MIME 타입 (예: image/jpeg)"),
    current_user: dict = Depends(require_admin)
):
    """공지사항 첨부파일 업로드를 위한 Presigned URL 발급"""
    try:
        file_ext = validate_file_extension(filename, {'.jpg', '.jpeg', '.png', '.pdf'})
    except HTTPException:
        # 확장자 검증 실패 시 해당 draft 자동 삭제
        try:
            admin_supabase = get_supabase_admin()
            admin_supabase.table('posts')\
                .delete()\
                .eq('id', post_id)\
                .eq('author_id', str(current_user["id"]))\
                .eq('is_draft', True)\
                .execute()
            logger.info(f"Draft {post_id} 삭제 완료 (파일 확장자 검증 실패)")
        except Exception as cleanup_err:
            logger.error(f"Draft {post_id} 삭제 실패: {cleanup_err}")
        raise

    unique_filename = f"{uuid.uuid4()}{file_ext}"
    # 게시글별 폴더 분리
    file_key = f"post-{post_id}/{unique_filename}"
    
    presigned_url = generate_presigned_url_with_content_type(
        bucket_name="post-attachments",
        file_key=file_key,
        content_type=content_type,
        expires_in=300
    )
    
    base_url = get_bucket_url("post-attachments")
    public_url = f"{base_url}/{file_key}"
    
    return {
        "presigned_url": presigned_url,
        "public_url": public_url,
        "file_key": file_key,
        "filename": filename,
        "content_type": content_type
    }


@router.post(
    "/admin/notices/draft",
    summary="Draft 게시글 생성 (관리자)",
    description="파일 업로드를 위한 post_id를 미리 획득",
    responses={
        429: {"model": ErrorResponse, "description": "요청이 너무 빠릅니다"}
    }
)
async def create_draft_notice(
    body: DraftCreateRequest,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    # [Rate Limit] DB 기반 중복/연타 방지 (최근 3초)
    try:
        limit_time = (datetime.now(timezone.utc) - timedelta(seconds=3)).isoformat()
        
        # 최근 3초 내 작성된 글이 있는지 확인 (Draft 포함 모든 글)
        recent_check = (
            supabase.table("posts")
            .select("id", count="exact")  # type: ignore
            .eq("author_id", current_user["id"])
            .gte("created_at", limit_time)
            .execute()
        )
            
        if recent_check.count and recent_check.count > 0:
             raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="잠시 후 다시 시도해주세요."
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Rate limit check failed: {e}")

    """
    Draft 게시글 생성
    
    파일 업로드를 위해 post_id를 먼저 획득합니다.
    is_draft=true 상태로 생성되며, 최종 게시 시 POST /admin/notices로 업데이트합니다.
    """
    try:
        admin_supabase = get_supabase_admin()
        
        # Draft 게시글 생성
        draft_data = {
            "board_id": body.board_id,
            "author_id": str(current_user["id"]),
            "title": "[Draft]",
            "content": "",
            "is_draft": True
        }
        
        result = admin_supabase.table('posts').insert(draft_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Draft 생성 실패"
            )
        
        return {
            "post_id": result.data[0]['id'],
            "message": "Draft 게시글이 생성되었습니다. 파일 업로드 후 POST /admin/notices로 최종 게시하세요."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Draft 생성 실패"
        )


@router.delete(
    "/admin/notices/draft/{post_id}",
    summary="Draft 게시글 삭제 (관리자)",
    description="파일 업로드 실패 등으로 불필요해진 draft를 삭제합니다",
    responses={
        404: {"model": ErrorResponse, "description": "Draft를 찾을 수 없음"}
    }
)
async def delete_draft_notice(
    post_id: int,
    current_user: dict = Depends(require_admin)
):
    """
    Draft 삭제 API
    
    파일 업로드 실패, 글 작성 취소 등의 상황에서
    프론트엔드가 호출하여 고아 draft를 정리합니다.
    is_draft=True인 게시글만 삭제 가능합니다.
    """
    try:
        admin_supabase = get_supabase_admin()
        
        # 본인이 작성한 draft만 삭제 가능
        result = admin_supabase.table('posts')\
            .delete()\
            .eq('id', post_id)\
            .eq('author_id', str(current_user["id"]))\
            .eq('is_draft', True)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="삭제할 Draft를 찾을 수 없습니다"
            )
        
        logger.info(f"Draft {post_id} 삭제 완료 (by {current_user['id']})")
        return {"message": "Draft가 삭제되었습니다"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"delete_draft_notice: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Draft 삭제 실패"
        )


@router.post(
    "/admin/notices",
    response_model=NoticeDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="공지사항 작성 (관리자)",
    description="관리자만 공지사항을 작성할 수 있습니다 (Presigned URL로 첨부파일 업로드)",
    responses={
        401: {"model": ErrorResponse},
        403: {"model": ErrorResponse, "description": "권한 없음"},
        429: {"model": ErrorResponse, "description": "요청이 너무 빠릅니다"}
    }
)
async def create_notice(
    body: NoticeCreateRequest,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    # [Rate Limit] DB 기반 중복/연타 방지 (최근 3초 내 작성 금지)
    try:
        # UTC 기준 3초 전
        limit_time = (datetime.now(timezone.utc) - timedelta(seconds=3)).isoformat()
        
        # Draft가 아닌 실제 글 작성만 체크 (posts 테이블)
        recent_check = (
            supabase.table("posts")
            .select("id", count="exact")  # type: ignore
            .eq("author_id", current_user["id"])
            .eq("is_draft", False)
            .gte("created_at", limit_time)
            .execute()
        )
            
        if recent_check.count and recent_check.count > 0:
             raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="잠시 후 다시 시도해주세요."
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Rate limit check failed: {e}")

    """
    공지사항 작성 (관리자 전용, Presigned URL 사용)
    
    플로우:
    1. POST /admin/notices/draft 호출하여 draft 게시글 생성 및 post_id 획득
    2. post_id로 Presigned URL 발급 및 파일 업로드
    3. POST /admin/notices 호출하여 최종 게시 (is_draft=false)
    
    post_id가 제공되면 기존 draft를 업데이트하고, 없으면 새 게시글을 생성합니다.
    """
    try:
        # 관리자 작업이므로 RLS 우회 클라이언트 사용
        admin_supabase = get_supabase_admin()
        
        post_id = None
        
        # post_id가 있으면 기존 draft 업데이트, 없으면 새로 생성
        if body.post_id:
            # 기존 draft 업데이트
            update_data = {
                "title": body.title,
                "content": body.content,
                "subcategory": body.subcategory,
                "is_pinned": body.is_pinned,
                "is_draft": False  # 최종 게시
            }
            
            result = admin_supabase.table('posts')\
                .update(update_data)\
                .eq('id', body.post_id)\
                .eq('is_draft', True)\
                .execute()
            
            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Draft 게시글을 찾을 수 없습니다"
                )
            
            post_id = body.post_id
        else:
            # 새 게시글 생성
            post_data = {
                "board_id": body.board_id,
                "author_id": str(current_user["id"]),
                "title": body.title,
                "content": body.content,
                "subcategory": body.subcategory,
                "is_pinned": body.is_pinned,
                "is_draft": False  # 최종 게시
            }
            
            result = admin_supabase.table('posts').insert(post_data).execute()
            
            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="공지사항 생성 실패"
                )
            
            post_id = result.data[0]['id']
        
        # 첨부파일 정보 저장
        if body.attachment_urls:
            for att in body.attachment_urls[:5]:  # 최대 5개
                admin_supabase.table('attachments').insert({
                    "post_id": post_id,
                    "filename": att.filename,
                    "file_url": att.public_url,
                    "file_size": att.file_size,
                    "mime_type": att.mime_type
                }).execute()
        
        # 생성된 공지사항 조회
        return await get_notice(post_id)
    
    except HTTPException as he:
        # publish 실패 시 draft 정리
        if body.post_id:
            try:
                cleanup_supabase = get_supabase_admin()
                cleanup_supabase.table('posts')\
                    .delete()\
                    .eq('id', body.post_id)\
                    .eq('is_draft', True)\
                    .execute()
                logger.info(f"Draft {body.post_id} 삭제 완료 (HTTPException)")
            except Exception as cleanup_err:
                logger.error(f"Draft {body.post_id} 삭제 실패: {cleanup_err}")
        raise
    except Exception as e:
        # publish 실패 시 draft 정리
        if body.post_id:
            try:
                cleanup_supabase = get_supabase_admin()
                cleanup_supabase.table('posts')\
                    .delete()\
                    .eq('id', body.post_id)\
                    .eq('is_draft', True)\
                    .execute()
                logger.info(f"Draft {body.post_id} 삭제 완료 (Exception)")
            except Exception as cleanup_err:
                logger.error(f"Draft {body.post_id} 삭제 실패: {cleanup_err}")
        logger.error(f"create_notice: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="공지사항 작성 실패"
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
        from datetime import timezone, timedelta
        kst = timezone(timedelta(hours=9))
        update_data = request.model_dump(exclude_unset=True, exclude={'attachment_urls', 'delete_attachment_ids'})
        update_data["updated_at"] = datetime.now(kst).isoformat()
        
        admin_supabase = get_supabase_admin()
        
        # 게시글 기본 정보 수정
        result = admin_supabase.table('posts')\
            .update(update_data)\
            .eq('id', notice_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="공지사항 수정 실패"
            )
        
        # 첨부파일 삭제
        if request.delete_attachment_ids:
            for att_id in request.delete_attachment_ids:
                admin_supabase.table('attachments').delete().eq('id', att_id).eq('post_id', notice_id).execute()
        
        # 새 첨부파일 추가
        if request.attachment_urls:
            for att in request.attachment_urls[:5]:  # 최대 5개
                admin_supabase.table('attachments').insert({
                    "post_id": notice_id,
                    "filename": att.filename,
                    "file_url": att.public_url,
                    "file_size": att.file_size,
                    "mime_type": att.mime_type
                }).execute()
        
        return await get_notice(notice_id)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="공지사항 수정 실패"
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
        # 관리자 작업이므로 RLS 우회 클라이언트 사용
        admin_supabase = get_supabase_admin()
        
        # 공지사항 존재 확인
        existing = admin_supabase.table('posts')\
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
        from datetime import timezone, timedelta
        kst = timezone(timedelta(hours=9))
        result = admin_supabase.table('posts')\
            .update({
                "is_deleted": True,
                "deleted_at": datetime.now(kst).isoformat(),
                "deleted_by": str(current_user["id"])
            })\
            .eq('id', notice_id)\
            .eq('is_deleted', False)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="삭제 처리 실패"
            )
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="공지사항 삭제 실패"
        )
