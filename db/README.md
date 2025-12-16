# Database - PostgreSQL 스키마

서울과학기술대학교 컴퓨터공학과 학생회 홈페이지 데이터베이스

## 📋 개요

- **DBMS**: PostgreSQL 15+ (Supabase 호스팅)
- **테이블**: 6개 (profiles, boards, posts, events, event_images, registrations)
- **보안**: Row Level Security (RLS) + JWT 인증
- **특징**: 선착순 신청 트랜잭션, Soft Delete, 익명 게시

## 🗂️ 테이블 구조

### 1. profiles (사용자 프로필)
- 학번 기반 로그인
- 권한: `student`, `council`, `admin`
- 학생회비 납부 여부 관리

### 2. boards (게시판)
- 공지사항, 건의함
- 익명 허용 여부 설정

### 3. posts (게시글)
- Soft Delete 지원
- 익명 게시 가능 (관리자만 실명 확인)
- admin만 공지사항 작성

### 4. events (행사)
- 선착순 신청 시스템
- 구글폼 병행 지원 (과도기)
- 회비 납부자 전용 행사 설정 가능

### 5. event_images (행사 이미지)
- 행사당 여러 장 등록
- 순서 지정 가능

### 6. registrations (행사 신청)
- 중복 신청 방지 (UNIQUE 제약)
- 선착순 번호 자동 부여

## 🔐 보안 정책

### 접근 제어
- **비인증 사용자**: 모든 데이터 접근 불가 (RLS로 차단)
- **인증 사용자**: 행사, 게시글 조회 가능
- **학생회(council)**: 게시글 삭제 가능
- **관리자(admin)**: 공지 작성, 모든 권한

### RLS 정책
- `profiles`: 인증 필수, 본인만 수정
- `boards`: 인증 필수
- `posts`: 인증 필수, 삭제 안 된 글만 조회
- `events`: 인증 필수 (비회원 차단)
- `event_images`: 인증 필수
- `registrations`: 본인 신청 내역만, 직접 INSERT 금지

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
2. 구글폼 전용 여부 확인
3. 회비 납부 여부 확인
4. 신청 기간 확인
5. 정원 확인
6. 중복 신청 확인

### 구글폼 병행 (과도기)

**3가지 모드**:
1. **홈페이지만**: `google_form_url = null`
2. **구글폼만**: `use_google_form_only = true`
3. **병행**: `google_form_url` 있고 `use_google_form_only = false`

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
UPDATE profiles 
SET role = 'admin' 
WHERE student_id = '20210001';
```

### 회비 납부 처리
```sql
UPDATE profiles 
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

- **2025-12-16**: 초기 스키마 설계
  - 6개 테이블 생성
  - RLS 정책 적용
  - 선착순 신청 함수 구현

## 🔄 향후 추가 예정

- [ ] 자유게시판 (회의 후 결정)
- [ ] 건의함 세부 카테고리 (회의 후 결정)
- [ ] 첨부파일 테이블 (필요 시)
- [ ] 알림 시스템 (선택)

## 📞 문의

데이터베이스 관련 문의사항은 학생회 개발팀에게 연락주세요.
