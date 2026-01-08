-- ============================================================================
-- 마이그레이션 실행 가이드
-- ============================================================================
-- Supabase Dashboard > SQL Editor에서 순서대로 실행하세요
-- 
-- 주의: DROP TABLE을 사용하므로 기존 데이터가 모두 삭제됩니다!
--       프로덕션 환경에서는 ALTER TABLE을 사용하거나 백업 후 진행하세요.
-- ============================================================================

-- 1단계: Clubs 테이블 마이그레이션 ✅
-- 파일: 001_update_clubs_table.sql
-- 
-- 실행 방법:
-- 1. Supabase Dashboard 접속
-- 2. SQL Editor 열기
-- 3. 001_update_clubs_table.sql 내용 복사/붙여넣기
-- 4. Run 클릭

-- 2단계: Locker Periods 테이블 마이그레이션 ✅
-- 파일: 002_update_locker_periods_table.sql
-- 
-- 실행 방법:
-- 1. SQL Editor에서 002_update_locker_periods_table.sql 내용 복사/붙여넣기
-- 2. Run 클릭
-- 
-- 주의: locker_rentals 테이블도 함께 재생성됩니다 (의존성)

-- 3단계: 복지사업 시스템 재설계 ✅
-- 파일: 003_redesign_welfare_system.sql
-- 
-- 실행 방법:
-- 1. SQL Editor에서 003_redesign_welfare_system.sql 내용 복사/붙여넣기
-- 2. Run 클릭
-- 
-- 변경 내용:
-- - 삭제: welfare_rentals, welfare_rental_requests, welfare_lockers, locker_rentals
-- - 추가: locker_info (배치도 + 구글폼), rental_items (구글폼 + 스프레드시트)
-- - 유지: locker_periods (이미 return_start/end 있음)

-- 4단계: 로그인 시도 추적 시스템 ✅
-- 파일: 004_add_login_attempt_tracking.sql
-- 
-- 실행 방법:
-- 1. SQL Editor에서 004_add_login_attempt_tracking.sql 내용 복사/붙여넣기
-- 2. Run 클릭
-- 
-- 추가 내용:
-- - login_attempts: 로그인 시도 이력 추적
-- - login_blocks: 학번별 차단 상태 관리 (실패 횟수, 차단 시간)

-- 5단계: 비밀번호 재설정 ✅
-- 파일: 005_add_password_reset_table.sql
-- 
-- 실행 방법:
-- 1. SQL Editor에서 005_add_password_reset_table.sql 내용 복사/붙여넣기
-- 2. Run 클릭
-- 
-- 추가 내용:
-- - password_resets: 비밀번호 찾기 이메일 인증

-- 6단계: 학생회 소개 이미지 Storage (더 이상 사용 안 함) ⚠️
-- 파일: 006_create_introduction_images_storage.sql
-- 
-- ⚠️ Cloudflare R2로 마이그레이션 완료되어 실행 불필요
-- 
-- 변경 사항:
-- - Supabase Storage → Cloudflare R2 (introduction-images bucket)
-- - RLS 정책 대신 R2 Public Access 사용

-- 7단계: 비회원 행사 신청 지원 ✅ 🆕
-- 파일: 007_add_guest_registration_support.sql
-- 
-- 실행 방법:
-- 1. SQL Editor에서 007_add_guest_registration_support.sql 내용 복사/붙여넣기
-- 2. Run 클릭
-- 
-- 추가 내용:
-- - registrations 테이블: user_id nullable 변경
-- - 비회원 필드 추가: guest_student_id, guest_name, guest_phone
-- - CHECK constraint: 회원 OR 비회원 중 하나 필수
-- - 부분 UNIQUE 인덱스: 회원/비회원 각각 중복 방지
-- - register_for_event_guest() 함수: 회원/비회원 모두 처리

-- ============================================================================
-- 마이그레이션 확인
-- ============================================================================
-- 마이그레이션 후 아래 쿼리로 테이블 구조 확인

-- clubs 테이블 컬럼 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clubs' 
ORDER BY ordinal_position;

-- locker_periods 테이블 컬럼 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'locker_periods' 
ORDER BY ordinal_position;

-- registrations 테이블 컬럼 확인 (비회원 필드 확인)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'registrations' 
ORDER BY ordinal_position;

-- register_for_event_guest 함수 확인
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'register_for_event_guest';
