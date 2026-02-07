-- spreadsheet_id: DEFAULT 제거 + 기존 값 초기화
-- 이제 application_sheet_url에서 자동 추출하므로 DB에 별도 저장 불필요
-- Supabase Dashboard > SQL Editor에서 실행

-- 1. DEFAULT 값 제거 (새 물품 추가 시 잘못된 ID가 자동 삽입되는 것 방지)
ALTER TABLE rental_items ALTER COLUMN spreadsheet_id DROP DEFAULT;

-- 2. 기존에 저장된 (잘못될 수 있는) spreadsheet_id 값 초기화
UPDATE rental_items SET spreadsheet_id = NULL;
