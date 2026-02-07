-- ============================================
-- Guidebook Info Table
-- 신입생 가이드북 정보 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS guidebook_info (
    id INTEGER PRIMARY KEY DEFAULT 1,
    notion_url TEXT,
    title TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- 초기 레코드 생성
INSERT INTO guidebook_info (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS 정책
ALTER TABLE guidebook_info ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "guidebook_info_select_policy" ON guidebook_info
    FOR SELECT USING (true);

-- 관리자만 수정 가능
CREATE POLICY "guidebook_info_update_policy" ON guidebook_info
    FOR UPDATE USING (auth.role() = 'service_role');

-- 코멘트
COMMENT ON TABLE guidebook_info IS '신입생 가이드북 정보';
COMMENT ON COLUMN guidebook_info.notion_url IS '노션 페이지 URL';
COMMENT ON COLUMN guidebook_info.title IS '제목 (관리자 입력 또는 OG 추출)';
COMMENT ON COLUMN guidebook_info.description IS '설명 (관리자 입력 또는 OG 추출)';
