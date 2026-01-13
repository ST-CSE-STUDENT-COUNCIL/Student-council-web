-- ============================================================================
-- Migration 011: 모든 테이블에 updated_at 자동 갱신 트리거 추가
-- ============================================================================
-- 목적: UPDATE 시 updated_at이 자동으로 갱신되도록 트리거 추가
-- 적용 대상: login_blocks, users, introduction_images, posts, suggestions, clubs, rental_items
-- 작성일: 2026-01-11
-- ============================================================================

-- 1. 범용 트리거 함수 생성 (이미 존재하면 교체)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 각 테이블에 트리거 생성 (이미 존재하면 먼저 삭제)

-- login_blocks 테이블
DROP TRIGGER IF EXISTS trigger_login_blocks_updated_at ON login_blocks;
CREATE TRIGGER trigger_login_blocks_updated_at
  BEFORE UPDATE ON login_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- users 테이블
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- introduction_images 테이블
DROP TRIGGER IF EXISTS trigger_introduction_images_updated_at ON introduction_images;
CREATE TRIGGER trigger_introduction_images_updated_at
  BEFORE UPDATE ON introduction_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- posts 테이블
DROP TRIGGER IF EXISTS trigger_posts_updated_at ON posts;
CREATE TRIGGER trigger_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- suggestions 테이블
DROP TRIGGER IF EXISTS trigger_suggestions_updated_at ON suggestions;
CREATE TRIGGER trigger_suggestions_updated_at
  BEFORE UPDATE ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- clubs 테이블
DROP TRIGGER IF EXISTS trigger_clubs_updated_at ON clubs;
CREATE TRIGGER trigger_clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- rental_items 테이블
DROP TRIGGER IF EXISTS trigger_rental_items_updated_at ON rental_items;
CREATE TRIGGER trigger_rental_items_updated_at
  BEFORE UPDATE ON rental_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. 확인
COMMENT ON FUNCTION update_updated_at_column() IS 'UPDATE 시 updated_at 컬럼을 현재 시각으로 자동 갱신';
