# 서울과기대 컴공학생회 홈페이지 백엔드

FastAPI + Supabase 기반 학생회 홈페이지 백엔드 API

## 기술 스택

- **Framework**: FastAPI 0.115.0
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (JWT)
- **Storage**: Supabase Storage (Private bucket)
 - **Email**: Gmail HTTP API (google-auth/googleapiclient) — migrated from SMTP
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
│   │   ├── auth.py          # 인증 관련 API
│   │   ├── admin.py         # 관리자 API
│   │   ├── users.py         # 마이페이지 API (경로: /mypage)
│   │   ├── notices.py       # 공지사항 API (boards + posts 통합)
│   │   ├── clubs.py         # 동아리 API
│   │   ├── welfare.py       # 복지사업 API (사물함, 물품대여)
│   │   └── suggestions.py   # 건의함 API
│   ├── schemas/             # Pydantic 스키마
│   │   ├── __init__.py
│   │   ├── auth.py          # 인증 요청/응답 모델
│   │   ├── admin.py         # 관리자 요청/응답 모델
│   │   ├── users.py         # 사용자 요청/응답 모델
│   │   ├── notices.py       # 공지사항 요청/응답 모델
│   │   ├── clubs.py         # 동아리 요청/응답 모델
│   │   ├── welfare.py       # 복지사업 요청/응답 모델
│   │   └── suggestions.py   # 건의함 요청/응답 모델
│   └── utils/               # 유틸리티
│       ├── __init__.py
│       ├── email.py         # 이메일 발송
│       ├── auth.py          # 인증/권한 미들웨어
│       ├── storage.py       # 파일 업로드 관리
│       └── sheets.py        # Google Sheets API
├── db/
│   ├── schema.sql           # 데이터베이스 스키마
│   ├── reset.sql            # 데이터 초기화 스크립트
│   ├── migrations/          # 마이그레이션 SQL 파일
│   │   ├── 001_update_clubs_table.sql
│   │   ├── 002_update_locker_periods_table.sql
│   │   └── README.md
│   └── README.md
├── .env                     # 환경변수 (gitignore)
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
SUPABASE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Gmail HTTP API (OAuth2)
# Use OAuth2 client ID/secret + refresh token for the Gmail HTTP API migration.
GMAIL_CLIENT_ID=your_gmail_oauth_client_id
GMAIL_CLIENT_SECRET=your_gmail_oauth_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
GMAIL_FROM_EMAIL=your_email@gmail.com
GMAIL_FROM_NAME=서울과기대 컴공학생회

# Security
SECRET_KEY=your_secret_key_here
ALLOWED_EMAIL_DOMAIN=seoultech.ac.kr

# Google Sheets API (for welfare rental items inventory)
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key

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
- `POST /auth/signup` - 회원가입
- `POST /auth/login` - 로그인
- `POST /auth/logout` - 로그아웃
- `POST /auth/forgot-password` - 비밀번호 찾기 (학번 입력 → 이메일 인증번호 발송) 🆕
- `POST /auth/verify-reset-code` - 비밀번호 재설정 인증번호 확인 🆕
- `POST /auth/reset-password` - 비밀번호 재설정 🆕

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
- `GET /admin/users/blocked` - 차단된 사용자 목록 조회 (IP 로그 포함) 🆕
- `POST /admin/users/{student_id}/unblock` - 사용자 차단 해제 🆕

**공지사항 (Notices)** ⚠️ 작성은 관리자만 가능
- `GET /notices` - 공지사항 목록 조회 (공개, 로그인 불필요)
  - mainCategory: `student_council` (학생회), `democracy` (민주자치)
  - subCategory: `all`, `event` (행사), `welfare` (복지), `announcement` (공고), `notice` (고시), `meeting` (대표자회의), `rules` (학생회칙)
- `GET /notices/{notice_id}` - 공지사항 상세 조회 (공개, 로그인 불필요)
- `POST /notices` - 공지사항 작성 (admin)
- `PATCH /notices/{notice_id}` - 공지사항 수정 (admin)
- `DELETE /notices/{notice_id}` - 공지사항 삭제 (admin, Soft Delete)

**동아리 (Clubs)** 🆕
- `GET /clubs` - 동아리 목록 조회 (공개, 로그인 불필요)
- `GET /clubs/{club_id}` - 동아리 상세 조회 (공개, 로그인 불필요)

**복지사업 (Welfare)** 🆕
- `GET /welfare/locker_periods` - 사물함 정보 조회 (공개, 로그인 불필요)
  - 사물함 배치도 이미지 URL, 신청 구글폼 URL 포함
- `PUT /welfare/locker_periods` - 사물함 정보 수정 (admin)
- `GET /welfare/welfare_rentals` - 물품대여 목록 조회 (공개, 로그인 불필요)
  - Google Sheets에서 실시간 재고 수량 조회
- `POST /welfare/welfare_rentals` - 물품대여 항목 추가 (admin, multipart/form-data)
- `PUT /welfare/welfare_rentals/{rental_id}` - 물품대여 항목 수정 (admin)
- `DELETE /welfare/welfare_rentals/{rental_id}` - 물품대여 항목 삭제 (admin)

**건의함 (Suggestions)**
- `POST /suggestions` - 건의함 작성 (익명)
- `GET /suggestions` - 건의함 목록 조회
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

**Supabase Storage Buckets:**
- `club-images` (🌐 Public) - 동아리 이미지
- `post-attachments` (🌐 Public) - 공지사항 첨부파일
- `verification-images` (🔒 Private) - 학번 인증 이미지
- `welfare-images` (🌐 Public) - 복지사업 물품 이미지

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

**공지사항 첨부파일 업로드:**
- **형식**: JPG, JPEG, PNG, PDF
- **크기**: 최대 10MB
- **저장소**: Supabase Storage Public bucket (`post-attachments`)
- **요청 방식**: `POST /notices`에서 multipart/form-data로 게시글과 함께 업로드
- **접근**: Public URL로 영구적 접근 가능 (로그인 불필요)
- **제한**: 요청당 최대 5개

**동아리 이미지:**
- **저장소**: Supabase Storage Public bucket (`club-images`)
- **접근**: Public URL로 영구적 접근 가능

**복지사업 물품 이미지:**
- **저장소**: Supabase Storage Public bucket (`welfare-images`)
- **형식**: JPG, JPEG, PNG
- **크기**: 최대 5MB
- **요청 방식**: `POST /welfare/welfare_rentals`에서 multipart/form-data로 업로드
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

### 📰 공지사항

- **조회**: 로그인 불필요 (공개 API)
- **작성/수정/삭제**: 관리자만 가능
- **카테고리 구조**:
  - **학생회** (student_council): 행사(event), 복지(welfare)
  - **민주자치** (democracy): 공고(announcement), 고시(notice), 대표자회의(meeting), 학생회칙(rules)
- **필터링**: `mainCategory`와 `subCategory`로 게시글 조회
  - 예: `GET /notices?mainCategory=student_council&subCategory=event`
  - `subCategory=all`로 해당 카테고리 전체 조회
- **검색**: 제목 + 내용 검색 지원
- **정렬**: 고정 게시글 우선, 최신순/오래된순
- **첨부파일**: 최대 5개, JPG/PNG/PDF, 10MB 제한, Public URL (영구적)
- **Soft Delete**: 삭제 시 is_deleted 플래그 변경 (복구 가능)

### 🎯 동아리

- **조회**: 로그인 불필요 (공개 API)
- **필드**: 동아리명, 이미지, 소개, 웹사이트 URL
- **이미지**: Public bucket (`club-images`) 저장
- **관리**: 관리자 페이지에서 CRUD (향후 구현 예정)

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

## Supabase Storage 설정

### Bucket 구조

프로젝트는 3개의 Storage bucket을 사용합니다:

1. **club-images** (🌐 Public)
   - 용도: 동아리 이미지
   - 접근: Public URL로 영구 접근
   - 생성 방법: Dashboard → Storage → New bucket → Public 체크

2. **post-attachments** (🌐 Public)
   - 용도: 공지사항 첨부파일
   - 접근: Public URL로 영구 접근
   - 생성 방법: Dashboard → Storage → New bucket → Public 체크

3. **verification-images** (🔒 Private)
   - 용도: 학번 인증 이미지
   - 접근: Signed URL (1시간 유효)
   - 생성 방법: Dashboard → Storage → New bucket → Public 체크 해제

### Private Bucket 생성

1. Supabase Dashboard → Storage
2. `New bucket` 클릭
3. Name: `verification-images`
4. **Public bucket**: ❌ 체크 해제 (Private)
5. `Create bucket`

### Public Bucket 생성

1. Supabase Dashboard → Storage
2. `New bucket` 클릭
3. Name: `club-images`, `post-attachments`, 또는 `welfare-images`
4. **Public bucket**: ✅ 체크
5. `Create bucket`

### RLS (Row Level Security) 정책

Public buckets의 경우 다음 정책 설정:

```sql
-- welfare-images bucket 예시
-- 1. Public read policy
INSERT INTO storage.policies (bucket_id, name, definition, operation, type)
VALUES ('welfare-images', 'Public read access', 'true', 'SELECT', 'PERMISSIVE');

-- 2. Authenticated insert policy
INSERT INTO storage.policies (bucket_id, name, definition, operation, type)
VALUES ('welfare-images', 'Authenticated insert', '(SELECT auth.role()) = ''authenticated''', 'INSERT', 'PERMISSIVE');

-- 3. Authenticated update policy
INSERT INTO storage.policies (bucket_id, name, definition, operation, type)
VALUES ('welfare-images', 'Authenticated update', '(SELECT auth.role()) = ''authenticated''', 'UPDATE', 'PERMISSIVE');

-- 4. Authenticated delete policy
INSERT INTO storage.policies (bucket_id, name, definition, operation, type)
VALUES ('welfare-images', 'Authenticated delete', '(SELECT auth.role()) = ''authenticated''', 'DELETE', 'PERMISSIVE');
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

### 페이지네이션
- 기본 페이지 크기: 20 (posts API 기본값)

### 기타 업데이트
- `db/reset.sql` 스크립트가 `db/`에 추가되어 데이터 초기화 및 시퀀스 리셋을 돕습니다.
- 배포용 예시 환경 파일 `.env.render.example`를 루트에 추가했습니다. 민감값은 Render Secrets에 설정하세요.
- Google Sheets API 통합으로 복지사업 물품 재고를 실시간 조회합니다.

### 마이그레이션

데이터베이스 스키마 변경 사항은 `db/migrations/` 디렉토리에 순차적으로 관리됩니다:

1. `001_add_clubs_table.sql` - 동아리 테이블 추가
2. `002_add_clubs_description.sql` - 동아리 설명 컬럼 추가
3. `003_redesign_welfare_system.sql` - 복지사업 시스템 재설계 (Google Sheets 통합)

마이그레이션 실행:
```bash
psql -h <host> -U <user> -d <database> -f db/migrations/005_add_password_reset_table.sql
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
