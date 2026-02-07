-- ============================================
-- Activity Registration Attendance Columns
-- 행사 출석 체크 컬럼 추가
-- ============================================

-- 출석 여부 및 출석 시간 컬럼 추가
ALTER TABLE activity_registrations
ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS attended_at TIMESTAMPTZ;

-- 인덱스 추가 (출석 여부로 필터링 시 성능 향상)
CREATE INDEX IF NOT EXISTS idx_activity_registrations_attended 
ON activity_registrations(activity_id, attended);

-- 코멘트 추가
COMMENT ON COLUMN activity_registrations.attended IS '출석 여부';
COMMENT ON COLUMN activity_registrations.attended_at IS '출석 체크 시간';
