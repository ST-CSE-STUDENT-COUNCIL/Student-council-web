-- ============================================
-- Print Welfare Info Table
-- 프린트 복지사업 정보 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS print_welfare_info (
    id INTEGER PRIMARY KEY DEFAULT 1,
    image_url TEXT,
    description TEXT,
    google_form_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- 초기 레코드 생성
INSERT INTO print_welfare_info (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS 정책
ALTER TABLE print_welfare_info ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "print_welfare_info_select_policy" ON print_welfare_info
    FOR SELECT USING (true);

-- 관리자만 수정 가능
CREATE POLICY "print_welfare_info_update_policy" ON print_welfare_info
    FOR UPDATE USING (auth.role() = 'service_role');

-- 코멘트
COMMENT ON TABLE print_welfare_info IS '프린트 복지사업 정보';
COMMENT ON COLUMN print_welfare_info.image_url IS '프린트 관련 이미지 URL';
COMMENT ON COLUMN print_welfare_info.description IS '설명';
COMMENT ON COLUMN print_welfare_info.google_form_url IS '신청 구글폼 URL';
