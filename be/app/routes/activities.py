"""
활동(Activities) 관련 API 엔드포인트

통합 활동 관리:
- 행사신청 (event)
- 수요조사 (demand_survey)  
- 설문조사 (survey)
- 카톡방 초대 신청 (kakao_invite)
- 공지 (notice)
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query, UploadFile, File, Form
from typing import Optional
from datetime import datetime
import math
import json
from app.schemas.activities import (
    ActivityCreateRequest,
    ActivityUpdateRequest,
    ActivityResponse,
    ActivityListItem,
    ActivityListResponse,
    ActivityRegistrationRequest,
    ActivityRegistrationResponse,
    ActivityRegistrationListResponse,
    SurveySubmitRequest,
    SurveyStatsResponse,
    ErrorResponse
)
from app.utils.auth import optional_current_user, require_verified_user, require_admin
from app.utils.r2_storage import upload_file_to_r2, delete_file_from_r2
from app.database import supabase


router = APIRouter(tags=["활동"])


# ============================================================================
# 공개 엔드포인트 (로그인 불필요)
# ============================================================================

@router.get(
    "/activities",
    response_model=ActivityListResponse,
    status_code=status.HTTP_200_OK,
    summary="활동 목록 조회",
    description="활동 목록을 조회합니다. 타입별 필터링 가능합니다.",
    responses={
        200: {"description": "성공"}
    }
)
async def get_activities(
    type_filter: Optional[str] = Query(None, description="활동 타입 필터 (event, demand_survey, survey, kakao_invite, notice)"),
    is_active_only: bool = Query(True, description="활성화된 활동만 조회"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    page_size: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    current_user: Optional[dict] = Depends(optional_current_user)
):
    """활동 목록 조회"""
    try:
        # 전체 개수 조회
        count_query = supabase.table("activities").select("id", count="exact")  # type: ignore
        
        if is_active_only:
            count_query = count_query.eq("is_active", True)
        
        count_query = count_query.eq("is_deleted", False)
        
        if type_filter:
            count_query = count_query.eq("type", type_filter)
        
        count_result = count_query.execute()
        total = len(count_result.data) if count_result.data else 0
        
        # 목록 조회
        query = supabase.table("activities")\
            .select("*")\
            .eq("is_deleted", False)\
            .order("created_at", desc=True)
        
        if is_active_only:
            query = query.eq("is_active", True)
        
        if type_filter:
            query = query.eq("type", type_filter)
        
        offset = (page - 1) * page_size
        query = query.range(offset, offset + page_size - 1)
        
        result = query.execute()
        activities_data = result.data if result.data else []
        
        # 응답 데이터 구성
        items = []
        now = datetime.utcnow()
        
        for activity in activities_data:
            registration_start = datetime.fromisoformat(activity["registration_start"].replace('Z', '+00:00')) if activity.get("registration_start") else None
            registration_end = datetime.fromisoformat(activity["registration_end"].replace('Z', '+00:00')) if activity.get("registration_end") else None
            
            # 신청 가능 여부 판단
            is_registration_open = True
            if registration_start and now < registration_start:
                is_registration_open = False
            if registration_end and now > registration_end:
                is_registration_open = False
            
            # 정원 마감 여부
            is_full = False
            if activity.get("max_capacity") and activity.get("current_count", 0) >= activity["max_capacity"]:
                is_full = True
            
            items.append(ActivityListItem(
                id=activity["id"],
                type=activity["type"],
                title=activity["title"],
                description=activity.get("description"),
                registration_start=registration_start,
                registration_end=registration_end,
                max_capacity=activity.get("max_capacity"),
                current_count=activity.get("current_count", 0),
                thumbnail_url=activity.get("thumbnail_url"),
                is_active=activity["is_active"],
                created_at=datetime.fromisoformat(activity["created_at"].replace('Z', '+00:00')),
                is_registration_open=is_registration_open,
                is_full=is_full
            ))
        
        total_pages = math.ceil(total / page_size) if total and total > 0 else 0
        
        return ActivityListResponse(
            activities=items,
            pagination={
                "page": page,
                "limit": page_size,
                "total": total,
                "total_pages": total_pages
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"활동 목록 조회 실패: {str(e)}"
        )


@router.get(
    "/activities/{activity_id}",
    response_model=ActivityResponse,
    status_code=status.HTTP_200_OK,
    summary="활동 상세 조회",
    description="활동 상세 정보를 조회합니다.",
    responses={
        200: {"description": "성공"},
        404: {"model": ErrorResponse, "description": "활동 없음"}
    }
)
async def get_activity(
    activity_id: int,
    current_user: Optional[dict] = Depends(optional_current_user)
):
    """활동 상세 조회"""
    try:
        # 활동 조회
        result = supabase.table("activities")\
            .select("*")\
            .eq("id", activity_id)\
            .eq("is_deleted", False)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="활동을 찾을 수 없습니다"
            )
        
        activity = result.data
        
        # 내 신청 여부 확인 (로그인한 경우)
        is_registered = False
        my_registration_id = None
        
        if current_user:
            reg_result = supabase.table("activity_registrations")\
                .select("id")\
                .eq("activity_id", activity_id)\
                .eq("user_id", current_user["id"])\
                .eq("status", "pending")\
                .execute()
            
            if reg_result.data:
                is_registered = True
                my_registration_id = reg_result.data[0]["id"]
        
        return ActivityResponse(
            id=activity["id"],
            type=activity["type"],
            title=activity["title"],
            description=activity.get("description"),
            registration_start=datetime.fromisoformat(activity["registration_start"].replace('Z', '+00:00')) if activity.get("registration_start") else None,
            registration_end=datetime.fromisoformat(activity["registration_end"].replace('Z', '+00:00')) if activity.get("registration_end") else None,
            max_capacity=activity.get("max_capacity"),
            current_count=activity.get("current_count", 0),
            require_membership=activity.get("require_membership", False),
            config=activity.get("config", {}),
            form_fields=activity.get("form_fields", []),
            thumbnail_url=activity.get("thumbnail_url"),
            is_active=activity["is_active"],
            created_by=activity.get("created_by"),
            created_at=datetime.fromisoformat(activity["created_at"].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(activity["updated_at"].replace('Z', '+00:00')),
            is_registered=is_registered,
            my_registration_id=my_registration_id
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"활동 조회 실패: {str(e)}"
        )


# ============================================================================
# 신청 엔드포인트 (회원/비회원 모두 가능)
# ============================================================================

@router.post(
    "/activities/{activity_id}/register",
    response_model=ActivityRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="활동 신청",
    description="활동에 신청합니다. 회원/비회원 모두 가능합니다. 카톡방 초대 신청 시 이미지 업로드 필요.",
    responses={
        201: {"description": "신청 완료"},
        400: {"model": ErrorResponse, "description": "신청 실패 (정원 마감, 중복 신청 등)"},
        401: {"model": ErrorResponse, "description": "인증 필요 (카톡방 초대는 회원만)"}
    }
)
async def register_for_activity(
    activity_id: int,
    body: str = Form(...),  # JSON 문자열로 받음
    verification_image: Optional[UploadFile] = File(None),
    current_user: Optional[dict] = Depends(optional_current_user)
):
    """활동 신청 (회원/비회원)"""
    try:
        # JSON 파싱
        try:
            data = json.loads(body)
            request = ActivityRegistrationRequest(**data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"잘못된 요청 데이터: {str(e)}"
            )
        
        # 활동 정보 조회
        activity_result = supabase.table("activities")\
            .select("type, require_membership, registration_start, registration_end, max_capacity, current_count")\
            .eq("id", activity_id)\
            .eq("is_deleted", False)\
            .eq("is_active", True)\
            .single()\
            .execute()
        
        if not activity_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="활동을 찾을 수 없습니다"
            )
        
        activity = activity_result.data
        
        # 카톡방 초대는 회원만 가능
        if activity["type"] == "kakao_invite" and not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="카톡방 초대 신청은 로그인이 필요합니다"
            )
        
        # 비회원 신청 시 필수 정보 확인
        if not current_user:
            if not all([request.name, request.student_id, request.department, request.phone, request.email]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="비회원은 이름, 학번, 학과, 전화번호, 이메일을 모두 입력해야 합니다"
                )
        
        # 이미지 업로드 (카톡방 초대 신청)
        verification_image_url = None
        if verification_image and activity["type"] == "kakao_invite":
            try:
                verification_image_url = await upload_file_to_r2(
                    file=verification_image,
                    bucket_name="verification-images",
                    folder="kakao_invites"
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"이미지 업로드 실패: {str(e)}"
                )
        
        # 회원 정보 가져오기
        user_id = current_user["id"] if current_user else None
        name = request.name or (current_user.get("name") if current_user else None)
        student_id = request.student_id or (current_user.get("student_id") if current_user else None)
        department = request.department or (current_user.get("department") if current_user else None)
        phone = request.phone or (current_user.get("phone") if current_user else None)
        email = request.email or (current_user.get("email") if current_user else None)
        
        # PostgreSQL 함수 호출
        rpc_result = supabase.rpc(
            "register_for_activity",
            {
                "p_activity_id": activity_id,
                "p_user_id": user_id,
                "p_name": name,
                "p_student_id": student_id,
                "p_department": department,
                "p_phone": phone,
                "p_email": email,
                "p_form_responses": request.form_responses,
                "p_verification_image_url": verification_image_url,
                "p_kakao_id": request.kakao_id
            }
        ).execute()
        
        if not rpc_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="신청 처리 실패"
            )
        
        result = rpc_result.data[0]
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        # 신청 내역 조회
        registration_result = supabase.table("activity_registrations")\
            .select("*")\
            .eq("id", result["registration_id"])\
            .single()\
            .execute()
        
        registration = registration_result.data
        
        return ActivityRegistrationResponse(
            id=registration["id"],
            activity_id=registration["activity_id"],
            user_id=registration.get("user_id"),
            name=registration.get("name"),
            student_id=registration.get("student_id"),
            department=registration.get("department"),
            phone=registration.get("phone"),
            email=registration.get("email"),
            form_responses=registration.get("form_responses", {}),
            kakao_id=registration.get("kakao_id"),
            verification_image_url=registration.get("verification_image_url"),
            status=registration["status"],
            created_at=datetime.fromisoformat(registration["created_at"].replace('Z', '+00:00'))
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"활동 신청 실패: {str(e)}"
        )


@router.delete(
    "/activities/{activity_id}/register",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="활동 신청 취소",
    description="활동 신청을 취소합니다. (로그인 필요)",
    responses={
        204: {"description": "취소 완료"},
        401: {"model": ErrorResponse, "description": "인증 필요"},
        404: {"model": ErrorResponse, "description": "신청 내역 없음"}
    }
)
async def cancel_activity_registration(
    activity_id: int,
    current_user: dict = Depends(require_verified_user)
):
    """활동 신청 취소"""
    try:
        # 내 신청 내역 조회
        reg_result = supabase.table("activity_registrations")\
            .select("id")\
            .eq("activity_id", activity_id)\
            .eq("user_id", current_user["id"])\
            .single()\
            .execute()
        
        if not reg_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="신청 내역을 찾을 수 없습니다"
            )
        
        registration_id = reg_result.data["id"]
        
        # PostgreSQL 함수 호출
        rpc_result = supabase.rpc(
            "cancel_activity_registration",
            {
                "p_registration_id": registration_id,
                "p_user_id": current_user["id"]
            }
        ).execute()
        
        if not rpc_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="취소 처리 실패"
            )
        
        result = rpc_result.data[0]
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"신청 취소 실패: {str(e)}"
        )


# ============================================================================
# 설문조사 제출 엔드포인트
# ============================================================================

@router.post(
    "/activities/{activity_id}/survey",
    status_code=status.HTTP_200_OK,
    summary="설문조사 제출",
    description="설문조사에 응답합니다. (로그인 필요)",
    responses={
        200: {"description": "제출 완료"},
        401: {"model": ErrorResponse, "description": "인증 필요"},
        404: {"model": ErrorResponse, "description": "활동 없음"}
    }
)
async def submit_survey(
    activity_id: int,
    body: SurveySubmitRequest,
    current_user: dict = Depends(require_verified_user)
):
    """설문조사 제출"""
    try:
        # 활동 존재 및 타입 확인
        activity_result = supabase.table("activities")\
            .select("type")\
            .eq("id", activity_id)\
            .eq("type", "survey")\
            .eq("is_deleted", False)\
            .single()\
            .execute()
        
        if not activity_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="설문조사를 찾을 수 없습니다"
            )
        
        # 기존 응답 확인
        existing = supabase.table("activity_registrations")\
            .select("id")\
            .eq("activity_id", activity_id)\
            .eq("user_id", current_user["id"])\
            .execute()
        
        if existing.data:
            # 업데이트
            supabase.table("activity_registrations")\
                .update({"survey_responses": body.survey_responses})\
                .eq("id", existing.data[0]["id"])\
                .execute()
        else:
            # 신규 등록
            supabase.table("activity_registrations").insert({
                "activity_id": activity_id,
                "user_id": current_user["id"],
                "name": current_user.get("name"),
                "student_id": current_user.get("student_id"),
                "department": current_user.get("department"),
                "phone": current_user.get("phone"),
                "email": current_user.get("email"),
                "survey_responses": body.survey_responses,
                "status": "pending"
            }).execute()
        
        return {"message": "설문조사가 제출되었습니다"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"설문조사 제출 실패: {str(e)}"
        )


# ============================================================================
# 관리자 엔드포인트
# ============================================================================

@router.post(
    "/admin/activities",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="활동 생성 (관리자)",
    description="새로운 활동을 생성합니다. 이미지 업로드 가능 (관리자 권한 필요)",
    responses={
        201: {"description": "생성 완료"},
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "권한 없음"}
    }
)
async def create_activity(
    type: str = Form(..., description="활동 유형 (event, demand_survey, survey, kakao_invite, fee_payment, notice)"),
    title: str = Form(..., max_length=200),
    description: Optional[str] = Form(None),
    registration_start: Optional[str] = Form(None),
    registration_end: Optional[str] = Form(None),
    max_capacity: Optional[int] = Form(None),
    require_membership: bool = Form(False),
    config: str = Form("{}", description="JSON 문자열 (location, event_date, kakao_link 등)"),
    form_fields: str = Form("[]", description="JSON 배열 문자열"),
    survey_config: str = Form("{}", description="JSON 문자열 (설문 문항)"),
    is_active: bool = Form(True),
    images: Optional[list[UploadFile]] = File(None, description="활동 이미지 (여러 장 가능)"),
    current_user: dict = Depends(require_admin)
):
    """활동 생성 (관리자 전용, 이미지 업로드 가능)"""
    try:
        # JSON 파싱
        try:
            config_data = json.loads(config)
            form_fields_data = json.loads(form_fields)
            survey_config_data = json.loads(survey_config)
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"JSON 파싱 실패: {str(e)}"
            )
        
        # 활동 데이터 저장
        activity_data = {
            "type": type,
            "title": title,
            "description": description,
            "registration_start": registration_start,
            "registration_end": registration_end,
            "max_capacity": max_capacity,
            "require_membership": require_membership,
            "config": config_data,
            "form_fields": form_fields_data,
            "is_active": is_active,
            "created_by": current_user["id"]
        }
        
        # survey_config 추가 (config에 넣거나 별도로 관리)
        if survey_config_data:
            activity_data["config"]["survey_config"] = survey_config_data
        
        result = supabase.table("activities").insert(activity_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="활동 생성 실패"
            )
        
        activity = result.data[0]
        activity_id = activity["id"]
        
        # 이미지 업로드 (선택적)
        if images:
            for idx, image_file in enumerate(images):
                if image_file.filename:
                    try:
                        # R2에 업로드
                        image_url = await upload_file_to_r2(
                            file=image_file,
                            bucket_name="activity-images",
                            folder=f"activity-{activity_id}",
                            allowed_extensions={".jpg", ".jpeg", ".png"},
                            max_size_mb=10
                        )
                        
                        # activity_images 테이블에 저장
                        image_data = {
                            'activity_id': activity_id,
                            'image_url': image_url,
                            'display_order': idx
                        }
                        
                        supabase.table('activity_images').insert(image_data).execute()
                    
                    except Exception as img_error:
                        print(f"이미지 업로드 실패: {str(img_error)}")
                        continue
        
        return ActivityResponse(
            id=activity["id"],
            type=activity["type"],
            title=activity["title"],
            description=activity.get("description"),
            registration_start=datetime.fromisoformat(activity["registration_start"].replace('Z', '+00:00')) if activity.get("registration_start") else None,
            registration_end=datetime.fromisoformat(activity["registration_end"].replace('Z', '+00:00')) if activity.get("registration_end") else None,
            max_capacity=activity.get("max_capacity"),
            current_count=activity.get("current_count", 0),
            require_membership=activity.get("require_membership", False),
            config=activity.get("config", {}),
            form_fields=activity.get("form_fields", []),
            thumbnail_url=activity.get("thumbnail_url"),
            is_active=activity["is_active"],
            created_by=activity.get("created_by"),
            created_at=datetime.fromisoformat(activity["created_at"].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(activity["updated_at"].replace('Z', '+00:00')),
            is_registered=None,
            my_registration_id=None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"활동 생성 실패: {str(e)}"
        )


@router.patch(
    "/admin/activities/{activity_id}",
    response_model=ActivityResponse,
    status_code=status.HTTP_200_OK,
    summary="활동 수정 (관리자)",
    description="활동 정보를 수정합니다. (관리자 권한 필요)",
    responses={
        200: {"description": "수정 완료"},
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "권한 없음"},
        404: {"model": ErrorResponse, "description": "활동 없음"}
    }
)
async def update_activity(
    activity_id: int,
    body: ActivityUpdateRequest,
    current_user: dict = Depends(require_admin)
):
    """활동 수정 (관리자 전용)"""
    try:
        # 수정 데이터 구성
        update_data = {}
        
        if body.title is not None:
            update_data["title"] = body.title
        if body.description is not None:
            update_data["description"] = body.description
        if body.registration_start is not None:
            update_data["registration_start"] = body.registration_start.isoformat()
        if body.registration_end is not None:
            update_data["registration_end"] = body.registration_end.isoformat()
        if body.max_capacity is not None:
            update_data["max_capacity"] = body.max_capacity
        if body.require_membership is not None:
            update_data["require_membership"] = body.require_membership
        if body.config is not None:
            update_data["config"] = body.config
        if body.form_fields is not None:
            update_data["form_fields"] = [field.model_dump() for field in body.form_fields]
        if body.thumbnail_url is not None:
            update_data["thumbnail_url"] = body.thumbnail_url
        if body.is_active is not None:
            update_data["is_active"] = body.is_active
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="수정할 항목이 없습니다"
            )
        
        result = supabase.table("activities")\
            .update(update_data)\
            .eq("id", activity_id)\
            .eq("is_deleted", False)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="활동을 찾을 수 없습니다"
            )
        
        activity = result.data[0]
        
        return ActivityResponse(
            id=activity["id"],
            type=activity["type"],
            title=activity["title"],
            description=activity.get("description"),
            registration_start=datetime.fromisoformat(activity["registration_start"].replace('Z', '+00:00')) if activity.get("registration_start") else None,
            registration_end=datetime.fromisoformat(activity["registration_end"].replace('Z', '+00:00')) if activity.get("registration_end") else None,
            max_capacity=activity.get("max_capacity"),
            current_count=activity.get("current_count", 0),
            require_membership=activity.get("require_membership", False),
            config=activity.get("config", {}),
            form_fields=activity.get("form_fields", []),
            thumbnail_url=activity.get("thumbnail_url"),
            is_active=activity["is_active"],
            created_by=activity.get("created_by"),
            created_at=datetime.fromisoformat(activity["created_at"].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(activity["updated_at"].replace('Z', '+00:00')),
            is_registered=None,
            my_registration_id=None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"활동 수정 실패: {str(e)}"
        )


@router.delete(
    "/admin/activities/{activity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="활동 삭제 (관리자)",
    description="활동을 삭제합니다. (Soft Delete, 관리자 권한 필요)",
    responses={
        204: {"description": "삭제 완료"},
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "권한 없음"},
        404: {"model": ErrorResponse, "description": "활동 없음"}
    }
)
async def delete_activity(
    activity_id: int,
    current_user: dict = Depends(require_admin)
):
    """활동 삭제 (관리자 전용, Soft Delete)"""
    try:
        result = supabase.table("activities")\
            .update({
                "is_deleted": True,
                "deleted_at": datetime.utcnow().isoformat(),
                "deleted_by": current_user["id"]
            })\
            .eq("id", activity_id)\
            .eq("is_deleted", False)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="활동을 찾을 수 없습니다"
            )
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"활동 삭제 실패: {str(e)}"
        )


@router.get(
    "/admin/activities/{activity_id}/registrations",
    response_model=ActivityRegistrationListResponse,
    status_code=status.HTTP_200_OK,
    summary="활동 신청자 목록 조회 (관리자)",
    description="활동의 신청자 목록을 조회합니다. (관리자 권한 필요)",
    responses={
        200: {"description": "성공"},
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "권한 없음"}
    }
)
async def get_activity_registrations(
    activity_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(require_admin)
):
    """활동 신청자 목록 조회 (관리자 전용)"""
    try:
        # 전체 개수
        # type: ignore는 count 파라미터의 타입 힌트 오류를 무시합니다
        count_result = supabase.table("activity_registrations").select("id", count="exact").eq("activity_id", activity_id).execute()  # type: ignore
        
        total = len(count_result.data) if count_result.data else 0  # type: ignore
        
        # 목록 조회
        offset = (page - 1) * page_size
        result = supabase.table("activity_registrations")\
            .select("*")\
            .eq("activity_id", activity_id)\
            .order("created_at", desc=True)\
            .range(offset, offset + page_size - 1)\
            .execute()
        
        registrations = []
        for reg in result.data:
            registrations.append(ActivityRegistrationResponse(
                id=reg["id"],
                activity_id=reg["activity_id"],
                user_id=reg.get("user_id"),
                name=reg.get("name"),
                student_id=reg.get("student_id"),
                department=reg.get("department"),
                phone=reg.get("phone"),
                email=reg.get("email"),
                form_responses=reg.get("form_responses", {}),
                kakao_id=reg.get("kakao_id"),
                verification_image_url=reg.get("verification_image_url"),
                status=reg["status"],
                created_at=datetime.fromisoformat(reg["created_at"].replace('Z', '+00:00'))
            ))
        
        total_pages = math.ceil(total / page_size) if total and total > 0 else 0
        
        return ActivityRegistrationListResponse(
            registrations=registrations,
            pagination={
                "page": page,
                "limit": page_size,
                "total": total,
                "total_pages": total_pages
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"신청자 목록 조회 실패: {str(e)}"
        )


@router.get(
    "/activities/{activity_id}/survey/results",
    response_model=SurveyStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="설문조사 통계 조회",
    description="설문조사 응답 통계를 조회합니다. (관리자 권한 필요)",
    responses={
        200: {"description": "성공"},
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "권한 없음"}
    }
)
async def get_survey_stats(
    activity_id: int,
    current_user: dict = Depends(require_admin)
):
    """설문조사 통계 조회 (관리자 전용)"""
    try:
        # 설문조사 확인
        activity_result = supabase.table("activities")\
            .select("config")\
            .eq("id", activity_id)\
            .eq("type", "survey")\
            .eq("is_deleted", False)\
            .single()\
            .execute()
        
        if not activity_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="설문조사를 찾을 수 없습니다"
            )
        
        # 응답 조회
        responses_result = supabase.table("activity_registrations")\
            .select("survey_responses")\
            .eq("activity_id", activity_id)\
            .execute()
        
        total_responses = len(responses_result.data) if responses_result.data else 0
        
        # 통계 집계 (간단한 구현)
        question_stats = []
        config = activity_result.data.get("config", {})
        questions = config.get("questions", [])
        
        for question in questions:
            q_id = str(question["id"])
            q_type = question["type"]
            
            if q_type == "multiple_choice":
                # 객관식: 옵션별 응답 수 집계
                counts = {}
                for resp in responses_result.data:
                    survey_resp = resp.get("survey_responses", {})
                    answer = survey_resp.get(q_id)
                    if answer:
                        counts[answer] = counts.get(answer, 0) + 1
                
                question_stats.append({
                    "question_id": question["id"],
                    "question": question["question"],
                    "type": q_type,
                    "responses": counts
                })
            else:
                # 주관식: 모든 응답 수집
                answers = []
                for resp in responses_result.data:
                    survey_resp = resp.get("survey_responses", {})
                    answer = survey_resp.get(q_id)
                    if answer:
                        answers.append(answer)
                
                question_stats.append({
                    "question_id": question["id"],
                    "question": question["question"],
                    "type": q_type,
                    "responses": answers
                })
        
        return SurveyStatsResponse(
            activity_id=activity_id,
            total_responses=total_responses,
            question_stats=question_stats
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"설문조사 통계 조회 실패: {str(e)}"
        )


# ============================================================================
# 이미지 관리 API
# ============================================================================

@router.post(
    "/admin/activities/{activity_id}/images",
    status_code=status.HTTP_201_CREATED,
    summary="활동 이미지 추가 (관리자)",
    description="활동에 이미지를 추가합니다 (관리자 권한 필요)",
    responses={
        201: {"description": "이미지 추가 완료"},
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "권한 없음"},
        404: {"model": ErrorResponse, "description": "활동 없음"}
    }
)
async def add_activity_image(
    activity_id: int,
    image: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    display_order: int = Form(0),
    current_user: dict = Depends(require_admin)
):
    """활동 이미지 추가 (관리자 전용)"""
    try:
        # 활동 존재 확인
        check_result = supabase.table("activities")\
            .select("id")\
            .eq("id", activity_id)\
            .eq("is_deleted", False)\
            .single()\
            .execute()
        
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="활동을 찾을 수 없습니다"
            )
        
        # 이미지 업로드
        image_url = await upload_file_to_r2(
            file=image,
            bucket_name="activity-images",
            folder=f"activity-{activity_id}",
            allowed_extensions={".jpg", ".jpeg", ".png"},
            max_size_mb=10
        )
        
        # 이미지 정보 저장
        image_data = {
            'activity_id': activity_id,
            'image_url': image_url,
            'display_order': display_order,
            'caption': caption
        }
        
        result = supabase.table('activity_images').insert(image_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="이미지 추가 실패"
            )
        
        return {
            "message": "이미지가 추가되었습니다",
            "image": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 추가 실패: {str(e)}"
        )


@router.delete(
    "/admin/activities/{activity_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="활동 이미지 삭제 (관리자)",
    description="활동의 특정 이미지를 삭제합니다 (관리자 권한 필요)",
    responses={
        204: {"description": "삭제 완료"},
        401: {"model": ErrorResponse, "description": "인증 필요"},
        403: {"model": ErrorResponse, "description": "권한 없음"},
        404: {"model": ErrorResponse, "description": "이미지 없음"}
    }
)
async def delete_activity_image(
    activity_id: int,
    image_id: int,
    current_user: dict = Depends(require_admin)
):
    """활동 이미지 삭제 (관리자 전용)"""
    try:
        # 이미지 조회
        image_result = supabase.table('activity_images')\
            .select('*')\
            .eq('id', image_id)\
            .eq('activity_id', activity_id)\
            .single()\
            .execute()
        
        if not image_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="이미지를 찾을 수 없습니다"
            )
        
        image_url = image_result.data['image_url']
        
        # R2에서 파일 삭제
        try:
            await delete_file_from_r2(image_url, bucket_name="activity-images")
        except Exception as e:
            print(f"R2 파일 삭제 실패: {str(e)}")
            # R2 삭제 실패해도 DB에서는 삭제
        
        # DB에서 삭제
        supabase.table('activity_images').delete().eq('id', image_id).execute()
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 삭제 실패: {str(e)}"
        )
