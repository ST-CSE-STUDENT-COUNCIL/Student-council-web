"""
Supabase 데이터베이스 연결

Note: Service Role Key를 사용하면 JWT 만료 문제가 없습니다.
Service Role Key는 서버 측에서만 사용되며, 만료되지 않습니다.
"""
from supabase import create_client, Client
from typing import Optional
from app.config import settings


# Service Role Key를 사용하는 Admin 클라이언트 (JWT 만료 없음)
_admin_client: Optional[Client] = None


def get_supabase_admin() -> Client:
    """
    관리자 권한 Supabase 클라이언트 반환 (Service Role Key)
    
    Service Role Key는 만료되지 않아 JWT expired 문제가 없습니다.
    RLS를 우회하며, 모든 서버 측 작업에 사용됩니다.
    """
    global _admin_client
    if _admin_client is None:
        _admin_client = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_KEY  # Service role key
        )
    return _admin_client


# 일반 Supabase 클라이언트 - Service Role Key 사용 (JWT 만료 방지)
# 기존: anon key 사용 시 JWT 만료 문제 발생
# 변경: Service Role Key 사용으로 만료 문제 해결
supabase: Client = get_supabase_admin()


def get_supabase() -> Client:
    """
    Supabase 클라이언트 반환
    FastAPI dependency로 사용
    
    Note: Service Role Key를 사용하므로 JWT 만료 문제 없음
    """
    return get_supabase_admin()
