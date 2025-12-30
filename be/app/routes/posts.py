"""
게시글 관련 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query, File, UploadFile, Form
from typing import Optional
from datetime import datetime
import math
from app.schemas.posts import (
    PostUpdateRequest,
    PostResponse,
    PostListResponse,
    PostListItem,
    PaginationMeta,
    ErrorResponse,
    AttachmentResponse
)
from app.utils.auth import require_verified_user
from app.utils.storage import (
    upload_post_attachment,
    create_signed_url,
    delete_post_attachments,
    ATTACHMENT_ALLOWED_EXTENSIONS,
    ATTACHMENT_MAX_FILE_SIZE
)
from app.database import supabase


router = APIRouter(prefix="/posts", tags=["게시글"])
MAX_ATTACHMENTS_PER_REQUEST = 5


def build_attachment_responses(attachments_data: list[dict]) -> list[AttachmentResponse]:
    responses: list[AttachmentResponse] = []
    
    for attachment in attachments_data:
        signed_url = create_signed_url(
            attachment.get('file_url'),
            expires_in=3600,
            bucket='post-attachments'
        )
        
        responses.append(AttachmentResponse(
            id=attachment['id'],
            filename=attachment['filename'],
            file_url=signed_url or "",
            file_size=attachment.get('file_size'),
            mime_type=attachment.get('mime_type'),
            created_at=attachment['created_at']
        ))
    
    return responses


@router.get(
    "",
    response_model=PostListResponse,
    status_code=status.HTTP_200_OK,
    summary="게시글 목록 조회 (페이지네이션)",
    description="""
게시판별 게시글 목록을 페이지네이션으로 조회합니다.

**게시판 구조:**
- `board_id=1`: 학생회 공지 (admin만 작성 가능)
  - 소카테고리: `행사`, `복지`, `학과소식`
- `board_id=2`: 민주자치 공지 (admin만 작성 가능)
  - 소카테고리: `공고`, `고시`, `대표자회의`, `학생회칙`

**필터링 예시:**
- 학생회 행사만 보기: `?board_id=1&subcategory=행사`
- 민주자치 전체: `?board_id=2`
- 모든 게시판: 파라미터 없음

**정렬:**
- 고정 게시글(is_pinned) 우선
- 최신순 정렬
    """,
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "승인 대기 중"}
    }
)
async def get_posts(
    board_id: Optional[int] = Query(None, description="게시판 ID 필터"),
    subcategory: Optional[str] = Query(None, description="소카테고리 필터 (행사, 학과소식, 고시 등)"),
    page: int = Query(1, ge=1, description="페이지 번호 (1부터 시작)"),
    limit: int = Query(20, ge=1, le=100, description="페이지당 항목 수 (기본 20, 최대 100)"),
    current_user: dict = Depends(require_verified_user)
):
    """
    게시글 목록 조회
    
    페이지네이션과 필터링을 지원합니다.
    - board_id로 특정 게시판 필터링
    - subcategory로 소카테고리 필터링
    - 고정 게시글(is_pinned=true)은 상단에 표시
    - 삭제된 게시글(is_deleted=true)은 제외
    
    익명 게시글:
    - 일반 사용자: author_name = "익명"
    - 관리자/학생회: author_name = 실명
    
    Returns:
        게시글 목록 및 페이지네이션 정보
    """
    try:
        # 사용자 권한 확인 (관리자/학생회는 실명 조회 가능)
        is_staff = current_user.get('role') in ['admin', 'council']
        
        # 전체 개수 조회 (필터 적용)
        count_query = supabase.table('posts')\
            .select('id')\
            .eq('is_deleted', False)
        
        if board_id:
            count_query = count_query.eq('board_id', board_id)
        if subcategory:
            count_query = count_query.eq('subcategory', subcategory)
        
        count_result = count_query.execute()
        total = len(count_result.data) if count_result.data else 0
        
        # 기본 쿼리 (삭제되지 않은 게시글만)
        query = supabase.table('posts')\
            .select('id, board_id, author_id, title, subcategory, is_pinned, is_anonymous, created_at')\
            .eq('is_deleted', False)
        
        # 필터 적용
        if board_id:
            query = query.eq('board_id', board_id)
        if subcategory:
            query = query.eq('subcategory', subcategory)
        
        # 정렬 (고정 게시글 우선, 그 다음 최신순)
        query = query.order('is_pinned', desc=True).order('created_at', desc=True)
        
        # 페이지네이션
        offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)
        
        # 실행
        result = query.execute()
        
        posts_data = result.data if result.data else []
        
        # 작성자 이름 조회 및 익명 처리
        posts = []
        for post in posts_data:
            author_name = "익명"
            
            # 익명 게시글이 아니거나, 관리자/학생회인 경우 실명 표시
            if not post['is_anonymous'] or is_staff:
                if post['author_id']:
                    author_result = supabase.table('users')\
                        .select('name')\
                        .eq('id', post['author_id'])\
                        .single()\
                        .execute()
                    
                    if author_result.data:
                        author_name = author_result.data['name']
            
            posts.append(PostListItem(
                id=post['id'],
                board_id=post['board_id'],
                author_name=author_name,
                title=post['title'],
                subcategory=post.get('subcategory'),
                is_pinned=post['is_pinned'],
                is_anonymous=post['is_anonymous'],
                created_at=post['created_at']
            ))
        
        # 페이지네이션 메타 정보
        total_pages = math.ceil(total / limit) if total > 0 else 0
        
        return PostListResponse(
            posts=posts,
            pagination=PaginationMeta(
                page=page,
                limit=limit,
                total=total,
                total_pages=total_pages
            )
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"게시글 목록 조회 실패: {str(e)}"
        )


@router.get(
    "/{post_id}",
    response_model=PostResponse,
    status_code=status.HTTP_200_OK,
    summary="게시글 상세 조회",
    description="게시글 ID로 상세 내용을 조회합니다. 첨부파일 포함",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "승인 대기 중"},
        404: {"model": ErrorResponse, "description": "게시글을 찾을 수 없음"}
    }
)
async def get_post(post_id: int, current_user: dict = Depends(require_verified_user)):
    """
    게시글 상세 조회
    
    게시글 내용과 첨부파일을 함께 조회합니다.
    
    익명 처리:
    - 일반 사용자: 익명 게시글의 작성자 정보 숨김
    - 관리자/학생회: 실명 표시
    
    Args:
        post_id: 게시글 ID
    
    Returns:
        게시글 상세 정보 및 첨부파일 목록
    """
    try:
        is_staff = current_user.get('role') in ['admin', 'council']
        
        # 게시글 조회
        post_result = supabase.table('posts')\
            .select('*')\
            .eq('id', post_id)\
            .eq('is_deleted', False)\
            .single()\
            .execute()
        
        if not post_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="게시글을 찾을 수 없습니다"
            )
        
        post = post_result.data
        
        # 작성자 이름 조회 및 익명 처리
        author_id = None
        author_name = "익명"
        
        if not post['is_anonymous'] or is_staff:
            author_id = post['author_id']
            if author_id:
                author_result = supabase.table('users')\
                    .select('name')\
                    .eq('id', author_id)\
                    .single()\
                    .execute()
                
                if author_result.data:
                    author_name = author_result.data['name']
        
        # 첨부파일 조회
        attachments_result = supabase.table('attachments')\
            .select('*')\
            .eq('post_id', post_id)\
            .order('id')\
            .execute()
        
        attachments = attachments_result.data if attachments_result.data else []
        attachment_responses = build_attachment_responses(attachments)
        
        return PostResponse(
            id=post['id'],
            board_id=post['board_id'],
            author_id=author_id,
            author_name=author_name,
            title=post['title'],
            content=post['content'],
            subcategory=post.get('subcategory'),
            is_pinned=post['is_pinned'],
            is_anonymous=post['is_anonymous'],
            attachments=attachment_responses,
            created_at=post['created_at'],
            updated_at=post['updated_at']
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"게시글 조회 실패: {str(e)}"
        )


@router.post(
    "",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="게시글 작성",
    description=f"""
새 게시글을 작성합니다.

**권한:**
- `board_id=1, 2` (학생회/민주자치 공지): **admin만 작성 가능**

**익명 게시:**
- 익명 게시글은 허용되지 않습니다

**소카테고리:**
- 학생회: `행사`, `복지`, `학과소식`
- 민주자치: `공고`, `고시`, `대표자회의`, `학생회칙`
- 건의함: 소카테고리 없음 (null)

**첨부파일 제한:**
- 허용 확장자: {', '.join(sorted(ATTACHMENT_ALLOWED_EXTENSIONS))}
- 최대 파일 크기: {ATTACHMENT_MAX_FILE_SIZE // (1024 * 1024)}MB
- 요청당 최대 파일 개수: {MAX_ATTACHMENTS_PER_REQUEST}개

**요청 형식:** `multipart/form-data`

**예시:**
- `board_id`: 1
- `title`: 2025 신입생 환영회
- `content`: 환영회 내용...
- `subcategory`: 행사
- `is_anonymous`: false
- `files`: 첨부파일
    """,
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "권한 부족 또는 승인 대기 중"},
        404: {"model": ErrorResponse, "description": "게시판을 찾을 수 없음"}
    }
)
async def create_post(
    board_id: int = Form(..., description="게시판 ID"),
    title: str = Form(..., min_length=1, max_length=200, description="제목"),
    content: str = Form(..., min_length=1, description="내용"),
    subcategory: Optional[str] = Form(None, max_length=50, description="소카테고리"),
    is_anonymous: bool = Form(False, description="익명 여부 (건의함만 가능)"),
    files: Optional[list[UploadFile]] = File(None, description="첨부파일 리스트"),
    current_user: dict = Depends(require_verified_user)
):
    """
    게시글 작성
    
    게시판 권한에 따라 작성 가능 여부가 결정됩니다:
    - 공지사항(require_admin=true): 관리자만 작성 가능
    - 건의함(require_admin=false): 모든 승인된 사용자 작성 가능
    
    익명 게시글:
    - 건의함(allow_anonymous=true)에서만 가능
    - 다른 게시판에서는 is_anonymous=true로 요청 시 에러
    
    Args:
        board_id: 게시판 ID
        title: 제목
        content: 내용
        subcategory: 소카테고리
        is_anonymous: 익명 여부
        files: 첨부파일 리스트 (선택)
    
    Returns:
        생성된 게시글 정보
    """
    try:
        # 1. 게시판 정보 조회
        board_result = supabase.table('boards')\
            .select('*')\
            .eq('id', board_id)\
            .single()\
            .execute()
        
        if not board_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="게시판을 찾을 수 없습니다"
            )
        
        board = board_result.data
        
        # 2. 권한 확인
        if board['require_admin'] and current_user.get('role') != 'admin':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="관리자만 이 게시판에 글을 작성할 수 있습니다"
            )
        
        # 3. 익명 게시글 검증
        if is_anonymous and not board['allow_anonymous']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이 게시판에서는 익명 게시글을 작성할 수 없습니다"
            )

        if files and len(files) > MAX_ATTACHMENTS_PER_REQUEST:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"첨부파일은 최대 {MAX_ATTACHMENTS_PER_REQUEST}개까지 업로드 가능합니다"
            )
        
        # 4. 게시글 생성
        post_data = {
            'board_id': board_id,
            'author_id': current_user['id'],
            'title': title,
            'content': content,
            'subcategory': subcategory,
            'is_anonymous': is_anonymous,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = supabase.table('posts').insert(post_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="게시글 작성 실패"
            )
        
        post = result.data[0]
        
        attachments = []
        uploaded_paths = []
        if files:
            try:
                attachments_to_insert = []
                for file in files:
                    metadata = await upload_post_attachment(file, post['id'])
                    uploaded_paths.append(metadata["storage_path"])
                    attachments_to_insert.append({
                        "post_id": post['id'],
                        "filename": metadata["filename"],
                        "file_url": metadata["storage_path"],
                        "file_size": metadata["file_size"],
                        "mime_type": metadata["mime_type"]
                    })
                
                attachments_result = supabase.table('attachments')\
                    .insert(attachments_to_insert)\
                    .execute()
                
                if not attachments_result.data:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="첨부파일 저장 실패"
                    )
                
                attachments = attachments_result.data
            
            except Exception:
                await delete_post_attachments(uploaded_paths)
                supabase.table('posts').delete().eq('id', post['id']).execute()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="첨부파일 업로드 실패로 게시글이 롤백되었습니다"
                )
        
        attachment_responses = build_attachment_responses(attachments)
        
        # 6. 작성자 이름 조회
        author_name = "익명" if is_anonymous else current_user['name']
        
        return PostResponse(
            id=post['id'],
            board_id=post['board_id'],
            author_id=current_user['id'] if not is_anonymous else None,
            author_name=author_name,
            title=post['title'],
            content=post['content'],
            subcategory=post.get('subcategory'),
            is_pinned=post['is_pinned'],
            is_anonymous=post['is_anonymous'],
            attachments=attachment_responses,
            created_at=post['created_at'],
            updated_at=post['updated_at']
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"게시글 작성 실패: {str(e)}"
        )


@router.patch(
    "/{post_id}",
    response_model=PostResponse,
    status_code=status.HTTP_200_OK,
    summary="게시글 수정",
    description="게시글을 수정합니다. 작성자 본인 또는 관리자만 가능",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "권한 부족"},
        404: {"model": ErrorResponse, "description": "게시글을 찾을 수 없음"}
    }
)
async def update_post(
    post_id: int,
    body: PostUpdateRequest,
    current_user: dict = Depends(require_verified_user)
):
    """
    게시글 수정
    
    권한:
    - 작성자 본인: 제목, 내용, 소카테고리 수정 가능
    - 관리자: 모든 필드 수정 가능 (is_pinned 포함)
    
    Args:
        post_id: 수정할 게시글 ID
        body: 수정 내용
    
    Returns:
        수정된 게시글 정보
    """
    try:
        # 1. 게시글 조회
        post_result = supabase.table('posts')\
            .select('*')\
            .eq('id', post_id)\
            .eq('is_deleted', False)\
            .single()\
            .execute()
        
        if not post_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="게시글을 찾을 수 없습니다"
            )
        
        post = post_result.data
        
        # 2. 권한 확인
        is_author = post['author_id'] == current_user['id']
        is_admin = current_user.get('role') == 'admin'
        
        if not (is_author or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="게시글을 수정할 권한이 없습니다"
            )
        
        # 3. 수정 데이터 준비
        update_data = body.model_dump(exclude_unset=True)
        
        # is_pinned는 관리자만 수정 가능
        if 'is_pinned' in update_data and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="상단 고정은 관리자만 설정할 수 있습니다"
            )
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="수정할 내용이 없습니다"
            )
        
        update_data['updated_at'] = datetime.utcnow().isoformat()
        
        # 4. 게시글 수정
        result = supabase.table('posts')\
            .update(update_data)\
            .eq('id', post_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="게시글 수정 실패"
            )
        
        updated_post = result.data[0]
        
        # 5. 작성자 이름 조회
        is_staff = current_user.get('role') in ['admin', 'council']
        author_name = "익명"
        author_id = None
        
        if not updated_post['is_anonymous'] or is_staff:
            author_id = updated_post['author_id']
            if author_id:
                author_result = supabase.table('users')\
                    .select('name')\
                    .eq('id', author_id)\
                    .single()\
                    .execute()
                
                if author_result.data:
                    author_name = author_result.data['name']
        
        # 6. 첨부파일 조회
        attachments_result = supabase.table('attachments')\
            .select('*')\
            .eq('post_id', post_id)\
            .execute()
        
        attachments = attachments_result.data if attachments_result.data else []
        attachment_responses = build_attachment_responses(attachments)
        
        return PostResponse(
            id=updated_post['id'],
            board_id=updated_post['board_id'],
            author_id=author_id,
            author_name=author_name,
            title=updated_post['title'],
            content=updated_post['content'],
            subcategory=updated_post.get('subcategory'),
            is_pinned=updated_post['is_pinned'],
            is_anonymous=updated_post['is_anonymous'],
            attachments=attachment_responses,
            created_at=updated_post['created_at'],
            updated_at=updated_post['updated_at']
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"게시글 수정 실패: {str(e)}"
        )


@router.delete(
    "/{post_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="게시글 삭제 (Soft Delete)",
    description="게시글을 삭제합니다. 작성자 본인, 학생회, 관리자만 가능. 실제 삭제가 아닌 숨김 처리(Soft Delete)",
    responses={
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "권한 부족"},
        404: {"model": ErrorResponse, "description": "게시글을 찾을 수 없음"}
    }
)
async def delete_post(post_id: int, current_user: dict = Depends(require_verified_user)):
    """
    게시글 삭제 (Soft Delete)
    
    실제로 DB에서 삭제하지 않고 is_deleted=true로 표시합니다.
    
    권한:
    - 작성자 본인: 자신의 글 삭제 가능
    - 학생회(council): 모든 글 삭제 가능
    - 관리자(admin): 모든 글 삭제 가능
    
    Args:
        post_id: 삭제할 게시글 ID
    """
    try:
        # 1. 게시글 조회
        post_result = supabase.table('posts')\
            .select('*')\
            .eq('id', post_id)\
            .eq('is_deleted', False)\
            .single()\
            .execute()
        
        if not post_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="게시글을 찾을 수 없습니다"
            )
        
        post = post_result.data
        
        # 2. 권한 확인
        is_author = post['author_id'] == current_user['id']
        is_staff = current_user.get('role') in ['council', 'admin']
        
        if not (is_author or is_staff):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="게시글을 삭제할 권한이 없습니다"
            )
        
        # 3. Soft Delete 처리
        supabase.table('posts')\
            .update({
                'is_deleted': True,
                'deleted_at': datetime.utcnow().isoformat(),
                'deleted_by': current_user['id']
            })\
            .eq('id', post_id)\
            .execute()
        
        return None  # 204 No Content
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"게시글 삭제 실패: {str(e)}"
        )
