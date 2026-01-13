-- Migration 010: posts 테이블에 draft 상태 추가
-- 게시글 작성 중(draft) 상태를 지원하여 파일 업로드를 위한 post_id 선확보 가능

-- 1. is_draft 컬럼 추가
ALTER TABLE posts 
ADD COLUMN is_draft BOOLEAN DEFAULT false;

COMMENT ON COLUMN posts.is_draft IS 'Draft 상태 (true: 작성 중, false: 게시됨)';

-- 2. 인덱스 추가 (draft 게시글 필터링 최적화)
CREATE INDEX idx_posts_is_draft ON posts(is_draft);

-- 사용 시나리오:
-- 1. 게시글 draft 생성 (is_draft=true) → post_id 획득
-- 2. post_id로 파일 업로드 (post-{id}/ 폴더)
-- 3. 게시글 완성 후 is_draft=false로 업데이트
