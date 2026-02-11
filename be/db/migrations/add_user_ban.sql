-- Migration: Add ban functionality to users table
-- Date: 2026-02-10

-- Add ban-related columns
ALTER TABLE users 
  ADD COLUMN is_banned BOOLEAN DEFAULT false,
  ADD COLUMN ban_reason TEXT,
  ADD COLUMN banned_at TIMESTAMPTZ,
  ADD COLUMN banned_by UUID REFERENCES users(id);

-- Add index for ban queries
CREATE INDEX idx_users_is_banned ON users(is_banned);

-- Add comments
COMMENT ON COLUMN users.is_banned IS '밴 여부 (true: 접근 차단됨)';
COMMENT ON COLUMN users.ban_reason IS '밴 사유 (관리자가 기록)';
COMMENT ON COLUMN users.banned_at IS '밴 처리 일시';
COMMENT ON COLUMN users.banned_by IS '밴 처리한 관리자 ID';
