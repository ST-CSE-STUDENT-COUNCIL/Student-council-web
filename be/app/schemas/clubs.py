"""
동아리 관련 스키마
"""
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional
from datetime import datetime


class ClubBase(BaseModel):
    """동아리 기본 정보"""
    name: str
    image_url: str
    description: str
    website_url: Optional[str] = None


class ClubCreate(BaseModel):
    """동아리 생성 요청"""
    name: str = Field(..., max_length=100, description="동아리명")
    description: str = Field(..., min_length=1, description="동아리 설명")
    image_url: str = Field(..., description="이미지 URL (Presigned URL로 업로드 후 받은 public_url)")
    website_url: Optional[str] = Field(None, description="동아리 웹사이트 또는 SNS URL")


class ClubUpdate(BaseModel):
    """동아리 수정 요청"""
    name: Optional[str] = Field(None, max_length=100, description="동아리명")
    description: Optional[str] = Field(None, min_length=1, description="동아리 설명")
    image_url: Optional[str] = Field(None, description="이미지 URL (Presigned URL로 업로드 후 받은 public_url)")
    website_url: Optional[str] = Field(None, description="동아리 웹사이트 또는 SNS URL")


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


# ============================================================================
# 동아리 소개 이미지 스키마
# ============================================================================
class ClubIntroImageCreate(BaseModel):
    """동아리 소개 이미지 생성"""
    image_url: str = Field(..., description="이미지 URL (Presigned URL로 업로드 후)")
    caption: Optional[str] = Field(None, max_length=200, description="이미지 설명")
    display_order: int = Field(default=0, description="표시 순서")


class ClubIntroImageUpdate(BaseModel):
    """동아리 소개 이미지 수정"""
    caption: Optional[str] = Field(None, max_length=200)
    display_order: Optional[int] = Field(None)


class ClubIntroImageResponse(BaseModel):
    """동아리 소개 이미지 응답"""
    id: int
    club_id: int
    image_url: str
    caption: Optional[str]
    display_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClubIntroImageListResponse(BaseModel):
    """동아리 소개 이미지 목록 응답"""
    images: list[ClubIntroImageResponse]
    total: int
