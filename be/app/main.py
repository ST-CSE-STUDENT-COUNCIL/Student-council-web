"""
FastAPI 메인 애플리케이션
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.routes import auth

# Rate limiter 설정
limiter = Limiter(key_func=get_remote_address)

# FastAPI 앱 생성
app = FastAPI(
    title="서울과기대 컴공학생회 API",
    description="학생회 홈페이지 백엔드 API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Rate limiting 상태 저장
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL] if not settings.DEBUG else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)

# 헬스체크 엔드포인트
@app.get("/", tags=["헬스체크"])
async def health_check():
    """API 상태 확인"""
    return {
        "status": "healthy",
        "service": "seoultechcom-backend",
        "version": "1.0.0"
    }
