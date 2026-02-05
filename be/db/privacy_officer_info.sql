-- ============================================
-- Privacy Officer Info Table
-- 개인정보 총책임자(학생회장) 정보 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS privacy_officer_info (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT,
    phone TEXT,
    email TEXT,
    office_address TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- 초기 레코드 생성
INSERT INTO privacy_officer_info (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS 정책
ALTER TABLE privacy_officer_info ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "privacy_officer_info_select_policy" ON privacy_officer_info
    FOR SELECT USING (true);

-- 관리자만 수정 가능
CREATE POLICY "privacy_officer_info_update_policy" ON privacy_officer_info
    FOR UPDATE USING (auth.role() = 'service_role');

-- 코멘트
COMMENT ON TABLE privacy_officer_info IS '개인정보 총책임자(학생회장) 정보';
COMMENT ON COLUMN privacy_officer_info.name IS '이름';
COMMENT ON COLUMN privacy_officer_info.phone IS '전화번호';
COMMENT ON COLUMN privacy_officer_info.email IS '이메일';
COMMENT ON COLUMN privacy_officer_info.office_address IS '학생회실 주소';
COMMENT ON COLUMN privacy_officer_info.description IS '설명';
