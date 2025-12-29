"""
게시글 관련 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AttachmentResponse(BaseModel):
    """첨부파일 응답"""
    id: int = Field(..., description="첨부파일 ID")
    filename: str = Field(..., description="원본 파일명")
    file_url: str = Field(..., description="파일 URL")
    file_size: Optional[int] = Field(None, description="파일 크기 (bytes)")
    mime_type: Optional[str] = Field(None, description="MIME 타입")
    created_at: datetime = Field(..., description="업로드 일시")
    
    class Config:
        from_attributes = True


class PostCreateRequest(BaseModel):
    """게시글 작성 요청"""
    board_id: int = Field(..., description="게시판 ID")
    title: str = Field(..., min_length=1, max_length=200, description="제목")
    content: str = Field(..., min_length=1, description="내용")
    subcategory: Optional[str] = Field(None, max_length=50, description="소카테고리 (행사, 학과소식, 고시 등)")
    is_anonymous: bool = Field(default=False, description="익명 여부 (건의함만 가능)")


class PostUpdateRequest(BaseModel):
    """게시글 수정 요청"""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="제목")
    content: Optional[str] = Field(None, min_length=1, description="내용")
    subcategory: Optional[str] = Field(None, max_length=50, description="소카테고리")
    is_pinned: Optional[bool] = Field(None, description="상단 고정 (관리자만)")


class PostResponse(BaseModel):
    """게시글 응답"""
    id: int = Field(..., description="게시글 ID")
    board_id: int = Field(..., description="게시판 ID")
    author_id: Optional[str] = Field(None, description="작성자 ID (익명이면 None)")
    author_name: Optional[str] = Field(None, description="작성자 이름 (익명이면 '익명')")
    title: str = Field(..., description="제목")
    content: str = Field(..., description="내용")
    subcategory: Optional[str] = Field(None, description="소카테고리")
    is_pinned: bool = Field(..., description="상단 고정 여부")
    is_anonymous: bool = Field(..., description="익명 여부")
    attachments: list[AttachmentResponse] = Field(default_factory=list, description="첨부파일 목록")
    created_at: datetime = Field(..., description="작성 일시")
    updated_at: datetime = Field(..., description="수정 일시")
    
    class Config:
        from_attributes = True


class PostListItem(BaseModel):
    """게시글 목록 항목 (간단한 정보만)"""
    id: int = Field(..., description="게시글 ID")
    board_id: int = Field(..., description="게시판 ID")
    author_name: Optional[str] = Field(None, description="작성자 이름 (익명이면 '익명')")
    title: str = Field(..., description="제목")
    subcategory: Optional[str] = Field(None, description="소카테고리")
    is_pinned: bool = Field(..., description="상단 고정 여부")
    is_anonymous: bool = Field(..., description="익명 여부")
    created_at: datetime = Field(..., description="작성 일시")
    
    class Config:
        from_attributes = True


class PaginationMeta(BaseModel):
    """페이지네이션 메타 정보"""
    page: int = Field(..., description="현재 페이지")
    limit: int = Field(..., description="페이지당 항목 수")
    total: int = Field(..., description="전체 항목 수")
    total_pages: int = Field(..., description="전체 페이지 수")


class PostListResponse(BaseModel):
    """게시글 목록 응답 (페이지네이션)"""
    posts: list[PostListItem]
    pagination: PaginationMeta


class ErrorResponse(BaseModel):
    """에러 응답"""
    detail: str
