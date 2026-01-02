"""
인증 관련 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException, Header, Request, status
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
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
    LogoutResponse,
    ErrorResponse
)
from app.utils.email import (
    send_verification_email,
    create_email_verification,
    verify_email_code,
    check_email_verified,
    mark_email_used
)
from app.database import supabase
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
@limiter.limit("1/minute")
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
        
        # 2. 이미 인증 완료되었지만 아직 회원가입 안 한 경우
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
        
        # 3. 인증번호 생성 및 저장
        code = await create_email_verification(body.email)
        
        # 4. 인증번호 발송
        await send_verification_email(body.email, code)
        
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
        # 1. 이메일이 인증되었는지 확인
        is_email_verified = await check_email_verified(request.email)
        if not is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이메일 인증이 완료되지 않았습니다. 먼저 이메일 인증을 완료해주세요."
            )
        
        # 2. 이메일 중복 확인
        existing_email = supabase.table('users')\
            .select('email')\
            .eq('email', request.email)\
            .execute()
        
        if existing_email.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 가입된 이메일입니다"
            )
        
        # 3. 학번 중복 확인
        existing_student = supabase.table('users')\
            .select('student_id')\
            .eq('student_id', request.student_id)\
            .execute()
        
        if existing_student.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 학번입니다"
            )
        
        # 4. Supabase Auth에 사용자 생성
        try:
            auth_response = supabase.auth.admin.create_user({
                "email": request.email,
                "password": request.password,
                "email_confirm": True
            })
        except Exception as auth_error:
            error_message = str(auth_error)
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
        
        # 5. users 테이블에 프로필 정보 저장
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
        
        supabase.table('users').insert(user_data).execute()
        
        # 6. 이메일 인증 사용됨으로 표시
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
    description="학번과 비밀번호로 로그인합니다 (5분에 10회 제한)",
    responses={
        401: {"model": ErrorResponse, "description": "인증 실패"},
        403: {"model": ErrorResponse, "description": "승인 대기 또는 거부됨"},
        404: {"model": ErrorResponse, "description": "사용자 없음"},
        429: {"model": ErrorResponse, "description": "요청 횟수 초과"}
    }
)
@limiter.limit("10/5minutes")
async def login(body: LoginRequest, request: Request):
    """로그인 (학번 + 비밀번호)"""
    try:
        # 1. 학번으로 사용자 조회
        user_result = supabase.table('users')\
            .select('*')\
            .eq('student_id', body.student_id)\
            .single()\
            .execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="등록되지 않은 학번입니다"
            )
        
        user_data = user_result.data
        email = user_data['email']
        
        # 2. Supabase Auth로 로그인 (이메일 + 비밀번호)
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": body.password
            })
        except Exception as auth_error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="학번 또는 비밀번호가 올바르지 않습니다"
            )
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="학번 또는 비밀번호가 올바르지 않습니다"
            )
        
        access_token = auth_response.session.access_token
        
        # 3. 거절된 사용자는 로그인 차단
        if user_data['verification_status'] == 'rejected':
            rejection_reason = user_data.get('rejection_reason', '사유 없음')
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"가입이 거절되었습니다. 사유: {rejection_reason}"
            )
        
        return LoginResponse(
            access_token=access_token,
            user=user_data
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"로그인 실패: {str(e)}"
        )


@router.post(
    "/logout",
    response_model=LogoutResponse,
    status_code=status.HTTP_200_OK,
    summary="로그아웃",
    description="현재 세션을 종료하고 refresh token을 무효화합니다 (access token은 만료 시간까지 유효)",
    responses={
        401: {"model": ErrorResponse, "description": "인증되지 않은 요청"}
    }
)
async def logout(authorization: Optional[str] = Header(None)):
    """로그아웃 (세션 무효화)"""
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="인증 토큰이 필요합니다"
            )
        
        # Bearer 토큰 추출
        access_token = authorization.replace("Bearer ", "")
        
        # Supabase에서 사용자의 모든 세션 무효화
        # 1. 토큰으로 사용자 정보 조회
        try:
            user_response = supabase.auth.get_user(access_token)
            if user_response and user_response.user:
                # 2. 해당 사용자의 모든 세션 무효화
                supabase.auth.admin.sign_out(user_response.user.id, scope='global')
        except Exception:
            # 토큰이 이미 만료되었거나 유효하지 않은 경우
            # 프론트엔드에서는 이미 삭제할 것이므로 성공 처리
            pass
        
        return LogoutResponse()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"로그아웃 실패: {str(e)}"
        )
