"""
학생회 소개 관련 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional


class IntroductionImageCreate(BaseModel):
    """학생회 소개 이미지 생성 요청"""
    title: str = Field(..., max_length=100, description="섹션 제목 (예: 현행 학생회, 조직도)")
    display_order: int = Field(default=0, description="표시 순서 (낮을수록 먼저)")


class IntroductionImageUpdate(BaseModel):
    """학생회 소개 이미지 수정 요청"""
    title: Optional[str] = Field(None, max_length=100, description="섹션 제목")
    display_order: Optional[int] = Field(None, description="표시 순서")
    is_active: Optional[bool] = Field(None, description="활성화 여부")


class IntroductionImageResponse(BaseModel):
    """학생회 소개 이미지 응답"""
    id: int
    title: str
    image_url: str
    display_order: int
    is_active: bool
    created_at: str
    updated_at: str


class IntroductionImageListResponse(BaseModel):
    """학생회 소개 이미지 목록 응답"""
    images: list[IntroductionImageResponse]
    total: int


class ErrorResponse(BaseModel):
    """에러 응답"""
    detail: str
