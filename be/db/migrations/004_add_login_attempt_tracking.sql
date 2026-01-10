-- ============================================================================
-- Migration 004: Add login attempt tracking
-- ============================================================================
-- Purpose: Track login failures per student_id for enhanced security
-- Date: 2026-01-07
-- ============================================================================

-- 학번별 로그인 시도 추적 테이블
CREATE TABLE login_attempts (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,           -- 학번
  attempt_time TIMESTAMPTZ DEFAULT NOW(),    -- 시도 시각
  success BOOLEAN NOT NULL,                  -- 성공 여부
  ip_address VARCHAR(45),                    -- IP 주소 (IPv4/IPv6)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_login_attempts_student_id ON login_attempts(student_id);
CREATE INDEX idx_login_attempts_time ON login_attempts(attempt_time);

-- 학번별 로그인 차단 상태 테이블
CREATE TABLE login_blocks (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) UNIQUE NOT NULL,    -- 학번
  failed_attempts INT DEFAULT 0,             -- 누적 실패 횟수
  block_until TIMESTAMPTZ,                   -- 차단 만료 시각
  block_reason VARCHAR(50),                  -- 차단 사유 (10분/1시간/영구)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_login_blocks_student_id ON login_blocks(student_id);
CREATE INDEX idx_login_blocks_until ON login_blocks(block_until);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_login_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_login_blocks_updated_at
BEFORE UPDATE ON login_blocks
FOR EACH ROW
EXECUTE FUNCTION update_login_blocks_updated_at();
