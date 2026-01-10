-- ============================================================================
-- Migration 009: Add Application Period and Return/Extension Fields to locker_info
-- ============================================================================
-- 사물함 신청 기간 및 반납/연장 기간 관리를 위한 필드 추가
-- 관리자가 신청/반납 시작/종료 날짜를 설정하고 각각의 구글폼 URL과 함께 관리
-- 1학기, 방학 등 주기적으로 날짜와 URL 업데이트 가능
-- 모든 시간은 한국 시간(KST, Asia/Seoul) 기준
-- ============================================================================

-- Step 1: 반납/연장 관련 필드 추가 (NOT NULL 제약조건 포함)
ALTER TABLE locker_info 
ADD COLUMN return_extension_form_url TEXT NOT NULL DEFAULT '',
ADD COLUMN application_start TIMESTAMPTZ,
ADD COLUMN application_end TIMESTAMPTZ,
ADD COLUMN return_extension_start TIMESTAMPTZ,
ADD COLUMN return_extension_end TIMESTAMPTZ;

-- Step 2: created_at, updated_at을 한국 시간 기준으로 변경
ALTER TABLE locker_info 
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul'),
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul');

-- Step 3: 코멘트 업데이트
COMMENT ON COLUMN locker_info.application_form_url IS '구글폼 신청 URL (신청 기간 아닐 때 빈 문자열)';
COMMENT ON COLUMN locker_info.return_extension_form_url IS '구글폼 반납/연장 URL (반납 기간 아닐 때 빈 문자열)';
COMMENT ON COLUMN locker_info.application_start IS '신청 시작 날짜 (한국 시간 KST)';
COMMENT ON COLUMN locker_info.application_end IS '신청 종료 날짜 (한국 시간 KST)';
COMMENT ON COLUMN locker_info.return_extension_start IS '반납/연장 시작 날짜 (한국 시간 KST)';
COMMENT ON COLUMN locker_info.return_extension_end IS '반납/연장 종료 날짜 (한국 시간 KST)';
COMMENT ON COLUMN locker_info.description IS '설명 (예: 19, 35번 고장, 2024-1학기)';
COMMENT ON COLUMN locker_info.updated_at IS '마지막 수정 시각 (한국 시간 KST)';

-- Step 4: 테이블 코멘트 업데이트
COMMENT ON TABLE locker_info IS '[공개] 사물함 배치도 및 신청/반납 정보 (미래관 3층 사물함, 한국 시간 기준)';
