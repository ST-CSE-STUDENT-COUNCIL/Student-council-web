"""
복지사업 관련 Pydantic 스키마
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ============================================================================
# 사물함 (Locker)
# ============================================================================

class LockerInfo(BaseModel):
    """사물함 배치도 및 신청/반납 정보"""
    id: int
    layout_image_url: str = Field(..., description="피그마 배치도 이미지 URL")
    application_form_url: Optional[str] = Field(None, description="구글폼 신청 URL (NULL: 설정 안 됨, 빈 문자열: 마감, URL: 진행 중)")
    return_extension_form_url: Optional[str] = Field(None, description="구글폼 반납/연장 URL (NULL: 설정 안 됨, 빈 문자열: 마감, URL: 진행 중)")
    application_start: Optional[datetime] = Field(None, description="신청 시작 날짜 (KST)")
    application_end: Optional[datetime] = Field(None, description="신청 종료 날짜 (KST)")
    return_extension_start: Optional[datetime] = Field(None, description="반납/연장 시작 날짜 (KST)")
    return_extension_end: Optional[datetime] = Field(None, description="반납/연장 종료 날짜 (KST)")
    description: Optional[str] = Field(None, description="설명 (예: 19, 35번 고장, 2024-1학기)")
    updated_at: datetime = Field(..., description="마지막 수정 시각 (KST)")

    class Config:
        from_attributes = True


class LockerInfoUpdate(BaseModel):
    """사물함 정보 수정 (관리자용)"""
    application_form_url: Optional[str] = Field(None, description="구글폼 신청 URL")
    return_extension_form_url: Optional[str] = Field(None, description="구글폼 반납/연장 URL")
    application_start: Optional[datetime] = Field(None, description="신청 시작 날짜 (KST)")
    application_end: Optional[datetime] = Field(None, description="신청 종료 날짜 (KST)")
    return_extension_start: Optional[datetime] = Field(None, description="반납/연장 시작 날짜 (KST)")
    return_extension_end: Optional[datetime] = Field(None, description="반납/연장 종료 날짜 (KST)")
    description: Optional[str] = Field(None, description="설명")


# ============================================================================
# 물품대여 (Rental Items)
# ============================================================================

class RentalItem(BaseModel):
    """물품대여 정보"""
    id: int
    item_name: str = Field(..., description="물품명 (장우산, 단우산 등)")
    category: Optional[str] = Field(None, description="분류 (우산, 돗자리 등)")

    image_url: Optional[str] = Field(None, description="물품 이미지 URL")
    application_sheet_url: str = Field(..., description="구글 시트 URL (신청 현황)")
    available_quantity: Optional[int] = Field(None, description="현재 재고 (스프레드시트에서 조회)")
    is_active: bool = Field(True, description="대여 가능 여부")
    updated_at: datetime = Field(..., description="마지막 수정 시각")

    class Config:
        from_attributes = True


class RentalItemUpdate(BaseModel):
    """물품대여 수정 (관리자용)"""
    item_name: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    application_sheet_url: Optional[str] = None
    spreadsheet_id: Optional[str] = None
    quantity_sheet_name: Optional[str] = None
    quantity_cell_range: Optional[str] = None
    is_active: Optional[bool] = None
