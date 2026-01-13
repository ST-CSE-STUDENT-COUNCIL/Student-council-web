-- ============================================================================
-- 거절된 사용자 아카이브 테이블
-- ============================================================================
-- 가입 거절 시 users/auth.users에서 삭제하고 여기에 보관
-- 재가입 허용하면서 거절 이력 보존
-- ============================================================================

CREATE TABLE rejected_users (
  id SERIAL PRIMARY KEY,
  original_user_id UUID,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  student_id VARCHAR(20),
  department VARCHAR(100),
  phone VARCHAR(20),
  rejection_reason TEXT,
  rejected_at TIMESTAMPTZ DEFAULT NOW(),
  rejected_by UUID  -- 거절한 관리자
);

COMMENT ON TABLE rejected_users IS '거절된 회원가입 이력';
COMMENT ON COLUMN rejected_users.original_user_id IS '원래 users 테이블의 ID';
COMMENT ON COLUMN rejected_users.rejection_reason IS '거절 사유';

-- 인덱스
CREATE INDEX idx_rejected_users_student_id ON rejected_users(student_id);
CREATE INDEX idx_rejected_users_email ON rejected_users(email);
CREATE INDEX idx_rejected_users_rejected_at ON rejected_users(rejected_at DESC);
