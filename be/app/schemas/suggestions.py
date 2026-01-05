"""
건의함 관련 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SuggestionCreateRequest(BaseModel):
    """건의함 작성 요청"""
    title: str = Field(..., min_length=1, max_length=200, description="제목")
    content: str = Field(..., min_length=1, description="내용")


class SuggestionStatusUpdateRequest(BaseModel):
    """건의함 상태 업데이트 요청 (관리자 전용)"""
    status: str = Field(..., description="상태 (received, in_progress, rejected, approved)")
    rejection_reason: Optional[str] = Field(None, description="반려 사유 (rejected일 때 필요)")
    resolution_note: Optional[str] = Field(None, description="승인/반영 내용 (approved일 때 필요)")


class SuggestionResponse(BaseModel):
    """건의함 응답"""
    id: int = Field(..., description="건의함 ID")
    author_id: Optional[str] = Field(None, description="작성자 ID (관리자만 확인)")
    author_name: str = Field(..., description="작성자 이름 (기본 익명)")
    title: str = Field(..., description="제목")
    content: str = Field(..., description="내용")
    status: str = Field(..., description="처리 상태")
    rejection_reason: Optional[str] = Field(None, description="반려 사유 (admin/작성자만)")
    resolution_note: Optional[str] = Field(None, description="승인/반영 내용 (admin/작성자만)")
    created_at: datetime = Field(..., description="작성 일시")
    updated_at: datetime = Field(..., description="수정 일시")
    
    class Config:
        from_attributes = True


class SuggestionListItem(BaseModel):
    """건의함 목록 항목"""
    id: int = Field(..., description="건의함 ID")
    author_id: Optional[str] = Field(None, description="작성자 ID (관리자만 확인)")
    author_name: str = Field(..., description="작성자 이름 (기본 익명)")
    title: str = Field(..., description="제목")
    status: str = Field(..., description="처리 상태")
    rejection_reason: Optional[str] = Field(None, description="반려 사유 (admin/작성자만)")
    resolution_note: Optional[str] = Field(None, description="승인/반영 내용 (admin/작성자만)")
    created_at: datetime = Field(..., description="작성 일시")
    
    class Config:
        from_attributes = True


class PaginationMeta(BaseModel):
    """페이지네이션 메타 정보"""
    page: int = Field(..., description="현재 페이지")
    limit: int = Field(..., description="페이지당 항목 수")
    total: int = Field(..., description="전체 항목 수")
    total_pages: int = Field(..., description="전체 페이지 수")


class SuggestionListResponse(BaseModel):
    """건의함 목록 응답 (페이지네이션)"""
    suggestions: list[SuggestionListItem]
    pagination: PaginationMeta


class ErrorResponse(BaseModel):
    """에러 응답"""
    detail: str
