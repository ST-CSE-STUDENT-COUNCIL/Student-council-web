-- ============================================================================
-- Migration 003: Redesign Welfare System for Google Forms Integration
-- ============================================================================
-- 기존 복잡한 신청 시스템을 구글폼 + 스프레드시트 연동으로 변경
--
-- 변경 사항:
-- 1. 사물함: 배치도 이미지 URL + 구글폼 URL로 단순화
-- 2. 물품대여: 구글폼 + 스프레드시트 ID로 재고 관리
-- ============================================================================

-- ============================================================================
-- Step 1: 기존 복잡한 테이블 삭제
-- ============================================================================

-- 기존 사물함 관련 테이블 모두 삭제 (구글폼으로 대체)
DROP TABLE IF EXISTS locker_rentals CASCADE;
DROP TABLE IF EXISTS locker_periods CASCADE;
DROP TABLE IF EXISTS welfare_lockers CASCADE;

-- 기존 물품대여 관련 테이블 삭제
DROP TABLE IF EXISTS welfare_rental_requests CASCADE;
DROP TABLE IF EXISTS welfare_rentals CASCADE;

-- ============================================================================
-- Step 2: 새로운 사물함 시스템 (배치도 + 구글폼)
-- ============================================================================
-- 구글폼으로 신청 받으므로 복잡한 기간 관리 불필요
-- 신청 기간 아니면 관리자가 application_form_url을 빈 문자열로 설정

-- 기존 locker_info 테이블이 있다면 삭제
DROP TABLE IF EXISTS locker_info CASCADE;

-- 사물함 정보 테이블 (배치도 이미지 + 구글폼 URL)
CREATE TABLE locker_info (
  id SERIAL PRIMARY KEY,
  layout_image_url TEXT NOT NULL,  -- 사물함 배치도 이미지 URL (피그마)
  application_form_url TEXT NOT NULL,  -- 구글폼 신청 URL (신청 마감 시 빈 문자열)
  description TEXT,  -- 설명 (예: 19, 35번 고장)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE locker_info IS '[공개] 사물함 배치도 및 신청 정보 (미래관 3층 사물함)';
COMMENT ON COLUMN locker_info.layout_image_url IS '피그마에서 생성된 배치도 이미지 URL';
COMMENT ON COLUMN locker_info.application_form_url IS '구글폼 신청 URL (신청 마감 시 빈 문자열로 설정)';
COMMENT ON COLUMN locker_info.updated_at IS '마지막 수정 시각 (관리자가 이미지/URL 업데이트한 시각)';

-- 기본 데이터 삽입
INSERT INTO locker_info (layout_image_url, application_form_url, description)
VALUES (
  '',  -- 관리자가 나중에 업로드
  '',  -- 관리자가 나중에 구글폼 URL 입력
  '미래관 3층 사물함 (19번, 35번 고장)'
);

-- ============================================================================
-- Step 3: 새로운 물품대여 시스템 (구글폼 + 스프레드시트)
-- ============================================================================

-- 기존 rental_items 테이블이 있다면 삭제
DROP TABLE IF EXISTS rental_items CASCADE;

-- 물품대여 정보 테이블
CREATE TABLE rental_items (
  id SERIAL PRIMARY KEY,
  item_name VARCHAR(100) NOT NULL,  -- 물품명 (장우산, 단우산, 2인용 돇자리 등)
  category VARCHAR(50),  -- 분류 (우산, 돇자리 등)
  image_url TEXT,  -- 물품 이미지 URL
  
  -- 구글 시트 연동
  application_sheet_url TEXT NOT NULL,  -- 구글 시트 URL (물품별로 다른 시트 가능)
  spreadsheet_id TEXT DEFAULT '1r4MXOaZ-Pp-PYIUcjscWhnyz0hLwrcqpcut2oKDles8',  -- 고정: 대여사업 스프레드시트 ID
  quantity_sheet_name VARCHAR(100) DEFAULT '물품표',  -- 고정: 시트 이름
  quantity_cell_range VARCHAR(20) NOT NULL,  -- 물품별 재고 셀 위치 (예: C2, C4, C6)
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE rental_items IS '[공개] 물품대여 정보 (구글 시트 연동)';
COMMENT ON COLUMN rental_items.item_name IS '물품명 (장우산, 단우산 등 세분화)';
COMMENT ON COLUMN rental_items.application_sheet_url IS '구글 시트 URL (신청 현황 확인용)';
COMMENT ON COLUMN rental_items.spreadsheet_id IS '구글 스프레드시트 ID (재고 관리용)';
COMMENT ON COLUMN rental_items.quantity_cell_range IS '현재 재고 수량이 있는 셀 위치 (예: C2, C4)';

CREATE INDEX idx_rental_items_category ON rental_items(category);
CREATE INDEX idx_rental_items_is_active ON rental_items(is_active);

-- ============================================================================
-- Migration 완료
-- ============================================================================
