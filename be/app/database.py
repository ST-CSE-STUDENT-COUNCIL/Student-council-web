"""
Supabase 데이터베이스 연결
"""
from supabase import create_client, Client
from typing import Optional
from app.config import settings


# Supabase 클라이언트 (싱글톤)
supabase: Client = create_client(
    supabase_url=settings.SUPABASE_URL,
    supabase_key=settings.SUPABASE_KEY
)


def get_supabase() -> Client:
    """
    Supabase 클라이언트 반환
    FastAPI dependency로 사용
    """
    return supabase


def get_supabase_admin() -> Optional[Client]:
    """
    관리자 권한 Supabase 클라이언트 반환
    
    SUPABASE_KEY가 설정되어 있으면 admin 클라이언트를 생성합니다.
    """
    if not settings.SUPABASE_KEY:
        return None
    
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_KEY
    )
