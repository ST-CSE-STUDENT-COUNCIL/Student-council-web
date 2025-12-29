"""
게시판 관련 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BoardResponse(BaseModel):
    """게시판 정보 응답"""
    id: int = Field(..., description="게시판 ID")
    name: str = Field(..., description="게시판 이름")
    slug: str = Field(..., description="URL 식별자")
    description: Optional[str] = Field(None, description="게시판 설명")
    category: str = Field(..., description="대카테고리 (학생회, 민주자치, 건의함)")
    require_auth: bool = Field(..., description="인증 필요 여부")
    allow_anonymous: bool = Field(..., description="익명 허용 여부")
    require_admin: bool = Field(..., description="관리자 권한 필요 여부")
    created_at: datetime = Field(..., description="생성 일시")
    
    class Config:
        from_attributes = True


class BoardListResponse(BaseModel):
    """게시판 목록 응답"""
    boards: list[BoardResponse]
    total: int = Field(..., description="총 게시판 수")
