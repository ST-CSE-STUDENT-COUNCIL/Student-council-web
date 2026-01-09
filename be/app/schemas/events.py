"""
행사 관련 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ============================================================================
# 행사 이미지
# ============================================================================

class EventImageCreate(BaseModel):
    """행사 이미지 추가 요청"""
    caption: Optional[str] = Field(None, description="이미지 설명")
    display_order: int = Field(default=0, description="표시 순서")


class EventImageResponse(BaseModel):
    """행사 이미지 응답"""
    id: int
    event_id: int
    image_url: str
    display_order: int
    caption: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# 행사
# ============================================================================

class EventCreate(BaseModel):
    """행사 생성 요청"""
    category: Optional[str] = Field(None, max_length=50, description="행사 카테고리 (MT, 간식행사, 개강파티, 축제 등)")
    title: str = Field(..., max_length=200, description="행사명")
    description: Optional[str] = Field(None, description="행사 설명")
    location: Optional[str] = Field(None, max_length=200, description="장소")
    event_date: datetime = Field(..., description="행사 일시")
    registration_start: datetime = Field(..., description="신청 시작 일시")
    registration_end: datetime = Field(..., description="신청 종료 일시")
    max_capacity: int = Field(..., gt=0, description="최대 정원")
    require_membership: bool = Field(default=False, description="회비 납부자만 신청 가능")


class EventUpdate(BaseModel):
    """행사 수정 요청"""
    category: Optional[str] = Field(None, max_length=50, description="행사 카테고리")
    title: Optional[str] = Field(None, max_length=200, description="행사명")
    description: Optional[str] = Field(None, description="행사 설명")
    location: Optional[str] = Field(None, max_length=200, description="장소")
    event_date: Optional[datetime] = Field(None, description="행사 일시")
    registration_start: Optional[datetime] = Field(None, description="신청 시작 일시")
    registration_end: Optional[datetime] = Field(None, description="신청 종료 일시")
    max_capacity: Optional[int] = Field(None, gt=0, description="최대 정원")
    require_membership: Optional[bool] = Field(None, description="회비 납부자만 신청 가능")
    is_active: Optional[bool] = Field(None, description="활성화 여부")


class EventListItem(BaseModel):
    """행사 목록 아이템"""
    id: int
    category: Optional[str]
    title: str
    location: Optional[str]
    event_date: datetime
    registration_start: datetime
    registration_end: datetime
    max_capacity: int
    current_count: int
    require_membership: bool
    thumbnail_url: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class EventDetail(BaseModel):
    """행사 상세 정보"""
    id: int
    category: Optional[str]
    title: str
    description: Optional[str]
    location: Optional[str]
    event_date: datetime
    registration_start: datetime
    registration_end: datetime
    max_capacity: int
    current_count: int
    require_membership: bool
    thumbnail_url: Optional[str]
    is_active: bool
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    images: List[EventImageResponse] = []
    
    class Config:
        from_attributes = True


class EventListResponse(BaseModel):
    """행사 목록 응답"""
    events: List[EventListItem]
    total: int


# ============================================================================
# 행사 신청
# ============================================================================

class GuestRegistrationInfo(BaseModel):
    """비회원 신청 정보"""
    student_id: str = Field(..., min_length=1, max_length=20, description="학번")
    name: str = Field(..., min_length=1, max_length=50, description="이름")
    phone: str = Field(..., min_length=1, max_length=20, description="전화번호")


class EventRegistrationRequest(BaseModel):
    """행사 신청 요청 (회원/비회원 공통)"""
    guest_info: Optional[GuestRegistrationInfo] = Field(None, description="비회원인 경우 필수, 회원인 경우 null")


class EventRegistrationResponse(BaseModel):
    """행사 신청 응답"""
    id: int
    event_id: int
    user_id: Optional[str]  # nullable for guest
    guest_student_id: Optional[str] = None
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None
    status: str
    registration_number: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class EventRegistrationDetailResponse(BaseModel):
    """행사 신청 상세 응답 (참가자 정보 포함)"""
    id: int
    event_id: int
    user_id: Optional[str]
    student_id: str  # 회원 또는 비회원 학번
    name: str  # 회원 또는 비회원 이름
    email: Optional[str]  # 회원만
    phone: Optional[str]
    status: str
    registration_number: int
    is_guest: bool  # 비회원 여부
    created_at: datetime
    
    class Config:
        from_attributes = True


class EventRegistrationListResponse(BaseModel):
    """행사 신청 목록 응답"""
    registrations: List[EventRegistrationDetailResponse]
    total: int


class RegisterEventResult(BaseModel):
    """행사 신청 결과"""
    success: bool
    message: str
    registration_number: Optional[int] = None


# ============================================================================
# 만족도 조사
# ============================================================================

class EventSurveyCreate(BaseModel):
    """만족도 조사 제출"""
    rating: int = Field(..., ge=1, le=5, description="만족도 (1~5)")
    feedback: Optional[str] = Field(None, description="의견")


class EventSurveyResponse(BaseModel):
    """만족도 조사 응답"""
    id: int
    event_id: int
    user_id: str
    rating: int
    feedback: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class EventSurveyStats(BaseModel):
    """만족도 조사 통계"""
    total_responses: int
    average_rating: float
    rating_distribution: dict  # {1: count, 2: count, ...}


# ============================================================================
# 공통
# ============================================================================

class ErrorResponse(BaseModel):
    """에러 응답"""
    detail: str
