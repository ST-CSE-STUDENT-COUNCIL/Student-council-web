"""
통합 검색 관련 Pydantic 스키마
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Literal


class SearchResultItem(BaseModel):
    """검색 결과 항목"""
    id: int
    type: Literal["activity", "notice", "club"] = Field(..., description="결과 유형")
    title: str = Field(..., description="제목")
    description: Optional[str] = Field(None, description="설명 (미리보기)")
    url: str = Field(..., description="프론트엔드 이동 경로")
    date: Optional[datetime] = Field(None, description="생성일")
    thumbnail_url: Optional[str] = Field(None, description="썸네일 이미지 URL")


class SearchResponse(BaseModel):
    """통합 검색 응답"""
    results: List[SearchResultItem] = Field(default_factory=list, description="검색 결과 목록")
    total_count: int = Field(0, description="총 결과 수")
