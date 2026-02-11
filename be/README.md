# 서울과학기술대학교 컴퓨터공학과 학생회 홈페이지 Backend

이 프로젝트는 서울과학기술대학교 컴퓨터공학과 학생회 홈페이지의 백엔드 서버입니다.
FastAPI를 기반으로 구축되었으며, Supabase(Database, Auth)와 Cloudflare R2(Storage)를 사용합니다.

---

## 1. Intro (소개)

### 기술 스택 (Tech Stack)
- **Language**: Python 3.12
- **Framework**: FastAPI
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (JWT)
- **Storage**: 
  - 학적인증 이미지: Supabase Storage
  - 그 외 이미지 및 첨부파일/문서: Cloudflare R2 (S3 Compatible)
- **Hosting**: Fly.io
- **Security**: Cloudflare Turnstile (CAPTCHA)

### 주요 기능
- 학생회비 납부 내역 조회 및 관리
- 공지사항, 학생회 소개, 복지 게시판 관리
- 사물함 신청 및 관리
- 활동 보고 및 수요 조사

---

## 2. API 구조

주요 API 엔드포인트는 `app/routes` 디렉토리에 정의되어 있습니다.

| 태그 | 역할 | 주요 기능 |
|------|------|-----------|
| **Auth** | 인증 | 회원가입(Turnstile), 로그인(Turnstile), 비밀번호 재설정 |
| **Users** | 사용자 | 내 정보 조회, 비밀번호 변경, 회원탈퇴 |
| **Admin** | 관리자 | 회원 승인/거절, 역할 변경, 학생회비 관리 |
| **Notices** | 공지사항 | 공지사항 CRUD, 상단 고정 |
| **Activities** | 활동 | 행사 신청, 수요조사, 건의사항 |
| **Welfare** | 복지 | 대여 사업 및 사물함 신청 |

> 상세한 API 명세는 서버 실행 후 `http://localhost:8000/docs` (Swagger UI)에서 확인할 수 있습니다.

---

## 3. Database (Supabase)

Supabase의 Managed PostgreSQL을 사용합니다. 모든 테이블 스키마는 `db/schema.sql` 파일에 정의되어 있습니다.

### 주요 테이블
- **`users`**: 사용자 정보 (Supabase Auth와 연동). `student_id`, `name`, `role` 등 저장.
- **`activity_registrations`**: 행사 신청 내역.
- **`posts`**: 공지사항 및 게시글.
- **`lockers`**: 사물함 정보.

### 주의사항 (RLS & 권한)
- **RLS (Row Level Security)**: 대부분의 테이블에 RLS 정책이 적용되어 있어, API 단에서 적절한 Auth Token이 없으면 데이터를 조회/수정할 수 없습니다.
- **Admin Client**: 백엔드 코드(`app/database.py`)에서 `get_fresh_admin_client()`를 사용하여 RLS를 우회하는 관리자 작업을 수행합니다.

---

## 4. 로컬 서버 실행 방법 (Local Dev)

### 필수 요구사항
- Python 3.12+
- `.env` 파일 (관리자에게 요청하여 `.env.example`을 참고해 생성)

### 실행 단계
1. **가상환경 생성 및 활성화**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Mac/Linux
   # .venv\Scripts\activate  # Windows
   ```

2. **라이브러리 설치**
   ```bash
   pip install -r requirements.txt
   ```

3. **서버 실행**
   ```bash
   uvicorn app.main:app --reload
   ```
   서버가 시작되면 `http://localhost:8000`에서 접속 가능합니다.

---

## 5. 서버 배포 및 관리 (Fly.io)

이 서버는 **Fly.io**에 배포되어 있습니다.

### 배포 방법
1. **Fly CLI 설치**: [설치 가이드](https://fly.io/docs/hands-on/install-flyctl/)
2. **로그인**: `fly auth login`
3. **배포**:
   ```bash
   fly deploy
   ```
   > `--ha=false` 옵션을 붙이면 단일 인스턴스로 빠르게 배포됩니다.

### 로그 확인
실시간 로그를 확인하여 에러를 추적할 수 있습니다.
```bash
fly logs -a seoultech-cse-backend
```

---

## 6. 스토리지 (Storage)

### 1) Supabase Storage
- 용도: 학생증 인증 이미지 등 이미지 파일 저장
- 버킷: `verification-images` (비공개)
- 관리: Supabase 대시보드 또는 API

### 2) Cloudflare R2
- 용도: 공지사항 첨부파일, 활동 내역 등 대용량 파일
- 특징: AWS S3 호환 API(`boto3`)를 사용하며 출력 대역폭 비용이 무료입니다.
- 설정: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` 등의 환경변수 필요.

---

## 7. 테스트 방법

### 로컬 테스트
1. 서버 실행 (`uvicorn ...`)
2. 브라우저에서 `http://localhost:8000/docs` 접속.
3. Swagger UI에서 API 직접 호출 테스트.

### 서버 테스트 (배포 후)
1. `https://seoultech-cse-backend.fly.dev/docs` 접속.
2. `Authorize` 버튼을 눌러 로그인 토큰 입력 (Bearer Token).
3. API 호출 테스트.

---

## 8. 로깅 (Logging)

서버는 Python의 표준 `logging` 모듈을 사용하여 구조화된 로그를 출력합니다.

### 로그 레벨
환경변수 `LOG_LEVEL`을 설정하여 로그 출력 수준을 조절할 수 있습니다.

| 레벨 | 설명 | 용도 |
|------|------|------|
| **DEBUG** | 상세한 디버깅 정보 | 개발 환경, 문제 추적 |
| **INFO** | 일반 정보 메시지 | 기본 운영 정보 (기본값) |
| **WARNING** | 경고 메시지 | 잠재적 문제 상황 |
| **ERROR** | 오류 메시지 | 오류 발생 시 |

### 로그 레벨 설정 방법

**로컬 개발 환경 (.env 파일):**
```bash
LOG_LEVEL=DEBUG  # 상세 로그
# 또는
LOG_LEVEL=INFO   # 일반 로그 (기본값)
```

**프로덕션 환경 (Fly.io Secrets):**
```bash
fly secrets set LOG_LEVEL=INFO
```

### 로그 형식
```
[레벨] 타임스탬프 - 모듈명:함수명:라인 - 메시지
```

예시:
```
[INFO] 2024-01-15 10:30:45 - app.main:startup:25 - DB 워밍업 완료
[ERROR] 2024-01-15 10:31:20 - app.routes.auth:login:284 - users 테이블 insert 실패: ...
[WARNING] 2024-01-15 10:32:00 - app.utils.r2_storage:delete:390 - 파일 삭제 실패: ...
```

### 로그 확인

**로컬:**
터미널에서 실시간 출력됩니다.

**프로덕션 (Fly.io):**
```bash
fly logs -a seoultech-cse-backend
```

---

## 9. 기타 유지보수 참고사항

### 싱글톤 클라이언트 주의
Supabase 클라이언트(`supabase`)는 서버 전체에서 공유되는 싱글톤입니다.
**절대 `supabase.auth.sign_in_with_password()`를 직접 호출하지 마세요.**
서버의 인증 상태가 해당 유저로 고정되어 버립니다. 반드시 `app/database.py`의 `get_fresh_admin_client()`를 사용하여 **새로운 클라이언트 인스턴스**를 만들어야 합니다.

### 환경변수 관리
`fly.toml`에는 민감한 정보가 없습니다. 모든 Secret Key(DB URL, API Key 등)는 Fly.io Secrets로 관리해야 합니다.
```bash
fly secrets set KEY=VALUE
```

---

## 10. 문의

개발 관련 문의나 인수는 아래 이메일로 연락주세요.

📧 **이메일**: ehgis2344@seoultech.ac.kr
