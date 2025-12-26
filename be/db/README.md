# Database - PostgreSQL 스키마

서울과학기술대학교 컴퓨터공학과 학생회 홈페이지 데이터베이스

## 📋 개요

- **DBMS**: PostgreSQL 15+ (Supabase 호스팅)
- **인증**: Supabase Auth (회원가입/로그인 위임)
- **테이블**: 15개
- **보안**: Row Level Security (RLS) + JWT 인증
- **특징**: 선착순 신청 트랜잭션, Soft Delete, 익명 게시, 복지사업 관리

## 🔐 Supabase Auth 통합

### 회원가입 플로우
1. **이메일 인증** (`email_verifications` 테이블)
   - 학교 이메일(@seoultech.ac.kr)로 6자리 코드 전송
   - 5분 이내 인증 완료
   
2. **Supabase Auth 회원가입**
   - `auth.users` 테이블에 인증 정보 저장 (Supabase 관리)
   - 학번(student_id)을 username으로 사용
   - 비밀번호는 Supabase가 암호화하여 저장
   
3. **프로필 생성** (`users` 테이블)
   - `auth.users.id`를 참조하는 프로필 정보 저장
   - 학생 인증 대기 상태 (verification_status: pending)
   - 관리자 승인 후 로그인 가능

### 테이블 관계
```
auth.users (Supabase 관리)
    ↓ (id 참조)
users (우리가 관리)
    ↓ 
posts, events, registrations 등
```

## 🗂️ 테이블 구조

### 1. email_verifications (이메일 인증)
- 학교 이메일 6자리 코드 인증
- 5분 만료
- 회원가입 전 필수

### 2. users (사용자 프로필)
- `auth.users`와 1:1 매핑
- 학번 기반 로그인
- 권한: `student`, `council`, `admin`
- 학생회비 납부 여부 관리
- 관리자 승인 시스템

### 3. introduction_images (학생회 소개 이미지)
- 학생회 소개 이미지 관리
- admin만 수정 가능
- 순서 지정 가능

### 4. boards (게시판)
- 학생회/민주자치 공지사항, 건의함
- 대카테고리 분류
- 익명 허용 여부 설정

### 5. posts (게시글)
- 소카테고리 지원
- Soft Delete 지원
- 익명 게시 가능 (관리자만 실명 확인)
- admin만 공지사항 작성

### 6. attachments (첨부파일)
- 게시글 첨부파일 관리
- 파일명, URL, 크기, MIME 타입 저장

### 7. events (행사)
- 선착순 신청 시스템
- 회비 납부자 전용 행사 설정 가능
- Soft Delete 지원

### 7. event_images (행사 이미지)
- 행사당 여러 장 등록
- 순서 지정 가능

### 9. registrations (행사 신청)
- 중복 신청 방지 (UNIQUE 제약)
- 선착순 번호 자동 부여

### 10. event_surveys (행사 만족도 조사)
- 완료된 행사에 대한 만족도 조사
- 1~5점 평점 및 피드백
- 중복 제출 방지

### 11. clubs (동아리)
- 동아리 목록 및 정보
- 카테고리별 분류
- 상세 이미지 지원

### 12. welfare_rentals (복지사업 - 대여물품)
- 대여 물품 관리
- 재고 수량 추적

### 13. welfare_rental_requests (복지사업 - 대여신청)
- 대여 신청 및 승인 관리
- 승인자 추적 (approved_by)
- 반납 일자 추적

### 14. locker_periods (사물함 대여 기간)
- 학기별 대여 기간 설정
- 신청 기간 및 사용 기간 관리
- 관리자가 학기당 1회 설정

### 15. welfare_lockers (사물함 마스터)
- 미래관 3층 1~40번 사물함
- 19번, 35번 불량 처리
- 사물함 상태 관리

### 16. locker_rentals (사물함 대여)
- 학생 신청 및 사용 내역
- 승인자 및 반납 확인자 추적
- 기간별 중복 방지

## 🔐 보안 정책

### 접근 제어
- **비인증 사용자**: 모든 데이터 접근 불가 (RLS로 차단)
- **인증 사용자**: 행사, 게시글 조회 가능
- **학생회(council)**: 게시글 삭제 가능
- **관리자(admin)**: 공지 작성, 모든 권한

### 권한별 기능 비교

| 기능 | student | council | admin |
|------|---------|---------|-------|
| 공지사항 읽기 | ✅ | ✅ | ✅ |
| 공지사항 작성 | ❌ | ❌ | ✅ |
| 건의함 작성 | ✅ | ✅ | ✅ |
| 본인 글 삭제 | ✅ | ✅ | ✅ |
| 다른 사람 글 삭제 | ❌ | ✅ | ✅ |
| 익명 작성자 확인 | ❌ | ✅ | ✅ |
| 행사 조회/신청 | ✅ | ✅ | ✅ |
| 사용자 승인 | ❌ | ❌ | ✅ |
| 권한/회비 변경 | ❌ | ❌ | ✅ |

> **Council 역할**: 공지는 작성할 수 없지만, 부적절한 게시글을 관리할 수 있는 "글 관리자"

### RLS 정책
- `users`: 인증 필수, 본인만 수정
- `boards`: 인증 필수
- `posts`: 인증 필수, 삭제 안 된 글만 조회
- `events`: 인증 필수 (비회원 차단)
- `event_images`: 인증 필수
- `registrations`: 본인 신청 내역만, 직접 INSERT 금지

> **Note**: FastAPI는 Supabase Service Key를 사용하므로 RLS를 우회하여 모든 데이터에 접근 가능합니다.

## 🚀 주요 기능

### 선착순 신청 시스템
```sql
SELECT register_for_event(행사ID, 사용자ID);
```

**동시성 제어**:
- `FOR UPDATE` Pessimistic Lock
- 트랜잭션으로 경쟁 조건 방지

**검증 순서**:
1. 행사 존재 및 활성화 확인
2. 회비 납부 여부 확인
3. 신청 기간 확인
4. 정원 확인
5. 중복 신청 확인

### 사물함 관리 시스템

**기간 설정 (관리자)**:
1. 관리자가 학기마다 대여 기간 등록
2. 신청 기간 및 사용 기간 설정
3. 학생은 활성화된 기간에만 신청 가능

**신청 플로우**:
1. 학생: 사물함 번호 선택 후 신청
2. 관리자: 승인 처리
3. 학생: 사용
4. 학생회: 반납 확인 (사물함 비움 체크)

### 익명 게시 (건의함)
- `is_anonymous = true`: 일반 사용자에게 "익명" 표시
- 관리자는 `author_id`로 실명 확인 가능

### Soft Delete
- 게시글, 행사 삭제 시 `is_deleted = true`로 변경
- 일반 사용자는 조회 불가
- 관리자는 복구 가능

## 📦 설치 및 실행

### 1. Supabase 프로젝트 생성
1. [Supabase Console](https://supabase.com/dashboard) 접속
2. **New Project** 생성
   - Name: `seoultech-comeng-council`
   - Database Password: 강력한 비밀번호 설정
   - Region: Northeast Asia (Seoul)

### 2. 스키마 배포
1. Supabase Dashboard → **SQL Editor**
2. [`schema.sql`](schema.sql) 파일 내용 전체 복사
3. **Run** 버튼 클릭

### 3. API 키 확인
**Settings** → **API** 페이지에서 확인:

```env
# 백엔드 (.env)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...  # service_role key (절대 노출 금지!)
```

### 4. Storage 버킷 생성
**Storage** → **New bucket**:
- Name: `student-verifications`
- Public: ❌ (Private)
- File size limit: 5MB

## 🔧 관리 작업

### 관리자 권한 부여
```sql
UPDATE users 
SET role = 'admin' 
WHERE student_id = '20210001';
```

### 회비 납부 처리
```sql
UPDATE users 
SET membership_paid = true, 
    membership_paid_at = NOW()
WHERE student_id = '20210001';
```

### 게시글 복구
```sql
UPDATE posts 
SET is_deleted = false, 
    deleted_at = NULL, 
    deleted_by = NULL
WHERE id = 123;
```

### 행사 신청 현황 조회
```sql
SELECT 
  e.title,
  e.current_count,
  e.max_capacity,
  COUNT(r.id) as actual_count
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
WHERE e.id = 1
GROUP BY e.id;
```

## 📊 성능 최적화

### 인덱스 전략
- `student_id`: 로그인 조회
- `created_at DESC`: 최신 글 정렬
- `is_deleted`: Soft Delete 필터링
- `event_date`: 행사 일정 정렬
- `membership_paid`: 납부자 필터링

### 예상 성능
- **회원 수**: 1,000~2,000명
- **동시 접속**: 100~200명 (선착순 시)
- **게시글**: 연간 100~200개
- **행사**: 연간 10~20개
- **DB 크기**: 100MB 이하 (Supabase 무료 티어 충분)

## ⚠️ 주의사항

### 보안
1. **Service Key 절대 노출 금지**
   - 프론트엔드에 포함 금지
   - 환경변수로만 관리
   - GitHub에 커밋 금지

2. **학교 이메일 인증 필수**
   - `@seoultech.ac.kr`만 가입 가능
   - 회원가입 시 검증

3. **RLS 정책 변경 시 주의**
   - 테스트 후 적용
   - 정책 충돌 확인

### 데이터 관리
1. **백업**: Supabase Dashboard에서 자동 백업
2. **삭제**: Soft Delete 사용 (복구 가능)
3. **정원 관리**: `register_for_event()` 함수만 사용

## 🛠️ 트러블슈팅

### 선착순 신청 실패
```sql
-- 행사 상태 확인
SELECT * FROM events WHERE id = 1;

-- 신청 내역 확인
SELECT * FROM registrations WHERE event_id = 1 ORDER BY registration_number;

-- 카운트 불일치 수정
UPDATE events 
SET current_count = (SELECT COUNT(*) FROM registrations WHERE event_id = 1)
WHERE id = 1;
```

### RLS 정책 문제
```sql
-- RLS 비활성화 (테스트용, 프로덕션에서 금지)
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- RLS 다시 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
```

## 📝 변경 이력

- **2025-12-26**: 사물함 관리 시스템 재설계
  - 테이블 구조 변경 (12개 → 15개)
  - 사물함 기간 관리 테이블 추가 (locker_periods)
  - 사물함 마스터/대여 테이블 분리
  - 대여 승인자 추적 기능 추가
  - 구글폼 관련 기능 제거
  - 첨부파일 및 만족도 조사 테이블 추가

- **2025-12-19**: 스키마 재구성
  - 12개 테이블로 확장
  - `profiles` → `users`로 변경
  - 학생회 소개, 동아리, 복지사업 테이블 추가
  - 게시판 카테고리 구조 개선 (대/소카테고리)
  - Supabase Auth 통합 문서화

- **2025-12-16**: 초기 스키마 설계
  - 6개 테이블 생성
  - RLS 정책 적용
  - 선착순 신청 함수 구현

## 🔄 향후 추가 예정

- [ ] 첨부파일 테이블 (게시글 첨부)
- [ ] 관리자 활동 로그

## 📞 문의

관련 문의는 개발자 개인 이메일을 활용해주세요.
백엔드 관련 문의: ehgis2344@seoultech.ac.kr
