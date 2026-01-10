"""
복지사업 관련 API 라우트
- 사물함: 배치도 + 구글폼 URL
- 물품대여: 물품 목록 + 구글 스프레드시트 재고 조회
"""
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from typing import List, Optional
from app.schemas.welfare import (
    LockerInfo,
    LockerInfoUpdate,
    RentalItem,
    RentalItemUpdate
)
from app.database import get_supabase
from app.utils.auth import get_current_user, require_council
from app.utils.sheets import get_sheet_value
from app.utils.r2_storage import upload_file_to_r2 as upload_file_to_supabase, delete_file_from_r2

router = APIRouter(tags=["복지사업"])


# ============================================================================
# 사물함 (Locker)
# ============================================================================

@router.get("/welfare/locker_periods", response_model=LockerInfo, summary="사물함 배치도 및 신청 정보 조회 (공개)")
async def get_locker_info():
    """
    사물함 배치도 이미지 URL과 구글폼 신청 URL을 조회합니다.
    
    - **공개 API**: 인증 불필요
    - **신청 마감**: application_form_url이 빈 문자열일 경우
    - **피그마 배치도**: layout_image_url에서 확인
    """
    supabase = get_supabase()
    
    # locker_info 테이블에서 데이터 조회 (id=1, 단일 레코드)
    result = supabase.table('locker_info').select('*').eq('id', 1).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="사물함 정보가 없습니다")
    
    return result.data


@router.post("/admin/welfare/locker_image", summary="사물함 배치도 이미지 업로드 (관리자)")
async def upload_locker_image(
    layout_image: UploadFile = File(..., description="사물함 배치도 이미지"),
    current_user: dict = Depends(require_council)
):
    """
    사물함 배치도 이미지를 R2 스토리지에 업로드합니다.
    기존 이미지가 있으면 삭제하고 새 이미지로 교체합니다.
    
    - **관리자 전용**: admin, council 권한 필요
    - **multipart/form-data**: 이미지 업로드 시 사용
    - **자동 교체**: 기존 이미지 삭제 후 새 이미지 업로드 및 DB 업데이트
    """
    if not layout_image or not layout_image.filename:
        raise HTTPException(status_code=400, detail="이미지 파일이 필요합니다")
    
    supabase = get_supabase()
    
    try:
        # 기존 레코드 확인
        existing = supabase.table('locker_info').select('*').eq('id', 1).execute()
        
        # 기존 이미지가 있으면 R2에서 삭제
        if existing.data and existing.data[0].get('layout_image_url'):
            old_image_url = existing.data[0]['layout_image_url']
            if old_image_url:
                await delete_file_from_r2(old_image_url, "welfare-images")
        
        # 새 이미지 업로드
        image_url = await upload_file_to_supabase(
            file=layout_image,
            bucket_name="welfare-images",
            folder="lockers"
        )
        
        # DB 업데이트 또는 생성
        if existing.data:
            # 기존 레코드 업데이트 (updated_at은 DEFAULT 트리거로 자동 설정됨)
            result = supabase.table('locker_info').update({
                'layout_image_url': image_url
            }).eq('id', 1).execute()
        else:
            # 새 레코드 생성 (URL 필드는 NULL로 초기화)
            result = supabase.table('locker_info').insert({
                'id': 1,
                'layout_image_url': image_url
            }).execute()
        
        return {"image_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 업로드 실패: {str(e)}")


@router.put("/admin/welfare/locker_periods", response_model=LockerInfo, summary="사물함 정보 수정/생성 (관리자)")
async def update_locker_info(
    application_form_url: Optional[str] = Form(None, description="구글폼 신청 URL"),
    return_extension_form_url: Optional[str] = Form(None, description="구글폼 반납/연장 URL"),
    application_start: Optional[str] = Form(None, description="신청 시작 날짜 (ISO 8601 형식: 2024-03-01T00:00:00+09:00)"),
    application_end: Optional[str] = Form(None, description="신청 종료 날짜 (ISO 8601 형식: 2024-03-15T23:59:59+09:00)"),
    return_extension_start: Optional[str] = Form(None, description="반납/연장 시작 날짜 (ISO 8601 형식: 2024-06-01T00:00:00+09:00)"),
    return_extension_end: Optional[str] = Form(None, description="반납/연장 종료 날짜 (ISO 8601 형식: 2024-06-15T23:59:59+09:00)"),
    description: Optional[str] = Form(None, description="설명 (예: 19, 35번 고장, 2024-1학기)"),
    current_user: dict = Depends(require_council)
):
    """
    사물함 구글폼 URL(신청/반납), 신청 기간, 반납/연장 기간, 설명을 수정하거나 생성합니다.
    레코드가 없으면 자동으로 생성합니다 (UPSERT).
    
    - **관리자 전용**: admin, council 권한 필요
    - **신청 기간**: application_start, application_end로 신청 시작/종료 날짜 설정
    - **반납/연장 기간**: return_extension_start, return_extension_end로 반납/연장 시작/종료 날짜 설정
    - **구글폼 URL 2개**: 
      - application_form_url: 신청용 구글폼
      - return_extension_form_url: 반납/연장용 구글폼
    - **주기적 업데이트**: 1학기, 방학 등 날짜와 URL 변경 가능
    - **한국 시간**: 모든 날짜는 KST(Asia/Seoul) 기준
    - **이미지 업로드**: 별도 POST /admin/welfare/locker_image API 사용
    """
    supabase = get_supabase()
    
    # 먼저 레코드 존재 확인
    existing = supabase.table('locker_info').select('*').eq('id', 1).execute()
    record_exists = bool(existing.data)
    
    update_data = {}
    
    # 필드 업데이트
    if application_form_url is not None:
        update_data['application_form_url'] = application_form_url
    if return_extension_form_url is not None:
        update_data['return_extension_form_url'] = return_extension_form_url
    if application_start is not None:
        update_data['application_start'] = application_start
    if application_end is not None:
        update_data['application_end'] = application_end
    if return_extension_start is not None:
        update_data['return_extension_start'] = return_extension_start
    if return_extension_end is not None:
        update_data['return_extension_end'] = return_extension_end
    if description is not None:
        update_data['description'] = description
    
    # 레코드가 이미 존재하면서 수정할 데이터가 없으면 에러
    if record_exists and not update_data:
        raise HTTPException(status_code=400, detail="수정할 데이터가 없습니다")
    
    # 레코드가 없으면 생성, 있으면 수정 (UPSERT)
    if not record_exists:
        # 초기 생성 시 필수 필드 기본값 설정
        insert_data = {
            'id': 1,
            'layout_image_url': '',  # 이미지는 별도 API로 업로드
            'application_form_url': update_data.get('application_form_url'),
            'return_extension_form_url': update_data.get('return_extension_form_url'),
            'application_start': update_data.get('application_start'),
            'application_end': update_data.get('application_end'),
            'return_extension_start': update_data.get('return_extension_start'),
            'return_extension_end': update_data.get('return_extension_end'),
            'description': update_data.get('description')
        }
        result = supabase.table('locker_info').insert(insert_data).execute()
    else:
        # updated_at은 DEFAULT 트리거로 자동 갱신됨 (한국 시간)
        
        # locker_info 업데이트 (id=1)
        result = supabase.table('locker_info').update(update_data).eq('id', 1).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="사물함 정보 저장 실패")
    
    return result.data[0]


# ============================================================================
# 물품대여 (Rental Items)
# ============================================================================

@router.get("/welfare/welfare_rentals", response_model=List[RentalItem], summary="대여 물품 목록 조회 (공개)")
async def get_rental_items():
    """
    대여 가능한 물품 목록을 조회합니다.
    
    - **공개 API**: 인증 불필요
    - **현재 재고**: available_quantity는 구글 스프레드시트에서 실시간 조회
    """
    supabase = get_supabase()
    
    # rental_items 테이블에서 활성화된 물품만 조회
    result = supabase.table('rental_items').select('*').eq('is_active', True).order('category, item_name').execute()
    
    # 각 물품의 재고를 구글 스프레드시트에서 조회
    items = []
    for item in result.data:
        available_quantity = None
        
        # 스프레드시트 ID가 있으면 재고 조회 시도
        if item.get('spreadsheet_id'):
            sheet_name = item.get('quantity_sheet_name', 'Sheet1')
            cell_range = item.get('quantity_cell_range', 'B2')
            range_notation = f"{sheet_name}!{cell_range}"
            
            available_quantity = get_sheet_value(item['spreadsheet_id'], range_notation)
        
        items.append({
            **item,
            'available_quantity': available_quantity
        })
    
    return items


@router.post("/admin/welfare/welfare_rentals", response_model=RentalItem, summary="대여 물품 추가 (관리자)", status_code=201)
async def create_rental_item(
    item_name: str = Form(..., description="물품명 (예: 장우산, 단우산)"),
    application_sheet_url: str = Form(..., description="구글 시트 URL"),
    quantity_cell_range: str = Form(..., description="재고 셀 위치 (예: C2)"),
    category: Optional[str] = Form(None, description="분류"),
    image: Optional[UploadFile] = File(None, description="물품 이미지"),
    current_user: dict = Depends(require_council)
):
    """
    새로운 대여 물품을 추가합니다.
    
    - **관리자 전용**: admin, council 권한 필요
    - **multipart/form-data**: 이미지 파일 포함 가능
    - **item_name**: 장우산/단우산, 2인용/4인용 돗자리 등 구체적으로 입력
    """
    supabase = get_supabase()
    
    # 이미지 업로드 (있는 경우)
    image_url = None
    if image and image.filename:
        try:
            image_url = await upload_file_to_supabase(
                file=image,
                bucket_name="welfare-images",
                folder="items"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"이미지 업로드 실패: {str(e)}")
    
    # rental_items 테이블에 삽입
    insert_data = {
        "item_name": item_name,
        "category": category,
        "image_url": image_url,
        "application_sheet_url": application_sheet_url,
        "quantity_cell_range": quantity_cell_range
    }
    
    result = supabase.table('rental_items').insert(insert_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="물품 추가 실패")
    
    return {
        **result.data[0],
        'available_quantity': None
    }


@router.put("/admin/welfare/welfare_rentals/{item_id}", response_model=RentalItem, summary="대여 물품 수정 (관리자)")
async def update_rental_item(
    item_id: int,
    data: RentalItemUpdate,
    current_user: dict = Depends(require_council)
):
    """
    대여 물품 정보를 수정합니다.
    
    - **관리자 전용**: admin, council 권한 필요
    """
    supabase = get_supabase()
    
    # 수정할 데이터만 추출
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="수정할 데이터가 없습니다")
    
    # updated_at 자동 갱신
    update_data['updated_at'] = 'NOW()'
    
    # rental_items 업데이트
    result = supabase.table('rental_items').update(update_data).eq('id', item_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="물품을 찾을 수 없습니다")
    
    return {
        **result.data[0],
        'available_quantity': None
    }


@router.delete("/admin/welfare/welfare_rentals/{item_id}", status_code=204, summary="대여 물품 삭제 (관리자)")
async def delete_rental_item(
    item_id: int,
    current_user: dict = Depends(require_council)
):
    """
    대여 물품을 삭제합니다.
    
    - **관리자 전용**: admin, council 권한 필요
    """
    supabase = get_supabase()
    
    # rental_items 삭제
    result = supabase.table('rental_items').delete().eq('id', item_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="물품을 찾을 수 없습니다")
    
    return None
