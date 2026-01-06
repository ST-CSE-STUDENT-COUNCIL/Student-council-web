-- ============================================================================
-- 마이그레이션 실행 가이드
-- ============================================================================
-- Supabase Dashboard > SQL Editor에서 순서대로 실행하세요
-- 
-- 주의: DROP TABLE을 사용하므로 기존 데이터가 모두 삭제됩니다!
--       프로덕션 환경에서는 ALTER TABLE을 사용하거나 백업 후 진행하세요.
-- ============================================================================

-- 1단계: Clubs 테이블 마이그레이션
-- 파일: 001_update_clubs_table.sql
-- 
-- 실행 방법:
-- 1. Supabase Dashboard 접속
-- 2. SQL Editor 열기
-- 3. 001_update_clubs_table.sql 내용 복사/붙여넣기
-- 4. Run 클릭

-- 2단계: Locker Periods 테이블 마이그레이션
-- 파일: 002_update_locker_periods_table.sql
-- 
-- 실행 방법:
-- 1. SQL Editor에서 002_update_locker_periods_table.sql 내용 복사/붙여넣기
-- 2. Run 클릭
-- 
-- 주의: locker_rentals 테이블도 함께 재생성됩니다 (의존성)

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

-- locker_rentals 테이블 컬럼 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'locker_rentals' 
ORDER BY ordinal_position;
