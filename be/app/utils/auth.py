"""
인증 및 권한 검증 유틸리티
FastAPI Depends를 통해 라우트별 권한 제어를 수행합니다.
"""
from fastapi import HTTPException, status, Security, Depends, Request
from typing import Optional, List
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import supabase

# OpenAPI에 HTTP Bearer 스킴을 등록하기 위한 객체
bearer_scheme = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)) -> dict:
    """
    현재 로그인한 사용자 정보 조회
    
    JWT 토큰을 검증하고 Supabase에서 사용자 정보를 가져옵니다.
    모든 인증이 필요한 엔드포인트에서 사용됩니다.
    
    Args:
        authorization: HTTP Authorization 헤더 (Bearer 토큰)
    
    Returns:
        dict: 사용자 정보 (id, email, name, student_id, role, verification_status 등)
    
    Raises:
        HTTPException 401: 토큰이 없거나 유효하지 않은 경우
        HTTPException 404: 사용자를 찾을 수 없는 경우
    """
    # 1. Credentials 검증
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 토큰이 필요합니다"
        )
    access_token = credentials.credentials
    
    # 3. Supabase Auth로 토큰 검증 및 사용자 조회
    try:
        user_response = supabase.auth.get_user(access_token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다"
            )
        
        user_id = user_response.user.id
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰 검증에 실패했습니다"
        )
    
    # 4. users 테이블에서 프로필 정보 조회
    try:
        user_result = supabase.table('users')\
            .select('*')\
            .eq('id', user_id)\
            .single()\
            .execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다"
            )
        
        return user_result.data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 정보 조회 실패"
        )


async def require_verified_user(user: dict = Depends(get_current_user)) -> dict:
    """
    관리자 승인이 완료된 사용자만 접근 허용
    
    회원가입 후 관리자 승인(verification_status='approved')이 완료된 사용자만
    게시판, 행사 등의 기능을 사용할 수 있도록 제한합니다.
    
    Args:
        user: 현재 인증된 사용자 (Depends(get_current_user))
    
    Returns:
        dict: 승인된 사용자 정보
    
    Raises:
        HTTPException 403: 승인 대기 또는 거절된 사용자
    """
    # `user`는 Depends로 주입됩니다
    # 2. 승인 상태 확인
    verification_status = user.get('verification_status')
    
    if verification_status == 'pending':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 승인 대기 중입니다. 승인 후 이용 가능합니다."
        )
    elif verification_status == 'rejected':
        rejection_reason = user.get('rejection_reason', '사유 없음')
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"가입이 거절되었습니다. 사유: {rejection_reason}"
        )
    elif verification_status != 'approved':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="계정 승인이 필요합니다"
        )
    
    return user


async def require_council(user: dict = Depends(require_verified_user)) -> dict:
    """
    학생회 권한 이상 요구 (council, admin)
    
    일반 학생회 또는 관리자만 접근할 수 있는 기능에 사용합니다.
    예: 게시글 삭제, 신고 게시글 관리 등
    
    Args:
        authorization: HTTP Authorization 헤더 (Bearer 토큰)
    
    Returns:
        dict: 학생회 이상 권한을 가진 사용자 정보
    
    Raises:
        HTTPException 403: 권한 부족
    """
    # 1. 승인된 사용자인지 확인
    # `user`는 Depends로 주입됩니다
    
    # 2. 역할 확인 (council 또는 admin)
    role = user.get('role')
    if role not in ['council', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="학생회 권한이 필요합니다"
        )
    
    return user


async def require_admin(user: dict = Depends(require_verified_user)) -> dict:
    """
    관리자 권한 요구 (admin만)
    
    관리자만 접근할 수 있는 기능에 사용합니다.
    예: 회원 승인, 공지사항 작성, 행사 생성, 역할 변경 등
    
    Args:
        authorization: HTTP Authorization 헤더 (Bearer 토큰)
    
    Returns:
        dict: 관리자 권한을 가진 사용자 정보
    
    Raises:
        HTTPException 403: 관리자가 아닌 경우
    """
    # 1. 승인된 사용자인지 확인
    # `user`는 Depends로 주입됩니다
    
    # 2. 역할 확인 (admin만)
    role = user.get('role')
    if role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다"
        )
    
    return user


async def optional_current_user(
    authorization: Optional[HTTPAuthorizationCredentials] = Security(
        HTTPBearer(auto_error=False)
    )
) -> Optional[dict]:
    """
    선택적 사용자 인증 (로그인하지 않아도 접근 가능)
    
    게스트 등록 등 인증이 선택적인 엔드포인트에 사용합니다.
    토큰이 있으면 검증하고, 없으면 None을 반환합니다.
    
    Args:
        authorization: HTTP Authorization 헤더 (Bearer 토큰, 선택적)
    
    Returns:
        Optional[dict]: 사용자 정보 또는 None
    """
    if not authorization:
        return None
    
    try:
        return await get_current_user(authorization)
    except HTTPException:
        # 토큰이 유효하지 않으면 None 반환
        return None
