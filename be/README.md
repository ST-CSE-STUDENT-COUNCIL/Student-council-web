# 서울과기대 컴공학생회 홈페이지 백엔드

FastAPI + Supabase + Cloudflare R2 기반 학생회 홈페이지 백엔드 API

## 기술 스택

- **Framework**: FastAPI 0.115.0
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (JWT)
- **Storage**: Cloudflare R2 (5 Public Buckets) + Supabase Storage (Private)
- **Bot Prevention**: Cloudflare Turnstile 🆕
- **Email**: Gmail HTTP API (google-auth/googleapiclient)
- **Rate Limiting**: slowapi
- **File Upload**: python-multipart
- **HTTP Client**: httpx (Turnstile 검증용)
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
│   │   ├── auth.py          # 인증 관련 API
│   │   ├── admin.py         # 관리자 API
│   │   ├── users.py         # 마이페이지 API (경로: /mypage)
│   │   ├── boards.py        # 게시판 API
│   │   ├── posts.py         # 게시글 API (공지사항)
│   │   ├── clubs.py         # 동아리 API
│   │   ├── events.py        # 행사 API 🆕
│   │   ├── welfare.py       # 복지사업 API (사물함, 물품대여)
│   │   ├── introductions.py # 학생회 소개 이미지 API
│   │   └── suggestions.py   # 건의함 API
│   ├── schemas/             # Pydantic 스키마
│   │   ├── __init__.py
│   │   ├── auth.py          # 인증 요청/응답 모델
│   │   ├── admin.py         # 관리자 요청/응답 모델
│   │   ├── users.py         # 사용자 요청/응답 모델
│   │   ├── boards.py        # 게시판 요청/응답 모델
│   │   ├── posts.py         # 게시글 요청/응답 모델
│   │   ├── clubs.py         # 동아리 요청/응답 모델
│   │   ├── events.py        # 행사 요청/응답 모델 🆕
│   │   ├── welfare.py       # 복지사업 요청/응답 모델
│   │   ├── introductions.py # 학생회 소개 이미지 요청/응답 모델
│   │   └── suggestions.py   # 건의함 요청/응답 모델
│   └── utils/               # 유틸리티
│       ├── __init__.py
│       ├── email.py         # 이메일 발송
│       ├── auth.py          # 인증/권한 미들웨어
│       ├── login_security.py # 로그인 보안 (차단 관리)
│       ├── storage.py       # Supabase Storage (Private)
│       ├── r2_storage.py    # Cloudflare R2 스토리지 (Public) 🆕
│       ├── turnstile.py     # Cloudflare Turnstile 검증 🆕
│       └── sheets.py        # Google Sheets API
├── db/
│   ├── schema.sql           # 데이터베이스 스키마
│   ├── reset.sql            # 데이터 초기화 스크립트
│   ├── migrations/          # 마이그레이션 SQL 파일
│   │   ├── 001_update_clubs_table.sql
│   │   ├── 002_update_locker_periods_table.sql
│   │   ├── 003_redesign_welfare_system.sql
│   │   ├── 004_add_login_attempt_tracking.sql
│   │   ├── 005_add_password_reset_table.sql
│   │   ├── 006_create_introduction_images_storage.sql
│   │   ├── 007_add_guest_registration_support.sql 🆕
│   │   └── README.md
│   └── README.md
├── postman/                 # Postman 테스트 컬렉션 🆕
│   └── Events_API.postman_collection.json
├── test_turnstile.py        # Turnstile 테스트 스크립트 🆕
├── test_turnstile_api.sh    # API 테스트 가이드 🆕
├── TURNSTILE_SETUP_GUIDE.md # Turnstile 설정 가이드 🆕
├── R2_SETUP_GUIDE.md        # Cloudflare R2 설정 가이드
├── .env                     # 환경변수 (gitignore)
├── .env.example             # 환경변수 예시
├── .env.render.example      # Render 배포 예시
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
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Gmail OAuth2 API
GOOGLE_CLIENT_ID=your_gmail_oauth_client_id
GOOGLE_CLIENT_SECRET=your_gmail_oauth_client_secret
GOOGLE_REFRESH_TOKEN=your_gmail_refresh_token
GMAIL_FROM_EMAIL=your_email@gmail.com
GMAIL_FROM_NAME=서울과기대 컴공학생회

# Google Sheets API (복지사업 물품 재고 관리)
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key

# R2 Public Bucket URLs (각 버킷의 R2.dev 서브도메인)
R2_CLUB_IMAGES_URL=https://pub-xxxxx.r2.dev
R2_EVENT_IMAGES_URL=https://pub-xxxxx.r2.dev
R2_INTRODUCTION_IMAGES_URL=https://pub-xxxxx.r2.dev
R2_POST_ATTACHMENTS_URL=https://pub-xxxxx.r2.dev
R2_WELFARE_IMAGES_URL=https://pub-xxxxx.r2.dev

# Cloudflare Turnstile (봇 방지)
TURNSTILE_SECRET_KEY=your_secret_key_here
TURNSTILE_SITE_KEY=your_site_key_here

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

**인증 (Authentication)**
- `POST /auth/send-verification` - 이메일 인증번호 발송
- `POST /auth/verify-email` - 이메일 인증 확인
- `POST /auth/check-student-id` - 학번 중복 확인
- `POST /auth/signup` - 회원가입 (Turnstile 적용 🆕)
- `POST /auth/login` - 로그인 (Turnstile 적용 🆕)
- `POST /auth/logout` - 로그아웃
- `POST /auth/forgot-password` - 비밀번호 찾기 (학번 입력 → 이메일 인증번호 발송)
- `POST /auth/verify-reset-code` - 비밀번호 재설정 인증번호 확인
- `POST /auth/reset-password` - 비밀번호 재설정

**마이페이지 (MyPage)** ⚠️ 로그인 필요
- `GET /mypage` - 내 프로필 조회
- `POST /mypage/password` - 비밀번호 변경
- `POST /mypage/verification-image` - 학적 인증 이미지 업로드

**관리자 (Admin)** ⚠️ 관리자 권한 필요
- `GET /admin/users/pending` - 승인 대기 회원 목록 조회
- `GET /admin/users` - 전체 회원 목록 조회
- `POST /admin/users/{user_id}/approve` - 회원 승인
- `POST /admin/users/{user_id}/reject` - 회원 거부
- `PATCH /admin/users/{user_id}/role` - 회원 역할 변경
- `PATCH /admin/users/{user_id}/membership` - 회비 납부 상태 변경
- `GET /admin/users/blocked` - 차단된 사용자 목록 조회 (IP 로그 포함)
- `POST /admin/users/{student_id}/unblock` - 사용자 차단 해제

**게시판 (Boards)**
- `GET /boards` - 게시판 목록 조회
- `GET /boards/{board_id}` - 게시판 상세 조회

**게시글 (Posts)** ⚠️ 작성은 관리자만 가능
- `GET /posts` - 게시글 목록 조회 (공개, 로그인 불필요)
  - board_id: 특정 게시판 필터링
  - is_pinned: 고정글 필터
  - search: 제목/내용 검색
- `GET /posts/{post_id}` - 게시글 상세 조회 (공개, 로그인 불필요)
- `POST /posts` - 게시글 작성 (admin, multipart/form-data)
- `PATCH /posts/{post_id}` - 게시글 수정 (admin)
- `DELETE /posts/{post_id}` - 게시글 삭제 (admin, Soft Delete)

**동아리 (Clubs)**
- `GET /clubs` - 동아리 목록 조회 (공개, 로그인 불필요)
- `GET /clubs/{club_id}` - 동아리 상세 조회 (공개, 로그인 불필요)
- `POST /clubs` - 동아리 추가 (admin, multipart/form-data)
- `PATCH /clubs/{club_id}` - 동아리 수정 (admin)
- `DELETE /clubs/{club_id}` - 동아리 삭제 (admin)

**행사 (Events)** 🆕
- `GET /events` - 행사 목록 조회 (공개, 로그인 불필요)
- `GET /events/{event_id}` - 행사 상세 조회 (공개, 로그인 불필요)
- `POST /events/{event_id}/register` - 행사 신청 (회원/비회원 모두 가능)
- `DELETE /events/{event_id}/register` - 신청 취소 (로그인 필요)
- `GET /events/{event_id}/my-registration` - 내 신청 확인 (로그인 필요)
- `POST /events/{event_id}/survey` - 만족도 조사 제출 (로그인 필요)
- `POST /events` - 행사 생성 (admin, multipart/form-data, 이미지 여러 장 가능)
- `PATCH /events/{event_id}` - 행사 수정 (admin)
- `DELETE /events/{event_id}` - 행사 삭제 (admin, Soft Delete)
- `GET /events/{event_id}/registrations` - 참가자 목록 (admin)
- `GET /events/{event_id}/survey/results` - 만족도 통계 (admin)

**복지사업 (Welfare)**
- `GET /welfare/locker_periods` - 사물함 정보 조회 (공개, 로그인 불필요)
- `PUT /welfare/locker_periods` - 사물함 정보 수정 (admin)
- `GET /welfare/welfare_rentals` - 물품대여 목록 조회 (공개, 로그인 불필요)
- `POST /welfare/welfare_rentals` - 물품대여 항목 추가 (admin, multipart/form-data)
- `PUT /welfare/welfare_rentals/{rental_id}` - 물품대여 항목 수정 (admin)
- `DELETE /welfare/welfare_rentals/{rental_id}` - 물품대여 항목 삭제 (admin)

**학생회 소개 (Introductions)**
- `GET /introductions/images` - 소개 이미지 목록 조회 (공개, 로그인 불필요)
- `POST /introductions/images` - 이미지 업로드 (admin, multipart/form-data)
- `PATCH /introductions/images/{image_id}` - 이미지 수정 (admin)
- `DELETE /introductions/images/{image_id}` - 이미지 삭제 (admin)

**건의함 (Suggestions)**
- `POST /suggestions` - 건의함 작성 (Turnstile 적용 🆕)
- `GET /suggestions` - 건의함 목록 조회 (본인 작성 건만 실명 표시)
- `GET /suggestions/{suggestion_id}` - 건의함 상세 조회
- `PATCH /suggestions/{suggestion_id}/status` - 건의함 상태 변경 (admin)

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
   💡 프론트엔드: password와 passwordConfirm 일치 확인 후 API 호출

5. 로그인 (POST /auth/login)
   ⚠️ pending 상태에서도 로그인 가능
   └─> 프론트엔드에서 verification_status 확인 후 마이페이지 유도

6. 학적 인증 이미지 업로드 (POST /users/me/verification-image)
   └─> 로그인 필수 (JWT 토큰 필요)
   └─> Private Storage에 저장
```

## 비밀번호 재설정 플로우 (로그인 전)

```
1. 비밀번호 찾기 (POST /auth/forgot-password)
   └─> 학번 입력
   └─> 등록된 이메일로 6자리 인증번호 발송 (5분 유효, 1분 1회 제한)

2. 인증번호 확인 (POST /auth/verify-reset-code)
   └─> 학번 + 인증번호 검증

3. 비밀번호 재설정 (POST /auth/reset-password)
   └─> 새 비밀번호 설정 (8자 이상)
   └─> 로그인 차단 정보도 자동 초기화
   💡 프론트엔드: newPassword와 newPasswordConfirm 일치 확인 후 API 호출
```
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

**Cloudflare R2 Storage Buckets:** (모두 Public)
- `club-images` - 동아리 이미지
- `event-images` - 행사 이미지 🆕
- `introduction-images` - 학생회 소개 이미지
- `post-attachments` - 공지사항 첨부파일
- `welfare-images` - 복지사업 물품 이미지

**설정:**
- **Public URL**: 각 버킷별 R2.dev 서브도메인 설정
- **업로드**: boto3 S3 호환 API 사용
- **접근**: Public URL로 영구 접근 가능

**학적 인증 이미지 업로드:**
- **엔드포인트**: `POST /mypage/verification-image`
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

**게시글 첨부파일 업로드:**
- **형식**: JPG, JPEG, PNG, PDF
- **크기**: 최대 10MB
- **저장소**: Cloudflare R2 (`post-attachments`)
- **요청 방식**: `POST /posts`에서 multipart/form-data로 게시글과 함께 업로드
- **접근**: Public URL로 영구적 접근 가능 (로그인 불필요)
- **제한**: 요청당 최대 5개

**동아리 이미지:**
- **저장소**: Cloudflare R2 (`club-images`)
- **접근**: Public URL로 영구적 접근 가능

**행사 이미지:** 🆕
- **저장소**: Cloudflare R2 (`event-images`)
- **형식**: JPG, JPEG, PNG
- **크기**: 최대 5MB (썸네일), 10MB (상세 이미지)
- **요청 방식**: 
  - 행사 생성: `POST /events` - multipart/form-data, 여러 장 업로드 가능
  - 이미지 추가: `POST /events/{event_id}/images` - 추가 업로드 가능
- **접근**: Public URL로 영구적 접근 가능

**복지사업 물품 이미지:**
- **저장소**: Cloudflare R2 (`welfare-images`)
- **형식**: JPG, JPEG, PNG
- **크기**: 최대 5MB
- **요청 방식**: `POST /welfare/welfare_rentals`에서 multipart/form-data로 업로드
- **접근**: Public URL로 영구적 접근 가능

**학생회 소개 이미지:**
- **저장소**: Cloudflare R2 (`introduction-images`)
- **형식**: JPG, JPEG, PNG
- **크기**: 최대 10MB
- **요청 방식**: `POST /introductions/images`에서 multipart/form-data로 업로드 (admin 전용)
- **접근**: Public URL로 영구적 접근 가능

### 📮 건의함

- **작성**: 승인된 사용자만 가능
- **익명 처리**: 
  - 일반 사용자: 본인 작성글만 실명 표시
  - council: 전체 목록 조회 가능, 작성자 익명
  - admin: 전체 목록 조회 가능, 작성자 실명 표시
- **제목 보호**: 본인 또는 관리자/학생회만 제목 조회 가능
- **상태 관리**: received(접수) → in_progress(처리중) → rejected(반려) / approved(승인)
- **사유/반영 내용**: 작성자 본인과 관리자만 확인 가능

### 📰 게시글 (Posts)

- **조회**: 로그인 불필요 (공개 API)
- **작성/수정/삭제**: 관리자만 가능
- **게시판별 조회**: board_id 파라미터로 필터링
- **필터링**: 
  - `board_id`: 특정 게시판 필터
  - `is_pinned`: 고정글만 조회
  - `search`: 제목 + 내용 검색
- **정렬**: 고정 게시글 우선, 최신순/오래된순
- **첨부파일**: 최대 5개, JPG/PNG/PDF, 10MB 제한, Public URL (영구적)
- **Soft Delete**: 삭제 시 is_deleted 플래그 변경 (복구 가능)

### 🎯 동아리 API

**공개 엔드포인트:**
- `GET /clubs` - 동아리 목록 조회
- `GET /clubs/{club_id}` - 동아리 상세 조회

**관리자 전용 엔드포인트:**
- `POST /clubs` - 동아리 추가 (multipart/form-data: name, description, website_url, image)
- `PATCH /clubs/{club_id}` - 동아리 정보 수정 (JSON: name, description, website_url)
- `DELETE /clubs/{club_id}` - 동아리 삭제

### 🎉 행사 API (Events)

**공개 엔드포인트 (인증 필요):**
- `GET /events` - 행사 목록 조회
  - Query: `include_inactive` (비활성 행사 포함 여부)
- `GET /events/{event_id}` - 행사 상세 조회 (이미지 포함)
- `POST /events/{event_id}/register` - 행사 참가 신청 ⭐
  - 회원: 자동으로 정보 사용 (학번, 이름, 전화번호)
  - 비회원: `guest_info` Body 필수 (student_id, name, phone)
  - 트랜잭션 처리: 정원 확인, 중복 방지, 선착순 번호 부여
- `DELETE /events/{event_id}/register` - 신청 취소
- `GET /events/{event_id}/my-registration` - 내 신청 확인
- `POST /events/{event_id}/survey` - 만족도 조사 제출 (1-5점 + 의견)

**관리자 전용 엔드포인트:**
- `POST /events` - 행사 생성 (multipart/form-data: 썸네일 업로드)
- `PATCH /events/{event_id}` - 행사 정보 수정
- `DELETE /events/{event_id}` - 행사 삭제 (Soft Delete)
- `POST /events/{event_id}/images` - 상세 이미지 추가 (여러 장 가능)
- `DELETE /events/{event_id}/images/{image_id}` - 이미지 삭제
- `GET /events/{event_id}/registrations` - 참가자 목록 (회원/비회원 구분)
- `GET /events/{event_id}/survey/results` - 만족도 통계

**특징:**
- 회원/비회원 모두 신청 가능
- 회원 이점: 자동 정보 입력, 마이페이지에서 내역 확인
- 선착순 신청: `register_for_event_guest()` DB 함수로 트랜잭션 처리
- 정원 관리: current_count/max_capacity 자동 관리
- 회비 납부자 전용: `require_membership=true` 설정 가능
- Soft Delete: 과거 행사 데이터 보존

### 📧 이메일 인증

- **발송**: Gmail HTTP API (OAuth2 refresh token 사용, `google-auth` 기반)
- **코드**: 6자리 랜덤 숫자
- **유효기간**: 5분
- **제한**: 1분에 1회 (Rate limiting)
- **저장소**: Supabase `email_verifications` 테이블

### 🚦 Rate Limiting

slowapi를 사용한 요청 횟수 제한:

- `POST /auth/send-verification` - 1분에 1회
- `POST /auth/login` - **IP 기반: 5분에 100회** (공용 IP 고려)
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

### 로그인 보안 (학번 기반 차단)

**누적 실패 횟수에 따른 차단 정책:**
- **누적 5회 실패** → 10분간 로그인 차단
- **누적 10회 실패** → 1시간 동안 로그인 차단
- **누적 15회 실패** → 영구 차단 (계정 삭제 안 함, 관리자 문의 필요)

**보안 기능:**
- 로그인 성공 시 실패 횟수 자동 초기화
- `login_attempts` 테이블: 모든 시도 기록 (학번, 성공/실패, IP, 시간)
- `login_blocks` 테이블: 차단 상태 관리 (실패 횟수, 차단 만료 시각, 차단 사유)
- 실패 시 남은 횟수 표시 (예: "실패 3/15")
- 차단 중일 때 남은 시간 안내

**악의적 공격 방어:**
- 15회 실패 시 계정 삭제하지 않고 **영구 차단**만 적용
- 관리자가 `/admin/users/blocked` API로 IP 로그 확인
- 실제 본인 확인 시 `/admin/users/{student_id}/unblock` API로 차단 해제
- 타인 학번으로 공격해도 계정 삭제되지 않음

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

## Cloudflare R2 Storage 설정

### Bucket 구조

프로젝트는 5개의 R2 Public bucket을 사용합니다:

1. **club-images**
   - 용도: 동아리 이미지
   - 접근: Public URL (R2.dev)

2. **event-images** 🆕
   - 용도: 행사 이미지
   - 접근: Public URL (R2.dev)

3. **introduction-images**
   - 용도: 학생회 소개 이미지
   - 접근: Public URL (R2.dev)

4. **post-attachments**
   - 용도: 공지사항 첨부파일
   - 접근: Public URL (R2.dev)

5. **welfare-images**
   - 용도: 복지사업 물품 이미지
   - 접근: Public URL (R2.dev)

### R2 Bucket 생성 방법

1. Cloudflare Dashboard → R2 → Create bucket
2. Bucket name 입력 (예: `club-images`)
3. Location: Automatic
4. **Public Access 활성화**:
   - Settings → Public Access → Allow Access
   - R2.dev subdomain 자동 생성됨
5. 생성된 R2.dev URL을 `.env` 파일의 해당 변수에 설정

### API Keys 발급

1. Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Create API Token
3. Permissions: Object Read & Write
4. 생성된 키를 `.env` 파일에 설정:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`

### Supabase Storage 설정 (학적 인증용)

**Private Bucket 생성** (학적 인증 이미지 전용):

1. Supabase Dashboard → Storage
2. `New bucket` 클릭
3. Name: `verification-images`
4. **Public bucket**: ❌ 체크 해제 (Private)
5. `Create bucket`

> **Note**: Cloudflare R2로 마이그레이션 완료. 학적 인증 이미지만 Supabase Private Storage 사용.
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

### 동아리 API

**공개 엔드포인트:**
- `GET /clubs` - 동아리 목록 조회
- `GET /clubs/{club_id}` - 동아리 상세 조회

**관리자 전용 엔드포인트:**
- `POST /clubs` - 동아리 추가 (multipart/form-data: name, description, website_url, image)
- `PATCH /clubs/{club_id}` - 동아리 정보 수정 (JSON: name, description, website_url)
- `DELETE /clubs/{club_id}` - 동아리 삭제

### 학생회 소개 이미지 API

**공개 엔드포인트:**
- `GET /introductions/images` - 학생회 소개 이미지 목록 조회
  - Query: `active_only` (boolean, 기본값: true)

**관리자 전용 엔드포인트:**
- `POST /introductions/images` - 이미지 업로드 (multipart/form-data: title, display_order, image)
  - 최대 10MB, jpg/jpeg/png만 허용
  - Storage 정책: 모든 사용자 읽기 가능, 관리자만 쓰기/수정/삭제
- `PATCH /introductions/images/{image_id}` - 이미지 정보 수정 (JSON: title, display_order, is_active)
- `DELETE /introductions/images/{image_id}` - 이미지 삭제

### 페이지네이션
- 기본 페이지 크기: 20 (posts API 기본값)

### 기타 업데이트
- `db/reset.sql` 스크립트가 `db/`에 추가되어 데이터 초기화 및 시퀀스 리셋을 돕습니다.
- 배포용 예시 환경 파일 `.env.render.example`를 루트에 추가했습니다. 민감값은 Render Secrets에 설정하세요.
- Google Sheets API 통합으로 복지사업 물품 재고를 실시간 조회합니다.

### 마이그레이션

데이터베이스 스키마 변경 사항은 `db/migrations/` 디렉토리에 순차적으로 관리됩니다:

1. `001_update_clubs_table.sql` - 동아리 테이블 업데이트
2. `002_update_locker_periods_table.sql` - 사물함 기간 테이블 업데이트
3. `003_redesign_welfare_system.sql` - 복지사업 시스템 재설계 (Google Sheets 통합)
4. `004_add_login_attempt_tracking.sql` - 로그인 시도 추적 및 차단 시스템
5. `005_add_password_reset_table.sql` - 비밀번호 재설정 테이블 추가
6. `006_create_introduction_images_storage.sql` - 학생회 소개 이미지 (Supabase Storage 정책 - 더 이상 사용 안 함)
7. `007_add_guest_registration_support.sql` - 비회원 행사 신청 지원 🆕

마이그레이션 실행 (Supabase SQL Editor):
```sql
-- 각 파일의 SQL을 복사해서 SQL Editor에 붙여넣고 Run
```

> **Note**: Migration 006은 Cloudflare R2로 마이그레이션 완료되어 더 이상 사용하지 않음.

## 보안 기능

### Cloudflare Turnstile (봇 방지) 🆕

다음 API에 Turnstile 캡챠가 적용되어 있습니다:
- 회원가입
- 로그인
- 건의함 작성

**설정 방법**: [TURNSTILE_SETUP_GUIDE.md](TURNSTILE_SETUP_GUIDE.md) 참고

**동작 방식**:
- `TURNSTILE_SECRET_KEY`가 설정된 경우: 모든 요청에 `turnstile_token` 필요
- `TURNSTILE_SECRET_KEY`가 미설정된 경우: 검증 우회 (개발 환경)

**프론트엔드 Site Key**: `.env`의 `TURNSTILE_SITE_KEY` 값을 프론트엔드에 전달

### 로그인 보안

- 5회 실패 → 10분 차단
- 10회 실패 → 1시간 차단
- 15회 실패 → 영구 차단 (관리자 해제 필요)
- IP 기반 로깅

### RLS (Row Level Security)

- Supabase Storage의 private 버킷(verification-images)에 RLS 정책 적용
- 학적 인증 이미지는 관리자만 조회 가능

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
