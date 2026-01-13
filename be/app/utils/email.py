"""
이메일 발송 유틸리티
"""
import base64
import logging
import random
from email.message import EmailMessage
from datetime import datetime, timedelta, timezone

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.config import settings
from app.database import supabase


logger = logging.getLogger(__name__)

GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send"


def _generate_verification_code() -> str:
    """
    6자리 인증번호 생성
    """
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])


def _build_email_message(email: str, code: str) -> EmailMessage:
    """
    이메일 메시지 생성
    
    텍스트와 HTML 본문을 동시에 구성합니다.
    """
    message = EmailMessage()
    message["From"] = f"{settings.GMAIL_FROM_NAME} <{settings.GMAIL_FROM_EMAIL}>"
    message["To"] = email
    message["Subject"] = "[서울과기대 컴공학생회] 이메일 인증번호"
    
    # HTML 본문
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0066cc;">이메일 인증</h2>
            <p>안녕하세요,</p>
            <p>아래의 인증번호를 입력하여 회원가입을 완료해주세요.</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                <h1 style="color: #0066cc; letter-spacing: 5px; margin: 0;">{code}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">
                ※ 이 인증번호는 <strong>5분간 유효</strong>합니다.<br>
                ※ 본인이 요청하지 않았다면 이 메일을 무시하세요.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
                서울과학기술대학교 컴퓨터공학과 학생회<br>
                이 메일은 자동 발송되었습니다.
            </p>
        </div>
    </body>
    </html>
    """
    
    message.set_content("인증번호: " + code)
    message.add_alternative(html_content, subtype="html")
    
    return message


def _get_gmail_credentials() -> Credentials:
    """
    Gmail API 인증 정보 생성
    
    Refresh Token 기반으로 Access Token을 갱신합니다.
    """
    credentials = Credentials(
        token=None,
        refresh_token=settings.GOOGLE_REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=[GMAIL_SEND_SCOPE]
    )
    
    # Access Token 갱신 (만료/미발급 시)
    credentials.refresh(Request())
    return credentials


def _send_gmail_message(message: EmailMessage, credentials: Credentials) -> None:
    """
    Gmail API로 이메일 발송
    
    raw 메시지를 base64url로 인코딩하여 전송합니다.
    """
    # Gmail API는 base64url 인코딩된 raw 메시지를 요구합니다.
    raw_bytes = message.as_bytes()
    raw_b64 = base64.urlsafe_b64encode(raw_bytes).decode("utf-8")

    service = build("gmail", "v1", credentials=credentials, cache_discovery=False)
    try:
        resp = service.users().messages().send(userId="me", body={"raw": raw_b64}).execute()
        logger.debug("Gmail send response: %s", resp)
    except Exception as e:
        logger.exception("Gmail API send failed: %s", str(e))
        raise


async def send_verification_email(to_email: str, code: str) -> None:
    """
    이메일 인증번호 발송
    
    Args:
        to_email: 수신자 이메일 (@seoultech.ac.kr)
        code: 6자리 인증번호
    
    Raises:
        Exception: 이메일 발송 실패 시
    """
    try:
        message = _build_email_message(to_email, code)
        credentials = _get_gmail_credentials()
        _send_gmail_message(message, credentials)
    except Exception as exc:
        # Gmail API 호출 실패 시 로그를 남기고 예외 재발생
        logger.exception("Gmail API 이메일 발송 실패")
        raise exc


async def create_email_verification(email: str) -> str:
    """
    이메일 인증코드 생성 및 저장
    
    기존 DB 저장 로직을 유지합니다.
    """
    # 6자리 랜덤 인증번호 생성
    code = _generate_verification_code()
    
    # 만료 시간 (5분)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    # DB에 인증번호 저장
    try:
        result = supabase.table('email_verifications').insert({
            'email': email,
            'code': code,
            'expires_at': expires_at.isoformat()
        }).execute()
        
        if not result.data:
            raise Exception('DB 저장 실패')
    except Exception as e:
        logger.error(f'Supabase insert error: {str(e)}')
        raise Exception('DB 저장 실패')

    return code


async def verify_email_code(email: str, code: str) -> bool:
    """
    이메일 인증번호 검증 및 인증 완료 처리
    
    Args:
        email: 이메일 주소
        code: 입력받은 6자리 인증번호
    
    Returns:
        bool: 인증 성공 여부
    """
    # 가장 최근에 발송된 유효한 인증번호 조회
    result = supabase.table('email_verifications')\
        .select('*')\
        .eq('email', email)\
        .eq('code', code)\
        .eq('verified', False)\
        .gt('expires_at', datetime.now(timezone.utc).isoformat())\
        .order('created_at', desc=True)\
        .limit(1)\
        .execute()
    
    if not result.data:
        return False
    
    # 인증 완료로 표시
    verification_id = result.data[0]['id']
    supabase.table('email_verifications')\
        .update({
            'verified': True,
            'verified_at': datetime.now(timezone.utc).isoformat()
        })\
        .eq('id', verification_id)\
        .execute()
    
    return True


async def check_email_verified(email: str) -> bool:
    """
    이메일이 인증 완료되었는지 확인
    
    Args:
        email: 이메일 주소
    
    Returns:
        bool: 인증 완료 여부
    """
    result = supabase.table('email_verifications')\
        .select('*')\
        .eq('email', email)\
        .eq('verified', True)\
        .eq('used', False)\
        .order('verified_at', desc=True)\
        .limit(1)\
        .execute()
    
    return bool(result.data)


async def mark_email_used(email: str) -> None:
    """
    인증 완료된 이메일을 회원가입에 사용됨으로 표시
    
    Args:
        email: 이메일 주소
    """
    supabase.table('email_verifications')\
        .update({'used': True})\
        .eq('email', email)\
        .eq('verified', True)\
        .eq('used', False)\
        .execute()


# ============================================================================
# 비밀번호 재설정 관련 함수
# ============================================================================

async def create_password_reset(student_id: str, email: str) -> str:
    """
    비밀번호 재설정 인증번호 생성 및 저장
    
    Args:
        student_id: 학번
        email: 이메일 주소
    
    Returns:
        str: 6자리 인증번호
    """
    code = _generate_verification_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    # 기존 인증번호 무효화
    supabase.table('password_resets')\
        .delete()\
        .eq('student_id', student_id)\
        .execute()
    
    # 새 인증번호 저장
    supabase.table('password_resets').insert({
        'student_id': student_id,
        'email': email,
        'code': code,
        'expires_at': expires_at.isoformat()
    }).execute()
    
    return code


async def send_password_reset_email(email: str, code: str) -> None:
    """
    비밀번호 재설정 인증번호 이메일 발송
    
    Args:
        email: 이메일 주소
        code: 6자리 인증번호
    """
    message = EmailMessage()
    message["From"] = f"{settings.GMAIL_FROM_NAME} <{settings.GMAIL_FROM_EMAIL}>"
    message["To"] = email
    message["Subject"] = "[서울과기대 컴공학생회] 비밀번호 재설정 인증번호"
    
    # HTML 본문 (회원가입 인증 디자인과 동일)
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0066cc;">비밀번호 재설정</h2>
            <p>안녕하세요,</p>
            <p>아래의 인증번호를 입력하여 비밀번호를 재설정해주세요.</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                <h1 style="color: #0066cc; letter-spacing: 5px; margin: 0;">{code}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">
                ※ 이 인증번호는 <strong>5분간 유효</strong>합니다.<br>
                ※ 본인이 요청하지 않았다면 이 메일을 무시하세요.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
                서울과학기술대학교 컴퓨터공학과 학생회<br>
                이 메일은 자동 발송되었습니다.
            </p>
        </div>
    </body>
    </html>
    """
    
    message.set_content("인증번호: " + code)
    message.add_alternative(html_content, subtype="html")
    
    try:
        creds = Credentials(
            token=None,
            refresh_token=settings.GOOGLE_REFRESH_TOKEN,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=[GMAIL_SEND_SCOPE]
        )
        creds.refresh(Request())
        
        service = build("gmail", "v1", credentials=creds)
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        send_message = {"raw": raw_message}
        service.users().messages().send(userId="me", body=send_message).execute()
        
        logger.info(f"비밀번호 재설정 이메일 발송 성공: {email}")
    
    except Exception as e:
        logger.error(f"비밀번호 재설정 이메일 발송 실패: {str(e)}")
        raise Exception(f"이메일 발송 실패: {str(e)}")


async def verify_password_reset_code(student_id: str, code: str) -> bool:
    """
    비밀번호 재설정 인증번호 확인
    
    Args:
        student_id: 학번
        code: 6자리 인증번호
    
    Returns:
        bool: 인증 성공 여부
    """
    result = supabase.table('password_resets')\
        .select('*')\
        .eq('student_id', student_id)\
        .eq('code', code)\
        .eq('verified', False)\
        .order('created_at', desc=True)\
        .limit(1)\
        .execute()
    
    if not result.data:
        return False
    
    reset_data = result.data[0]
    expires_at = datetime.fromisoformat(reset_data['expires_at'].replace('Z', '+00:00'))
    now = datetime.now(timezone.utc)
    
    if now > expires_at:
        return False
    
    # 인증 완료 표시
    supabase.table('password_resets')\
        .update({
            'verified': True,
            'verified_at': now.isoformat()
        })\
        .eq('id', reset_data['id'])\
        .execute()
    
    return True


async def check_password_reset_verified(student_id: str) -> bool:
    """
    비밀번호 재설정 인증 완료 여부 확인
    
    Args:
        student_id: 학번
    
    Returns:
        bool: 인증 완료 여부
    """
    result = supabase.table('password_resets')\
        .select('*')\
        .eq('student_id', student_id)\
        .eq('verified', True)\
        .eq('used', False)\
        .order('verified_at', desc=True)\
        .limit(1)\
        .execute()
    
    return bool(result.data)


async def mark_password_reset_used(student_id: str) -> None:
    """
    비밀번호 재설정 완료 표시
    
    Args:
        student_id: 학번
    """
    supabase.table('password_resets')\
        .update({'used': True})\
        .eq('student_id', student_id)\
        .eq('verified', True)\
        .eq('used', False)\
        .execute()
