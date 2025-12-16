# Backend - FastAPI 서버

서울과기대 컴퓨터공학과 학생회 홈페이지 백엔드 API

## 📋 개요

- **프레임워크**: FastAPI (Python 3.11+)
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: JWT + Supabase Auth
- **이메일**: Gmail SMTP

## 🚀 주요 기능

### 1. 이메일 인증 (`/api/email`)
- `POST /send-code`: 학교 이메일로 6자리 인증 코드 전송 (5분 유효)
- `POST /verify-code`: 인증 코드 확인

### 2. 회원가입 및 인증 (`/api/auth`)
- `POST /signup`: 회원가입 (이메일 인증 완료 후)
- `POST /login`: 로그인
- `POST /upload-verification-image`: 학생증 이미지 업로드
- `GET /me`: 내 프로필 조회

### 3. 관리자 승인 (`/api/admin`)
- `GET /pending-users`: 승인 대기 사용자 목록
- `POST /approve-user`: 사용자 승인/거부
- `GET /rejected-users`: 거부된 사용자 목록
- `POST /update-membership`: 회비 납부 상태 변경
- `POST /update-role`: 사용자 권한 변경

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
cd backend
python -m venv venv
source venv/bin/activate      # macOS/Linux
# venv\Scripts\activate       # Windows

pip install -r requirements.txt
```

### 2. 환경 변수 설정

`.env` 파일 생성 후 다음 값을 입력하세요:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# SMTP (Gmail)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Security
SECRET_KEY=your-secret-key-here
```

> 💡 `SECRET_KEY` 생성: `openssl rand -hex 32`

### 3. 서버 실행

```bash
# 개발 모드 (Hot Reload)
python run.py

# 또는 uvicorn 직접 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. API 문서 확인

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

> 📌 프론트엔드 CORS 설정은 `app/main.py`에서 관리됩니다.

## 🔐 인증 플로우

### 회원가입
1. **이메일 인증**: `/api/email/send-code` → 이메일로 6자리 코드 받기
2. **코드 확인**: `/api/email/verify-code` → 인증 코드 입력
3. **회원가입**: `/api/auth/signup` → 계정 생성
4. **이미지 업로드**: `/api/auth/upload-verification-image` → 학생증 캡쳐 업로드
5. **관리자 승인 대기**: 학생회 관리자가 확인 후 승인

### 로그인
1. **로그인**: `/api/auth/login` → JWT 토큰 받기
2. **인증 요청**: `Authorization: Bearer {token}` 헤더 추가

## 📁 프로젝트 구조

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 진입점
│   ├── config.py            # 환경 설정
│   ├── database.py          # Supabase 클라이언트
│   ├── routes/              # API 라우트
│   │   ├── email.py         # 이메일 인증
│   │   ├── auth.py          # 회원가입/로그인
│   │   └── admin.py         # 관리자 승인
│   ├── schemas/             # Pydantic 스키마
│   │   ├── email.py
│   │   ├── auth.py
│   │   └── admin.py
│   └── utils/               # 유틸리티
│       ├── email.py         # 이메일 전송
│       └── auth.py          # 인증 헬퍼
├── requirements.txt
├── .env.example
└── README.md
```

## 🔧 Gmail SMTP 설정

1. Gmail 계정에서 **2단계 인증** 활성화
2. **앱 비밀번호** 생성:
   - Google 계정 설정 → 보안 → 2단계 인증 → 앱 비밀번호
   - 앱: 메일, 기기: 기타 (FastAPI)
3. 생성된 16자리 비밀번호를 `.env`의 `SMTP_PASSWORD`에 입력

## 🗄️ Supabase 설정

### 1. Storage 버킷 생성
- 버킷 이름: `student-verifications`
- 공개 여부: **Private** (관리자만 접근 가능)

### 2. RLS 정책 설정
데이터베이스 스키마는 `database/schema.sql`을 참고하세요.

## 📝 API 사용 예시

### 이메일 인증 코드 전송
```bash
curl -X POST "http://localhost:8000/api/email/send-code" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "20211234@seoultech.ac.kr",
    "student_id": "20211234"
  }'
```

### 회원가입
```bash
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "20211234@seoultech.ac.kr",
    "student_id": "20211234",
    "password": "securepassword123",
    "name": "홍길동",
    "department": "컴퓨터공학과",
    "phone": "010-1234-5678"
  }'
```

### 로그인
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=20211234@seoultech.ac.kr&password=securepassword123"
```

## 🐛 트러블슈팅

### SMTP 연결 실패
- Gmail 앱 비밀번호가 올바른지 확인
- 2단계 인증이 활성화되어 있는지 확인
- 방화벽에서 포트 587 허용 확인

### Supabase 연결 실패
- `.env` 파일의 URL과 키가 올바른지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 이미지 업로드 실패
- Supabase Storage에 `student-verifications` 버킷 생성 확인
- 파일 크기가 너무 크지 않은지 확인 (권장: 5MB 이하)

## 📄 라이선스

이 프로젝트는 서울과학기술대학교 컴퓨터공학과 학생회 전용입니다.
