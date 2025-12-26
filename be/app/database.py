"""
Supabase 데이터베이스 연결
"""
from supabase import create_client, Client
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
