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
    
    # Gmail HTTP API
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REFRESH_TOKEN: str
    GMAIL_FROM_EMAIL: str
    GMAIL_FROM_NAME: str
    
    # Google Sheets API
    GOOGLE_SHEETS_API_KEY: str
    
    # Cloudflare R2
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    
    # R2 버킷별 Public URL
    R2_CLUB_IMAGES_URL: str
    R2_EVENT_IMAGES_URL: str
    R2_INTRODUCTION_IMAGES_URL: str
    R2_POST_ATTACHMENTS_URL: str
    R2_WELFARE_IMAGES_URL: str
    
    # Cloudflare Turnstile (선택사항 - 미설정시 검증 우회)
    TURNSTILE_SECRET_KEY: str = ""
    TURNSTILE_SITE_KEY: str = ""
    
    # Security
    SECRET_KEY: str
    ALLOWED_EMAIL_DOMAIN: str
    
    # Environment
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    FRONTEND_URL: str  # 필수값, .env 또는 Fly Secrets에서 설정 필요
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )
    
    def get_cors_origins(self) -> list[str]:
        """FRONTEND_URL을 파싱하여 CORS origins 리스트 반환"""
        if self.FRONTEND_URL == "*":
            return ["*"]
        # 쉼표로 구분된 URL들을 리스트로 변환 (공백 제거)
        return [url.strip() for url in self.FRONTEND_URL.split(",") if url.strip()]


# 싱글톤 인스턴스
settings = Settings() # pyright: ignore[reportCallIssue]
