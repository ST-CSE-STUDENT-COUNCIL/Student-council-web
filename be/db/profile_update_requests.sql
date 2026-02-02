-- ============================================
-- Profile Update Requests Table
-- 사용자 프로필 변경 요청 테이블 (이름, 학번)
-- ============================================

CREATE TABLE IF NOT EXISTS profile_update_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 변경 대상 필드
    field_name VARCHAR(20) NOT NULL CHECK (field_name IN ('name', 'student_id')),
    current_value VARCHAR(100),
    new_value VARCHAR(100) NOT NULL,
    
    -- 학적 증명 이미지 (Supabase Storage 경로)
    verification_image_url TEXT NOT NULL,
    
    -- 처리 상태
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,  -- 거부 사유 (rejected 시 필수)
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES users(id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_profile_updates_user_id ON profile_update_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_updates_status ON profile_update_requests(status);

-- RLS 정책
ALTER TABLE profile_update_requests ENABLE ROW LEVEL SECURITY;

-- 본인 요청만 조회 가능
CREATE POLICY "Users can view own requests" ON profile_update_requests
    FOR SELECT USING (auth.uid() = user_id);

-- 본인만 생성 가능
CREATE POLICY "Users can create own requests" ON profile_update_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 코멘트
COMMENT ON TABLE profile_update_requests IS '사용자 프로필 변경 요청 (관리자 승인 필요)';
COMMENT ON COLUMN profile_update_requests.field_name IS '변경할 필드명 (name, student_id)';
COMMENT ON COLUMN profile_update_requests.verification_image_url IS '학적 증명 이미지 Storage 경로';
COMMENT ON COLUMN profile_update_requests.rejection_reason IS '관리자 거부 사유';
