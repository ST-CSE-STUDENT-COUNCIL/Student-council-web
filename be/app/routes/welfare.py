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
from app.utils.r2_storage import upload_file_to_r2 as upload_file_to_supabase

router = APIRouter(prefix="/welfare", tags=["Welfare"])


# ============================================================================
# 사물함 (Locker)
# ============================================================================

@router.get("/locker_periods", response_model=LockerInfo, summary="사물함 배치도 및 신청 정보 조회 (공개)")
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


@router.put("/locker_periods", response_model=LockerInfo, summary="사물함 정보 수정 (관리자)")
async def update_locker_info(
    data: LockerInfoUpdate,
    current_user: dict = Depends(require_council)
):
    """
    사물함 배치도 이미지 URL, 구글폼 URL, 설명을 수정합니다.
    
    - **관리자 전용**: admin, council 권한 필요
    - **신청 마감 시**: application_form_url을 빈 문자열로 설정
    """
    supabase = get_supabase()
    
    # 수정할 데이터만 추출
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="수정할 데이터가 없습니다")
    
    # updated_at 자동 갱신
    update_data['updated_at'] = 'NOW()'
    
    # locker_info 업데이트 (id=1)
    result = supabase.table('locker_info').update(update_data).eq('id', 1).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="사물함 정보 수정 실패")
    
    return result.data[0]


# ============================================================================
# 물품대여 (Rental Items)
# ============================================================================

@router.get("/welfare_rentals", response_model=List[RentalItem], summary="대여 물품 목록 조회 (공개)")
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


@router.post("/welfare_rentals", response_model=RentalItem, summary="대여 물품 추가 (관리자)", status_code=201)
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


@router.put("/welfare_rentals/{item_id}", response_model=RentalItem, summary="대여 물품 수정 (관리자)")
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


@router.delete("/welfare_rentals/{item_id}", status_code=204, summary="대여 물품 삭제 (관리자)")
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
