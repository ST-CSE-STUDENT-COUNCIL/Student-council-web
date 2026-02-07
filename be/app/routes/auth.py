"""
인증 관련 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException, Header, Request, Response, status
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime
from app.schemas.auth import (
    SendVerificationRequest,
    SendVerificationResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
    CheckStudentIdRequest,
    CheckStudentIdResponse,
    SignupRequest,
    SignupResponse,
    LoginRequest,
    LoginResponse,
    RefreshResponse,
    LogoutResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    VerifyResetCodeRequest,
    VerifyResetCodeResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ErrorResponse
)
from app.utils.email import (
    send_verification_email,
    create_email_verification,
    verify_email_code,
    check_email_verified,
    mark_email_used,
    create_password_reset,
    send_password_reset_email,
    verify_password_reset_code,
    check_password_reset_verified,
    mark_password_reset_used
)
from app.utils.login_security import (
    record_login_attempt,
    check_login_block,
    increment_failed_attempts,
    reset_failed_attempts,
    unblock_user
)
from app.utils.turnstile import verify_turnstile
from app.database import supabase, get_supabase_admin
from postgrest.exceptions import APIError


router = APIRouter(prefix="/auth", tags=["인증"])
limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/send-verification",
    response_model=SendVerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="이메일 인증번호 발송",
    description="학교 이메일로 6자리 인증번호를 발송합니다 (5분간 유효, 1분에 1회 제한)",
    responses={
        400: {"model": ErrorResponse, "description": "이미 가입된 이메일"},
        429: {"model": ErrorResponse, "description": "요청 횟수 초과"},
        500: {"model": ErrorResponse, "description": "이메일 발송 실패"}
    }
)
@limiter.limit("10/minute")  # 공용 IP 고려
async def send_verification(body: SendVerificationRequest, request: Request):
    """이메일 인증번호 발송"""
    try:
        # 1. 이미 가입된 이메일인지 확인
        existing_user = supabase.table('users')\
            .select('email')\
            .eq('email', body.email)\
            .execute()
        
        if existing_user.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 가입된 이메일입니다"
            )
        
        # 3. 이미 인증 완료되었지만 아직 회원가입 안 한 경우
        already_verified = supabase.table('email_verifications')\
            .select('*')\
            .eq('email', body.email)\
            .eq('verified', True)\
            .eq('used', False)\
            .execute()
        
        if already_verified.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 인증 완료된 이메일입니다. 회원가입을 진행해주세요."
            )
        
        # 4. 인증번호 생성 및 저장
        code = await create_email_verification(body.email)
        
        # 5. 인증번호 발송
        send_verification_email(body.email, code)
        
        return SendVerificationResponse(email=body.email)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이메일 발송 실패: {str(e)}"
        )


@router.post(
    "/verify-email",
    response_model=VerifyEmailResponse,
    status_code=status.HTTP_200_OK,
    summary="이메일 인증 확인",
    description="발송된 6자리 인증번호를 확인하고 이메일 인증을 완료합니다",
    responses={
        400: {"model": ErrorResponse, "description": "인증번호 불일치 또는 만료"}
    }
)
async def verify_email(request: VerifyEmailRequest):
    """이메일 인증 확인"""
    try:
        is_verified = await verify_email_code(request.email, request.code)
        
        if not is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="인증번호가 올바르지 않거나 만료되었습니다"
            )
        
        return VerifyEmailResponse(email=request.email)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"인증 확인 실패: {str(e)}"
        )




@router.post(    "/check-student-id",
    response_model=CheckStudentIdResponse,
    status_code=status.HTTP_200_OK,
    summary="학번 중복 확인",
    description="학번이 이미 사용 중인지 확인합니다"
)
async def check_student_id(request: CheckStudentIdRequest):
    """학번 중복 확인"""
    try:
        existing_user = supabase.table('users')\
            .select('student_id')\
            .eq('student_id', request.student_id)\
            .execute()
        
        if existing_user.data:
            return CheckStudentIdResponse(
                available=False,
                message="이미 사용 중인 학번입니다"
            )
        
        return CheckStudentIdResponse(
            available=True,
            message="사용 가능한 학번입니다"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"학번 확인 실패: {str(e)}"
        )


@router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="회원가입",
    description="이메일 인증 완료 후 회원가입을 진행합니다",
    responses={
        400: {"model": ErrorResponse, "description": "이메일 미인증, 중복 이메일/학번"},
        500: {"model": ErrorResponse, "description": "회원가입 실패"}
    }
)
async def signup(request: SignupRequest):
    """회원가입"""
    try:
        # 1. Turnstile 검증
        if request.turnstile_token:
            await verify_turnstile(token=request.turnstile_token)
        
        # 2. 이메일이 인증되었는지 확인
        is_email_verified = await check_email_verified(request.email)
        if not is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이메일 인증이 완료되지 않았습니다. 먼저 이메일 인증을 완료해주세요."
            )
        
        # 3. 이메일 중복 확인
        existing_email = supabase.table('users')\
            .select('email')\
            .eq('email', request.email)\
            .execute()
        
        if existing_email.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 가입된 이메일입니다"
            )
        
        # 4. 학번 중복 확인
        existing_student = supabase.table('users')\
            .select('student_id')\
            .eq('student_id', request.student_id)\
            .execute()
        
        if existing_student.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 학번입니다"
            )
        
        # 5. Supabase Auth에 사용자 생성 (새 클라이언트 사용)
        try:
            from app.database import get_fresh_admin_client
            fresh_client = get_fresh_admin_client()
            auth_response = fresh_client.auth.admin.create_user({
                "email": request.email,
                "password": request.password,
                "email_confirm": True
            })
        except Exception as auth_error:
            error_message = str(auth_error)
            print(f"[SIGNUP ERROR] Auth 생성 실패: {error_message}")
            if "already been registered" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="이미 가입된 이메일입니다"
                )
            # 보안: 내부 에러 메시지 숨김
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            )
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="사용자 생성 실패"
            )
        
        user_id = auth_response.user.id
        
        # 6. users 테이블에 프로필 정보 저장
        user_data = {
            'id': user_id,
            'email': request.email,
            'name': request.name,
            'student_id': request.student_id,
            'phone': request.phone,
            'department': request.department,
            'verification_status': 'pending',
            'membership_paid': False
        }
        
        try:
            # RLS 우회를 위해 fresh_client 사용
            fresh_client.table('users').insert(user_data).execute()
        except Exception as insert_error:
            print(f"[SIGNUP ERROR] users 테이블 insert 실패: {str(insert_error)}")
            raise
        
        # 7. 이메일 인증 사용됨으로 표시
        await mark_email_used(request.email)
        
        return SignupResponse(
            user_id=user_id,
            email=request.email,
            name=request.name
        )
    
    except HTTPException:
        raise
    except APIError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"회원가입 실패: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"서버 오류: {str(e)}"
        )


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="로그인",
    description="학번과 비밀번호로 로그인합니다 (IP 기반 5분에 100회, 학번 기반 누적 실패 차단)",
    responses={
        401: {"model": ErrorResponse, "description": "인증 실패"},
        403: {"model": ErrorResponse, "description": "승인 대기, 거부, 또는 로그인 차단"},
        404: {"model": ErrorResponse, "description": "사용자 없음"},
        429: {"model": ErrorResponse, "description": "요청 횟수 초과"}
    }
)
@limiter.limit("300/5minutes")  # 공용 IP 고려 (넉넉하게)
async def login(body: LoginRequest, request: Request):
    """로그인 (학번 + 비밀번호)"""
    client_ip = get_remote_address(request)
    
    try:
        # 1. Turnstile 검증
        if body.turnstile_token:
            await verify_turnstile(
                token=body.turnstile_token,
                remote_ip=client_ip
            )
        
        # 2. 학번으로 사용자 조회
        user_result = supabase.table('users')\
            .select('*')\
            .eq('student_id', body.student_id)\
            .limit(1)\
            .execute()
        
        if not user_result.data or len(user_result.data) == 0:
            # users에 없으면 rejected_users 확인
            rejected_result = supabase.table('rejected_users')\
                .select('rejection_reason, rejected_at')\
                .eq('student_id', body.student_id)\
                .order('rejected_at', desc=True)\
                .limit(1)\
                .execute()
            
            if rejected_result.data and len(rejected_result.data) > 0:
                rejection_reason = rejected_result.data[0].get('rejection_reason', '사유 없음')
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"가입이 거절되었습니다. 사유: {rejection_reason}. 재가입을 원하시면 다시 회원가입해주세요."
                )
            
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="등록되지 않은 학번입니다"
            )
        
        user_data = user_result.data[0]
        email = user_data['email']
        
        # 3. 학번 기반 차단 확인
        block_status = await check_login_block(body.student_id)
        
        if block_status['is_permanent']:
            # 15번 실패 -> 영구 차단 (계정 삭제 안 함)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="로그인 시도 횟수 초과로 계정이 차단되었습니다. 본인이 맞다면 관리자에게 문의하여 차단 해제를 요청하세요."
            )
        
        if block_status['is_blocked']:
            # 차단 중
            reason = block_status['reason']
            block_until = block_status['block_until']
            
            if reason == '10_minutes':
                remaining = (block_until - datetime.now(block_until.tzinfo)).total_seconds() // 60
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"로그인이 일시 차단되었습니다. 약 {int(remaining)}분 후 다시 시도해주세요. (5회 실패)"
                )
            elif reason == '1_hour':
                remaining = (block_until - datetime.now(block_until.tzinfo)).total_seconds() // 60
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"로그인이 일시 차단되었습니다. 약 {int(remaining)}분 후 다시 시도해주세요. (10회 실패)"
                )
        
        # 3. Supabase Auth로 로그인 시도 (새 클라이언트 사용)
        try:
            # 싱글톤 오염 방지를 위해 새 클라이언트 생성
            from app.database import get_fresh_admin_client
            fresh_client = get_fresh_admin_client()
            
            # [중복 로그인 방지] 기존 세션 모두 만료 처리
            try:
                # user_data['id']는 위에서 이미 조회했음
                fresh_client.auth.admin.sign_out(user_data['id'], scope='global')
            except Exception as e:
                # 로그아웃 실패하더라도 로그인은 계속 진행 (로그만 남김)
                print(f"[LOGIN WARNING] 기존 세션 만료 실패 (무시됨): {str(e)}")
            
            auth_response = fresh_client.auth.sign_in_with_password({
                "email": email,
                "password": body.password
            })
        except Exception as auth_error:
            # 로그인 실패 기록
            await record_login_attempt(body.student_id, False, client_ip)
            
            # 실패 횟수 증가 및 차단 처리
            result = await increment_failed_attempts(body.student_id)
            
            if result['is_permanent']:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="로그인 시도 횟수 초과로 계정이 차단되었습니다. 본인이 맞다면 관리자에게 문의하여 차단 해제를 요청하세요."
                )
            elif result['is_blocked']:
                reason = result['block_reason']
                if reason == '10_minutes':
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="로그인 5회 실패로 10분간 차단되었습니다."
                    )
                elif reason == '1_hour':
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="로그인 10회 실패로 1시간 동안 차단되었습니다."
                    )
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"학번 또는 비밀번호가 올바르지 않습니다. (실패 {result['failed_attempts']}/15)"
            )
        
        if not auth_response.user or not auth_response.session:
            # 로그인 실패 기록
            await record_login_attempt(body.student_id, False, client_ip)
            
            # 실패 횟수 증가
            result = await increment_failed_attempts(body.student_id)
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"학번 또는 비밀번호가 올바르지 않습니다. (실패 {result['failed_attempts']}/15)"
            )
        
        access_token = auth_response.session.access_token
        refresh_token = auth_response.session.refresh_token
        
        # 4. 거절된 사용자는 로그인 차단
        if user_data['verification_status'] == 'rejected':
            rejection_reason = user_data.get('rejection_reason', '사유 없음')
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"가입이 거절되었습니다. 사유: {rejection_reason}"
            )
        
        # 5. 로그인 성공 - 실패 횟수 초기화 및 기록
        await reset_failed_attempts(body.student_id)
        await record_login_attempt(body.student_id, True, client_ip)

        # [중복 로그인 방지] 마지막 로그인 시각 갱신
        # 이 시각 이전에 발급된 토큰은 모두 무효화됨
        from datetime import datetime, timezone
        now_iso = datetime.now(timezone.utc).isoformat()
        
        try:
            fresh_client.table('users').update({'last_login_at': now_iso}).eq('id', user_data['id']).execute()
            # 응답 데이터에도 최신 로그인 시각 반영
            user_data['last_login_at'] = now_iso
        except Exception as e:
            print(f"[LOGIN ERROR] last_login_at update failed: {e}")
            # 치명적이지 않으므로 진행 (로그인 성공 처리)

        # 6. 응답 생성 및 refresh_token을 HttpOnly 쿠키로 설정
        from fastapi.responses import JSONResponse
        
        response_data = {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_data
        }
        
        response = JSONResponse(content=response_data)
        
        # HttpOnly 쿠키 설정 (30일 유효)
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            samesite="lax",
            secure=True,  # HTTPS에서만 전송
            max_age=30 * 24 * 60 * 60  # 30일
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"로그인 실패: {str(e)}"
        )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="로그아웃",
    description="현재 세션을 종료하고 refresh token을 무효화합니다",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않은 요청"}
    }
)
async def logout(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """로그아웃 (세션 무효화 + 쿠키 삭제)"""
    from fastapi.responses import JSONResponse
    
    try:
        if authorization and authorization.startswith("Bearer "):
            # Bearer 토큰 추출
            access_token = authorization.replace("Bearer ", "")
            
            # Supabase에서 사용자의 모든 세션 무효화
            try:
                from app.database import get_fresh_admin_client
                fresh_client = get_fresh_admin_client()
                
                user_response = fresh_client.auth.get_user(access_token)
                if user_response and user_response.user:
                    fresh_client.auth.admin.sign_out(user_response.user.id, scope='global')
            except Exception:
                pass
        
        # 응답 생성 및 쿠키 삭제
        response = JSONResponse(content={"message": "로그아웃되었습니다"})
        response.delete_cookie(
            key="refresh_token",
            httponly=True,
            samesite="lax",
            secure=True
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"로그아웃 실패: {str(e)}"
        )


@router.post(
    "/refresh",
    response_model=RefreshResponse,
    status_code=status.HTTP_200_OK,
    summary="토큰 갱신",
    description="refresh_token 쿠키를 사용하여 새로운 access_token을 발급합니다",
    responses={
        401: {"model": ErrorResponse, "description": "유효하지 않은 refresh token"}
    }
)
async def refresh_token(request: Request):
    """Access Token 갱신 (Cookie에서 Refresh Token 사용)"""
    from fastapi.responses import JSONResponse
    
    try:
        # 쿠키에서 refresh_token 추출
        refresh_token = request.cookies.get("refresh_token")
        
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="refresh token이 없습니다. 다시 로그인해주세요."
            )
        
        # Supabase에서 세션 갱신
        from app.database import get_fresh_admin_client
        fresh_client = get_fresh_admin_client()
        
        try:
            auth_response = fresh_client.auth.refresh_session(refresh_token)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="refresh token이 만료되었습니다. 다시 로그인해주세요."
            )
        
        if not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="세션 갱신에 실패했습니다. 다시 로그인해주세요."
            )
        
        new_access_token = auth_response.session.access_token
        new_refresh_token = auth_response.session.refresh_token
        
        # 응답 생성 (새 refresh_token으로 쿠키 업데이트 - Token Rotation)
        response_data = {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
        
        response = JSONResponse(content=response_data)
        
        # 새 refresh_token으로 쿠키 갱신
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            samesite="lax",
            secure=True,
            max_age=30 * 24 * 60 * 60  # 30일
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"토큰 갱신 실패: {str(e)}"
        )


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="비밀번호 찾기",
    description="학번으로 등록된 이메일에 인증번호를 발송합니다 (5분간 유효, 1분에 1회 제한)",
    responses={
        404: {"model": ErrorResponse, "description": "등록되지 않은 학번"},
        429: {"model": ErrorResponse, "description": "요청 횟수 초과"},
        500: {"model": ErrorResponse, "description": "이메일 발송 실패"}
    }
)
@limiter.limit("10/minute")  # 공용 IP 고려
async def forgot_password(body: ForgotPasswordRequest, request: Request):
    """비밀번호 찾기 - 학번으로 인증번호 발송"""
    try:
        # 1. 학번으로 사용자 조회
        user_result = supabase.table('users')\
            .select('email')\
            .eq('student_id', body.student_id)\
            .single()\
            .execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="등록되지 않은 학번입니다"
            )
        
        email = user_result.data['email']
        
        # 2. 인증번호 생성 및 저장
        code = await create_password_reset(body.student_id, email)
        
        # 3. 이메일 발송
        send_password_reset_email(email, code)
        
        return ForgotPasswordResponse(email=email)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"비밀번호 찾기 실패: {str(e)}"
        )


@router.post(
    "/verify-reset-code",
    response_model=VerifyResetCodeResponse,
    status_code=status.HTTP_200_OK,
    summary="비밀번호 재설정 인증 코드 확인",
    description="비밀번호 재설정을 위한 인증번호를 확인합니다",
    responses={
        400: {"model": ErrorResponse, "description": "인증번호 불일치 또는 만료"},
        500: {"model": ErrorResponse, "description": "서버 오류"}
    }
)
async def verify_reset_code(body: VerifyResetCodeRequest):
    """비밀번호 재설정 인증번호 확인"""
    try:
        # 인증번호 검증
        is_valid = await verify_password_reset_code(body.student_id, body.code)
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="인증번호가 일치하지 않거나 만료되었습니다"
            )
        
        return VerifyResetCodeResponse(student_id=body.student_id)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"인증 확인 실패: {str(e)}"
        )


@router.post(
    "/reset-password",
    response_model=ResetPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="비밀번호 재설정",
    description="인증 완료 후 새로운 비밀번호로 변경합니다",
    responses={
        400: {"model": ErrorResponse, "description": "인증 미완료 또는 사용자 없음"},
        500: {"model": ErrorResponse, "description": "비밀번호 변경 실패"}
    }
)
async def reset_password(body: ResetPasswordRequest):
    """비밀번호 재설정"""
    try:
        # 1. 인증 완료 여부 확인
        is_verified = await check_password_reset_verified(body.student_id)
        if not is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="인증이 완료되지 않았습니다. 먼저 인증번호를 확인해주세요."
            )
        
        # 2. 사용자 조회
        user_result = supabase.table('users')\
            .select('id, email')\
            .eq('student_id', body.student_id)\
            .single()\
            .execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="사용자를 찾을 수 없습니다"
            )
        
        user_id = user_result.data['id']
        email = user_result.data['email']
        
        # 3. Supabase Auth에서 비밀번호 변경 (새 클라이언트 사용)
        try:
            from app.database import get_fresh_admin_client
            fresh_client = get_fresh_admin_client()
            fresh_client.auth.admin.update_user_by_id(
                user_id,
                {"password": body.new_password}
            )
        except Exception as auth_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"비밀번호 변경 실패: {str(auth_error)}"
            )
        
        # 4. 재설정 완료 표시
        await mark_password_reset_used(body.student_id)
        
        # 5. 로그인 차단 정보도 초기화 (비밀번호 찾기로 해결됨)
        await reset_failed_attempts(body.student_id)
        
        return ResetPasswordResponse()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"비밀번호 재설정 실패: {str(e)}"
        )
