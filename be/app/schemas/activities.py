"""
활동(Activities) 관련 스키마

통합 활동 관리:
- 행사신청 (event)
- 수요조사 (demand_survey)
- 설문조사 (survey)
- 카톡방 초대 신청 (kakao_invite)
- 공지 (notice)
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime


# ============================================================================
# Form Field 스키마 (추가 정보 수집 필드 정의)
# ============================================================================
class FormField(BaseModel):
    """추가 정보 수집 필드 정의"""
    name: str = Field(..., description="필드 이름 (영문)")
    label: str = Field(..., description="필드 라벨 (한글)")
    type: Literal["text", "textarea", "select", "radio", "checkbox", "number", "date", "file"] = Field(..., description="입력 타입")
    options: Optional[List[str]] = Field(None, description="선택지 (select, radio, checkbox용)")
    required: bool = Field(default=False, description="필수 여부")
    placeholder: Optional[str] = Field(None, description="플레이스홀더")
    help_text: Optional[str] = Field(None, description="도움말")


# ============================================================================
# Config 스키마 (타입별 상세 설정)
# ============================================================================
class EventConfig(BaseModel):
    """행사 상세 설정"""
    locations: List[Dict[str, str]] = Field(default_factory=list, description="장소 목록")
    dates: List[Dict[str, str]] = Field(default_factory=list, description="일정 목록")
    price: Optional[int] = Field(None, description="참가비")
    
    class Config:
        json_schema_extra = {
            "example": {
                "locations": [
                    {"name": "다솔관 1층", "description": "로비"},
                    {"name": "미래관 5층", "description": "세미나실"}
                ],
                "dates": [
                    {"date": "2026-03-15T14:00:00Z", "description": "1차 행사"},
                    {"date": "2026-03-16T14:00:00Z", "description": "2차 행사"}
                ],
                "price": 5000
            }
        }


class DemandSurveyConfig(BaseModel):
    """수요조사 설정"""
    target_date: Optional[str] = Field(None, description="목표 일정")
    description: Optional[str] = Field(None, description="추가 설명")


class SurveyConfig(BaseModel):
    """설문조사 설정"""
    questions: List[Dict[str, Any]] = Field(default_factory=list, description="설문 질문 목록")
    
    class Config:
        json_schema_extra = {
            "example": {
                "questions": [
                    {
                        "id": 1,
                        "question": "행사는 만족스러우셨나요?",
                        "type": "multiple_choice",
                        "options": ["매우 만족", "만족", "보통", "불만족", "매우 불만족"],
                        "required": True
                    },
                    {
                        "id": 2,
                        "question": "개선할 점이 있다면?",
                        "type": "text",
                        "required": False
                    }
                ]
            }
        }


class KakaoInviteConfig(BaseModel):
    """카톡방 초대 설정"""
    kakao_room_name: str = Field(..., description="카카오톡 방 이름")
    description: Optional[str] = Field(None, description="초대 안내 메시지")


class NoticeConfig(BaseModel):
    """공지 설정"""
    external_link: Optional[str] = Field(None, description="외부 링크")


# ============================================================================
# Activity 생성/수정 스키마
# ============================================================================
class ActivityCreateRequest(BaseModel):
    """활동 생성 요청"""
    type: Literal["event", "demand_survey", "survey", "kakao_invite", "notice"] = Field(..., description="활동 타입")
    title: str = Field(..., min_length=1, max_length=200, description="제목")
    description: Optional[str] = Field(None, description="설명")
    
    registration_start: Optional[datetime] = Field(None, description="신청 시작 일시")
    registration_end: Optional[datetime] = Field(None, description="신청 종료 일시")
    
    max_capacity: Optional[int] = Field(None, ge=1, description="최대 정원")
    require_membership: bool = Field(default=False, description="회비 납부자만 신청 가능")
    
    config: Dict[str, Any] = Field(default_factory=dict, description="타입별 상세 설정")
    form_fields: List[FormField] = Field(default_factory=list, description="추가 정보 수집 필드")
    
    thumbnail_url: Optional[str] = Field(None, description="썸네일 URL")
    is_active: bool = Field(default=True, description="활성화 여부")


class ActivityUpdateRequest(BaseModel):
    """활동 수정 요청"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None
    max_capacity: Optional[int] = Field(None, ge=1)
    require_membership: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None
    form_fields: Optional[List[FormField]] = None
    thumbnail_url: Optional[str] = None
    is_active: Optional[bool] = None


# ============================================================================
# Activity 응답 스키마
# ============================================================================
class ActivityResponse(BaseModel):
    """활동 응답"""
    id: int
    type: str
    title: str
    description: Optional[str]
    registration_start: Optional[datetime]
    registration_end: Optional[datetime]
    max_capacity: Optional[int]
    current_count: int
    require_membership: bool
    config: Dict[str, Any]
    form_fields: List[Dict[str, Any]]
    thumbnail_url: Optional[str]
    is_active: bool
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    # 신청 상태 (로그인한 사용자만)
    is_registered: Optional[bool] = Field(None, description="내가 신청했는지 여부")
    my_registration_id: Optional[int] = Field(None, description="내 신청 ID")
    
    class Config:
        from_attributes = True


class ActivityListItem(BaseModel):
    """활동 목록 항목"""
    id: int
    type: str
    title: str
    description: Optional[str]
    registration_start: Optional[datetime]
    registration_end: Optional[datetime]
    max_capacity: Optional[int]
    current_count: int
    thumbnail_url: Optional[str]
    is_active: bool
    created_at: datetime
    
    # 신청 가능 여부
    is_registration_open: bool = Field(default=False, description="현재 신청 가능 여부")
    is_full: bool = Field(default=False, description="정원 마감 여부")


class ActivityListResponse(BaseModel):
    """활동 목록 응답"""
    activities: List[ActivityListItem]
    pagination: Dict[str, Any]


# ============================================================================
# Activity Registration 스키마
# ============================================================================
class ActivityRegistrationRequest(BaseModel):
    """활동 신청 요청"""
    # 비회원 정보 (회원은 선택사항, 비회원은 필수)
    name: Optional[str] = Field(None, max_length=100, description="이름")
    student_id: Optional[str] = Field(None, pattern=r'^\d{8}$', description="학번")
    department: Optional[str] = Field(None, max_length=100, description="학과")
    phone: Optional[str] = Field(None, pattern=r'^010-?\d{4}-?\d{4}$', description="전화번호")
    email: Optional[str] = Field(None, description="이메일")
    
    # 추가 정보 응답
    form_responses: Dict[str, Any] = Field(default_factory=dict, description="추가 정보 응답")
    
    # 카톡방 초대용
    kakao_id: Optional[str] = Field(None, max_length=100, description="카카오톡 ID")
    
    @field_validator('phone')
    @classmethod
    def normalize_phone(cls, v: Optional[str]) -> Optional[str]:
        if v:
            return v.replace('-', '')
        return v


class ActivityRegistrationResponse(BaseModel):
    """활동 신청 응답"""
    id: int
    activity_id: int
    user_id: Optional[str]
    name: Optional[str]
    student_id: Optional[str]
    department: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    form_responses: Dict[str, Any]
    kakao_id: Optional[str]
    verification_image_url: Optional[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ActivityRegistrationListResponse(BaseModel):
    """활동 신청 목록 응답 (관리자용)"""
    registrations: List[ActivityRegistrationResponse]
    pagination: Dict[str, Any]


# ============================================================================
# Survey Response 스키마
# ============================================================================
class SurveySubmitRequest(BaseModel):
    """설문조사 제출 요청"""
    survey_responses: Dict[str, Any] = Field(..., description="설문 응답")
    
    class Config:
        json_schema_extra = {
            "example": {
                "survey_responses": {
                    "1": "매우 만족",
                    "2": "음식이 더 다양했으면 좋겠습니다",
                    "3": 5
                }
            }
        }


class SurveyStatsResponse(BaseModel):
    """설문조사 통계 응답 (관리자용)"""
    activity_id: int
    total_responses: int
    question_stats: List[Dict[str, Any]]
    
    class Config:
        json_schema_extra = {
            "example": {
                "activity_id": 1,
                "total_responses": 50,
                "question_stats": [
                    {
                        "question_id": 1,
                        "question": "행사는 만족스러우셨나요?",
                        "type": "multiple_choice",
                        "responses": {
                            "매우 만족": 30,
                            "만족": 15,
                            "보통": 5
                        }
                    }
                ]
            }
        }


# ============================================================================
# 에러 응답
# ============================================================================
class ErrorResponse(BaseModel):
    """에러 응답"""
    detail: str
