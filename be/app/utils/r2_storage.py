"""
Cloudflare R2 Storage 유틸리티
"""
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException, status
from typing import Optional
import uuid
import os
from app.config import settings


# R2 클라이언트 초기화
def get_r2_client():
    """Cloudflare R2 클라이언트 생성"""
    return boto3.client(
        's3',
        endpoint_url=f'https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name='auto',  # R2는 auto 사용
        config=Config(signature_version='s3v4')
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
        bucket_url_map = {
            "club-images": settings.R2_CLUB_IMAGES_URL,
            "event-images": settings.R2_EVENT_IMAGES_URL,
            "introduction-images": settings.R2_INTRODUCTION_IMAGES_URL,
            "post-attachments": settings.R2_POST_ATTACHMENTS_URL,
            "welfare-images": settings.R2_WELFARE_IMAGES_URL
        }
        
        base_url = bucket_url_map.get(bucket_name)
        if not base_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"알 수 없는 버킷: {bucket_name}"
            )
        
        public_url = f"{base_url}/{file_key}"
        
        return public_url
    
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"R2 업로드 실패: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"파일 처리 실패: {str(e)}"
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
        bucket_url_map = {
            "club-images": settings.R2_CLUB_IMAGES_URL,
            "event-images": settings.R2_EVENT_IMAGES_URL,
            "introduction-images": settings.R2_INTRODUCTION_IMAGES_URL,
            "post-attachments": settings.R2_POST_ATTACHMENTS_URL,
            "welfare-images": settings.R2_WELFARE_IMAGES_URL
        }
        
        base_url = bucket_url_map.get(bucket_name)
        if not base_url:
            print(f"알 수 없는 버킷: {bucket_name}")
            return False
        
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
        print(f"R2 파일 삭제 실패: {str(e)}")
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
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.pdf'}
    
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"R2 업로드 실패: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"파일 처리 실패: {str(e)}"
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
                print(f"파일 삭제 실패: {url}, 에러: {str(e)}")
                continue
        
        return True
    
    except Exception as e:
        print(f"R2 파일 삭제 실패: {str(e)}")
        return False
