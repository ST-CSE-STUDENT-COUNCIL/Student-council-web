"""
FastAPI 메인 애플리케이션
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
from app.config import settings
from app.routes import auth, admin, users, suggestions, notices, clubs, welfare, introductions, activities, search
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Rate limiter 설정
limiter = Limiter(key_func=get_remote_address)


# 서버 시작/종료 이벤트
@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    logger.info("서버 시작")
    yield
    # shutdown
    logger.info("서버 종료")



# FastAPI 앱 생성
app = FastAPI(
    title="서울과기대 컴공학생회 API",
    description="학생회 홈페이지 백엔드 API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_parameters={"persistAuthorization": True},
    lifespan=lifespan
)

# Rate limiting 상태 저장
app.state.limiter = limiter

# Rate limit 초과 시 커스텀 에러 핸들러
async def rate_limit_handler(request: Request, exc: Exception):
    """Rate limit 초과 시 에러 응답"""
    return JSONResponse(
        status_code=429,
        content={"detail": "요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해주세요."}
    )

app.add_exception_handler(RateLimitExceeded, rate_limit_handler)  # type: ignore

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(suggestions.router)
app.include_router(notices.router)
app.include_router(clubs.router)
app.include_router(welfare.router)
app.include_router(introductions.router)
app.include_router(activities.router)
app.include_router(search.router)


# 헬스체크 엔드포인트
@app.get("/", tags=["헬스체크"])
async def health_check():
    """API 상태 확인"""
    return {
        "status": "healthy",
        "service": "seoultechcom-backend",
        "version": "1.0.0"
    }

@app.get("/robots.txt", response_class=PlainTextResponse, tags=["기타"])
async def robots_txt():
    """검색 엔진 크롤링 방지 (API 서버)"""
    return "User-agent: *\nDisallow: /"
