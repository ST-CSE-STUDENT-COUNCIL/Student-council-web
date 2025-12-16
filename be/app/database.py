"""
Supabase 데이터베이스 연결 및 클라이언트 관리
"""
from supabase import create_client, Client
from functools import lru_cache
from app.config import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """Supabase 클라이언트 싱글톤 인스턴스 반환"""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


def get_supabase() -> Client:
    """FastAPI 의존성 주입용 Supabase 클라이언트"""
    return get_supabase_client()
