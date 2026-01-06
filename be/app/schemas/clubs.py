"""
동아리 관련 스키마
"""
from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime


class ClubBase(BaseModel):
    """동아리 기본 정보"""
    name: str
    image_url: str
    description: str
    website_url: Optional[str] = None


class ClubListItem(BaseModel):
    """동아리 목록 아이템"""
    id: int
    name: str
    image_url: str
    description: str
    website_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ClubDetail(BaseModel):
    """동아리 상세 정보"""
    id: int
    name: str
    image_url: str
    description: str
    website_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ClubListResponse(BaseModel):
    """동아리 목록 응답"""
    clubs: list[ClubListItem]
    total: int


class ErrorResponse(BaseModel):
    """에러 응답"""
    detail: str
