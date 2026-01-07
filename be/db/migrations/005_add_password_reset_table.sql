-- ============================================================================
-- Migration 005: Add password reset functionality
-- ============================================================================
-- Purpose: Allow users to reset password via email verification
-- Date: 2026-01-07
-- ============================================================================

-- 비밀번호 재설정 인증 테이블
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,           -- 학번
  email VARCHAR(255) NOT NULL,               -- 이메일
  code VARCHAR(6) NOT NULL,                  -- 6자리 인증 코드
  verified BOOLEAN DEFAULT false,            -- 인증 완료 여부
  used BOOLEAN DEFAULT false,                -- 비밀번호 재설정에 사용됨
  expires_at TIMESTAMPTZ NOT NULL,           -- 만료 시각 (5분)
  created_at TIMESTAMPTZ DEFAULT NOW(),      -- 생성 시각
  verified_at TIMESTAMPTZ                    -- 인증 완료 시각
);

-- 인덱스
CREATE INDEX idx_password_resets_student_id ON password_resets(student_id);
CREATE INDEX idx_password_resets_email ON password_resets(email);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);
