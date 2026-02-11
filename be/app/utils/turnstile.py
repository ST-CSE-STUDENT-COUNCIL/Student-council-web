"""
Cloudflare Turnstile 검증 유틸리티

봇 방지를 위한 Cloudflare Turnstile 토큰 검증을 처리합니다.
"""
import httpx
from typing import Optional
from fastapi import HTTPException, status
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

async def verify_turnstile(token: str, remote_ip: Optional[str] = None) -> bool:
    """
    Cloudflare Turnstile 토큰 검증
    
    Args:
        token: 클라이언트에서 받은 Turnstile 토큰
        remote_ip: 클라이언트 IP 주소 (선택사항)
    
    Returns:
        bool: 검증 성공 여부
    
    Raises:
        HTTPException 400: 검증 실패
        HTTPException 500: API 통신 실패
    """
    if not settings.TURNSTILE_SECRET_KEY:
        # Turnstile이 설정되지 않은 경우 검증 우회 (개발 환경)
        return True
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Turnstile 토큰이 필요합니다"
        )
    
    # Cloudflare Turnstile 검증 API 호출
    url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    payload = {
        "secret": settings.TURNSTILE_SECRET_KEY,
        "response": token,
    }
    
    if remote_ip:
        payload["remoteip"] = remote_ip
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            result = response.json()
            
            if not result.get("success", False):
                error_codes = result.get("error-codes", [])
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Turnstile 검증 실패: {', '.join(error_codes) if error_codes else '알 수 없는 오류'}"
                )
            
            return True
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"verify_turnstile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Turnstile 검증 중 오류 발생"
        )
