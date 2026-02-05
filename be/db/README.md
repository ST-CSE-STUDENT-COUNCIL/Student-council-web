# Database - PostgreSQL 스키마

서울과학기술대학교 컴퓨터공학과 학생회 홈페이지 데이터베이스

## 📋 개요

- **DBMS**: PostgreSQL 15+ (Supabase 호스팅)
- **인증**: Supabase Auth (회원가입/로그인 위임)
- **스토리지**: Cloudflare R2 (이미지/첨부파일)
- **보안**: Row Level Security (RLS) + JWT 인증 + Rate Limiting

## 🗂️ 테이블 구조

### 인증 및 보안
| 테이블 | 설명 |
|--------|------|
| `email_verifications` | 학교 이메일 인증 (6자리 코드, 5분 만료) |
| `password_resets` | 비밀번호 재설정 인증 |
| `login_attempts` | 로그인 시도 이력 |
| `login_blocks` | 로그인 차단 관리 |

### 사용자
| 테이블 | 설명 |
|--------|------|
| `users` | 사용자 프로필 (학번, 권한, 회비 납부 여부) |
| `rejected_users` | 거부된 회원가입 요청 |

### 게시판
| 테이블 | 설명 |
|--------|------|
| `boards` | 게시판 (학생회/민주자치 공지, 건의함) |
| `posts` | 게시글 (소카테고리, Soft Delete, 익명 지원) |
| `attachments` | 게시글 첨부파일 |
| `suggestions` | 건의함 (익명, 상태 관리) |

### 활동 (통합 시스템)
| 테이블 | 설명 |
|--------|------|
| `activities` | 통합 활동 (행사/수요조사/설문/카톡초대/공지) |
| `activity_registrations` | 활동 신청 (회원/비회원 모두 가능) |
| `activity_images` | 활동 이미지 |

### 기타
| 테이블 | 설명 |
|--------|------|
| `introduction_images` | 학생회 소개 이미지 |
| `clubs` | 동아리 목록 |
| `rental_items` | 복지사업 대여물품 (구글시트 연동) |
| `locker_info` | 사물함 정보 |

## 🔐 보안 정책

### 1. 권한 체계

| 역할 | 설명 |
|------|------|
| `student` | 일반 학생 (기본값) |
| `admin` | 관리자 (공지 작성, 사용자 승인, 모든 권한) |

### 2. Rate Limiting (속도 제한)
공용 IP 환경(학교 WiFi 등)을 고려하여 설정되었습니다.

| 엔드포인트 | 제한 | 비고 |
|-----------|------|------|
| **로그인** | 100회 / 5분 | IP 기준 |
| **활동 신청** | 100회 / 1분 | 공용 IP 고려 넉넉하게 설정 |
| **이미지 URL 발급** | 50회 / 1분 | 활동 신청 시 이미지 첨부용 |
| **이메일 발송** | 3회 / 1분 | 인증번호, 비밀번호 찾기 |

### 3. 로그인 차단
학번 기준으로 실패 횟수를 누적하여 차단합니다.
- 5회 실패: 10분 차단
- 10회 실패: 1시간 차단
- 15회 실패: 영구 차단 (관리자 문의 필요)

## 📤 첨부파일 업로드 정책

### 허용 파일 형식
```
이미지: .jpg, .jpeg, .png, .gif, .webp
문서: .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .hwp, .hwpx, .txt
압축: .zip, .7z, .rar
```

### 제한 사항
- **최대 파일 크기**: 10MB (**프론트엔드 검증 필수**)
- **Presigned URL 유효 시간**: 5분 (300초)

### R2 버킷 구조
| 버킷 | 용도 |
|------|------|
| `club-images` | 동아리 이미지 |
| `event-images` | 활동/행사 이미지 |
| `introduction-images` | 학생회 소개 이미지 |
| `post-attachments` | 게시글 첨부파일 |
| `welfare-images` | 복지사업 이미지 |

### Supabase Storage
| 버킷 | 용도 |
|------|------|
| `verification-images` | 학적 인증 이미지 (Private, 5MB 제한) |

## 🚀 주요 기능

### 활동 신청 시스템
```sql
-- 활동 신청
SELECT register_for_activity(
  p_activity_id := 1,
  p_user_id := 'uuid-here',
  p_name := '홍길동',
  p_student_id := '20241234',
  p_department := '컴퓨터공학과',
  p_phone := '01012345678',
  p_email := 'test@seoultech.ac.kr',
  p_form_responses := '{"meal": "채식"}'::jsonb,
  p_verification_image_url := 'https://...',
  p_kakao_id := 'kakao123'
);
```

**동시성 제어**: `FOR UPDATE` Pessimistic Lock + 트랜잭션

**검증 순서**:
1. 활동 존재 및 활성화 확인
2. 신청 기간 확인
3. 정원 확인
4. 회비 납부 여부 확인 (require_membership=true인 경우)
5. 중복 신청 확인

## 📦 설치 및 실행

### 1. Supabase 프로젝트 설정
1. [Supabase Console](https://supabase.com/dashboard) 접속
2. 프로젝트 생성 (Region: Northeast Asia)

### 2. 스키마 배포
```bash
# SQL Editor에서 실행
1. schema.sql 전체 실행
2. fix_activity_registration.sql 실행 (버그 픽스)
```

### 3. 환경변수 설정
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # 절대 노출 금지!
SUPABASE_ANON_KEY=eyJ...
```

## 🔧 관리 작업

```sql
-- 관리자 권한 부여
UPDATE users SET role = 'admin' WHERE student_id = '20210001';

-- 회비 납부 처리
UPDATE users 
SET membership_paid = true, membership_paid_at = NOW() 
WHERE student_id = '20210001';

-- 게시글 복구 (Soft Delete)
UPDATE posts 
SET is_deleted = false, deleted_at = NULL, deleted_by = NULL 
WHERE id = 123;
```

## ⚠️ 주의사항

1. **Service Key 노출 금지**: 환경변수로만 관리
2. **학교 이메일만 가입 가능**: `@seoultech.ac.kr`
3. **RLS 정책 변경 시 테스트 필수**
4. **Rate Limiting**: 공용 IP 환경 고려하여 설정값 조정 주의

## 📝 파일 목록

| 파일 | 설명 |
|------|------|
| `schema.sql` | 전체 스키마 정의 |
| `reset.sql` | 데이터 초기화 스크립트 |
| `fix_activity_registration.sql` | 활동 신청 함수 버그 픽스 |

## 📞 문의

백엔드 관련 문의: ehgis2344@seoultech.ac.kr
