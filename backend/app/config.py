"""
환경 설정 파일
.env 파일에서 환경 변수를 읽어와 설정을 관리합니다.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # Supabase 설정
    supabase_url: str
    supabase_key: str
    supabase_anon_key: str
    
    # Gmail SMTP 설정
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    smtp_from_email: str
    smtp_from_name: str = "서울과기대 컴공과 학생회"
    
    # 보안 설정
    secret_key: str
    allowed_email_domain: str = "seoultech.ac.kr"
    
    # 환경 설정
    environment: str = "development"
    debug: bool = True
    
    # 이메일 인증 설정
    verification_code_length: int = 6
    verification_code_expiry_minutes: int = 5
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """설정 싱글톤 인스턴스 반환"""
    return Settings()
