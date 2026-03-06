"""
Cloudflare R2 Storage 유틸리티
"""
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException, status
from typing import Optional, Literal
import uuid
import os
from app.utils.logger import get_logger

logger = get_logger(__name__)
from datetime import timedelta
from app.config import settings


# 다양한 문서/압축 파일 확장자 모음
BROAD_ALLOWED_EXTENSIONS = {
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.svg',
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.hwp', '.hwpx', '.txt',
    '.zip', '.7z', '.rar'
}

# 버킷 타입 정의
BucketType = Literal[
    "club-images",
    "event-images",
    "introduction-images",
    "post-attachments",
    "welfare-images"
]

# 버킷별 URL 매핑
BUCKET_URL_MAP = {
    "club-images": settings.R2_CLUB_IMAGES_URL,
    "event-images": settings.R2_EVENT_IMAGES_URL,
    "introduction-images": settings.R2_INTRODUCTION_IMAGES_URL,
    "post-attachments": settings.R2_POST_ATTACHMENTS_URL,
    "welfare-images": settings.R2_WELFARE_IMAGES_URL
}


# R2 클라이언트 싱글톤 (연결 재사용으로 성능 향상)
_r2_client = None
_r2_presign_client = None


def get_r2_client():
    """Cloudflare R2 클라이언트 반환 (싱글톤) - 업로드/삭제용"""
    global _r2_client
    if _r2_client is None:
        _r2_client = boto3.client(
            's3',
            endpoint_url=f'https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name='auto',
            config=Config(
                signature_version='s3v4',
                s3={'addressing_style': 'path'}
            )
        )
    return _r2_client


def get_r2_presign_client():
    """Cloudflare R2 Presigned URL 전용 클라이언트 - region을 us-east-1로 고정해야 SigV4 정상 동작"""
    global _r2_presign_client
    if _r2_presign_client is None:
        _r2_presign_client = boto3.client(
            's3',
            endpoint_url=f'https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name='us-east-1',  # Presigned URL SigV4 크레덴셜 정상 생성에 필요
            config=Config(
                signature_version='s3v4',
                s3={'addressing_style': 'path'}
            )
        )
    return _r2_presign_client



def validate_file_extension(filename: str, allowed_extensions: set) -> str:
    """파일 확장자 검증"""
    file_ext = os.path.splitext(filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"허용되지 않은 파일 형식입니다. 허용: {', '.join(allowed_extensions)}"
        )
    return file_ext


def get_bucket_url(bucket_name: str) -> str:
    """버킷 이름으로 Public URL 가져오기"""
    base_url = BUCKET_URL_MAP.get(bucket_name)
    if not base_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"알 수 없는 버킷: {bucket_name}"
        )
    return base_url


def generate_presigned_url(
    bucket_name: BucketType,
    file_key: str,
    expires_in: int = 300
) -> str:
    """
    Presigned URL 생성 (업로드용)
    
    Args:
        bucket_name: R2 버킷 이름
        file_key: 파일 경로 (예: 'folder/filename.jpg')
        expires_in: URL 유효 시간 (초, 기본 5분)
    
    Returns:
        str: Presigned URL
    """
    try:
        r2_client = get_r2_presign_client()
        presigned_url = r2_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': file_key,
                'ContentType': 'application/octet-stream'
            },
            ExpiresIn=expires_in
        )
        # boto3의 이중 인코딩 버그 수정 (%252F → %2F)
        presigned_url = presigned_url.replace('%252F', '%2F')
        return presigned_url
    except Exception as e:
        logger.error(f"generate_presigned_url: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Presigned URL 생성 실패"
        )


def generate_presigned_url_with_content_type(
    bucket_name: BucketType,
    file_key: str,
    content_type: str,
    expires_in: int = 300
) -> str:
    """
    Presigned URL 생성 (업로드용, Content-Type 지정)
    
    Args:
        bucket_name: R2 버킷 이름
        file_key: 파일 경로 (예: 'folder/filename.jpg')
        content_type: 파일의 MIME 타입 (예: 'image/jpeg')
        expires_in: URL 유효 시간 (초, 기본 5분)
    
    Returns:
        str: Presigned URL
    """
    try:
        r2_client = get_r2_presign_client()
        presigned_url = r2_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': file_key,
                'ContentType': content_type
            },
            ExpiresIn=expires_in
        )
        # boto3의 이중 인코딩 버그 수정 (%252F → %2F)
        presigned_url = presigned_url.replace('%252F', '%2F')
        return presigned_url
    except Exception as e:
        logger.error(f"generate_presigned_url_with_content_type: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Presigned URL 생성 실패"
        )


async def upload_file_to_r2(
    file: UploadFile,
    bucket_name: str,
    folder: str = "",
    allowed_extensions: set = {'.jpg', '.jpeg', '.png', '.svg'},
    max_size_mb: int = 10
) -> str:
    """
    Cloudflare R2에 파일 업로드
    
    Args:
        file: 업로드할 파일
        bucket_name: R2 버킷 이름
        folder: 폴더 경로 (예: 'events/1')
        allowed_extensions: 허용할 확장자 집합
        max_size_mb: 최대 파일 크기 (MB)
    
    Returns:
        str: 파일의 Public URL
    
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
        
        # 고유한 파일명 생성
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_key = f"{folder}/{unique_filename}" if folder else unique_filename
        
        # R2 업로드
        r2_client = get_r2_client()
        r2_client.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=file_content,
            ContentType=file.content_type or 'application/octet-stream'
        )
        
        # Public URL 생성 (버킷별 매핑)
        base_url = get_bucket_url(bucket_name)
        public_url = f"{base_url}/{file_key}"
        
        return public_url
    
    except ClientError as e:
        logger.error(f"upload_file_to_r2 ClientError: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="R2 업로드 실패"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"upload_file_to_r2: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="파일 처리 실패"
        )


def generate_download_presigned_url(
    bucket_name: BucketType,
    file_key: str,
    expires_in: int = 3600
) -> str:
    """
    다운로드용 Presigned URL 생성 (GET)

    버킷이 public이 아닌 경우에도 임시 접근 가능한 URL 발급.
    expires_in 초 후 자동 만료됨.

    Args:
        bucket_name: R2 버킷 이름
        file_key: 파일 경로 (예: 'post-1/uuid.pdf')
        expires_in: URL 유효 시간 (초, 기본 1시간)

    Returns:
        str: 만료 시간이 포함된 Presigned URL
    """
    try:
        r2_client = get_r2_presign_client()
        presigned_url = r2_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': bucket_name,
                'Key': file_key,
            },
            ExpiresIn=expires_in
        )
        # boto3의 이중 인코딩 버그 수정 (%252F → %2F)
        presigned_url = presigned_url.replace('%252F', '%2F')
        return presigned_url
    except Exception as e:
        logger.error(f"generate_download_presigned_url: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="다운로드 URL 생성 실패"
        )


async def delete_file_from_r2(file_url: str, bucket_name: str) -> bool:
    """
    R2에서 파일 삭제
    
    Args:
        file_url: 파일의 Public URL
        bucket_name: R2 버킷 이름
    
    Returns:
        bool: 삭제 성공 여부
    """
    try:
        # 버킷별 URL 매핑
        base_url = get_bucket_url(bucket_name)
        
        # URL에서 파일 키 추출
        # 예: https://pub-xxx.r2.dev/folder/file.jpg -> folder/file.jpg
        file_key = file_url.replace(f"{base_url}/", "")
        
        r2_client = get_r2_client()
        r2_client.delete_object(
            Bucket=bucket_name,
            Key=file_key
        )
        
        return True
    
    except Exception as e:
        logger.error(f"R2 파일 삭제 실패: {str(e)}")
        return False


async def upload_post_attachment(file: UploadFile, post_id: int) -> dict:
    """
    게시글 첨부파일을 R2에 업로드
    
    Args:
        file: 업로드할 파일
        post_id: 게시글 ID
    
    Returns:
        dict: 파일 메타데이터 (storage_path, filename, file_size, mime_type)
    
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
    allowed_extensions = BROAD_ALLOWED_EXTENSIONS
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"허용되지 않은 파일 형식입니다. 허용: {', '.join(allowed_extensions)}"
        )
    
    # 파일 읽기 및 크기 검증
    try:
        file_content = await file.read()
        file_size = len(file_content)
        max_size_bytes = 10 * 1024 * 1024  # 10MB
        
        if file_size > max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="파일 크기가 너무 큽니다 (최대 10MB)"
            )
        
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="빈 파일은 업로드할 수 없습니다"
            )
        
        # 고유한 파일명 생성
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_key = f"post-{post_id}/{unique_filename}"
        
        # R2 업로드
        r2_client = get_r2_client()
        r2_client.put_object(
            Bucket='post-attachments',
            Key=file_key,
            Body=file_content,
            ContentType=file.content_type or 'application/octet-stream'
        )
        
        # Public URL 생성
        storage_path = f"{settings.R2_POST_ATTACHMENTS_URL}/{file_key}"
        
        return {
            "storage_path": storage_path,
            "filename": file.filename,
            "file_size": file_size,
            "mime_type": file.content_type
        }
    
    except ClientError as e:
        logger.error(f"upload_post_file_to_r2 ClientError: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="R2 업로드 실패"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"upload_post_file_to_r2: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="파일 처리 실패"
        )


async def delete_post_attachments(storage_paths: list[str]) -> bool:
    """
    게시글 첨부파일을 R2에서 삭제
    
    Args:
        storage_paths: 삭제할 파일들의 Public URL 리스트
    
    Returns:
        bool: 모두 삭제 성공 여부
    """
    if not storage_paths:
        return False
    
    try:
        r2_client = get_r2_client()
        
        for url in storage_paths:
            try:
                # URL에서 파일 키 추출
                # 예: https://pub-xxx.r2.dev/post-1/uuid.jpg -> post-1/uuid.jpg
                file_key = url.replace(f"{settings.R2_POST_ATTACHMENTS_URL}/", "")
                
                r2_client.delete_object(
                    Bucket='post-attachments',
                    Key=file_key
                )
            except Exception as e:
                logger.warning(f"파일 삭제 실패: {url}, 에러: {str(e)}")
                continue
        
        return True
    
    except Exception as e:
        logger.error(f"R2 파일 삭제 실패: {str(e)}")
        return False
