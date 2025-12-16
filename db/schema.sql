-- ============================================================================
-- 서울과학기술대학교 컴퓨터공학과 학생회 홈페이지 데이터베이스 스키마
-- ============================================================================
-- 기술 스택: Supabase (PostgreSQL) + FastAPI
-- 
-- 접근 제어 정책:
--   - 비인증 사용자: 홈페이지 소개, 로그인/회원가입만 접근
--   - 인증 사용자: 모든 콘텐츠 접근 (행사, 공지사항, 건의함)
--   - 학생회(council): 일반 게시글 삭제 가능
--   - 관리자(admin): 공지사항 작성, 모든 권한
--
-- 보안:
--   - RLS로 비인증 접근 차단
--   - FastAPI Depends(verify_user)로 라우트 보호
--   - Soft Delete로 복구 가능
--   - 트랜잭션으로 선착순 처리
-- ============================================================================

-- ============================================================================
-- 0. 이메일 인증 (회원가입 1단계)
-- ============================================================================
-- 학교 이메일(@seoultech.ac.kr) 인증용 테이블
-- 6자리 코드를 이메일로 전송하고 5분 이내 인증 확인
-- ============================================================================
CREATE TABLE email_verifications (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,  -- 인증할 학교 이메일
  student_id VARCHAR(20) NOT NULL,  -- 학번
  code VARCHAR(6) NOT NULL,  -- 6자리 인증 코드
  verified BOOLEAN DEFAULT false,  -- 인증 완료 여부
  expires_at TIMESTAMPTZ NOT NULL,  -- 만료 시각 (5분)
  created_at TIMESTAMPTZ DEFAULT NOW(),  -- 생성 시각
  verified_at TIMESTAMPTZ,  -- 인증 완료 시각
  
  -- 중복 요청 방지를 위한 인덱스
  CONSTRAINT unique_unverified_email UNIQUE (email, verified)
);

-- 인덱스
CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_student_id ON email_verifications(student_id);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);

-- 만료된 인증 코드 자동 삭제 (매일 자정)
-- 주의: Supabase에서는 pg_cron 확장이 필요합니다.
-- 대안: FastAPI 백그라운드 태스크로 주기적 삭제

-- ============================================================================
-- 1. 사용자 프로필
-- ============================================================================
-- 접근 권한:
--   - 조회: 모든 인증된 사용자
--   - 수정: 본인만
--   - 권한 부여: 관리자 페이지에서 수동 변경
--
-- 역할:
--   - student: 일반 학생 (기본값)
--   - council: 일반 학생회 (공지 작성 불가, 게시글 삭제 가능)
--   - admin: 학생회 관리자 (공지 작성 가능, 모든 권한)
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id VARCHAR(20) UNIQUE NOT NULL,  -- 학번 (로그인 ID)
  name VARCHAR(100) NOT NULL,  -- 이름
  email VARCHAR(255) NOT NULL,  -- 학교 이메일 (@seoultech.ac.kr)
  department VARCHAR(100),  -- 학과
  phone VARCHAR(20),  -- 연락처
  role VARCHAR(20) DEFAULT 'student',  -- 권한: student/council/admin
  
  -- 학생 인증 (관리자 승인 방식)
  is_verified BOOLEAN DEFAULT false,  -- 관리자 승인 여부
  verification_image_url TEXT,  -- 통합정보시스템 학적 캡쳐 이미지
  verification_status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
  verified_by UUID REFERENCES profiles(id),  -- 승인한 관리자
  verified_at TIMESTAMPTZ,  -- 승인 일시
  rejection_reason TEXT,  -- 거부 사유
  
  membership_paid BOOLEAN DEFAULT false,  -- 4년 회비 납부 여부
  membership_paid_at TIMESTAMPTZ,  -- 회비 납부 일시
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS '[인증 필요] 사용자 프로필';
COMMENT ON COLUMN profiles.student_id IS '학번 (로그인 ID, Supabase Auth의 username)';
COMMENT ON COLUMN profiles.role IS 'student: 일반학생, council: 일반학생회, admin: 관리자';
COMMENT ON COLUMN profiles.is_verified IS '관리자 승인 여부 (승인되어야 로그인 가능)';
COMMENT ON COLUMN profiles.verification_image_url IS '통합정보시스템 학적 증명 이미지 (학번 확인용)';
COMMENT ON COLUMN profiles.verification_status IS 'pending: 승인대기, approved: 승인됨, rejected: 거부됨';
COMMENT ON COLUMN profiles.membership_paid IS '4년 회비 납부 여부 (납부자 전용 행사 신
CREATE INDEX idx_profiles_verification_status ON profiles(verification_status);  -- 승인 대기 목록 조회용청 조건)';

CREATE INDEX idx_profiles_student_id ON profiles(student_id);
CREATE INDEX idx_profiles_membership_paid ON profiles(membership_paid);

-- ============================================================================
-- 2. 게시판
-- ============================================================================
-- 게시판별 권한:
--   - 공지사항 (notice): admin만 작성, 모두 읽기 (인증 필요)
--   - 건의함 (suggestion): 모두 작성, 익명 허용, 관리자만 실명 확인
-- ============================================================================
CREATE TABLE boards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,  -- 게시판 이름
  slug VARCHAR(100) UNIQUE NOT NULL,  -- URL 식별자 (예: /board/notice)
  description TEXT,  -- 게시판 설명
  require_auth BOOLEAN DEFAULT true,  -- 인증 필요 여부
  allow_anonymous BOOLEAN DEFAULT false,  -- 익명 허용 여부 (건의함: true)
  require_admin BOOLEAN DEFAULT false,  -- admin 권한 필요 (공지사항: true)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE boards IS '게시판 메타데이터';
COMMENT ON COLUMN boards.slug IS 'URL 경로용 식별자 (예: /board/notice)';
COMMENT ON COLUMN boards.allow_anonymous IS '익명 허용 여부 (건의함: true, 공지사항: false)';
COMMENT ON COLUMN boards.require_admin IS 'admin 권한 필요 여부 (공지사항: true)';

-- 기본 게시판 생성
INSERT INTO boards (name, slug, description, require_admin, allow_anonymous) VALUES
('공지사항', 'notice', '학생회 공지사항', true, false),
('건의함', 'suggestion', '익명으로 건의할 수 있습니다', false, true);

-- ============================================================================
-- 3. 게시글
-- ============================================================================
-- 작성 권한:
--   - 공지사항: admin만 (RLS로 제어)
--   - 건의함: 모든 인증 사용자
--
-- 삭제 권한:
--   - 본인 글: 작성자 본인
--   - 모든 글: admin, council
--
-- 익명 처리:
--   - is_anonymous=true: 일반 사용자에게 "익명" 표시
--   - 관리자(admin, council)는 author_id로 실명 확인 가능
--
-- Soft Delete:
--   - is_deleted=true로 변경 (실제 삭제 아님)
--   - 일반 사용자는 조회 안 됨 (RLS 필터링)
--   - 관리자는 복구 가능
-- ============================================================================
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  board_id INT REFERENCES boards(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- 작성자 (익명일 때도 저장)
  title VARCHAR(200) NOT NULL,  -- 제목
  content TEXT NOT NULL,  -- 내용
  view_count INT DEFAULT 0,  -- 조회수
  is_pinned BOOLEAN DEFAULT false,  -- 상단 고정 (공지사항용)
  is_anonymous BOOLEAN DEFAULT false,  -- 익명 여부 (true: 관리자만 실명 확인)
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT false,  -- true면 일반 사용자에게 안 보임
  deleted_at TIMESTAMPTZ,  -- 삭제 일시
  deleted_by UUID REFERENCES profiles(id),  -- 삭제한 사람 (본인 or 관리자)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE posts IS '[인증 필요] 게시글 (공지사항, 건의함)';
COMMENT ON COLUMN posts.is_anonymous IS '익명 여부 (true: 익명, 관리자만 실명 확인 가능)';
COMMENT ON COLUMN posts.is_deleted IS 'Soft delete (true: 삭제됨, 복구 가능)';
COMMENT ON COLUMN posts.deleted_by IS '삭제 처리한 사람 (본인 or 관리자)';

CREATE INDEX idx_posts_board_id ON posts(board_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_deleted ON posts(is_deleted);  -- Soft delete 필터링 최적화

-- ============================================================================
-- 4. 행사
-- ============================================================================
-- 행사 신청 방식 (3가지):
--   1. 홈페이지 신청만:
--      - google_form_url = null
--      - use_google_form_only = false
--      → register_for_event() 함수로 선착순 신청
--
--   2. 구글폼만 (과도기):
--      - google_form_url = 'https://forms.gle/...'
--      - use_google_form_only = true
--      → 홈페이지 신청 버튼 숨김, 구글폼 링크만 표시
--      → 정원 관리 안 함 (구글폼에서 자체 관리)
--
--   3. 병행 (과도기):
--      - google_form_url = 'https://forms.gle/...'
--      - use_google_form_only = false
--      → "홈페이지 신청" + "구글폼으로 신청" 둘 다 표시
--      → 홈페이지 정원(max_capacity)은 전체 정원의 일부만 할당
--
-- 납부자 제한:
--   - require_membership = true: 회비 납부자만 신청 (MT, 컴공인의 밤 등)
--   - require_membership = false: 모두 신청 가능 (간식행사 등)
--
-- 접근 제어:
--   - 인증된 사용자만 조회 가능 (비회원 차단, 분탕 방지)
-- ============================================================================
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50),  -- 행사 카테고리 (MT, 간식행사, 개강파티, 축제 등)
  title VARCHAR(200) NOT NULL,  -- 행사명
  description TEXT,  -- 행사 설명
  location VARCHAR(200),  -- 장소 (예: 다솔관 1층 로비)
  event_date TIMESTAMPTZ NOT NULL,  -- 행사 일시
  registration_start TIMESTAMPTZ NOT NULL,  -- 신청 시작
  registration_end TIMESTAMPTZ NOT NULL,  -- 신청 종료
  max_capacity INT NOT NULL,  -- 최대 정원
  current_count INT DEFAULT 0,  -- 현재 신청 인원 (트랜잭션으로 관리)
  require_membership BOOLEAN DEFAULT false,  -- 회비 납부자만 신청 가능
  
  -- 구글폼 병행 (과도기)
  google_form_url TEXT,  -- 구글폼 링크 (없으면 null)
  use_google_form_only BOOLEAN DEFAULT false,  -- true: 구글폼만, false: 홈페이지 활성화
  
  thumbnail_url TEXT,  -- 썸네일 이미지
  is_active BOOLEAN DEFAULT true,  -- 활성화 여부
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT false,  -- 과거 행사 데이터 보존
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  
  created_by UUID REFERENCES profiles(id),  -- 행사 생성자
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_capacity CHECK (current_count <= max_capacity),
  CONSTRAINT check_capacity_positive CHECK (max_capacity > 0)
);

COMMENT ON TABLE events IS '[인증 필요] 행사 (로그인 후 조회 가능, 분탕 방지)';
COMMENT ON COLUMN events.category IS '행사 카테고리 (MT, 간식행사, 개강파티, 축제, 컴공인의 밤)';
COMMENT ON COLUMN events.current_count IS '현재 신청 인원 (register_for_event 함수로만 수정)';
COMMENT ON COLUMN events.require_membership IS 'true: 회비 납부자만 신청 가능';
COMMENT ON COLUMN events.google_form_url IS '구글폼 링크 (과도기 병행용, 없으면 null)';
COMMENT ON COLUMN events.use_google_form_only IS 'true: 구글폼만, false: 홈페이지 신청 활성화';
COMMENT ON COLUMN events.is_deleted IS 'Soft delete (과거 행사 데이터 보존)';

CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_is_deleted ON events(is_deleted);

-- ============================================================================
-- 5. 행사 이미지
-- ============================================================================
-- 행사 상세 페이지에 표시될 설명 이미지 (여러 장)
-- display_order로 순서 지정 (1, 2, 3...)
-- ============================================================================
CREATE TABLE event_images (
  id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,  -- Supabase Storage URL
  display_order INT DEFAULT 0,  -- 표시 순서 (낮을수록 먼저 표시)
  caption TEXT,  -- 이미지 설명 (선택사항)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE event_images IS '[인증 필요] 행사 상세 설명 이미지 (여러 장 가능)';
COMMENT ON COLUMN event_images.display_order IS '표시 순서 (1, 2, 3... 낮을수록 먼저)';

CREATE INDEX idx_event_images_event_id ON event_images(event_id);

-- ============================================================================
-- 6. 행사 신청 내역
-- ============================================================================
-- 접근 권한:
--   - 조회: 본인 신청 내역만 (RLS로 제어)
--   - 삽입: 직접 INSERT 금지, register_for_event() 함수로만 가능
--   - 관리자: 모든 신청 내역 조회 가능 (FastAPI Service Key)
--
-- 중복 신청 방지:
--   - UNIQUE(event_id, user_id): DB 레벨 제약
--   - register_for_event() 함수에서도 체크
-- ============================================================================
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'confirmed',  -- confirmed, cancelled
  registration_number INT,  -- 선착순 번호 (1번부터 시작)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 중복 신청 방지
  UNIQUE(event_id, user_id)
);

COMMENT ON TABLE registrations IS '[인증 필요] 행사 신청 내역 (본인 것만 조회)';
COMMENT ON COLUMN registrations.registration_number IS '선착순 번호 (1번이 1등)';
COMMENT ON COLUMN registrations.status IS 'confirmed: 확정, cancelled: 취소';
COMMENT ON CONSTRAINT registrations_event_id_user_id_key ON registrations 
  IS '중복 신청 방지 (같은 행사에 1번만 신청 가능)';

CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);

-- ============================================================================
-- 7. 선착순 신청 함수 (원자적 트랜잭션 처리)
-- ============================================================================
-- 호출: SELECT register_for_event(행사ID, 사용자ID)
--
-- 검증 순서:
--   1. 행사 존재 여부 (is_active=true, is_deleted=false)
--   2. 구글폼 전용 여부 (use_google_form_only=true면 거부)
--   3. 회비 납부 여부 (require_membership=true면 체크)
--   4. 신청 기간 (registration_start ~ registration_end)
--   5. 정원 확인 (current_count < max_capacity)
--   6. 중복 신청 (이미 신청했는지)
--
-- 동시성 제어:
--   - FOR UPDATE: Pessimistic Lock으로 경쟁 조건(Race Condition) 방지
--   - 트랜잭션: 원자적 처리 (신청 + 카운트 증가)
--
-- 반환값 (JSON):
--   - success: true/false
--   - message: 결과 메시지
--   - registration_number: 성공 시 순번 (1, 2, 3...)
-- ============================================================================
CREATE OR REPLACE FUNCTION register_for_event(
  p_event_id INT,
  p_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_current_count INT;
  v_max_capacity INT;
  v_registration_number INT;
  v_registration_start TIMESTAMPTZ;
  v_registration_end TIMESTAMPTZ;
  v_require_membership BOOLEAN;
  v_user_membership_paid BOOLEAN;
  v_use_google_form_only BOOLEAN;
BEGIN
  -- 행사 정보 조회 및 락 (다른 트랜잭션 대기)
  SELECT current_count, max_capacity, registration_start, registration_end, 
         require_membership, use_google_form_only
  INTO v_current_count, v_max_capacity, v_registration_start, v_registration_end, 
       v_require_membership, v_use_google_form_only
  FROM events
  WHERE id = p_event_id AND is_active = true AND is_deleted = false
  FOR UPDATE;  -- Pessimistic Lock (경쟁 조건 방지)
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', '행사를 찾을 수 없습니다');
  END IF;
  
  -- 구글폼 전용 행사는 홈페이지 신청 불가
  IF v_use_google_form_only THEN
    RETURN json_build_object('success', false, 'message', '구글폼으로만 신청 가능합니다');
  END IF;
  
  -- 사용자 회비 납부 여부 확인
  SELECT membership_paid INTO v_user_membership_paid
  FROM profiles WHERE id = p_user_id;
  
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
  IF EXISTS (SELECT 1 FROM registrations WHERE event_id = p_event_id AND user_id = p_user_id) THEN
    RETURN json_build_object('success', false, 'message', '이미 신청하셨습니다');
  END IF;
  
  -- 신청 순번 생성 (1번부터)
  v_registration_number := v_current_count + 1;
  
  -- 신청 삽입
  INSERT INTO registrations (event_id, user_id, registration_number)
  VALUES (p_event_id, p_user_id, v_registration_number);
  
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

COMMENT ON FUNCTION register_for_event(INT, UUID) IS '[인증 필요] 선착순 행사 신청 (트랜잭션)';

-- ============================================================================
-- RLS (Row Level Security) 정책
-- ============================================================================
-- Supabase Anon Key로 직접 접근 시 제어
-- FastAPI는 Service Key 사용하므로 RLS 우회 (모든 데이터 접근 가능)
-- ============================================================================

-- profiles: 인증된 사용자만 조회, 본인만 수정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);  -- 인증 필수

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);  -- 본인만 수정

-- boards: 인증된 사용자만 조회 (게시판 목록도 로그인 후)
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boards_select_authenticated" ON boards
  FOR SELECT USING (auth.uid() IS NOT NULL);  -- 인증 필수

-- posts: 인증된 사용자만 조회, 공지사항은 admin만 작성
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_authenticated" ON posts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND  -- 인증 필수
    is_deleted = false  -- 삭제 안 된 글만
  );

CREATE POLICY "posts_insert" ON posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND (
      -- 공지사항은 admin만 작성 가능
      (board_id = (SELECT id FROM boards WHERE slug = 'notice') AND 
       EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
      OR
      -- 다른 게시판은 인증만 하면 작성 가능
      board_id != (SELECT id FROM boards WHERE slug = 'notice')
    )
  );

CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE USING (auth.uid() = author_id);  -- 본인 글만 수정

-- events: 인증된 사용자만 조회 (비회원 차단, 분탕 방지)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_authenticated" ON events
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND  -- 인증 필수
    is_deleted = false
  );

-- event_images: 인증된 사용자만 조회
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_images_select_authenticated" ON event_images
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- registrations: 본인 신청 내역만 조회, 직접 INSERT 금지
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registrations_select_own" ON registrations
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()  -- 본인 것만
  );

CREATE POLICY "registrations_no_insert" ON registrations
  FOR INSERT WITH CHECK (false);  -- 직접 INSERT 금지 (함수로만)

-- ============================================================================
-- 완료
-- ============================================================================
-- 이 스키마를 Supabase SQL Editor에 복사하여 실행하세요.
-- ============================================================================
