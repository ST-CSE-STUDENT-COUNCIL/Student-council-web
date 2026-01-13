"""
공지사항 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BoardInfo(BaseModel):
    """게시판 정보"""
    id: int
    name: str
    category: str


class AuthorInfo(BaseModel):
    """작성자 정보"""
    id: str
    name: str


class AttachmentInfo(BaseModel):
    """첨부파일 정보"""
    id: int
    filename: str
    file_url: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    created_at: datetime


class NoticeListItem(BaseModel):
    """공지사항 목록 아이템"""
    id: int
    title: str
    content: str
    subcategory: Optional[str] = None
    is_pinned: bool = False
    created_at: datetime
    updated_at: datetime
    board: BoardInfo
    author: AuthorInfo


class PaginationMeta(BaseModel):
    """페이지네이션 메타 정보"""
    total: int = Field(..., description="전체 항목 수")
    page: int = Field(..., description="현재 페이지")
    page_size: int = Field(..., description="페이지당 항목 수")
    total_pages: int = Field(..., description="전체 페이지 수")
    has_next: bool = Field(..., description="다음 페이지 존재 여부")
    has_prev: bool = Field(..., description="이전 페이지 존재 여부")


class NoticeListResponse(BaseModel):
    """공지사항 목록 응답"""
    notices: list[NoticeListItem]
    pagination: PaginationMeta


class NoticeDetailResponse(BaseModel):
    """공지사항 상세 응답"""
    id: int
    title: str
    content: str
    subcategory: Optional[str] = None
    is_pinned: bool = False
    created_at: datetime
    updated_at: datetime
    board: BoardInfo
    author: AuthorInfo
    attachments: list[AttachmentInfo] = []


class AttachmentFileInfo(BaseModel):
    """첨부파일 업로드 정보 (Presigned URL 방식)"""
    filename: str
    public_url: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


class DraftCreateRequest(BaseModel):
    """Draft 게시글 생성 요청"""
    board_id: int = Field(..., description="게시판 ID")


class NoticeCreateRequest(BaseModel):
    """공지사항 작성 요청"""
    post_id: Optional[int] = Field(None, description="기존 draft 게시글 ID (있으면 업데이트, 없으면 새로 생성)")
    title: str
    content: str
    board_id: int
    subcategory: Optional[str] = None
    is_pinned: bool = False
    attachment_urls: Optional[list[AttachmentFileInfo]] = None


class NoticeUpdateRequest(BaseModel):
    """공지사항 수정 요청"""
    title: Optional[str] = None
    content: Optional[str] = None
    subcategory: Optional[str] = None
    is_pinned: Optional[bool] = None
    attachment_urls: Optional[list[AttachmentFileInfo]] = None  # 첨부파일 추가용
    delete_attachment_ids: Optional[list[int]] = None  # 첨부파일 삭제용
