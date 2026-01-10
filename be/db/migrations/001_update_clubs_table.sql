-- ============================================================================
-- Clubs 테이블 구조 변경
-- 기존 테이블이 있다면 DROP 후 재생성, 없다면 새로 생성
-- ============================================================================

-- 기존 테이블 삭제 (데이터 손실 주의!)
DROP TABLE IF EXISTS clubs CASCADE;

-- 새 구조로 clubs 테이블 생성
CREATE TABLE clubs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,  -- 동아리명 (필수)
  image_url TEXT NOT NULL,  -- 동아리 이미지 (필수)
  description TEXT NOT NULL,  -- 동아리 세부 설명 (필수)
  website_url TEXT,  -- 동아리 사이트 URL (선택)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE clubs IS '[공개] 동아리 목록';
COMMENT ON COLUMN clubs.name IS '동아리명 (필수)';
COMMENT ON COLUMN clubs.image_url IS '동아리 대표 이미지 URL (필수)';
COMMENT ON COLUMN clubs.description IS '동아리 세부 설명 (필수)';
COMMENT ON COLUMN clubs.website_url IS '동아리 웹사이트 또는 SNS URL (선택)';
