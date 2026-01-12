-- ============================================================================
-- Migration: 009_fix_posts_rls_for_admin_delete
-- Description: posts 테이블 UPDATE RLS 정책 수정 - 관리자가 모든 게시물 삭제(수정) 가능하도록
-- Date: 2026-01-12
-- ============================================================================

-- 기존 UPDATE 정책 삭제
DROP POLICY IF EXISTS "posts_update_own" ON posts;
DROP POLICY IF EXISTS "posts_update_own_or_admin" ON posts;

-- 새로운 UPDATE 정책 생성: 본인 글 또는 관리자(admin/council)만 수정 가능
CREATE POLICY "posts_update_own_or_admin" ON posts
  FOR UPDATE 
  USING (
    auth.uid() = author_id  -- 본인 글
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'council')  -- 관리자 또는 학생회
    )
  )
  WITH CHECK (
    auth.uid() = author_id  -- 본인 글
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'council')  -- 관리자 또는 학생회
    )
  );

COMMENT ON POLICY "posts_update_own_or_admin" ON posts IS 
  '본인이 작성한 글 또는 관리자(admin/council)가 수정/삭제 가능';
