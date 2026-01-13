-- ============================================================================
-- 동아리 소개 이미지 테이블
-- ============================================================================
-- 동아리별 다중 소개 이미지 관리
-- ============================================================================

CREATE TABLE club_introduction_images (
  id SERIAL PRIMARY KEY,
  club_id INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption VARCHAR(200),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE club_introduction_images IS '동아리 소개 이미지';
COMMENT ON COLUMN club_introduction_images.club_id IS '동아리 ID';
COMMENT ON COLUMN club_introduction_images.display_order IS '표시 순서 (낮을수록 먼저)';
COMMENT ON COLUMN club_introduction_images.caption IS '이미지 설명';

-- 인덱스
CREATE INDEX idx_club_intro_images_club_id ON club_introduction_images(club_id);
CREATE INDEX idx_club_intro_images_order ON club_introduction_images(club_id, display_order);

-- updated_at 자동 갱신 트리거
CREATE TRIGGER trigger_club_intro_images_updated_at
  BEFORE UPDATE ON club_introduction_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책
ALTER TABLE club_introduction_images ENABLE ROW LEVEL SECURITY;

-- 공개 읽기
CREATE POLICY "club_intro_images_read_all"
  ON club_introduction_images
  FOR SELECT
  USING (true);

-- 관리자만 수정
CREATE POLICY "club_intro_images_admin_modify"
  ON club_introduction_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
