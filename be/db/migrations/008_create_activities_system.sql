-- ============================================================================
-- 마이그레이션 008: Activities 시스템 추가
-- ============================================================================
-- 작성일: 2026-01-10
-- 목적: 행사/수요조사/설문조사/카톡방 초대/공지를 통합 관리하는 시스템 구축
-- 
-- 변경사항:
--   - activities 테이블 추가 (통합 활동 관리)
--   - activity_registrations 테이블 추가 (신청 내역)
--   - activity_images 테이블 추가 (이미지 관리)
-- 
-- 주의:
--   - 기존 events 테이블은 그대로 유지됩니다
--   - 점진적 마이그레이션을 위해 병행 운영 가능
-- ============================================================================

-- ============================================================================
-- 1. Activities 테이블 (통합 활동 관리)
-- ============================================================================
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  
  -- 타입 및 기본 정보
  type VARCHAR(50) NOT NULL,  -- 'event', 'demand_survey', 'survey', 'kakao_invite', 'notice'
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- 신청 기간 설정
  registration_start TIMESTAMPTZ,
  registration_end TIMESTAMPTZ,
  
  -- 정원 관리 (선착순)
  max_capacity INT,
  current_count INT DEFAULT 0,
  
  -- 권한 제한
  require_membership BOOLEAN DEFAULT false,  -- 회비 납부자만
  
  -- 타입별 상세 설정 (JSONB)
  config JSONB NOT NULL DEFAULT '{}',
  -- 예시:
  -- event: {"locations": [...], "dates": [...], "price": 5000}
  -- demand_survey: {"target_date": "2026-03-15"}
  -- survey: {"questions": [...]}
  -- kakao_invite: {"kakao_room_name": "컴공 24학번"}
  -- notice: {"external_link": "https://..."}
  
  -- 추가 정보 수집 필드 정의 (JSONB)
  form_fields JSONB DEFAULT '[]',
  -- 예시:
  -- [
  --   {"name": "gender", "label": "성별", "type": "select", "options": ["남", "여"], "required": true},
  --   {"name": "team_members", "label": "팀원", "type": "text", "required": false}
  -- ]
  
  -- 썸네일
  thumbnail_url TEXT,
  
  -- 활성화 및 삭제
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),
  
  -- 메타데이터
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 제약조건
  CONSTRAINT check_activity_capacity CHECK (max_capacity IS NULL OR current_count <= max_capacity),
  CONSTRAINT check_activity_type CHECK (type IN ('event', 'demand_survey', 'survey', 'kakao_invite', 'notice'))
);

COMMENT ON TABLE activities IS '통합 활동 관리 (행사/수요조사/설문조사/카톡방초대/공지)';
COMMENT ON COLUMN activities.type IS '활동 타입: event, demand_survey, survey, kakao_invite, notice';
COMMENT ON COLUMN activities.config IS '타입별 상세 설정 (JSONB)';
COMMENT ON COLUMN activities.form_fields IS '추가 정보 수집 필드 정의 (JSONB)';
COMMENT ON COLUMN activities.current_count IS '현재 신청 인원 (트랜잭션으로 관리)';

-- 인덱스
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_registration_dates ON activities(registration_start, registration_end);
CREATE INDEX idx_activities_is_deleted ON activities(is_deleted);
CREATE INDEX idx_activities_is_active ON activities(is_active);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- GIN 인덱스 (JSONB 쿼리 성능 향상)
CREATE INDEX idx_activities_config ON activities USING GIN (config);
CREATE INDEX idx_activities_form_fields ON activities USING GIN (form_fields);

-- ============================================================================
-- 2. Activity Images 테이블 (이미지 관리)
-- ============================================================================
CREATE TABLE activity_images (
  id SERIAL PRIMARY KEY,
  activity_id INT REFERENCES activities(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE activity_images IS '활동 상세 이미지 (여러 장 가능)';
COMMENT ON COLUMN activity_images.display_order IS '표시 순서 (낮을수록 먼저)';

CREATE INDEX idx_activity_images_activity_id ON activity_images(activity_id);
CREATE INDEX idx_activity_images_display_order ON activity_images(activity_id, display_order);

-- ============================================================================
-- 3. Activity Registrations 테이블 (신청 내역)
-- ============================================================================
CREATE TABLE activity_registrations (
  id SERIAL PRIMARY KEY,
  activity_id INT REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),  -- NULL 가능 (비회원 신청 지원)
  
  -- 기본 정보 (비회원 신청 시 필수)
  name VARCHAR(100),
  student_id VARCHAR(20),
  department VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  
  -- 추가 정보 응답 (JSONB)
  form_responses JSONB DEFAULT '{}',
  -- 예시: {"gender": "남성", "team_members": "홍길동, 김철수"}
  
  -- 카톡방 초대 전용 필드
  verification_image_url TEXT,  -- 학적 인증 이미지 (Private Storage)
  kakao_id VARCHAR(100),        -- 카카오톡 ID
  
  -- 설문조사 응답 (survey 타입 전용)
  survey_responses JSONB DEFAULT '{}',
  -- 예시: {"1": "매우 만족", "2": "음식이 더 다양했으면 좋겠습니다"}
  
  -- 신청 상태
  status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected, cancelled
  admin_note TEXT,  -- 관리자 메모
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 중복 신청 방지 (회원만)
  CONSTRAINT unique_activity_user UNIQUE(activity_id, user_id)
);

COMMENT ON TABLE activity_registrations IS '활동 신청 내역 (회원/비회원 모두 가능)';
COMMENT ON COLUMN activity_registrations.user_id IS '회원 ID (비회원은 NULL)';
COMMENT ON COLUMN activity_registrations.form_responses IS '추가 정보 응답 (JSONB)';
COMMENT ON COLUMN activity_registrations.verification_image_url IS '학적 인증 이미지 (카톡방 초대용)';
COMMENT ON COLUMN activity_registrations.survey_responses IS '설문조사 응답 (JSONB)';
COMMENT ON COLUMN activity_registrations.status IS '신청 상태: pending, approved, rejected, cancelled';

-- 인덱스
CREATE INDEX idx_activity_registrations_activity_id ON activity_registrations(activity_id);
CREATE INDEX idx_activity_registrations_user_id ON activity_registrations(user_id);
CREATE INDEX idx_activity_registrations_status ON activity_registrations(status);
CREATE INDEX idx_activity_registrations_created_at ON activity_registrations(created_at DESC);

-- GIN 인덱스 (JSONB 쿼리 성능 향상)
CREATE INDEX idx_activity_registrations_form_responses ON activity_registrations USING GIN (form_responses);
CREATE INDEX idx_activity_registrations_survey_responses ON activity_registrations USING GIN (survey_responses);

-- ============================================================================
-- 4. 신청 함수 (선착순 처리)
-- ============================================================================
CREATE OR REPLACE FUNCTION register_for_activity(
  p_activity_id INT,
  p_user_id UUID,
  p_name VARCHAR,
  p_student_id VARCHAR,
  p_department VARCHAR,
  p_phone VARCHAR,
  p_email VARCHAR,
  p_form_responses JSONB DEFAULT '{}',
  p_verification_image_url TEXT DEFAULT NULL,
  p_kakao_id VARCHAR DEFAULT NULL
) RETURNS TABLE(success BOOLEAN, message TEXT, registration_id INT) AS $$
DECLARE
  v_max_capacity INT;
  v_current_count INT;
  v_require_membership BOOLEAN;
  v_user_membership BOOLEAN;
  v_registration_id INT;
  v_registration_start TIMESTAMPTZ;
  v_registration_end TIMESTAMPTZ;
BEGIN
  -- 1. 활동 정보 조회
  SELECT max_capacity, current_count, require_membership, registration_start, registration_end
  INTO v_max_capacity, v_current_count, v_require_membership, v_registration_start, v_registration_end
  FROM activities
  WHERE id = p_activity_id AND is_active = true AND is_deleted = false
  FOR UPDATE;  -- 행 잠금
  
  -- 활동이 존재하지 않음
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '존재하지 않거나 비활성화된 활동입니다', NULL::INT;
    RETURN;
  END IF;
  
  -- 2. 신청 기간 체크
  IF v_registration_start IS NOT NULL AND NOW() < v_registration_start THEN
    RETURN QUERY SELECT false, '아직 신청 기간이 아닙니다', NULL::INT;
    RETURN;
  END IF;
  
  IF v_registration_end IS NOT NULL AND NOW() > v_registration_end THEN
    RETURN QUERY SELECT false, '신청 기간이 종료되었습니다', NULL::INT;
    RETURN;
  END IF;
  
  -- 3. 정원 체크
  IF v_max_capacity IS NOT NULL AND v_current_count >= v_max_capacity THEN
    RETURN QUERY SELECT false, '정원이 마감되었습니다', NULL::INT;
    RETURN;
  END IF;
  
  -- 4. 회비 납부 체크 (회원만)
  IF p_user_id IS NOT NULL AND v_require_membership = true THEN
    SELECT membership_paid INTO v_user_membership
    FROM users
    WHERE id = p_user_id;
    
    IF v_user_membership = false THEN
      RETURN QUERY SELECT false, '회비 납부자만 신청 가능합니다', NULL::INT;
      RETURN;
    END IF;
  END IF;
  
  -- 5. 중복 신청 체크 (회원만)
  IF p_user_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM activity_registrations
      WHERE activity_id = p_activity_id AND user_id = p_user_id
    ) THEN
      RETURN QUERY SELECT false, '이미 신청하셨습니다', NULL::INT;
      RETURN;
    END IF;
  END IF;
  
  -- 6. 신청 등록
  INSERT INTO activity_registrations (
    activity_id, user_id, name, student_id, department, phone, email,
    form_responses, verification_image_url, kakao_id
  ) VALUES (
    p_activity_id, p_user_id, p_name, p_student_id, p_department, p_phone, p_email,
    p_form_responses, p_verification_image_url, p_kakao_id
  ) RETURNING id INTO v_registration_id;
  
  -- 7. 현재 인원 증가
  UPDATE activities
  SET current_count = current_count + 1,
      updated_at = NOW()
  WHERE id = p_activity_id;
  
  RETURN QUERY SELECT true, '신청이 완료되었습니다', v_registration_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION register_for_activity IS '활동 신청 함수 (선착순 처리, 트랜잭션 보장)';

-- ============================================================================
-- 5. 신청 취소 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION cancel_activity_registration(
  p_registration_id INT,
  p_user_id UUID
) RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_activity_id INT;
  v_reg_user_id UUID;
BEGIN
  -- 1. 신청 내역 조회
  SELECT activity_id, user_id
  INTO v_activity_id, v_reg_user_id
  FROM activity_registrations
  WHERE id = p_registration_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '신청 내역을 찾을 수 없습니다';
    RETURN;
  END IF;
  
  -- 2. 본인 확인
  IF v_reg_user_id != p_user_id THEN
    RETURN QUERY SELECT false, '본인의 신청만 취소할 수 있습니다';
    RETURN;
  END IF;
  
  -- 3. 신청 취소
  UPDATE activity_registrations
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE id = p_registration_id;
  
  -- 4. 현재 인원 감소
  UPDATE activities
  SET current_count = GREATEST(current_count - 1, 0),
      updated_at = NOW()
  WHERE id = v_activity_id;
  
  RETURN QUERY SELECT true, '신청이 취소되었습니다';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cancel_activity_registration IS '활동 신청 취소 함수';

-- ============================================================================
-- 6. 트리거: updated_at 자동 갱신
-- ============================================================================
CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();

CREATE TRIGGER trigger_activity_registrations_updated_at
  BEFORE UPDATE ON activity_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();

-- ============================================================================
-- 완료
-- ============================================================================
-- 마이그레이션 완료!
-- 이제 FastAPI에서 activities API를 구현하면 됩니다.
-- ============================================================================
