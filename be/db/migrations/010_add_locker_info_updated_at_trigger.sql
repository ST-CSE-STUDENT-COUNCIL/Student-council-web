-- ============================================================================
-- Migration 010: locker_info 테이블에 updated_at 자동 갱신 트리거 추가
-- ============================================================================
-- 목적: UPDATE 시 updated_at이 자동으로 한국 시간(KST)으로 갱신되도록 트리거 추가
-- 적용 대상: locker_info 테이블
-- 작성일: 2026-01-11
-- ============================================================================

-- 1. 트리거 함수 생성 (이미 존재하면 교체)
CREATE OR REPLACE FUNCTION update_locker_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW() AT TIME ZONE 'Asia/Seoul';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 트리거 생성 (이미 존재하면 먼저 삭제)
DROP TRIGGER IF EXISTS trigger_locker_info_updated_at ON locker_info;

CREATE TRIGGER trigger_locker_info_updated_at
  BEFORE UPDATE ON locker_info
  FOR EACH ROW
  EXECUTE FUNCTION update_locker_info_updated_at();

-- 3. 확인
COMMENT ON TRIGGER trigger_locker_info_updated_at ON locker_info IS 'locker_info 테이블 UPDATE 시 updated_at을 한국 시간(KST)으로 자동 갱신';
