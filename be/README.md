# 서울과기대 컴공학생회 홈페이지 백엔드

FastAPI + Supabase 기반 학생회 홈페이지 백엔드 API

## 기술 스택

- **Framework**: FastAPI 0.115.0
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (JWT)
- **Storage**: Supabase Storage (Private bucket)
- **Email**: Gmail SMTP (aiosmtplib)
- **Rate Limiting**: slowapi
- **File Upload**: python-multipart
- **Python**: 3.12+

## 프로젝트 구조

```
be/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 엔트리포인트
│   ├── config.py            # 환경변수 설정
│   ├── database.py          # Supabase 클라이언트
│   ├── routes/              # API 엔드포인트
│   │   ├── __init__.py
│   │   ├── auth.py          # 인증 관련 API (7개)
│   │   ├── admin.py         # 관리자 API (6개)
│   │   └── users.py         # 사용자 프로필 API (3개)
│   ├── schemas/             # Pydantic 스키마
│   │   ├── __init__.py
│   │   ├── auth.py          # 인증 요청/응답 모델
│   │   ├── admin.py         # 관리자 요청/응답 모델
│   │   └── users.py         # 사용자 요청/응답 모델
│   └── utils/               # 유틸리티
│       ├── __init__.py
│       ├── email.py         # 이메일 발송
│       ├── auth.py          # 인증/권한 미들웨어
│       └── storage.py       # 파일 업로드 관리
├── db/
│   ├── schema.sql           # 데이터베이스 스키마
│   └── README.md
├── .env                     # 환경변수 (gitignore)
├── .gitignore
├── requirements.txt         # 패키지 의존성
└── README.md
```

## 설치 및 실행

### 1. 가상환경 생성 및 활성화

```bash
cd be
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows
```

### 2. 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. 환경변수 설정

`.env` 파일 생성:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_FROM_NAME=서울과기대 컴공학생회

# Security
SECRET_KEY=your_secret_key_here
ALLOWED_EMAIL_DOMAIN=seoultech.ac.kr

# Environment
ENVIRONMENT=development
DEBUG=true
FRONTEND_URL=http://localhost:5173

# Server
HOST=0.0.0.0
PORT=8000
```

### 4. 데이터베이스 스키마 적용

Supabase Dashboard → SQL Editor에서 `db/schema.sql` 실행

### 5. 서버 실행

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

서버 실행 후:
- API 문서: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- 헬스체크: http://localhost:8000/

## API 문서

모든 API 엔드포인트 및 사용법은 Swagger 문서를 참조하세요:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### API 목록 요약

**인증 (Authentication)** - 7개 엔드포인트
**사용자 (Users)** - 3개 엔드포인트  
**관리자 (Admin)** - 6개 엔드포인트 ⚠️ 관리자 권한 필요

> 상세한 Request/Response 스키마는 Swagger 문서에서 확인하세요.

## 회원가입 및 승인 플로우

```
1. 이메일 인증번호 발송 (POST /auth/send-verification)
   └─> Gmail로 6자리 코드 전송 (5분 유효)

2. 이메일 인증 확인 (POST /auth/verify-email)
   └─> 인증번호 검증 및 인증 완료 처리

3. 학번 중복 확인 (POST /auth/check-student-id)
   └─> 사용 가능 여부 확인

4. 회원가입 (POST /auth/signup)
   └─> Supabase Auth에 계정 생성
   └─> users 테이블에 프로필 저장
   └─> verification_status = 'pending' (관리자 승인 대기)

5. 로그인 (POST /auth/login)
   ⚠️ pending 상태에서도 로그인 가능
   └─> 프론트엔드에서 verification_status 확인 후 마이페이지 유도

6. 학적 인증 이미지 업로드 (POST /users/me/verification-image)
   └─> 로그인 필수 (JWT 토큰 필요)
   └─> Private Storage에 저장
   └─> users 테이블에 자동 FK 연결 (orphan 파일 방지)
   └─> Rate limit: 1시간에 3회

7. 관리자 승인 (POST /admin/users/{id}/approve)
   └─> 관리자가 이미지 확인 후 승인/거부
   └─> verification_status = 'approved' 변경
   └─> 승인 후 모든 기능 사용 가능
```

## 주요 기능 상세

### 🔐 권한 시스템

4단계 권한 미들웨어:

1. **get_current_user** - JWT 토큰 검증 및 사용자 정보 조회
2. **require_verified_user** - 관리자 승인 완료 사용자만 허용
3. **require_council** - 학생회 이상 권한 요구 (council, admin)
4. **require_admin** - 관리자 권한만 허용

**역할 (Role):**
- `student` - 일반 학생 (기본값)
- `council` - 일반 학생회 (게시글 삭제 등)
- `admin` - 관리자 (모든 권한)

**승인 상태 (Verification Status):**
- `pending` - 관리자 승인 대기 (로그인 가능, 이미지 업로드 가능)
- `approved` - 승인 완료 (모든 기능 사용 가능)
- `rejected` - 거부됨 (로그인 차단)

### 📤 파일 업로드 시스템

**학적 인증 이미지 업로드:**
- **형식**: JPG, PNG만 허용
- **크기**: 최대 5MB
- **저장소**: Supabase Storage Private bucket (`verification-images`)
- **보안**: Signed URL로만 접근 가능 (1시간 유효)
- **Rate Limiting**: 1시간에 3회 제한
- **로그인**: 필수 (FK 관계 보장)

**관리자 이미지 확인:**
```http
GET /admin/users/pending
Authorization: Bearer <admin_access_token>
```
응답에 `verification_image_url` 필드에 Signed URL 포함 (1시간 유효)

### 📧 이메일 인증

- **발송**: Gmail SMTP (앱 비밀번호 사용)
- **코드**: 6자리 랜덤 숫자
- **유효기간**: 5분
- **제한**: 1분에 1회 (Rate limiting)
- **저장소**: Supabase `email_verifications` 테이블

### 🚦 Rate Limiting

slowapi를 사용한 요청 횟수 제한:

- `POST /auth/send-verification` - 1분에 1회
- `POST /auth/login` - 5분에 10회
- `POST /auth/upload-verification-image` - 1시간에 3회 (deprecated)
- `POST /users/me/verification-image` - 1시간에 3회

## 보안

### JWT 토큰 관리
- **Access Token**: 1시간 유효
- **Refresh Token**: 7일 유효
- 로그아웃 시 Supabase에서 refresh token 무효화

### 이메일 인증
- 6자리 랜덤 코드 생성
- 5분간 유효
- 인증 완료 후 회원가입 가능

### 관리자 승인
- 회원가입 후 `verification_status='pending'`
- 관리자 승인 전까지 로그인 불가
- 승인/거부 시 상태 변경

### 첫 관리자 계정 생성

Supabase SQL Editor에서 실행:

```sql
-- 1. 사용자 승인 및 관리자 권한 부여
UPDATE users 
SET 
  verification_status = 'approved',
  verified_at = NOW(),
  role = 'admin'
WHERE student_id = '20221234';  -- 본인 학번으로 변경

-- 2. 확인
SELECT student_id, name, email, role, verification_status 
FROM users 
WHERE role = 'admin';
```

## Supabase Storage 설정

### Private Bucket 생성

1. Supabase Dashboard → Storage
2. `New bucket` 클릭
3. Name: `verification-images`
4. **Public bucket**: ❌ 체크 해제 (Private)
5. `Create bucket`

### RLS (Row Level Security) 정책

```sql
-- Service Key를 사용하므로 RLS 정책 불필요
-- 백엔드에서 Signed URL로 접근 제어
```

## 개발

### 코드 스타일
- PEP 8 준수
- Type hints 사용
- Docstring 작성

### 에러 처리
- HTTPException 사용
- 명확한 에러 메시지
- 적절한 HTTP 상태 코드

### API 문서
- FastAPI 자동 생성
- Swagger UI: `/docs`
- ReDoc: `/redoc`

## 환경별 설정

### Development
```env
ENVIRONMENT=development
DEBUG=true
```

### Production
```env
ENVIRONMENT=production
DEBUG=false
FRONTEND_URL=https://yourdomain.com
```

## 문제 해결

### Supabase 연결 실패
```bash
# 연결 테스트
python -c "from app.database import supabase; print('✅ 연결 성공')"
```

### 이메일 발송 실패
- Gmail 앱 비밀번호 확인
- SMTP 설정 확인
- 방화벽 설정 확인

### 포트 충돌
```bash
# 8000 포트 사용 중인 프로세스 확인
lsof -i :8000
# 프로세스 종료
kill -9 <PID>
```

## 라이선스

MIT

## 기여

Pull Request 환영합니다!
