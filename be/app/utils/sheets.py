"""
Google Sheets API 연동 유틸리티
API 키를 사용하여 공개 스프레드시트에서 데이터를 읽어옵니다.
"""
import threading
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from app.config import settings
from typing import Optional
from app.utils.logger import get_logger

logger = get_logger(__name__)

# ── 싱글턴 서비스 객체 ────────────────────────────────────────────────────────
# build()는 최초 1회만 Discovery API(~1MB JSON) HTTP 요청을 수행합니다.
# 매 요청마다 build()를 호출하면 첫 요청·콜드 스타트 시 10초 이상 지연됩니다.
_sheets_service = None
_sheets_service_lock = threading.Lock()


def _get_sheets_service():
    """Google Sheets API 서비스 객체를 싱글턴으로 반환합니다."""
    global _sheets_service
    if _sheets_service is not None:
        return _sheets_service
    with _sheets_service_lock:
        if _sheets_service is None:  # double-checked locking
            logger.info("[sheets] Google Sheets 서비스 초기화 (Discovery API 호출)...")
            _sheets_service = build(
                'sheets', 'v4',
                developerKey=settings.GOOGLE_SHEETS_API_KEY,
                cache_discovery=False,  # Docker 컨테이너 내 파일 쓰기 시도 방지
            )
            logger.info("[sheets] Google Sheets 서비스 초기화 완료")
    return _sheets_service


def get_sheet_value(spreadsheet_id: str, range_name: str) -> Optional[int]:
    """
    구글 스프레드시트에서 특정 셀의 값을 읽어옵니다.
    
    Args:
        spreadsheet_id: 스프레드시트 ID
        range_name: 셀 범위 (예: 'Sheet1!B2', 'Sheet1!B2:B2')
    
    Returns:
        int: 셀의 숫자 값 (숫자로 변환 가능한 경우)
        None: 값이 없거나 에러 발생 시
    
    Example:
        >>> get_sheet_value('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', 'Sheet1!B2')
        5
    """
    try:
        # 싱글턴 서비스 사용 (매 요청마다 build() 재호출 방지)
        service = _get_sheets_service()

        # 스프레드시트에서 데이터 조회
        result = service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=range_name
        ).execute()
        
        # 값 추출
        values = result.get('values', [])
        
        if not values or not values[0]:
            return None
        
        # 첫 번째 셀의 값을 숫자로 변환
        cell_value = values[0][0]
        
        # 숫자로 변환 시도
        try:
            return int(cell_value)
        except (ValueError, TypeError):
            # 소수점이 있는 경우
            try:
                return int(float(cell_value))
            except (ValueError, TypeError):
                return None
    
    except HttpError as error:
        logger.error(f"Google Sheets API error: {error}")
        return None
    except Exception as error:
        logger.error(f"Unexpected error: {error}")
        return None
