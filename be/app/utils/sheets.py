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


def _parse_cell_value(cell_value) -> Optional[int]:
    try:
        return int(cell_value)
    except (ValueError, TypeError):
        try:
            return int(float(cell_value))
        except (ValueError, TypeError):
            return None


def get_sheet_values_batch(spreadsheet_id: str, ranges: list) -> list:
    """
    여러 셀을 한 번의 batchGet API 호출로 조회합니다.

    Returns:
        ranges와 같은 순서의 Optional[int] 리스트
    """
    if not ranges:
        return []
    try:
        service = _get_sheets_service()
        result = service.spreadsheets().values().batchGet(
            spreadsheetId=spreadsheet_id,
            ranges=ranges
        ).execute()
        output = []
        for vr in result.get('valueRanges', []):
            values = vr.get('values', [])
            if values and values[0]:
                output.append(_parse_cell_value(values[0][0]))
            else:
                output.append(None)
        # API가 빈 range를 생략할 수 있으므로 부족분을 None으로 채움
        while len(output) < len(ranges):
            output.append(None)
        return output
    except HttpError as error:
        logger.error(f"Google Sheets batchGet API error: {error}")
        return [None] * len(ranges)


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
        
        return _parse_cell_value(values[0][0])
    
    except HttpError as error:
        logger.error(f"Google Sheets API error: {error}")
        return None
    except Exception as error:
        logger.error(f"Unexpected error: {error}")
        return None
