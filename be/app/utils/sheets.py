"""
Google Sheets API 연동 유틸리티
API 키를 사용하여 공개 스프레드시트에서 데이터를 읽어옵니다.
"""
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from app.config import settings
from typing import Optional


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
        # Google Sheets API 서비스 빌드 (API 키 사용)
        service = build('sheets', 'v4', developerKey=settings.GOOGLE_SHEETS_API_KEY)
        
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
        print(f"Google Sheets API error: {error}")
        return None
    except Exception as error:
        print(f"Unexpected error: {error}")
        return None
