"""
행사 관련 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile, Form, Body
from typing import Optional, List
from datetime import datetime
from app.schemas.events import (
    EventCreate,
    EventUpdate,
    EventListResponse,
    EventDetail,
    EventImageResponse,
    GuestRegistrationInfo,
    EventRegistrationRequest,
    EventRegistrationResponse,
    EventRegistrationListResponse,
    RegisterEventResult,
    EventSurveyCreate,
    EventSurveyResponse,
    EventSurveyStats,
    ErrorResponse
)
from app.utils.auth import get_current_user, require_admin, optional_current_user
from app.utils.r2_storage import upload_file_to_r2 as upload_file_to_supabase
from app.database import supabase


router = APIRouter(prefix="/events", tags=["행사"])


@router.get(
    "",
    response_model=EventListResponse,
    status_code=status.HTTP_200_OK,
    summary="행사 목록 조회",
    description="등록된 행사 목록을 조회합니다 (로그인 불필요)",
    responses={
        500: {"model": ErrorResponse, "description": "서버 오류"}
    }
)
async def get_events(include_inactive: bool = False):
    """행사 목록 조회 (비회원 접근 가능)"""
    try:
        query = supabase.table('events')\
            .select('*')\
            .eq('is_deleted', False)
        
        if not include_inactive:
            query = query.eq('is_active', True)
        
        result = query.order('event_date', desc=True).execute()
        
        events = result.data if result.data else []
        
        return EventListResponse(
            events=events,
            total=len(events)
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"행사 목록 조회 실패: {str(e)}"
        )


@router.get(
    "/{event_id}",
    response_model=EventDetail,
    status_code=status.HTTP_200_OK,
    summary="행사 상세 조회",
    description="특정 행사의 상세 정보를 조회합니다 (로그인 불필요)",
    responses={
        404: {"model": ErrorResponse, "description": "행사를 찾을 수 없음"},
        500: {"model": ErrorResponse, "description": "서버 오류"}
    }
)
async def get_event(event_id: int):
    """행사 상세 조회 (비회원 접근 가능)"""
    try:
        # 행사 정보 조회
        event_result = supabase.table('events')\
            .select('*')\
            .eq('id', event_id)\
            .eq('is_deleted', False)\
            .single()\
            .execute()
        
        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="행사를 찾을 수 없습니다"
            )
        
        event = event_result.data
        
        # 행사 이미지 조회
        images_result = supabase.table('event_images')\
            .select('*')\
            .eq('event_id', event_id)\
            .order('display_order')\
            .execute()
        
        event['images'] = images_result.data if images_result.data else []
        
        return EventDetail(**event)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"행사 조회 실패: {str(e)}"
        )


@router.post(
    "",
    response_model=EventDetail,
    status_code=status.HTTP_201_CREATED,
    summary="행사 생성",
    description="새로운 행사를 생성합니다 (관리자 전용, multipart/form-data, 이미지 선택적)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        413: {"model": ErrorResponse, "description": "파일 크기 초과"},
        500: {"model": ErrorResponse, "description": "생성 실패"}
    }
)
async def create_event(
    category: Optional[str] = Form(None),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    event_date: str = Form(...),
    registration_start: str = Form(...),
    registration_end: str = Form(...),
    max_capacity: int = Form(...),
    require_membership: bool = Form(False),
    images: Optional[List[UploadFile]] = File(None),
    current_user: dict = Depends(require_admin)
):
    """행사 생성 (관리자 전용, 이미지 선택적)"""
    try:
        # 행사 정보 저장
        event_data = {
            'category': category,
            'title': title,
            'description': description,
            'location': location,
            'event_date': event_date,
            'registration_start': registration_start,
            'registration_end': registration_end,
            'max_capacity': max_capacity,
            'require_membership': require_membership,
            'created_by': current_user['id'],
            'is_active': True
        }
        
        result = supabase.table('events').insert(event_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="행사 생성 실패"
            )
        
        event = result.data[0]
        event_id = event['id']
        
        # 이미지 업로드 (선택적)
        uploaded_images = []
        if images:
            for idx, image_file in enumerate(images):
                if image_file.filename:  # 파일이 실제로 있는 경우만
                    try:
                        # R2에 업로드
                        image_url = await upload_file_to_supabase(
                            file=image_file,
                            bucket_name="event-images",
                            folder=f"event-{event_id}",
                            allowed_extensions={".jpg", ".jpeg", ".png"},
                            max_size_mb=10
                        )
                        
                        # event_images 테이블에 저장
                        image_data = {
                            'event_id': event_id,
                            'image_url': image_url,
                            'display_order': idx
                        }
                        
                        image_result = supabase.table('event_images').insert(image_data).execute()
                        if image_result.data:
                            uploaded_images.append(image_result.data[0])
                    
                    except Exception as img_error:
                        print(f"이미지 업로드 실패: {str(img_error)}")
                        # 이미지 업로드 실패해도 행사는 생성됨
                        continue
        
        event['images'] = uploaded_images
        
        return EventDetail(**event)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"행사 생성 실패: {str(e)}"
        )


@router.patch(
    "/{event_id}",
    response_model=EventDetail,
    summary="행사 정보 수정",
    description="행사 정보를 수정합니다 (관리자 전용)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "행사를 찾을 수 없음"},
        500: {"model": ErrorResponse, "description": "수정 실패"}
    }
)
async def update_event(
    event_id: int,
    body: EventUpdate,
    current_user: dict = Depends(require_admin)
):
    """행사 정보 수정 (관리자 전용)"""
    try:
        # 행사 존재 확인
        check_result = supabase.table('events')\
            .select('id')\
            .eq('id', event_id)\
            .eq('is_deleted', False)\
            .single()\
            .execute()
        
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="행사를 찾을 수 없습니다"
            )
        
        # 수정할 데이터 구성
        update_data = body.model_dump(exclude_unset=True)
        update_data['updated_at'] = datetime.utcnow().isoformat()
        
        result = supabase.table('events')\
            .update(update_data)\
            .eq('id', event_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="행사 수정 실패"
            )
        
        event = result.data[0]
        
        # 이미지 조회
        images_result = supabase.table('event_images')\
            .select('*')\
            .eq('event_id', event_id)\
            .order('display_order')\
            .execute()
        
        event['images'] = images_result.data if images_result.data else []
        
        return EventDetail(**event)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"행사 수정 실패: {str(e)}"
        )


@router.delete(
    "/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="행사 삭제",
    description="행사를 삭제합니다 (Soft Delete, 관리자 전용)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "행사를 찾을 수 없음"},
        500: {"model": ErrorResponse, "description": "삭제 실패"}
    }
)
async def delete_event(
    event_id: int,
    current_user: dict = Depends(require_admin)
):
    """행사 삭제 (Soft Delete, 관리자 전용)"""
    try:
        # 행사 존재 확인
        check_result = supabase.table('events')\
            .select('id')\
            .eq('id', event_id)\
            .eq('is_deleted', False)\
            .single()\
            .execute()
        
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="행사를 찾을 수 없습니다"
            )
        
        # Soft Delete
        supabase.table('events')\
            .update({
                'is_deleted': True,
                'deleted_at': datetime.utcnow().isoformat(),
                'deleted_by': current_user['id']
            })\
            .eq('id', event_id)\
            .execute()
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"행사 삭제 실패: {str(e)}"
        )


@router.post(
    "/{event_id}/images",
    response_model=EventImageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="행사 이미지 추가",
    description="행사 상세 설명 이미지를 추가합니다 (관리자 전용)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "행사를 찾을 수 없음"},
        413: {"model": ErrorResponse, "description": "파일 크기 초과"},
        500: {"model": ErrorResponse, "description": "업로드 실패"}
    }
)
async def add_event_image(
    event_id: int,
    image: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    display_order: int = Form(0),
    current_user: dict = Depends(require_admin)
):
    """행사 이미지 추가 (관리자 전용)"""
    try:
        # 행사 존재 확인
        check_result = supabase.table('events')\
            .select('id')\
            .eq('id', event_id)\
            .eq('is_deleted', False)\
            .single()\
            .execute()
        
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="행사를 찾을 수 없습니다"
            )
        
        # 이미지 업로드
        image_url = await upload_file_to_supabase(
            file=image,
            bucket_name="event-images",
            folder=f"events/{event_id}",
            allowed_extensions={".jpg", ".jpeg", ".png"},
            max_size_mb=10
        )
        
        # 이미지 정보 저장
        image_data = {
            'event_id': event_id,
            'image_url': image_url,
            'display_order': display_order,
            'caption': caption
        }
        
        result = supabase.table('event_images').insert(image_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="이미지 추가 실패"
            )
        
        return EventImageResponse(**result.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 추가 실패: {str(e)}"
        )


@router.delete(
    "/{event_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="행사 이미지 삭제",
    description="행사 이미지를 삭제합니다 (관리자 전용)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        404: {"model": ErrorResponse, "description": "이미지를 찾을 수 없음"},
        500: {"model": ErrorResponse, "description": "삭제 실패"}
    }
)
async def delete_event_image(
    event_id: int,
    image_id: int,
    current_user: dict = Depends(require_admin)
):
    """행사 이미지 삭제 (관리자 전용)"""
    try:
        # 이미지 존재 확인
        check_result = supabase.table('event_images')\
            .select('id')\
            .eq('id', image_id)\
            .eq('event_id', event_id)\
            .single()\
            .execute()
        
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="이미지를 찾을 수 없습니다"
            )
        
        # 삭제
        supabase.table('event_images')\
            .delete()\
            .eq('id', image_id)\
            .execute()
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 삭제 실패: {str(e)}"
        )


@router.post(
    "/{event_id}/register",
    response_model=RegisterEventResult,
    status_code=status.HTTP_201_CREATED,
    summary="행사 참가 신청",
    description="행사에 참가 신청합니다 (회원: 자동 정보, 비회원: 정보 입력 필요)",
    responses={
        400: {"model": ErrorResponse, "description": "신청 실패 (정원 마감, 중복 신청 등)"},
        500: {"model": ErrorResponse, "description": "서버 오류"}
    }
)
async def register_for_event(
    event_id: int,
    body: EventRegistrationRequest,
    current_user: Optional[dict] = Depends(optional_current_user)
):
    """
    행사 참가 신청 (회원/비회원 모두 가능)
    
    - 회원 (로그인): 기존 정보 자동 사용, body에 {"guest_info": null}
    - 비회원: body에 {"guest_info": {...}} 필수
    """
    try:
        # 회원 여부 확인
        user_id = None
        if current_user:
            user_id = current_user['id']
        
        # 비회원인 경우 정보 필수
        if user_id is None and body.guest_info is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="비회원은 학번, 이름, 전화번호를 입력해야 합니다"
            )
        if user_id is None and body.guest_info is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="비회원은 학번, 이름, 전화번호를 입력해야 합니다"
            )
        
        # register_for_event_guest 함수 호출
        params = {
            'p_event_id': event_id,
            'p_user_id': user_id
        }
        
        if body.guest_info:
            params.update({
                'p_guest_student_id': body.guest_info.student_id,
                'p_guest_name': body.guest_info.name,
                'p_guest_phone': body.guest_info.phone
            })
        
        # RPC 호출 - Postgrest가 JSON을 APIError로 래핑하는 경우 처리
        try:
            result = supabase.rpc('register_for_event_guest', params).execute()
            response_data = result.data
        except Exception as rpc_error:
            # APIError 메시지에서 실제 데이터 추출
            error_str = str(rpc_error)
            if "'success':" in error_str and "'message':" in error_str:
                import ast
                # "APIError: {...}" 형식에서 딕셔너리 추출
                dict_str = error_str.split("APIError:", 1)[-1].strip() if "APIError:" in error_str else error_str
                try:
                    response_data = ast.literal_eval(dict_str)
                except:
                    raise rpc_error
            else:
                raise rpc_error
        
        # 응답 데이터 타입 확인 및 변환
        if isinstance(response_data, str):
            import json
            response_data = json.loads(response_data)
        elif isinstance(response_data, list) and len(response_data) > 0:
            response_data = response_data[0]
        
        if not isinstance(response_data, dict):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"잘못된 응답 형식: {type(response_data)}"
            )
        
        # 성공 여부 확인
        if not response_data.get('success'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=response_data.get('message', '신청 실패')
            )
        
        return RegisterEventResult(**response_data)
    
    except HTTPException:
        raise
    except Exception as e:
        # 디버깅을 위한 상세 에러 정보
        import traceback
        print(f"신청 처리 오류: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"신청 처리 실패: {str(e)}"
        )


@router.delete(
    "/{event_id}/register",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="행사 신청 취소",
    description="행사 참가 신청을 취소합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        404: {"model": ErrorResponse, "description": "신청 내역을 찾을 수 없음"},
        500: {"model": ErrorResponse, "description": "취소 실패"}
    }
)
async def cancel_registration(
    event_id: int,
    current_user: dict = Depends(get_current_user)
):
    """행사 신청 취소"""
    try:
        # 신청 내역 확인
        check_result = supabase.table('registrations')\
            .select('id')\
            .eq('event_id', event_id)\
            .eq('user_id', current_user['id'])\
            .eq('status', 'confirmed')\
            .single()\
            .execute()
        
        if not check_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="신청 내역을 찾을 수 없습니다"
            )
        
        # 상태를 cancelled로 변경
        supabase.table('registrations')\
            .update({'status': 'cancelled'})\
            .eq('event_id', event_id)\
            .eq('user_id', current_user['id'])\
            .execute()
        
        # 행사 current_count 감소
        supabase.rpc(
            'decrement',
            {
                'table_name': 'events',
                'row_id': event_id,
                'column_name': 'current_count'
            }
        ).execute()
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"취소 처리 실패: {str(e)}"
        )


@router.get(
    "/{event_id}/my-registration",
    response_model=EventRegistrationResponse,
    summary="내 신청 확인",
    description="해당 행사에 대한 내 신청 정보를 조회합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        404: {"model": ErrorResponse, "description": "신청 내역을 찾을 수 없음"},
        500: {"model": ErrorResponse, "description": "조회 실패"}
    }
)
async def get_my_registration(
    event_id: int,
    current_user: dict = Depends(get_current_user)
):
    """내 신청 확인"""
    try:
        result = supabase.table('registrations')\
            .select('*')\
            .eq('event_id', event_id)\
            .eq('user_id', current_user['id'])\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="신청 내역을 찾을 수 없습니다"
            )
        
        return EventRegistrationResponse(**result.data)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"조회 실패: {str(e)}"
        )


@router.get(
    "/{event_id}/registrations",
    response_model=EventRegistrationListResponse,
    summary="행사 참가자 목록",
    description="행사 참가자 목록을 조회합니다 (관리자 전용)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        500: {"model": ErrorResponse, "description": "조회 실패"}
    }
)
async def get_event_registrations(
    event_id: int,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    """행사 참가자 목록 (관리자 전용)"""
    try:
        query = supabase.table('registrations')\
            .select('*, users(student_id, name, email, phone)')\
            .eq('event_id', event_id)
        
        if status_filter:
            query = query.eq('status', status_filter)
        
        result = query.order('registration_number').execute()
        
        registrations = []
        for reg in result.data:
            user = reg.pop('users', None)
            
            # 회원/비회원 구분
            if reg.get('user_id') and user:
                # 회원
                registrations.append({
                    **reg,
                    'student_id': user['student_id'],
                    'name': user['name'],
                    'email': user['email'],
                    'phone': user.get('phone'),
                    'is_guest': False
                })
            else:
                # 비회원
                registrations.append({
                    **reg,
                    'student_id': reg.get('guest_student_id'),
                    'name': reg.get('guest_name'),
                    'email': None,
                    'phone': reg.get('guest_phone'),
                    'is_guest': True
                })
        
        return EventRegistrationListResponse(
            registrations=registrations,
            total=len(registrations)
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"참가자 목록 조회 실패: {str(e)}"
        )


@router.post(
    "/{event_id}/survey",
    response_model=EventSurveyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="만족도 조사 제출",
    description="행사 만족도 조사를 제출합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        400: {"model": ErrorResponse, "description": "이미 제출했거나 참가하지 않은 행사"},
        500: {"model": ErrorResponse, "description": "제출 실패"}
    }
)
async def submit_event_survey(
    event_id: int,
    body: EventSurveyCreate,
    current_user: dict = Depends(get_current_user)
):
    """만족도 조사 제출"""
    try:
        # 참가 여부 확인
        registration_check = supabase.table('registrations')\
            .select('id')\
            .eq('event_id', event_id)\
            .eq('user_id', current_user['id'])\
            .eq('status', 'confirmed')\
            .single()\
            .execute()
        
        if not registration_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="행사에 참가하지 않았습니다"
            )
        
        # 만족도 제출
        survey_data = {
            'event_id': event_id,
            'user_id': current_user['id'],
            'rating': body.rating,
            'feedback': body.feedback
        }
        
        result = supabase.table('event_surveys').insert(survey_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="만족도 제출 실패"
            )
        
        return EventSurveyResponse(**result.data[0])
    
    except HTTPException:
        raise
    except Exception as e:
        if "duplicate key" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 만족도 조사를 제출했습니다"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"만족도 제출 실패: {str(e)}"
        )


@router.get(
    "/{event_id}/survey/results",
    response_model=EventSurveyStats,
    summary="만족도 조사 결과",
    description="행사 만족도 조사 통계를 조회합니다 (관리자 전용)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않음"},
        403: {"model": ErrorResponse, "description": "관리자 권한 필요"},
        500: {"model": ErrorResponse, "description": "조회 실패"}
    }
)
async def get_survey_results(
    event_id: int,
    current_user: dict = Depends(require_admin)
):
    """만족도 조사 결과 (관리자 전용)"""
    try:
        result = supabase.table('event_surveys')\
            .select('rating')\
            .eq('event_id', event_id)\
            .execute()
        
        surveys = result.data if result.data else []
        
        if not surveys:
            return EventSurveyStats(
                total_responses=0,
                average_rating=0.0,
                rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            )
        
        # 통계 계산
        total = len(surveys)
        ratings = [s['rating'] for s in surveys]
        average = sum(ratings) / total
        
        distribution = {i: ratings.count(i) for i in range(1, 6)}
        
        return EventSurveyStats(
            total_responses=total,
            average_rating=round(average, 2),
            rating_distribution=distribution
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"통계 조회 실패: {str(e)}"
        )
