-- ============================================================================
-- Migration 012: locker_info URL 필드를 NULL 허용으로 변경
-- ============================================================================
-- 목적: application_form_url, return_extension_form_url을 개별 설정 가능하도록 NULL 허용
-- 의미:
--   - NULL: 설정 안 됨 (해당 기간이 아님)
--   - 빈 문자열 (''): 마감됨
--   - URL 값: 진행 중
-- 작성일: 2026-01-11
-- ============================================================================

-- Step 1: application_form_url NOT NULL 제약조건 제거
ALTER TABLE locker_info 
ALTER COLUMN application_form_url DROP NOT NULL;

-- Step 2: return_extension_form_url NOT NULL 제약조건 제거
ALTER TABLE locker_info 
ALTER COLUMN return_extension_form_url DROP NOT NULL;

-- Step 3: 코멘트 업데이트
COMMENT ON COLUMN locker_info.application_form_url IS '구글폼 신청 URL (NULL: 설정 안 됨, 빈 문자열: 마감, URL: 진행 중)';
COMMENT ON COLUMN locker_info.return_extension_form_url IS '구글폼 반납/연장 URL (NULL: 설정 안 됨, 빈 문자열: 마감, URL: 진행 중)';

-- Step 4: 기존 빈 문자열 데이터를 NULL로 변경 (선택사항)
UPDATE locker_info 
SET application_form_url = NULL 
WHERE application_form_url = '';

UPDATE locker_info 
SET return_extension_form_url = NULL 
WHERE return_extension_form_url = '';
