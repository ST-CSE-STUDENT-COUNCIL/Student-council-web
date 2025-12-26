# 서울과기대 컴공학생회 홈페이지 백엔드

FastAPI + Supabase 기반 학생회 홈페이지 백엔드 API

## 기술 스택

- **Framework**: FastAPI 0.115.0
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (JWT)
- **Email**: Gmail SMTP (aiosmtplib)
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
│   │   └── auth.py          # 인증 관련 API
│   ├── schemas/             # Pydantic 스키마
│   │   ├── __init__.py
│   │   └── auth.py          # 인증 요청/응답 모델
│   └── utils/               # 유틸리티
│       ├── __init__.py
│       └── email.py         # 이메일 발송
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
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

서버 실행 후:
- API 문서: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- 헬스체크: http://localhost:8000/

## API 엔드포인트

### 인증 (Authentication)

#### 1. 이메일 인증번호 발송
```http
POST /auth/send-verification
Content-Type: application/json

{
  "email": "student@seoultech.ac.kr"
}
```

**응답 (200):**
```json
{
  "message": "인증번호가 발송되었습니다",
  "email": "student@seoultech.ac.kr"
}
```

#### 2. 이메일 인증 확인
```http
POST /auth/verify-email
Content-Type: application/json

{
  "email": "student@seoultech.ac.kr",
  "code": "123456"
}
```

**응답 (200):**
```json
{
  "message": "이메일 인증이 완료되었습니다",
  "email": "student@seoultech.ac.kr"
}
```

#### 3. 학번 중복 확인
```http
POST /auth/check-student-id
Content-Type: application/json

{
  "student_id": "20221234"
}
```

**응답 (200):**
```json
{
  "available": true,
  "message": "사용 가능한 학번입니다"
}
```

#### 4. 회원가입
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "student@seoultech.ac.kr",
  "password": "password123!",
  "name": "홍길동",
  "student_id": "20221234",
  "phone": "01012345678",
  "department": "컴퓨터공학과"
}
```

**응답 (201):**
```json
{
  "message": "회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.",
  "user_id": "uuid",
  "email": "student@seoultech.ac.kr",
  "name": "홍길동"
}
```

#### 5. 로그인
```http
POST /auth/login
Content-Type: application/json

{
  "student_id": "20221234",
  "password": "password123!"
}
```

**응답 (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "student_id": "20221234",
    "name": "홍길동",
    "email": "student@seoultech.ac.kr",
    "department": "컴퓨터공학과",
    "role": "student",
    "verification_status": "approved"
  }
}
```

#### 6. 로그아웃
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**응답 (200):**
```json
{
  "message": "로그아웃되었습니다"
}
```

## 회원가입 플로우

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

5. 관리자 승인 (SQL 직접 실행 또는 관리자 페이지)
   └─> verification_status = 'approved' 변경

6. 로그인 가능 (POST /auth/login)
```

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

```sql
-- Supabase SQL Editor에서 실행
UPDATE users 
SET 
  verification_status = 'approved',
  is_verified = true,
  verified_at = NOW(),
  role = 'admin'
WHERE student_id = '20221234';
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
