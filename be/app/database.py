"""
Supabase 데이터베이스 연결

Note: Service Role Key를 사용하면 JWT 만료 문제가 없습니다.
Service Role Key는 서버 측에서만 사용되며, 만료되지 않습니다.

주의: sign_in_with_password()를 호출하면 클라이언트의 인증 상태가 변경됩니다.
Admin Auth API(create_user, delete_user 등)를 사용하려면 get_fresh_admin_client()를 사용하세요.
"""
from supabase import create_client, Client
from typing import Optional
from app.config import settings


# 일반 DB 작업용 싱글톤 클라이언트
_db_client: Optional[Client] = None


def get_supabase_admin() -> Client:
    """
    DB 작업용 Supabase 클라이언트 반환 (Service Role Key)
    
    싱글톤 패턴으로 재사용됩니다.
    일반 DB 작업(select, insert, update, delete)에 사용합니다.
    
    주의: 이 클라이언트로 sign_in_with_password() 호출 금지!
    """
    global _db_client
    if _db_client is None:
        _db_client = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_KEY  # Service role key
        )
    return _db_client


def get_fresh_admin_client() -> Client:
    """
    Admin Auth API용 새 클라이언트 생성 (매번 새로 생성)
    
    auth.admin.create_user(), auth.admin.delete_user() 등
    Admin Auth API를 사용할 때는 반드시 이 함수를 사용하세요.
    
    싱글톤 클라이언트는 sign_in_with_password() 호출 시
    인증 상태가 변경되어 Admin API가 실패할 수 있습니다.
    """
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_KEY  # Service role key
    )


# 일반 Supabase 클라이언트 - DB 작업용
supabase: Client = get_supabase_admin()


def get_supabase() -> Client:
    """
    Supabase 클라이언트 반환
    FastAPI dependency로 사용
    """
    return get_supabase_admin()
