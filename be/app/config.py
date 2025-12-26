"""
환경변수 설정 관리
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    애플리케이션 설정
    
    Note: 모든 값은 .env 파일에서 자동으로 로드됩니다.
    Pylance 에러는 무시하세요 - 실제로는 정상 작동합니다.
    """
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_ANON_KEY: str
    
    # SMTP (이메일)
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str
    SMTP_FROM_EMAIL: str
    SMTP_FROM_NAME: str
    
    # Security
    SECRET_KEY: str
    ALLOWED_EMAIL_DOMAIN: str
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    FRONTEND_URL: str = "*"  # 기본값: 모든 origin 허용 (프론트 배포 후 변경 권장)
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )


# 싱글톤 인스턴스
settings = Settings() # pyright: ignore[reportCallIssue]
