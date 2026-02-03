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
class FormFieldCondition(BaseModel):
    """조건부 필드/섹션 표시 조건"""
    target: str = Field(..., description="조건을 검사할 대상 필드의 name")
    value: str = Field(..., description="조건이 참이 되기 위한 값 (예: '참여')")


class FormField(BaseModel):
    """추가 정보 수집 필드 정의"""
    name: str = Field(..., description="필드 이름 (영문)")
    label: str = Field(..., description="필드 라벨 (한글)")
    type: Literal["text", "textarea", "select", "radio", "checkbox", "number", "date", "file", "section"] = Field(..., description="입력 타입")
    options: Optional[List[str]] = Field(None, description="선택지 (select, radio, checkbox용)")
    required: bool = Field(default=False, description="필수 여부")
    placeholder: Optional[str] = Field(None, description="플레이스홀더")
    help_text: Optional[str] = Field(None, description="도움말")
    condition: Optional[FormFieldCondition] = Field(None, description="이 필드(또는 섹션)가 표시될 조건")


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
    image_urls: Optional[List[Dict[str, str]]] = Field(None, description="이미지 URL 리스트")
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
    image_urls: Optional[List[Dict[str, str]]] = Field(None, description="이미지 URL 리스트")
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
    images: List[Dict[str, Any]] = Field(default_factory=list, description="활동 이미지 목록")
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
    student_id: Optional[str] = Field(None, pattern=r'^\d{8,20}$', description="학번/수험번호")
    department: Optional[str] = Field(None, max_length=100, description="학과")
    phone: Optional[str] = Field(None, pattern=r'^010-?\d{4}-?\d{4}$', description="전화번호")
    email: Optional[str] = Field(None, description="이메일")
    verification_image_url: Optional[str] = Field(None, description="첨부 이미지 URL (Presigned URL로 업로드 후 받은 public_url, 모든 활동 유형에서 사용 가능)")
    
    # 추가 정보 응답
    form_responses: Dict[str, Any] = Field(default_factory=dict, description="추가 정보 응답")
    
    # 카톡방 초대용
    kakao_id: Optional[str] = Field(None, max_length=100, description="카카오톡 ID")
    
    # Turnstile 토큰 (비회원 필수)
    turnstile_token: Optional[str] = Field(None, description="Cloudflare Turnstile 토큰 (비회원 신청 시 필수)")
    
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
# 신청 상태 변경 스키마 (관리자용)
# ============================================================================
class RegistrationStatusUpdateRequest(BaseModel):
    """신청 상태 변경 요청 (관리자용)"""
    status: Literal["approved", "rejected", "pending"] = Field(..., description="변경할 상태")
    admin_note: Optional[str] = Field(None, max_length=500, description="관리자 메모 (승인/거절 사유)")


# ============================================================================
# 수요조사 통계 스키마 (관리자용)
# ============================================================================
class ObjectiveQuestionStats(BaseModel):
    """객관식 질문 통계"""
    field_name: str = Field(..., description="필드 이름")
    label: str = Field(..., description="질문 라벨")
    type: str = Field(..., description="질문 타입 (select, radio, checkbox)")
    options: List[str] = Field(default_factory=list, description="선택지 목록")
    counts: Dict[str, int] = Field(default_factory=dict, description="옵션별 응답 수")
    other_count: int = Field(default=0, description="기타 응답 수")


class SubjectiveAnswer(BaseModel):
    """주관식 응답 항목"""
    answer: Any = Field(..., description="응답 내용")
    respondent: str = Field(..., description="응답자")
    created_at: Optional[str] = Field(None, description="응답 시각")


class SubjectiveQuestionStats(BaseModel):
    """주관식 질문 통계"""
    field_name: str = Field(..., description="필드 이름")
    label: str = Field(..., description="질문 라벨")
    type: str = Field(..., description="질문 타입 (text, textarea)")
    response_count: int = Field(default=0, description="응답 수")
    responses: List[SubjectiveAnswer] = Field(default_factory=list, description="응답 목록")


class DemandSurveyStatsResponse(BaseModel):
    """수요조사 통계 응답 (관리자용)"""
    activity_id: int = Field(..., description="활동 ID")
    title: Optional[str] = Field(None, description="수요조사 제목")
    total_responses: int = Field(default=0, description="총 응답 수")
    objective_questions: List[ObjectiveQuestionStats] = Field(default_factory=list, description="객관식 질문 통계")
    subjective_questions: List[SubjectiveQuestionStats] = Field(default_factory=list, description="주관식 질문 통계")
    
    class Config:
        json_schema_extra = {
            "example": {
                "activity_id": 1,
                "title": "간식 수요조사",
                "total_responses": 50,
                "objective_questions": [
                    {
                        "field_name": "snack_preference",
                        "label": "선호하는 간식",
                        "type": "radio",
                        "options": ["빵", "과자", "음료"],
                        "counts": {"빵": 20, "과자": 25, "음료": 5},
                        "other_count": 0
                    }
                ],
                "subjective_questions": [
                    {
                        "field_name": "suggestion",
                        "label": "기타 의견",
                        "type": "textarea",
                        "response_count": 10,
                        "responses": [
                            {"answer": "아이스크림도 추가해주세요", "respondent": "홍길동", "created_at": "2026-01-16T10:00:00Z"}
                        ]
                    }
                ]
            }
        }


# ============================================================================
# 내 활동 조회 스키마 (회원용)
# ============================================================================
class MyActivityItem(BaseModel):
    """내 활동 항목"""
    registration_id: int = Field(..., description="신청 ID")
    status: str = Field(..., description="신청 상태 (pending, approved, rejected, cancelled)")
    registered_at: datetime = Field(..., description="신청 일시")
    updated_at: Optional[datetime] = Field(None, description="상태 변경 일시")
    activity: Dict[str, Any] = Field(..., description="활동 정보")


class MyActivitiesResponse(BaseModel):
    """내 활동 목록 응답"""
    items: List[MyActivityItem] = Field(default_factory=list, description="활동 목록")
    total: int = Field(default=0, description="총 개수")
    page: int = Field(default=1, description="현재 페이지")
    page_size: int = Field(default=20, description="페이지 크기")
    total_pages: int = Field(default=0, description="총 페이지 수")
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "registration_id": 1,
                        "status": "approved",
                        "registered_at": "2026-01-15T10:00:00Z",
                        "updated_at": "2026-01-16T09:00:00Z",
                        "activity": {
                            "id": 5,
                            "type": "event",
                            "title": "OT 신청",
                            "description": "2026년 신입생 OT",
                            "thumbnail_url": "https://example.com/image.jpg",
                            "registration_start": "2026-01-10T00:00:00Z",
                            "registration_end": "2026-01-20T23:59:59Z",
                            "max_capacity": 100,
                            "current_count": 45,
                            "require_membership": False,
                            "is_active": True
                        }
                    }
                ],
                "total": 3,
                "page": 1,
                "page_size": 20,
                "total_pages": 1
            }
        }


# ============================================================================
# 에러 응답
# ============================================================================
class ErrorResponse(BaseModel):
    """에러 응답"""
    detail: str


# ============================================================================
# 출석 관련 스키마
# ============================================================================
class AttendanceSearchRequest(BaseModel):
    """학번으로 출석 정보 검색 요청"""
    student_id: str = Field(..., description="학번")


class AttendanceCheckRequest(BaseModel):
    """출석 체크 요청"""
    student_id: str = Field(..., description="학번")


class AttendanceCheckResponse(BaseModel):
    """출석 체크 응답"""
    message: str = Field(default="출석이 완료되었습니다", description="결과 메시지")
    registration_id: int = Field(..., description="신청 ID")
    attended_at: datetime = Field(..., description="출석 체크 시간")


class AttendanceInfoResponse(BaseModel):
    """출석 정보 응답 (참석자가 보는 화면)"""
    registration_id: int = Field(..., description="신청 ID")
    activity_title: str = Field(..., description="행사명")
    user_name: str = Field(..., description="참석자 이름")
    student_id: str = Field(..., description="학번")
    already_attended: bool = Field(default=False, description="이미 출석 체크했는지")
    attended_at: Optional[datetime] = Field(None, description="출석 시간")


class AttendanceListItem(BaseModel):
    """출석 목록 항목"""
    registration_id: int
    user_id: Optional[str]
    user_name: str
    student_id: str
    phone: Optional[str]
    registered_at: datetime
    attended: bool
    attended_at: Optional[datetime]


class AttendanceListResponse(BaseModel):
    """출석 현황 응답 (관리자용)"""
    activity_id: int
    activity_title: str
    total_registrations: int = Field(..., description="총 신청자 수")
    attended_count: int = Field(..., description="출석자 수")
    attendance_rate: float = Field(..., description="출석률 (%)")
    registrations: List[AttendanceListItem]
