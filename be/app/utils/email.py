"""
이메일 전송 유틸리티
Gmail SMTP를 사용하여 인증 코드 이메일을 전송합니다.
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import get_settings


async def send_verification_email(to_email: str, code: str, student_id: str) -> bool:
    """
    인증 코드를 이메일로 전송
    
    Args:
        to_email: 수신자 이메일
        code: 6자리 인증 코드
        student_id: 학번
        
    Returns:
        bool: 전송 성공 여부
    """
    settings = get_settings()
    
    # 이메일 메시지 생성
    message = MIMEMultipart("alternative")
    message["Subject"] = "[서울과기대 컴공과 학생회] 이메일 인증 코드"
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    message["To"] = to_email
    
    # HTML 본문
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .code-box {{ background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }}
            .code {{ font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }}
            .warning {{ color: #e74c3c; font-size: 14px; margin-top: 20px; }}
            .footer {{ text-align: center; color: #999; font-size: 12px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✉️ 이메일 인증</h1>
                <p>서울과학기술대학교 컴퓨터공학과 학생회</p>
            </div>
            <div class="content">
                <p><strong>{student_id}</strong>님, 안녕하세요!</p>
                <p>학생회 홈페이지 회원가입을 위한 인증 코드입니다.</p>
                
                <div class="code-box">
                    <p style="margin: 0; font-size: 14px; color: #666;">인증 코드</p>
                    <div class="code">{code}</div>
                </div>
                
                <p>위 코드를 회원가입 페이지에 입력해주세요.</p>
                
                <div class="warning">
                    ⚠️ 이 코드는 <strong>5분</strong> 동안만 유효합니다.<br>
                    본인이 요청하지 않은 경우, 이 이메일을 무시하셔도 됩니다.
                </div>
                
                <div class="footer">
                    <p>서울과학기술대학교 컴퓨터공학과 학생회</p>
                    <p>이 메일은 발신 전용입니다.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    # 텍스트 버전 (HTML 지원 안되는 이메일 클라이언트용)
    text_body = f"""
    서울과학기술대학교 컴퓨터공학과 학생회
    이메일 인증 코드
    
    {student_id}님, 안녕하세요!
    
    학생회 홈페이지 회원가입을 위한 인증 코드입니다.
    
    인증 코드: {code}
    
    위 코드를 회원가입 페이지에 입력해주세요.
    
    ⚠️ 이 코드는 5분 동안만 유효합니다.
    본인이 요청하지 않은 경우, 이 이메일을 무시하셔도 됩니다.
    
    ---
    서울과학기술대학교 컴퓨터공학과 학생회
    이 메일은 발신 전용입니다.
    """
    
    # MIME 파트 추가
    part_text = MIMEText(text_body, "plain", "utf-8")
    part_html = MIMEText(html_body, "html", "utf-8")
    message.attach(part_text)
    message.attach(part_html)
    
    try:
        # SMTP 서버 연결 및 전송
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            start_tls=True,
        )
        return True
    except Exception as e:
        print(f"이메일 전송 실패: {str(e)}")
        return False
