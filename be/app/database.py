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


def get_supabase_admin() -> Client:
    """
    관리자 권한 Supabase 클라이언트 반환 (Service Role Key)
    
    RLS를 우회하여 Storage 업로드 등에 사용됩니다.
    일반 쿼리에서도 관리자 권한이 필요한 경우 사용하세요.
    """
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_KEY  # Service role key 사용
    )
