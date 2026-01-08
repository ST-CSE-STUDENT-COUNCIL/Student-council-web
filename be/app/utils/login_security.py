"""
로그인 시도 추적 및 차단 관리 유틸리티
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.database import supabase


async def record_login_attempt(student_id: str, success: bool, ip_address: Optional[str] = None):
    """
    로그인 시도 기록
    
    Args:
        student_id: 학번
        success: 로그인 성공 여부
        ip_address: IP 주소
    """
    try:
        supabase.table('login_attempts').insert({
            'student_id': student_id,
            'success': success,
            'ip_address': ip_address,
            'attempt_time': datetime.now().isoformat()
        }).execute()
    except Exception as e:
        print(f"로그인 시도 기록 실패: {str(e)}")


async def check_login_block(student_id: str) -> Dict[str, Any]:
    """
    학번의 로그인 차단 상태 확인
    
    Args:
        student_id: 학번
        
    Returns:
        {
            'is_blocked': bool,
            'reason': str,
            'block_until': datetime or None,
            'failed_attempts': int,
            'is_permanent': bool  # 15번 실패로 영구 차단
        }
    """
    try:
        # 차단 정보 조회
        block_result = supabase.table('login_blocks')\
            .select('*')\
            .eq('student_id', student_id)\
            .execute()
        
        if not block_result.data:
            return {
                'is_blocked': False,
                'reason': None,
                'block_until': None,
                'failed_attempts': 0,
                'is_permanent': False
            }
        
        block_data = block_result.data[0]
        failed_attempts = block_data.get('failed_attempts', 0)
        block_until_str = block_data.get('block_until')
        block_reason = block_data.get('block_reason')
        
        # 15번 실패 시 영구 차단 (삭제하지 않음 - 관리자가 판단)
        if failed_attempts >= 15 or block_reason == 'permanent':
            return {
                'is_blocked': True,
                'reason': 'permanent',
                'block_until': None,
                'failed_attempts': failed_attempts,
                'is_permanent': True
            }
        
        # 차단 시간이 없으면 차단되지 않음
        if not block_until_str:
            return {
                'is_blocked': False,
                'reason': None,
                'block_until': None,
                'failed_attempts': failed_attempts,
                'is_permanent': False
            }
        
        # 차단 시간 확인
        block_until = datetime.fromisoformat(block_until_str.replace('Z', '+00:00'))
        now = datetime.now(block_until.tzinfo)
        
        if now < block_until:
            # 여전히 차단 중
            return {
                'is_blocked': True,
                'reason': block_reason,
                'block_until': block_until,
                'failed_attempts': failed_attempts,
                'is_permanent': False
            }
        else:
            # 차단 시간 만료 - 차단 해제하지만 실패 횟수는 유지
            return {
                'is_blocked': False,
                'reason': None,
                'block_until': None,
                'failed_attempts': failed_attempts,
                'is_permanent': False
            }
    
    except Exception as e:
        print(f"로그인 차단 확인 실패: {str(e)}")
        return {
            'is_blocked': False,
            'reason': None,
            'block_until': None,
            'failed_attempts': 0,
            'is_permanent': False
        }


async def increment_failed_attempts(student_id: str) -> Dict[str, Any]:
    """
    로그인 실패 횟수 증가 및 차단 처리
    
    Args:
        student_id: 학번
        
    Returns:
        {
            'failed_attempts': int,
            'is_blocked': bool,
            'block_reason': str,
            'block_until': datetime or None,
            'is_permanent': bool
        }
    """
    try:
        # 현재 차단 정보 조회
        block_result = supabase.table('login_blocks')\
            .select('*')\
            .eq('student_id', student_id)\
            .execute()
        
        now = datetime.now()
        
        if not block_result.data:
            # 첫 실패 - 새로운 레코드 생성
            supabase.table('login_blocks').insert({
                'student_id': student_id,
                'failed_attempts': 1,
                'block_until': None,
                'block_reason': None
            }).execute()
            
            return {
                'failed_attempts': 1,
                'is_blocked': False,
                'block_reason': None,
                'block_until': None,
                'is_permanent': False
            }
        
        block_data = block_result.data[0]
        current_attempts = block_data.get('failed_attempts', 0)
        new_attempts = current_attempts + 1
        
        # 차단 로직
        block_until = None
        block_reason = None
        is_blocked = False
        is_permanent = False
        
        if new_attempts == 5:
            # 5번 실패 -> 10분 차단
            block_until = now + timedelta(minutes=10)
            block_reason = '10_minutes'
            is_blocked = True
        elif new_attempts == 10:
            # 10번 실패 -> 1시간 차단
            block_until = now + timedelta(hours=1)
            block_reason = '1_hour'
            is_blocked = True
        elif new_attempts >= 15:
            # 15번 실패 -> 영구 차단 (삭제 안 함, 관리자가 IP 로그 확인 후 판단)
            block_reason = 'permanent'
            is_blocked = True
            is_permanent = True
        
        # 차단 정보 업데이트
        supabase.table('login_blocks')\
            .update({
                'failed_attempts': new_attempts,
                'block_until': block_until.isoformat() if block_until else None,
                'block_reason': block_reason
            })\
            .eq('student_id', student_id)\
            .execute()
        
        return {
            'failed_attempts': new_attempts,
            'is_blocked': is_blocked,
            'block_reason': block_reason,
            'block_until': block_until,
            'is_permanent': is_permanent
        }
    
    except Exception as e:
        print(f"실패 횟수 증가 실패: {str(e)}")
        return {
            'failed_attempts': 0,
            'is_blocked': False,
            'block_reason': None,
            'block_until': None,
            'is_permanent': False
        }


async def reset_failed_attempts(student_id: str):
    """
    로그인 성공 시 실패 횟수 초기화
    
    Args:
        student_id: 학번
    """
    try:
        # 차단 정보 삭제 (성공 시 모두 리셋)
        supabase.table('login_blocks')\
            .delete()\
            .eq('student_id', student_id)\
            .execute()
    except Exception as e:
        print(f"실패 횟수 초기화 실패: {str(e)}")


async def unblock_user(student_id: str):
    """
    관리자용: 사용자 차단 해제 (IP 로그 확인 후 실제 본인 확인 시)
    
    Args:
        student_id: 학번
    """
    try:
        # 차단 정보 삭제
        supabase.table('login_blocks')\
            .delete()\
            .eq('student_id', student_id)\
            .execute()
    except Exception as e:
        print(f"차단 해제 실패: {str(e)}")
