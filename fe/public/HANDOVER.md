# 🏫 서울과기대 컴공학생회 백엔드 인수인계 매뉴얼

> **최종 업데이트**: 2026년 2월  
> **연락처**: ehgis2344@seoultech.ac.kr

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택 및 아키텍처](#2-기술-스택-및-아키텍처)
3. [환경 변수 관리](#3-환경-변수-관리)
4. [서버 관리 (Fly.io)](#4-서버-관리-flyio)
5. [데이터베이스 관리 (Supabase)](#5-데이터베이스-관리-supabase)
6. [스토리지 관리](#6-스토리지-관리)
7. [인증 및 보안](#7-인증-및-보안)
8. [API 라우트 구조](#8-api-라우트-구조)
9. [관리자 계정 관리](#9-관리자-계정-관리)
10. [Gmail Refresh Token 재발급](#10-gmail-refresh-token-재발급)
11. [모니터링 및 디버깅](#11-모니터링-및-디버깅)
12. [자주 발생하는 문제와 해결](#12-자주-발생하는-문제와-해결)
13. [주의사항 및 금지사항](#13-주의사항-및-금지사항)
14. [연간 운영 체크리스트](#14-연간-운영-체크리스트)

> ℹ️ **이 문서는 백엔드 코드 없이 웹 대시보드만으로 운영하는 것을 기준으로 작성되었습니다.**

---

## 1. 프로젝트 개요

서울과학기술대학교 컴퓨터공학과 학생회 공식 홈페이지의 백엔드 API 서버입니다.

### 주요 기능
- **회원 관리**: 학교 이메일(@seoultech.ac.kr) 인증 → 학적 이미지 업로드 → 관리자 승인
- **공지사항**: 학생회 공지 / 민주자치 공지 (관리자만 작성)
- **건의함**: 익명 건의 제출 및 관리자 답변
- **행사/활동**: 통합 활동 관리 (행사/설문/수요조사/카톡방/회비납부/공지)
- **동아리**: 동아리 소개 및 관리
- **복지사업**: 물품 대여(구글시트 연동), 사물함, 프린트 복지, 가이드북
- **통합 검색**: 활동·공지·동아리 통합 검색 API

---

## 2. 기술 스택 및 아키텍처

### 기술 스택
| 구분 | 기술 | 비고 |
|------|------|------|
| **런타임** | Python 3.12 | FastAPI 프레임워크 |
| **DB** | Supabase (PostgreSQL) | 리전: `ap-northeast-2` (서울) |
| **인증** | Supabase Auth | JWT 토큰 기반 |
| **파일 스토리지** | Cloudflare R2 + Supabase Storage | 용도별 분리 (아래 참조) |
| **서버 호스팅** | Fly.io | 리전: `nrt` (도쿄), Docker 기반 |
| **이메일** | Gmail API (OAuth 2.0) | 인증번호 발송 |
| **CAPTCHA** | Cloudflare Turnstile | 봇 방지 |
| **물품 재고** | Google Sheets API | 실시간 재고 연동 |

### 아키텍처 흐름
```
[프론트엔드 (Vercel)]
        │
        ▼
[Fly.io - FastAPI 서버 (도쿄)]
        │
        ├──▶ Supabase DB (서울) ─── PostgreSQL + Auth
        ├──▶ Cloudflare R2 ─────── 파일 스토리지 (Presigned URL)
        ├──▶ Supabase Storage ──── 학적 인증 이미지 (private)
        ├──▶ Gmail API ─────────── 이메일 발송
        ├──▶ Google Sheets API ─── 대여 물품 재고
        └──▶ Cloudflare Turnstile ─ CAPTCHA 검증
```



---

## 3. 환경 변수 관리

### 환경변수 목록

| 변수 | 설명 | 발급처 |
|------|------|--------|
| **Supabase** | | |
| `SUPABASE_URL` | Supabase 프로젝트 URL | Supabase Dashboard → Settings → API |
| `SUPABASE_KEY` | **Service Role Key** (RLS 우회, 서버 전용) | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Anon Key | Supabase Dashboard → Settings → API |
| **Gmail API** | | |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret | Google Cloud Console |
| `GOOGLE_REFRESH_TOKEN` | OAuth Refresh Token (**주기적 갱신 필요**) | OAuth Playground |
| `GMAIL_FROM_EMAIL` | 발신 이메일 주소 | - |
| `GMAIL_FROM_NAME` | 발신자 이름 (예: "컴공학생회") | - |
| **Google Sheets** | | |
| `GOOGLE_SHEETS_API_KEY` | Sheets API Key (읽기 전용) | Google Cloud Console |
| **Cloudflare R2** | | |
| `R2_ACCOUNT_ID` | Cloudflare 계정 ID | Cloudflare Dashboard |
| `R2_ACCESS_KEY_ID` | R2 API 토큰 Access Key | Cloudflare R2 → Manage API Tokens |
| `R2_SECRET_ACCESS_KEY` | R2 API 토큰 Secret Key | Cloudflare R2 → Manage API Tokens |
| `R2_CLUB_IMAGES_URL` | club-images 버킷 Public URL | R2 → 버킷 → Settings → Public access |
| `R2_EVENT_IMAGES_URL` | event-images 버킷 Public URL | 위와 동일 |
| `R2_INTRODUCTION_IMAGES_URL` | introduction-images 버킷 Public URL | 위와 동일 |
| `R2_POST_ATTACHMENTS_URL` | post-attachments 버킷 Public URL | 위와 동일 |
| `R2_WELFARE_IMAGES_URL` | welfare-images 버킷 Public URL | 위와 동일 |
| **Cloudflare Turnstile** | | |
| `TURNSTILE_SECRET_KEY` | Turnstile Secret Key (미설정 시 검증 우회) | Cloudflare Turnstile |
| `TURNSTILE_SITE_KEY` | Turnstile Site Key | Cloudflare Turnstile |
| **보안/기타** | | |
| `SECRET_KEY` | 앱 시크릿 키 | 랜덤 생성 |
| `ALLOWED_EMAIL_DOMAIN` | 허용 이메일 도메인 (예: `seoultech.ac.kr`) | - |
| `ENVIRONMENT` | 환경 (`development` / `production`) | - |
| `FRONTEND_URL` | CORS 허용 URL (쉼표 구분 가능) | - |

### 환경변수 확인/수정 방법 (Fly.io Dashboard)
```
1. https://fly.io/dashboard 접속 → 로그인
2. seoultech-cse-backend 앱 클릭
3. 좌측 메뉴 → Secrets 클릭
4. 환경변수 목록 확인 가능 (값은 숨김 처리됨)
5. 수정: 해당 Secret 옆 연필 아이콘 클릭 → 새 값 입력 → Save
6. 추가: "Add a secret" 버튼 클릭 → 이름과 값 입력 → Save
7. 삭제: 해당 Secret 옆 휴지통 아이콘 클릭
```

> ⚠️ **중요**: Secret을 변경하면 서버가 자동으로 재시작됩니다.

---

## 4. 서버 관리 (Fly.io)

### 기본 정보
| 항목 | 값 |
|------|-----|
| 앱 이름 | `seoultech-cse-backend` |
| 리전 | `nrt` (도쿄) |
| 스펙 | shared CPU 1x, 512MB RAM |
| 포트 | 8080 (내부), HTTPS (외부) |
| 최소 머신 수 | 1 (항상 가동) |
| 자동 중지 | 비활성화 (`auto_stop_machines = false`) |

### Dashboard 접근
```
https://fly.io/dashboard → 로그인 → seoultech-cse-backend 클릭
```

### 서버 상태 확인
```
Dashboard → Overview 탭
- Status: Deployed (정상), Suspended (중지됨)
- 머신 상태, 메모리/CPU 사용량 확인 가능
```

### 로그 확인
```
Dashboard → Logs & Errors 탭
- 실시간 로그 스트리밍
- 에러 로그 검색 가능 (ERROR, 500, 429 등으로 필터)
```

### 머신 재시작
```
Dashboard → Machines 탭 → 해당 머신 → 우측 ⋯ 메뉴 → Restart
```

### 스케일링 (메모리/CPU 변경)
```
Dashboard → Machines 탭 → 해당 머신 → Configuration
- Memory: 512MB → 1024MB 등으로 변경 가능
- CPU: shared-cpu-1x → shared-cpu-2x 등으로 변경 가능
```

### 현재 서버 설정
| 항목 | 현재 설정 |
|------|----------|
| 포트 | 8080 (내부), HTTPS (외부) |
| 자동 중지 | 꺼짐 (항상 가동) |
| 최소 머신 수 | 1대 |
| 헬스체크 | 30초 간격으로 `GET /` 호출 |

---

## 5. 데이터베이스 관리 (Supabase)

### 접속 정보
- **Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
- **리전**: `ap-northeast-2` (서울)
- **직접 DB URL**: Supabase Dashboard → Settings → Database → Connection string

### 테이블 구조 요약

| 테이블 | 설명 | 비고 |
|--------|------|------|
| `users` | 사용자 정보 | Supabase Auth UUID 참조 |
| `email_verifications` | 이메일 인증 코드 | 5분 만료 |
| `password_resets` | 비밀번호 재설정 | 5분 만료 |
| `login_attempts` | 로그인 시도 기록 | 보안 추적 |
| `login_blocks` | 로그인 차단 | 5회→10분, 10회→1시간, 15회→영구 |
| `rejected_users` | 거절된 사용자 아카이브 | - |
| `profile_update_requests` | 프로필 변경 요청 | 관리자 승인 필요 |
| `boards` | 게시판 메타 | 3개 고정 (학생회/민주자치/건의함) |
| `posts` | 게시글 | Soft Delete, Draft 지원 |
| `attachments` | 게시글 첨부파일 | R2 URL 저장 |
| `suggestions` | 건의함 | 익명, 상태 관리 |
| `clubs` | 동아리 | - |
| `club_introduction_images` | 동아리 소개 이미지 | - |
| `introduction_images` | 학생회 소개 이미지 | - |
| `activities` | 통합 활동 | event/survey/demand_survey 등 |
| `activity_images` | 활동 이미지 | - |
| `activity_registrations` | 활동 신청 | 선착순 처리 (DB Function) |
| `rental_items` | 대여 물품 | 구글시트 연동 |
| `locker_info` | 사물함 정보 | - |
| `print_welfare_info` | 프린트 복지 정보 | 싱글 행 테이블 |
| `guidebook_info` | 가이드북 정보 | 싱글 행 테이블 |
| `privacy_officer_info` | 개인정보 책임자 | 싱글 행 테이블 |

### 사용자 역할 체계
```
student (기본) → admin (관리자)
```
- `student`: 일반 사용자 (공지 열람, 건의함 작성, 행사 신청)
- `admin`: 관리자 (모든 권한 — 공지 작성, 회원 승인, 행사 관리)

> `council` 역할은 deprecated. 코드에 `require_council`이 남아있지만 내부적으로 `require_admin`과 동일하게 동작합니다.

### 주요 DB 함수 (PostgreSQL)
```sql
-- 선착순 활동 신청 (동시성 처리)
register_for_activity(p_activity_id, p_user_id, p_name, p_student_id, p_phone, p_is_anonymous)

-- 활동 신청 취소
cancel_activity_registration(p_activity_id, p_user_id)
```

### DB 초기화
**⚠️ 모든 데이터가 삭제됩니다!** 신규 환경 셋업 또는 테스트 DB에만 사용하세요.

```
1. Supabase Dashboard → SQL Editor → New query
2. db/reset.sql 내용을 붙여넣기
3. Run 클릭
4. 관리자 계정은 Supabase Dashboard → Auth → Users 에서 수동 생성
   또는 홈페이지에서 회원가입 후 아래 SQL로 관리자 승격:
   UPDATE users SET role = 'admin', verification_status = 'approved' WHERE student_id = '학번';
```

### SQL Editor 접근
```
Supabase Dashboard → SQL Editor → New query
```

자주 쓰는 쿼리:
```sql
-- 사용자 역할 확인/변경
SELECT id, name, student_id, role, verification_status FROM users WHERE student_id = '학번';
UPDATE users SET role = 'admin' WHERE student_id = '학번';

-- Draft 게시글 정리 (고아 draft)
DELETE FROM posts WHERE is_draft = true AND created_at < NOW() - INTERVAL '1 day';

-- 활동 신청 인원 수 보정
UPDATE activities SET current_count = (
  SELECT COUNT(*) FROM activity_registrations WHERE activity_id = activities.id
);

-- 만료된 인증 코드 정리
DELETE FROM email_verifications WHERE expires_at < NOW();
DELETE FROM password_resets WHERE expires_at < NOW();
```

---

## 6. 스토리지 관리

### 이중 스토리지 구조

| 스토리지 | 용도 | 접근 권한 | 비고 |
|----------|------|-----------|------|
| **Cloudflare R2** | 일반 이미지/첨부파일 | Public (URL 직접 접근) | Presigned URL로 업로드 |
| **Supabase Storage** | 학적 인증 이미지 | Private (Signed URL) | 관리자만 조회 가능 |

### Cloudflare R2

#### 버킷 목록
| 버킷 | 용도 | 허용 확장자 |
|-------|------|------------|
| `club-images` | 동아리 이미지 | jpg, jpeg, png, gif, webp |
| `event-images` | 활동/행사 이미지 | jpg, jpeg, png, gif, webp |
| `introduction-images` | 학생회 소개 이미지 | jpg, jpeg, png, gif, webp |
| `post-attachments` | 공지사항 첨부파일 | jpg, jpeg, png, pdf |
| `welfare-images` | 복지사업 이미지 | jpg, jpeg, png, gif, webp |

#### 업로드 플로우 (Presigned URL 방식)
```
1. [프론트] → POST /presigned-url (파일명, post_id 전달)
2. [서버]  → 확장자 검증 → R2 Presigned URL 생성 (5분 유효)
3. [프론트] → PUT {presigned_url} (파일 직접 업로드)
4. [프론트] → 최종 API 호출 시 public_url 함께 전달
```

> 서버를 통하지 않고 **프론트에서 R2로 직접 업로드**하므로 서버 부하가 없습니다.

#### R2 Dashboard 접근
- Cloudflare Dashboard → R2 → 해당 버킷
- 파일 삭제/관리 가능
- **주의**: Public URL이 변경되면 `R2_*_URL` 환경변수도 업데이트 필요

#### R2 API Token 재발급
```
1. Cloudflare Dashboard (https://dash.cloudflare.com) 접속
2. 좌측 메뉴 → R2 Object Storage 클릭
3. 우측 상단 "Manage R2 API Tokens" 클릭
4. "Create API Token" 클릭
5. Permissions: Object Read & Write 선택
6. 해당 버킷들 선택 (또는 All buckets)
7. Create API Token 클릭
8. 발급된 Access Key ID / Secret Access Key 복사
9. Fly.io Dashboard → Secrets 에서 아래 값 업데이트:
   - R2_ACCESS_KEY_ID = 새 Access Key ID
   - R2_SECRET_ACCESS_KEY = 새 Secret Access Key
```

### Supabase Storage

#### 버킷
| 버킷 | 용도 | 접근 |
|-------|------|------|
| `verification-images` | 학적 인증 이미지 | Private (Signed URL, 관리자만) |

#### 관리
- Supabase Dashboard → Storage → verification-images
- 회원 승인/거절 후 이미지는 자동으로 유지됨 (수동 정리 필요 시 Dashboard에서)

---

## 7. 인증 및 보안

### 회원가입 플로우
```
1. 이메일 인증 (POST /send-verification → POST /verify-email)
   └─ @seoultech.ac.kr 이메일로 6자리 코드 전송, 5분 유효

2. 학번 중복 확인 (POST /check-student-id)

3. 회원가입 (POST /signup)
   └─ 학적 인증 이미지를 Supabase Storage에 업로드
   └─ verification_status = 'pending' 으로 생성

4. 관리자 승인 (POST /admin/users/{id}/approve)
   └─ verification_status = 'approved' 로 변경
   └─ 이후 로그인 가능
```

### 로그인 보안
- **Cloudflare Turnstile**: 회원가입/로그인 시 CAPTCHA 검증
- **로그인 실패 차단**:
  - 5회 실패 → 10분 차단
  - 10회 실패 → 1시간 차단
  - 15회 실패 → 영구 차단 (관리자 해제 필요)
- **중복 로그인 방지**: JWT `iat` vs `last_login_at` 비교, 새 로그인 시 이전 세션 무효화
- **Rate Limiting**: slowapi 기반 요청 속도 제한

### 권한 체계
| 권한 레벨 | 대상 | 접근 가능 기능 |
|-----------|------|---------------|
| 비인증 | 누구나 | 학생회 소개, 동아리 목록, 로그인/회원가입 |
| 인증 사용자 | 승인 완료된 회원 | 공지사항, 건의함, 행사 신청, 복지사업, 검색 |
| 관리자 | `admin` 역할 | 위 전체 + 공지 작성, 회원 승인, 행사 관리 |
| 게스트 허용 | 비로그인도 가능 | 일부 행사 신청 (활동별 설정) |

### Supabase Auth 관리
- **Service Role Key**: 서버에서 RLS(Row Level Security) 우회에 사용
- Supabase Dashboard → Auth → Users 에서 사용자 목록 확인 가능
- **주의**: Auth 사용자 삭제 시 `users` 테이블 데이터도 함께 정리 필요

---

## 8. API 라우트 구조

### 공개 엔드포인트 (인증 불필요)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/` | 헬스체크 |
| GET | `/docs` | Swagger UI (API 문서) |
| POST | `/send-verification` | 이메일 인증번호 발송 |
| POST | `/verify-email` | 이메일 인증 확인 |
| POST | `/signup` | 회원가입 |
| POST | `/login` | 로그인 |
| POST | `/refresh` | 토큰 갱신 |
| POST | `/forgot-password` | 비밀번호 찾기 |
| GET | `/introductions` | 학생회 소개 |
| GET | `/clubs` | 동아리 목록 |

### 인증 필요 엔드포인트 (승인된 사용자)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/notices` | 공지사항 목록 |
| GET | `/notices/{id}` | 공지사항 상세 |
| GET | `/suggestions` | 건의함 목록 |
| POST | `/suggestions` | 건의 작성 |
| GET | `/activities` | 활동 목록 |
| POST | `/activities/{id}/register` | 활동 신청 |
| GET | `/welfare/*` | 복지사업 |
| GET | `/search` | 통합 검색 |

### 관리자 전용 엔드포인트
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/admin/pending-users` | 승인 대기 회원 |
| POST | `/admin/users/{id}/approve` | 회원 승인 |
| POST | `/admin/users/{id}/reject` | 회원 거부 |
| PATCH | `/admin/users/{id}/role` | 역할 변경 |
| POST | `/admin/notices` | 공지사항 작성 |
| POST | `/admin/notices/draft` | Draft 생성 |
| DELETE | `/admin/notices/draft/{id}` | Draft 삭제 |
| POST | `/admin/activities` | 활동 생성 |
| GET | `/admin/{id}/attendance` | 출석 현황 |
| POST | `/admin/{id}/registrations/{rid}/attend` | 출석 체크 |

> 전체 API 목록은 `/docs` (Swagger UI)에서 확인 가능합니다.

---

## 9. 관리자 계정 관리

### 방법 1: 홈페이지에서 회원가입 후 관리자 승격 (권장)
```
1. 홈페이지에서 정상적으로 회원가입 (학교 이메일 인증 + 학적 이미지 업로드)
2. 기존 관리자가 홈페이지에서 해당 회원 승인
3. Supabase Dashboard → SQL Editor → New query
4. 아래 SQL 실행:
```
```sql
-- 학번으로 관리자 승격
UPDATE users SET role = 'admin' WHERE student_id = '학번';
```

### 방법 2: Supabase Auth에서 직접 생성
```
1. Supabase Dashboard → Authentication → Users → Add User
2. 이메일과 비밀번호 입력 후 생성
3. 생성된 사용자의 UUID 복사
4. SQL Editor에서 users 테이블에 직접 INSERT:
```
```sql
INSERT INTO users (id, email, name, student_id, department, phone, role, verification_status)
VALUES (
  '복사한-uuid',
  'email@seoultech.ac.kr',
  '이름',
  '학번',
  '컴퓨터공학과',
  '010-0000-0000',
  'admin',
  'approved'
);
```

### 관리자 해임
```
Supabase Dashboard → SQL Editor:
```
```sql
UPDATE users SET role = 'student' WHERE student_id = '학번';
```

### 현재 관리자 목록 확인
```sql
SELECT name, student_id, email, role FROM users WHERE role = 'admin';
```

---

## 10. Gmail Refresh Token 재발급

> 🔴 **인증 이메일이 안 보내질 때 가장 먼저 확인하세요!**  
> Gmail API v1은 OAuth 2.0 Refresh Token을 사용하며, 이 토큰은 주기적으로 만료됩니다.

### 재발급이 필요한 증상
- 회원가입 시 인증번호 이메일이 안 도착함
- 비밀번호 재설정 이메일이 안 도착함
- 서버 로그에 `Gmail API` 관련 에러 발생

### 재발급 절차 (Google OAuth Playground)

```
📌 사전 준비:
- GOOGLE_CLIENT_ID (현재 Fly.io Secrets에 저장된 값)
- GOOGLE_CLIENT_SECRET (현재 Fly.io Secrets에 저장된 값)
- 발신 이메일 계정의 Google 로그인 정보
```

#### Step 1: OAuth Playground 접속
```
1. 브라우저에서 접속:
   https://developers.google.com/oauthplayground
```

#### Step 2: 자체 OAuth 자격증명 설정
```
2. 우측 상단 톱니바퀴(⚙️) 아이콘 클릭
3. "Use your own OAuth credentials" 체크박스 활성화
4. OAuth Client ID 입력 → Fly.io Secrets의 GOOGLE_CLIENT_ID 값 붙여넣기
5. OAuth Client secret 입력 → Fly.io Secrets의 GOOGLE_CLIENT_SECRET 값 붙여넣기
```

#### Step 3: Gmail API 권한 선택
```
6. 좌측 API 목록에서 "Gmail API v1" 펼치기
7. https://www.googleapis.com/auth/gmail.send 체크
8. "Authorize APIs" 파란 버튼 클릭
```

#### Step 4: Google 계정 인증
```
9. 발신 이메일 계정(GMAIL_FROM_EMAIL)으로 Google 로그인
10. "이 앱은 확인되지 않았습니다" 경고 → "고급" → "XXX(으)로 이동" 클릭
11. 권한 허용 클릭
```

#### Step 5: 토큰 교환
```
12. "Step 2" 탭으로 자동 이동됨
13. "Exchange authorization code for tokens" 버튼 클릭
14. 화면에 Refresh Token 값이 표시됨 → 복사
```

#### Step 6: Fly.io에 토큰 업데이트
```
15. Fly.io Dashboard (https://fly.io/dashboard) 접속
16. seoultech-cse-backend 앱 클릭
17. 좌측 메뉴 → Secrets
18. GOOGLE_REFRESH_TOKEN 찾기 → 연필 아이콘 클릭
19. 복사한 새 Refresh Token 붙여넣기 → Save
20. 서버가 자동으로 재시작됨
```

#### Step 7: 동작 확인
```
21. 홈페이지에서 회원가입 테스트 → 인증번호 이메일 수신 확인
22. 안 되면 Fly.io Dashboard → Monitoring 에서 로그 확인
```

> ⚠️ **주의사항**
> - Google Cloud Console에서 OAuth 동의 화면이 "테스트" 모드면 Refresh Token이 7일 후 만료됩니다
> - "프로덕션" 모드로 변경하면 Refresh Token이 훨씬 오래 유지됩니다
> - Google Cloud Console → APIs & Services → OAuth 동의 화면 → 게시 상태 확인

---

## 11. 모니터링 및 디버깅

### 서버 로그 확인 (Fly.io Dashboard)
```
1. https://fly.io/dashboard 접속
2. seoultech-cse-backend 앱 클릭
3. Logs & Errors 탭 클릭
4. 실시간 로그 스트리밍 확인
5. 에러 검색: 상단 검색바에 "ERROR", "500", "429" 등 입력
```

### 로그 포맷
```
[API ERROR] {함수명}: {에러메시지}       # API 핸들러 에러
[CLEANUP] Draft {id} 삭제 완료          # Draft 자동 정리
[STARTUP] DB 워밍업 완료                # 서버 시작
[AUTH WARNING] iat check failed: ...   # 인증 경고
Rate limit check failed: ...           # Rate limit 체크 실패
```

### Supabase 모니터링
- Dashboard → Reports → API 사용량, DB 사용량
- Dashboard → Logs → API logs, Database logs

### 헬스체크
- `GET /` → `{"status": "healthy"}` 응답 확인
- Fly.io 자체 헬스체크: 30초 간격, 5초 타임아웃

---

## 12. 자주 발생하는 문제와 해결

### 1. 인증 이메일이 안 보내짐
**원인**: Google OAuth Refresh Token 만료  
**해결**: [10. Gmail Refresh Token 재발급](#10-gmail-refresh-token-재발급) 섹션의 절차를 따라 재발급

### 2. 500 에러 — Internal Server Error
**원인**: 서버 내부 오류 (DB 연결, 스키마 불일치 등)  
**해결**: Fly.io Dashboard → Monitoring 에서 에러 로그 확인 → 개발자에게 문의

### 3. 429 에러 — "잠시 후 다시 시도해주세요"
**원인**: Rate Limiting 또는 DB 기반 중복 방지  
**해결**: 정상 동작. 실제 버그인 경우 rate limit 로직 확인

### 4. 활동 신청 인원 수 불일치
**원인**: `activities.current_count`와 실제 `activity_registrations` 수 불일치  
**해결**:
```sql
UPDATE activities SET current_count = (
  SELECT COUNT(*) FROM activity_registrations WHERE activity_id = activities.id
);
```

### 5. 서버 응답이 느림 (Cold Start)
**원인**: 현재 머신이 항상 1대 유지로 설정되어 Cold Start는 없어야 함  
**확인**: Fly.io Dashboard → Overview에서 머신 상태 확인. `stopped`면 Machines 탭에서 해당 머신 재시작

### 6. Supabase 무료 플랜 일시정지
**원인**: 무료 플랜은 1주일 미사용 시 자동 일시정지  
**해결**: Supabase Dashboard에서 Restore 클릭 (유료 플랜에서는 발생하지 않음)

### 7. R2 업로드 실패
**원인**: Presigned URL 만료 (5분), CORS 설정 오류, 파일 크기 초과  
**해결**: R2 버킷의 CORS 설정 확인, Presigned URL 유효시간 확인

---

## 13. 주의사항 및 금지사항

### 🚫 절대 하지 마세요
1. **`schema.sql`을 프로덕션 DB SQL Editor에서 실행하지 마세요** — 기존 데이터 유실 가능
2. **`reset.sql`을 프로덕션에서 실행하지 마세요** — 모든 데이터가 삭제됩니다
3. **Service Role Key (`SUPABASE_KEY`)를 외부에 노출하지 마세요** — DB 전체 접근 가능
4. **Fly.io Secrets의 값을 스크린샷이나 메시지로 공유하지 마세요** — API 키, 비밀번호 등 민감 정보
5. **Supabase Auth에서 사용자를 삭제할 때** `users` 테이블 데이터도 함께 정리하세요 — 불일치 발생 가능

### ⚠️ 주의사항
1. **Gmail Refresh Token은 주기적으로 만료됩니다** — 이메일이 안 보내지면 [10. Gmail Refresh Token 재발급](#10-gmail-refresh-token-재발급) 참조
2. **DB 함수(`register_for_activity` 등)는 코드가 아닌 DB에 존재합니다** — 수정 시 Supabase SQL Editor에서 직접 수정
3. **싱글 행 테이블** (`print_welfare_info`, `guidebook_info`, `privacy_officer_info`)은 항상 1행만 존재해야 함. INSERT 대신 UPDATE 사용
4. **Supabase 무료 플랜**은 1주일 미사용 시 자동 일시정지됩니다 — Dashboard에서 Restore 필요
5. **Cloudflare R2 버킷의 Public URL이 변경되면** Fly.io Secrets의 `R2_*_URL` 값도 함께 업데이트 필요

---

## 14. 연간 운영 체크리스트

### 학기 시작 전
- [ ] 관리자 계정 확인 및 비밀번호 변경
- [ ] Gmail Refresh Token 유효성 확인 (홈페이지에서 이메일 인증 테스트)
- [ ] Supabase Dashboard에서 프로젝트 상태 확인 (일시정지 여부)
- [ ] Fly.io Dashboard에서 서버 상태 확인 (Overview → running 여부)
- [ ] Fly.io Secrets에서 `FRONTEND_URL` 확인 (프론트엔드 도메인 변경 시)

### 임기 교체 시
- [ ] 기존 관리자 계정 비활성화 또는 비밀번호 변경
- [ ] 새 관리자 계정 생성 또는 역할 변경 ([9. 관리자 계정 관리](#9-관리자-계정-관리) 참조)
- [ ] 각 서비스 계정 소유자 변경:
  - Fly.io (https://fly.io) — 팀 멤버 초대 가능
  - Supabase (https://supabase.com) — Organization 멤버 관리
  - Cloudflare (https://dash.cloudflare.com) — 계정 멤버 관리
  - Google Cloud Console (https://console.cloud.google.com) — IAM 관리
- [ ] 이 문서(HANDOVER.md) 업데이트

### 주기적 정리 (Supabase SQL Editor에서 실행)
```sql
-- 만료된 인증 코드 삭제
DELETE FROM email_verifications WHERE expires_at < NOW();
DELETE FROM password_resets WHERE expires_at < NOW();

-- 고아 Draft 게시글 삭제 (1일 이상 된 것)
DELETE FROM posts WHERE is_draft = true AND created_at < NOW() - INTERVAL '1 day';

-- 오래된 로그인 시도 기록 삭제 (30일 이상)
DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL '30 days';
```
- [ ] Cloudflare Dashboard → R2에서 불필요한 파일 정리
- [ ] Supabase Dashboard → Storage에서 불필요한 학적 인증 이미지 정리
- [ ] Supabase Dashboard → Settings → Database에서 DB 용량 확인

### 관리용 대시보드 모음
| 서비스 | URL | 용도 |
|--------|-----|------|
| **Fly.io** | https://fly.io/dashboard | 서버 관리, 로그, 환경변수, 롤백 |
| **Supabase** | https://supabase.com/dashboard | DB 관리, Auth, Storage, SQL Editor |
| **Cloudflare** | https://dash.cloudflare.com | R2 스토리지, Turnstile |
| **Google Cloud** | https://console.cloud.google.com | Gmail API, Sheets API, OAuth 설정 |
| **OAuth Playground** | https://developers.google.com/oauthplayground | Gmail Refresh Token 재발급 |
| **API 문서** | `https://{서버주소}/docs` | Swagger UI (전체 API 목록) |

### 비상 연락
- **기존 개발자**: ehgis2344@seoultech.ac.kr
