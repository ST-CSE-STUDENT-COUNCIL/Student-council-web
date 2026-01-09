-- ============================================================================
-- 007: 비회원 행사 신청 지원
-- ============================================================================
-- 실행 일시: 2026-01-09
-- 설명: 비회원도 행사 신청 가능하도록 registrations 테이블 수정
--       - user_id nullable 변경
--       - 비회원 정보 필드 추가 (guest_student_id, guest_name, guest_phone)
--       - CHECK constraint: 회원 OR 비회원 중 하나는 필수
-- ============================================================================

-- 1. 기존 UNIQUE 제약 조건 삭제
ALTER TABLE registrations
DROP CONSTRAINT IF EXISTS registrations_event_id_user_id_key;

-- 2. user_id를 nullable로 변경 (기존 데이터 유지)
ALTER TABLE registrations
ALTER COLUMN user_id DROP NOT NULL;

-- 3. 비회원 정보 필드 추가
ALTER TABLE registrations
ADD COLUMN guest_student_id VARCHAR(20),
ADD COLUMN guest_name VARCHAR(50),
ADD COLUMN guest_phone VARCHAR(20);

-- 4. CHECK constraint: 회원 OR 비회원 중 하나는 필수
ALTER TABLE registrations
ADD CONSTRAINT check_user_or_guest CHECK (
    (user_id IS NOT NULL) OR 
    (guest_student_id IS NOT NULL AND guest_name IS NOT NULL)
);

-- 5. 중복 신청 방지를 위한 부분 UNIQUE 인덱스 생성
-- 회원: (event_id, user_id) UNIQUE (user_id가 NOT NULL일 때만)
CREATE UNIQUE INDEX idx_registrations_event_user 
ON registrations(event_id, user_id) 
WHERE user_id IS NOT NULL;

-- 비회원: (event_id, guest_student_id) UNIQUE (guest_student_id가 NOT NULL일 때만)
CREATE UNIQUE INDEX idx_registrations_event_guest 
ON registrations(event_id, guest_student_id) 
WHERE guest_student_id IS NOT NULL;

-- 6. 비회원 신청을 위한 새로운 함수 생성
CREATE OR REPLACE FUNCTION register_for_event_guest(
  p_event_id INT,
  p_user_id UUID DEFAULT NULL,
  p_guest_student_id VARCHAR DEFAULT NULL,
  p_guest_name VARCHAR DEFAULT NULL,
  p_guest_phone VARCHAR DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_current_count INT;
  v_max_capacity INT;
  v_registration_number INT;
  v_registration_start TIMESTAMPTZ;
  v_registration_end TIMESTAMPTZ;
  v_require_membership BOOLEAN;
  v_user_membership_paid BOOLEAN := false;
BEGIN
  -- 입력 검증
  IF p_user_id IS NULL AND (p_guest_student_id IS NULL OR p_guest_name IS NULL) THEN
    RETURN json_build_object('success', false, 'message', '회원 로그인 또는 비회원 정보(학번, 이름)가 필요합니다');
  END IF;

  -- 행사 정보 조회 및 락
  SELECT current_count, max_capacity, registration_start, registration_end, require_membership
  INTO v_current_count, v_max_capacity, v_registration_start, v_registration_end, v_require_membership
  FROM events
  WHERE id = p_event_id AND is_active = true AND is_deleted = false
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', '행사를 찾을 수 없습니다');
  END IF;
  
  -- 회원인 경우 회비 납부 여부 확인
  IF p_user_id IS NOT NULL THEN
    SELECT membership_paid INTO v_user_membership_paid
    FROM users WHERE id = p_user_id;
  END IF;
  
  -- 회비 납부자 전용 행사 체크
  IF v_require_membership AND NOT v_user_membership_paid THEN
    RETURN json_build_object('success', false, 'message', '학생회비 납부자만 신청 가능합니다');
  END IF;
  
  -- 신청 기간 체크
  IF NOW() < v_registration_start THEN
    RETURN json_build_object('success', false, 'message', '신청 시작 전입니다');
  END IF;
  
  IF NOW() > v_registration_end THEN
    RETURN json_build_object('success', false, 'message', '신청 기간이 종료되었습니다');
  END IF;
  
  -- 정원 확인
  IF v_current_count >= v_max_capacity THEN
    RETURN json_build_object('success', false, 'message', '정원이 마감되었습니다');
  END IF;
  
  -- 중복 신청 체크
  IF p_user_id IS NOT NULL THEN
    -- 회원 중복 체크
    IF EXISTS (SELECT 1 FROM registrations WHERE event_id = p_event_id AND user_id = p_user_id) THEN
      RETURN json_build_object('success', false, 'message', '이미 신청하셨습니다');
    END IF;
  ELSE
    -- 비회원 중복 체크
    IF EXISTS (SELECT 1 FROM registrations WHERE event_id = p_event_id AND guest_student_id = p_guest_student_id) THEN
      RETURN json_build_object('success', false, 'message', '이미 신청하셨습니다');
    END IF;
  END IF;
  
  -- 신청 순번 생성
  v_registration_number := v_current_count + 1;
  
  -- 신청 삽입
  INSERT INTO registrations (
    event_id, 
    user_id, 
    guest_student_id, 
    guest_name, 
    guest_phone, 
    registration_number
  )
  VALUES (
    p_event_id, 
    p_user_id, 
    p_guest_student_id, 
    p_guest_name, 
    p_guest_phone, 
    v_registration_number
  );
  
  -- 카운트 증가
  UPDATE events 
  SET current_count = current_count + 1, updated_at = NOW()
  WHERE id = p_event_id;
  
  -- 성공 반환
  RETURN json_build_object(
    'success', true, 
    'message', '신청 완료',
    'registration_number', v_registration_number
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION register_for_event_guest IS '[회원/비회원] 행사 신청 (트랜잭션)';
COMMENT ON COLUMN registrations.guest_student_id IS '비회원 학번';
COMMENT ON COLUMN registrations.guest_name IS '비회원 이름';
COMMENT ON COLUMN registrations.guest_phone IS '비회원 전화번호';

-- ============================================================================
-- 확인 쿼리
-- ============================================================================

-- 테이블 구조 확인
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'registrations' 
-- ORDER BY ordinal_position;

-- 제약 조건 확인
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'registrations'::regclass;

-- ============================================================================
-- Rollback (필요시)
-- ============================================================================

-- DROP FUNCTION IF EXISTS register_for_event_guest;
-- DROP INDEX IF EXISTS idx_registrations_event_user;
-- DROP INDEX IF EXISTS idx_registrations_event_guest;
-- ALTER TABLE registrations DROP CONSTRAINT IF EXISTS check_user_or_guest;
-- ALTER TABLE registrations DROP COLUMN IF EXISTS guest_student_id;
-- ALTER TABLE registrations DROP COLUMN IF EXISTS guest_name;
-- ALTER TABLE registrations DROP COLUMN IF EXISTS guest_phone;
-- ALTER TABLE registrations ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE registrations ADD CONSTRAINT registrations_event_id_user_id_key UNIQUE(event_id, user_id);
