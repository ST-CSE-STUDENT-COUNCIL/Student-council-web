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
  SELECT max_capacity, current_count, require_membership, registration_start, registration_end
  INTO v_max_capacity, v_current_count, v_require_membership, v_registration_start, v_registration_end
  FROM activities
  WHERE id = p_activity_id AND is_active = true AND is_deleted = false
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '존재하지 않거나 비활성화된 활동입니다', NULL::INT;
    RETURN;
  END IF;
  
  IF v_registration_start IS NOT NULL AND NOW() < v_registration_start THEN
    RETURN QUERY SELECT false, '아직 신청 기간이 아닙니다', NULL::INT;
    RETURN;
  END IF;
  
  IF v_registration_end IS NOT NULL AND NOW() > v_registration_end THEN
    RETURN QUERY SELECT false, '신청 기간이 종료되었습니다', NULL::INT;
    RETURN;
  END IF;
  
  IF v_max_capacity IS NOT NULL AND v_current_count >= v_max_capacity THEN
    RETURN QUERY SELECT false, '정원이 마감되었습니다', NULL::INT;
    RETURN;
  END IF;
  
  IF p_user_id IS NOT NULL AND v_require_membership = true THEN
    SELECT membership_paid INTO v_user_membership
    FROM users WHERE id = p_user_id;

    IF v_user_membership IS NULL THEN
        RETURN QUERY SELECT false, '회원 정보를 찾을 수 없습니다', NULL::INT;
        RETURN;
    END IF;
    
    IF v_user_membership = false THEN
      RETURN QUERY SELECT false, '회비 납부자만 신청 가능합니다', NULL::INT;
      RETURN;
    END IF;
  END IF;
  
  IF p_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM activity_registrations WHERE activity_id = p_activity_id AND user_id = p_user_id) THEN
      RETURN QUERY SELECT false, '이미 신청하셨습니다', NULL::INT;
      RETURN;
    END IF;
  END IF;
  
  INSERT INTO activity_registrations (
    activity_id, user_id, name, student_id, department, phone, email,
    form_responses, verification_image_url, kakao_id
  ) VALUES (
    p_activity_id, p_user_id, p_name, p_student_id, p_department, p_phone, p_email,
    p_form_responses, p_verification_image_url, p_kakao_id
  ) RETURNING id INTO v_registration_id;
  
  UPDATE activities
  SET current_count = current_count + 1, updated_at = NOW()
  WHERE id = p_activity_id;
  
  RETURN QUERY SELECT true, '신청이 완료되었습니다', v_registration_id;
END;
$$ LANGUAGE plpgsql;
