"""
파일 업로드 및 Storage 관리 유틸리티
"""
from fastapi import UploadFile, HTTPException, status
from typing import Optional
import uuid
import os
from app.database import supabase, get_supabase_admin


# 허용된 이미지 확장자
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# 게시글 첨부파일 설정
ATTACHMENT_ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.pdf'}
ATTACHMENT_ALLOWED_MIME_TYPES = {
    'image/jpeg',
    'image/png',
    'application/pdf'
}
ATTACHMENT_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def validate_image_file(file: UploadFile) -> None:
    """
    이미지 파일 유효성 검증
    
    파일 크기, 확장자, MIME 타입을 검증합니다.
    보안을 위해 엄격하게 검사합니다.
    
    Args:
        file: 업로드된 파일 객체
    
    Raises:
        HTTPException 400: 파일이 유효하지 않은 경우
    """
    # 1. 파일이 실제로 전송되었는지 확인
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="파일이 전송되지 않았습니다"
        )
    
    # 2. 파일명 확인
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="파일명이 없습니다"
        )
    
    # 3. 확장자 검증
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"허용되지 않은 파일 형식입니다. 허용: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # 4. MIME 타입 검증 (추가 보안)
    if file.content_type not in ['image/jpeg', 'image/png', 'image/jpg']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미지 파일만 업로드 가능합니다 (JPEG, PNG)"
        )


async def upload_verification_image(file: UploadFile) -> str:
    """
    학적 인증 이미지를 Supabase Storage에 업로드
    
    파일을 검증하고 고유한 파일명으로 저장합니다.
    Private bucket에 저장되므로 Signed URL로만 접근 가능합니다.
    
    Args:
        file: 업로드할 이미지 파일
    
    Returns:
        str: Storage 내 파일 경로 (예: "uuid-123.jpg")
    
    Raises:
        HTTPException 400: 파일이 유효하지 않은 경우
        HTTPException 500: 업로드 실패
    """
    # 1. 파일 검증
    validate_image_file(file)
    
    # 2. 파일 읽기 및 크기 확인
    try:
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"파일 크기가 너무 큽니다 (최대 {MAX_FILE_SIZE // (1024*1024)}MB)"
            )
        
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="빈 파일은 업로드할 수 없습니다"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"파일 읽기 실패: {str(e)}"
        )
    
    # 3. 고유한 파일명 생성 (UUID + 확장자)
    filename = file.filename or "unknown"
    file_ext = os.path.splitext(filename)[1].lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # 4. Supabase Storage에 업로드 (admin 클라이언트 사용 - RLS 우회)
    try:
        admin_client = get_supabase_admin()
        result = admin_client.storage.from_('verification-images').upload(
            path=unique_filename,
            file=file_content,
            file_options={
                "content-type": file.content_type or "image/jpeg",
                "cache-control": "3600"  # 1시간 캐시
            }
        )
        
        # 업로드 성공 확인
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="파일 업로드에 실패했습니다"
            )
        
        return unique_filename
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage 업로드 실패: {str(e)}"
        )


def create_signed_url(
    file_path: Optional[str],
    expires_in: int = 3600,
    bucket: str = 'verification-images'
) -> Optional[str]:
    """
    Private Storage 파일의 Signed URL 생성
    
    제한 시간 동안만 유효한 임시 URL을 생성합니다.
    관리자가 학적 인증 이미지를 볼 때 사용됩니다.
    
    Args:
        file_path: Storage 내 파일 경로 (예: "uuid-123.jpg")
        expires_in: 유효 시간 (초 단위, 기본 1시간)
    
    Returns:
        str: Signed URL 또는 None (파일이 없는 경우)
    
    Raises:
        HTTPException 500: URL 생성 실패
    """
    if not file_path:
        return None
    
    try:
        # Supabase Storage에서 Signed URL 생성
        result = supabase.storage.from_(bucket).create_signed_url(
            path=file_path,
            expires_in=expires_in
        )
        
        if result and 'signedURL' in result:
            return result['signedURL']
        
        return None
    
    except Exception as e:
        # 에러 발생 시 None 반환 (이미지가 없어도 다른 정보는 표시되도록)
        print(f"Signed URL 생성 실패: {str(e)}")
        return None


def validate_attachment_file(file: UploadFile) -> None:
    """
    게시글 첨부파일 유효성 검증
    
    확장자와 MIME 타입을 검증합니다.
    """
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="파일이 전송되지 않았습니다"
        )
    
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="파일명이 없습니다"
        )
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ATTACHMENT_ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "허용되지 않은 파일 형식입니다. 허용: "
                f"{', '.join(sorted(ATTACHMENT_ALLOWED_EXTENSIONS))}"
            )
        )
    
    if file.content_type not in ATTACHMENT_ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="허용되지 않은 MIME 타입입니다"
        )


async def upload_post_attachment(file: UploadFile, post_id: int) -> dict:
    """
    게시글 첨부파일을 Supabase Storage에 업로드
    
    업로드 후 Storage 경로와 메타 정보를 반환합니다.
    """
    validate_attachment_file(file)
    
    try:
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > ATTACHMENT_MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"파일 크기가 너무 큽니다 (최대 {ATTACHMENT_MAX_FILE_SIZE // (1024*1024)}MB)"
            )
        
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="빈 파일은 업로드할 수 없습니다"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"파일 읽기 실패: {str(e)}"
        )
    
    filename = file.filename or "unknown"
    file_ext = os.path.splitext(filename)[1].lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    storage_path = f"post-{post_id}/{unique_filename}"
    
    try:
        result = supabase.storage.from_('post-attachments').upload(
            path=storage_path,
            file=file_content,
            file_options={
                "content-type": file.content_type or "application/octet-stream",
                "cache-control": "3600"
            }
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="파일 업로드에 실패했습니다"
            )
        
        return {
            "storage_path": storage_path,
            "filename": filename,
            "file_size": file_size,
            "mime_type": file.content_type
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage 업로드 실패: {str(e)}"
        )


async def delete_post_attachments(storage_paths: list[str]) -> bool:
    """
    게시글 첨부파일을 Storage에서 삭제
    
    업로드 실패 시 롤백 목적으로 사용합니다.
    """
    if not storage_paths:
        return False
    
    try:
        admin_client = get_supabase_admin()
        storage_client = admin_client if admin_client is not None else supabase
        storage_client.storage.from_('post-attachments').remove(storage_paths)
        return True
    except Exception as e:
        print(f"첨부파일 삭제 실패: {str(e)}")
        return False


async def delete_verification_image(file_path: str) -> bool:
    """
    Storage에서 인증 이미지 삭제
    
    회원 삭제 또는 고아 파일 정리 시 사용합니다.
    
    Args:
        file_path: 삭제할 파일 경로
    
    Returns:
        bool: 삭제 성공 여부
    """
    if not file_path:
        return False
    
    try:
        result = supabase.storage.from_('verification-images').remove([file_path])
        return True
    except Exception as e:
        print(f"파일 삭제 실패: {str(e)}")
        return False


async def upload_file_to_supabase(
    file: UploadFile,
    bucket_name: str,
    folder: str = "",
    allowed_extensions: set = {'.jpg', '.jpeg', '.png', '.svg'},
    max_size_mb: int = 5
) -> str:
    """
    범용 파일 업로드 함수
    
    Supabase Storage에 파일을 업로드하고 공개 URL을 반환합니다.
    
    Args:
        file: 업로드할 파일
        bucket_name: 버킷 이름 (예: 'welfare-images')
        folder: 폴더 경로 (예: 'items')
        allowed_extensions: 허용할 확장자 집합
        max_size_mb: 최대 파일 크기 (MB)
    
    Returns:
        str: 파일의 공개 URL
    
    Raises:
        HTTPException: 파일 검증 실패 또는 업로드 실패
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="파일이 없습니다"
        )
    
    # 확장자 검증
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"허용되지 않은 파일 형식입니다. 허용: {', '.join(allowed_extensions)}"
        )
    
    # 파일 읽기 및 크기 검증
    try:
        file_content = await file.read()
        file_size = len(file_content)
        max_size_bytes = max_size_mb * 1024 * 1024
        
        if file_size > max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"파일 크기가 너무 큽니다 (최대 {max_size_mb}MB)"
            )
        
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="빈 파일은 업로드할 수 없습니다"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"파일 읽기 실패: {str(e)}"
        )
    
    # 고유 파일명 생성
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    storage_path = f"{folder}/{unique_filename}" if folder else unique_filename
    
    # Supabase Storage에 업로드
    try:
        result = supabase.storage.from_(bucket_name).upload(
            path=storage_path,
            file=file_content,
            file_options={
                "content-type": file.content_type or "application/octet-stream",
                "cache-control": "3600"
            }
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="파일 업로드 실패"
            )
        
        # 공개 URL 생성
        public_url = supabase.storage.from_(bucket_name).get_public_url(storage_path)
        return public_url
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage 업로드 실패: {str(e)}"
        )
