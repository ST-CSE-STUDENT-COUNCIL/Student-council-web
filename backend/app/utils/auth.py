"""
인증 및 권한 검증 유틸리티
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from app.database import get_supabase
from typing import Optional


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase)
) -> dict:
    """
    JWT 토큰에서 현재 사용자 정보 추출
    
    Args:
        credentials: Bearer 토큰
        supabase: Supabase 클라이언트
        
    Returns:
        dict: 사용자 정보
        
    Raises:
        HTTPException: 인증 실패 시
    """
    try:
        # Supabase Auth로 토큰 검증
        user = supabase.auth.get_user(credentials.credentials)
        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 인증 토큰입니다"
            )
        
        # 프로필 정보 조회
        profile_response = supabase.table("profiles").select("*").eq("id", user.user.id).single().execute()
        
        if not profile_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자 프로필을 찾을 수 없습니다"
            )
        
        return profile_response.data  # type: ignore
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"인증 실패: {str(e)}"
        )


async def require_verified_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    관리자 승인된 사용자만 허용
    
    Args:
        current_user: 현재 사용자 정보
        
    Returns:
        dict: 사용자 정보
        
    Raises:
        HTTPException: 미승인 사용자인 경우
    """
    if not current_user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 승인이 필요합니다"
        )
    return current_user


async def require_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    관리자 권한 필수
    
    Args:
        current_user: 현재 사용자 정보
        
    Returns:
        dict: 사용자 정보
        
    Raises:
        HTTPException: 관리자가 아닌 경우
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다"
        )
    return current_user


async def require_council_or_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    학생회 또는 관리자 권한 필수
    
    Args:
        current_user: 현재 사용자 정보
        
    Returns:
        dict: 사용자 정보
        
    Raises:
        HTTPException: 학생회/관리자가 아닌 경우
    """
    if current_user.get("role") not in ["council", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="학생회 또는 관리자 권한이 필요합니다"
        )
    return current_user
