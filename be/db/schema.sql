-- ============================================================================
-- 서울과학기술대학교 컴퓨터공학과 학생회 홈페이지 데이터베이스 스키마
-- ============================================================================
-- 기술 스택: Supabase (PostgreSQL) + FastAPI
-- 
-- 테이블 구조:
--   - users: 유저 정보
--   - email_verifications: 이메일 인증 대기
--   - introductions: 학생회 소개
--   - boards: 게시판 (공지사항, 건의함)
--   - posts: 게시글
--   - events: 행사
--   - event_images: 행사 이미지
--   - registrations: 행사 신청
--   - clubs: 동아리
--   - welfare_rentals: 복지사업(대여)
--   - welfare_lockers: 복지사업(사물함)
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
  code VARCHAR(6) NOT NULL,  -- 6자리 인증 코드
  verified BOOLEAN DEFAULT false,  -- 인증 완료 여부
  used BOOLEAN DEFAULT false,  -- 회원가입에 사용됨
  expires_at TIMESTAMPTZ NOT NULL,  -- 만료 시각 (5분)
  created_at TIMESTAMPTZ DEFAULT NOW(),  -- 생성 시각
  verified_at TIMESTAMPTZ  -- 인증 완료 시각
);

-- 인덱스
CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_student_id ON email_verifications(student_id);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);

-- 만료된 인증 코드 자동 삭제 (매일 자정)
-- 주의: Supabase에서는 pg_cron 확장이 필요합니다.
-- 대안: FastAPI 백그라운드 태스크로 주기적 삭제

-- ============================================================================
-- 0-0-1. 비밀번호 재설정 인증
-- ============================================================================
-- 비밀번호 찾기 시 이메일 인증용 테이블
-- ============================================================================
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

-- ============================================================================
-- 0-1. 로그인 시도 추적 (보안)
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

-- ============================================================================
-- 1. 사용자
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
CREATE TABLE users (
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
  verified_at TIMESTAMPTZ,  -- 승인 일시
  rejection_reason TEXT,  -- 거부 사유
  
  membership_paid BOOLEAN DEFAULT false,  -- 4년 회비 납부 여부
  membership_paid_at TIMESTAMPTZ,  -- 회비 납부 일시
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS '[인증 필요] 사용자 정보';
COMMENT ON COLUMN users.student_id IS '학번 (로그인 ID, Supabase Auth의 username)';
COMMENT ON COLUMN users.role IS 'student: 일반학생, council: 일반학생회, admin: 관리자';
COMMENT ON COLUMN users.is_verified IS '관리자 승인 여부 (승인되어야 로그인 가능)';
COMMENT ON COLUMN users.verification_image_url IS '통합정보시스템 학적 증명 이미지 (학번 확인용)';
COMMENT ON COLUMN users.verification_status IS 'pending: 승인대기, approved: 승인됨, rejected: 거부됨';
COMMENT ON COLUMN users.membership_paid IS '4년 회비 납부 여부 (납부자 전용 행사 신청 조건)';

CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_verification_status ON users(verification_status);  -- 승인 대기 목록 조회용
CREATE INDEX idx_users_membership_paid ON users(membership_paid);

-- ============================================================================
-- 2. 학생회 소개 이미지
-- ============================================================================
-- 학생회 소개 페이지 이미지 (현행 학생회, 공약, 역할, 행사, 조직도, 연락처)
-- admin만 수정 가능
-- ============================================================================
CREATE TABLE introduction_images (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,  -- 섹션 제목 (예: "현행 학생회", "조직도", "연락처")
  image_url TEXT NOT NULL,  -- 이미지 URL
  display_order INT DEFAULT 0,  -- 표시 순서
  is_active BOOLEAN DEFAULT true,  -- 활성화 여부
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE introduction_images IS '[공개] 학생회 소개 이미지';
COMMENT ON COLUMN introduction_images.display_order IS '표시 순서 (낮을수록 먼저)';

CREATE INDEX idx_introduction_images_display_order ON introduction_images(display_order);

-- ============================================================================
-- 3. 게시판
-- ============================================================================
-- 게시판별 권한:
--   - 공지사항 (notice): admin만 작성, 모두 읽기 (인증 필요)
--   - 건의함 (suggestion): 모두 작성, 익명 허용, 관리자만 실명 확인
-- 
-- 대카테고리: 학생회 공지 / 민주자치 공지 등
-- ============================================================================
CREATE TABLE boards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,  -- 게시판 이름
  slug VARCHAR(100) UNIQUE NOT NULL,  -- URL 식별자 (예: /board/notice)
  description TEXT,  -- 게시판 설명
  category VARCHAR(50),  -- 대카테고리 (학생회, 민주자치 등)
  require_auth BOOLEAN DEFAULT true,  -- 인증 필요 여부
  allow_anonymous BOOLEAN DEFAULT false,  -- 익명 허용 여부 (건의함: true)
  require_admin BOOLEAN DEFAULT false,  -- admin 권한 필요 (공지사항: true)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE boards IS '게시판 메타데이터';
COMMENT ON COLUMN boards.slug IS 'URL 경로용 식별자 (예: /board/notice)';
COMMENT ON COLUMN boards.category IS '대카테고리 (학생회, 민주자치 등)';
COMMENT ON COLUMN boards.allow_anonymous IS '익명 허용 여부 (건의함: true, 공지사항: false)';
COMMENT ON COLUMN boards.require_admin IS 'admin 권한 필요 여부 (공지사항: true)';

-- 기본 게시판 생성
-- 학생회: 소카테고리 (행사, 복지, 학과소식)
-- 민주자치: 소카테고리 (고시, 공고, 대표자회의, 학생회칙)
-- 건의함: 익명 가능
INSERT INTO boards (name, slug, description, category, require_admin, allow_anonymous) VALUES
('학생회 공지', 'student-council', '학생회 공지사항 (소카테고리: 행사, 복지, 학과소식)', '학생회', true, false),
('민주자치 공지', 'democracy', '민주자치 공지사항 (소카테고리: 고시, 공고, 대표자회의, 학생회칙)', '민주자치', true, false),
('건의함', 'suggestion', '익명으로 건의할 수 있습니다', '건의함', false, true);

-- ============================================================================
-- 4. 게시글
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
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- 작성자 (익명일 때도 저장)
  title VARCHAR(200) NOT NULL,  -- 제목
  content TEXT NOT NULL,  -- 내용
  subcategory VARCHAR(50),  -- 소카테고리 (게시판별로 다를 수 있음)
  is_pinned BOOLEAN DEFAULT false,  -- 상단 고정 (공지사항용)
  is_anonymous BOOLEAN DEFAULT false,  -- 익명 여부 (true: 관리자만 실명 확인)
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT false,  -- true면 일반 사용자에게 안 보임
  deleted_at TIMESTAMPTZ,  -- 삭제 일시
  deleted_by UUID REFERENCES users(id),  -- 삭제한 사람 (본인 or 관리자)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE posts IS '[인증 필요] 게시글 (공지사항, 건의함)';
COMMENT ON COLUMN posts.subcategory IS '소카테고리: 학생회(행사/복지/학과소식), 민주자치(고시/공고/대표자회의/학생회칙)';
COMMENT ON COLUMN posts.is_anonymous IS '익명 여부 (true: 익명, 관리자만 실명 확인 가능)';
COMMENT ON COLUMN posts.is_deleted IS 'Soft delete (true: 삭제됨, 복구 가능)';
COMMENT ON COLUMN posts.deleted_by IS '삭제 처리한 사람 (본인 or 관리자)';

CREATE INDEX idx_posts_board_id ON posts(board_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_deleted ON posts(is_deleted);  -- Soft delete 필터링 최적화
CREATE INDEX idx_posts_subcategory ON posts(subcategory);  -- 소카테고리 필터링

-- ============================================================================
-- 4-1. 첨부파일
-- ============================================================================
-- 게시글 첨부파일 (공지사항용)
-- ============================================================================
CREATE TABLE attachments (
  id SERIAL PRIMARY KEY,
  post_id INT REFERENCES posts(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,  -- 원본 파일명
  file_url TEXT NOT NULL,  -- Supabase Storage URL
  file_size BIGINT,  -- 파일 크기 (bytes)
  mime_type VARCHAR(100),  -- MIME 타입
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE attachments IS '[인증 필요] 게시글 첨부파일';

CREATE INDEX idx_attachments_post_id ON attachments(post_id);

-- ============================================================================
-- 4-2. 건의함
-- ============================================================================
-- 익명 건의함 (첨부파일 없음)
-- 작성자는 admin만 확인 가능 (council은 기본 비공개)
-- ============================================================================
CREATE TABLE suggestions (
  id SERIAL PRIMARY KEY,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'received',  -- received, in_progress, rejected, approved
  rejection_reason TEXT,  -- 반려 사유 (rejected 시)
  resolution_note TEXT,  -- 승인/반영 내용 (approved 시)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_suggestion_status CHECK (
    status IN ('received', 'in_progress', 'rejected', 'approved')
  )
);

COMMENT ON TABLE suggestions IS '[인증 필요] 익명 건의함';
COMMENT ON COLUMN suggestions.status IS 'received: 접수, in_progress: 처리중, rejected: 반려, approved: 승인';
COMMENT ON COLUMN suggestions.rejection_reason IS '반려 사유 (admin/작성자만 조회)';
COMMENT ON COLUMN suggestions.resolution_note IS '승인/반영 내용 (admin/작성자만 조회)';

CREATE INDEX idx_suggestions_author_id ON suggestions(author_id);
CREATE INDEX idx_suggestions_status ON suggestions(status);
CREATE INDEX idx_suggestions_created_at ON suggestions(created_at DESC);

-- ============================================================================
-- 5. 행사
-- ============================================================================
-- 행사 상태:
--   - 진행중: registration_start <= NOW() <= registration_end
--   - 예정: NOW() < registration_start
--   - 신청 마감: NOW() > registration_end 또는 current_count >= max_capacity
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
  thumbnail_url TEXT,  -- 썸네일 이미지 (3:4 비율)
  is_active BOOLEAN DEFAULT true,  -- 활성화 여부
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT false,  -- 과거 행사 데이터 보존
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),
  
  created_by UUID REFERENCES users(id),  -- 행사 생성자
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_capacity CHECK (current_count <= max_capacity),
  CONSTRAINT check_capacity_positive CHECK (max_capacity > 0)
);

COMMENT ON TABLE events IS '[인증 필요] 행사 (로그인 후 조회 가능, 분탕 방지)';
COMMENT ON COLUMN events.category IS '행사 카테고리 (MT, 간식행사, 개강파티, 축제, 컴공인의 밤)';
COMMENT ON COLUMN events.current_count IS '현재 신청 인원 (register_for_event 함수로만 수정)';
COMMENT ON COLUMN events.require_membership IS 'true: 회비 납부자만 신청 가능';
COMMENT ON COLUMN events.thumbnail_url IS '썸네일 이미지 (3:4 비율 권장)';
COMMENT ON COLUMN events.is_deleted IS 'Soft delete (과거 행사 데이터 보존)';

CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_is_deleted ON events(is_deleted);

-- ============================================================================
-- 6. 행사 이미지
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
-- 7. 행사 신청 내역
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
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- nullable (비회원 지원)
  
  -- 비회원 정보 (마이그레이션 007에서 추가)
  guest_student_id VARCHAR(20),
  guest_name VARCHAR(50),
  guest_phone VARCHAR(20),
  
  status VARCHAR(20) DEFAULT 'confirmed',  -- confirmed, cancelled
  registration_number INT,  -- 선착순 번호 (1번부터 시작)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- CHECK: 회원 OR 비회원 중 하나는 필수
  CONSTRAINT check_user_or_guest CHECK (
    (user_id IS NOT NULL) OR 
    (guest_student_id IS NOT NULL AND guest_name IS NOT NULL)
  )
);

COMMENT ON TABLE registrations IS '행사 신청 내역 (회원/비회원 모두 가능, 마이그레이션 007)';
COMMENT ON COLUMN registrations.user_id IS '회원 ID (비회원은 NULL)';
COMMENT ON COLUMN registrations.guest_student_id IS '비회원 학번';
COMMENT ON COLUMN registrations.guest_name IS '비회원 이름';
COMMENT ON COLUMN registrations.guest_phone IS '비회원 전화번호';
COMMENT ON COLUMN registrations.registration_number IS '선착순 번호 (1번이 1등)';
COMMENT ON COLUMN registrations.status IS 'confirmed: 확정, cancelled: 취소';

-- 중복 신청 방지 (부분 UNIQUE 인덱스)
CREATE UNIQUE INDEX idx_registrations_event_user 
ON registrations(event_id, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_registrations_event_guest 
ON registrations(event_id, guest_student_id) 
WHERE guest_student_id IS NOT NULL;

CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);

-- ============================================================================
-- 8. 행사 만족도 조사
-- ============================================================================
-- 완료된 행사에 대한 만족도 조사
-- ============================================================================
CREATE TABLE event_surveys (
  id SERIAL PRIMARY KEY,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL,  -- 만족도 (1~5)
  feedback TEXT,  -- 의견
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 중복 제출 방지
  UNIQUE(event_id, user_id),
  CONSTRAINT check_rating CHECK (rating >= 1 AND rating <= 5)
);

COMMENT ON TABLE event_surveys IS '[인증 필요] 행사 만족도 조사';
COMMENT ON COLUMN event_surveys.rating IS '만족도 (1~5점)';

CREATE INDEX idx_event_surveys_event_id ON event_surveys(event_id);
CREATE INDEX idx_event_surveys_user_id ON event_surveys(user_id);

-- ============================================================================
-- 9. 동아리
-- ============================================================================
-- 동아리 목록 및 정보
-- 공개 조회 가능, admin만 CRUD 가능
-- ============================================================================
CREATE TABLE clubs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,  -- 동아리명 (필수)
  image_url TEXT NOT NULL,  -- 동아리 이미지 (필수)
  description TEXT NOT NULL,  -- 동아리 세부 설명 (필수)
  website_url TEXT,  -- 동아리 사이트 URL (선택)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE clubs IS '[공개] 동아리 목록';
COMMENT ON COLUMN clubs.name IS '동아리명 (필수)';
COMMENT ON COLUMN clubs.image_url IS '동아리 대표 이미지 URL (필수)';
COMMENT ON COLUMN clubs.description IS '동아리 세부 설명 (필수)';
COMMENT ON COLUMN clubs.website_url IS '동아리 웹사이트 또는 SNS URL (선택)';

-- ============================================================================
-- 10. 복지사업 - 대여
-- ============================================================================
-- 물품 대여 (보드게임, 노트북 등)
-- 선착순 또는 예약 방식
-- ============================================================================
-- 물품대여 정보 (구글폼 + 스프레드시트 연동)
-- ============================================================================
CREATE TABLE rental_items (
  id SERIAL PRIMARY KEY,
  item_name VARCHAR(100) NOT NULL,  -- 물품명 (장우산, 단우산, 2인용 돗자리 등)
  category VARCHAR(50),  -- 분류 (우산, 돗자리 등)

  image_url TEXT,  -- 물품 이미지 URL
  
  -- 구글 시트 연동
  application_sheet_url TEXT NOT NULL,  -- 구글 시트 URL (물품별로 다른 시트 가능)
  spreadsheet_id TEXT DEFAULT '1r4MXOaZ-Pp-PYIUcjscWhnyz0hLwrcqpcut2oKDles8',  -- 고정: 대여사업 스프레드시트 ID
  quantity_sheet_name VARCHAR(100) DEFAULT '물품표',  -- 고정: 시트 이름
  quantity_cell_range VARCHAR(20) NOT NULL,  -- 물품별 재고 셀 위치 (예: C2, C4, C6)
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE rental_items IS '[공개] 물품대여 정보 (구글 시트 연동)';
COMMENT ON COLUMN rental_items.item_name IS '물품명 (장우산, 단우산 등 세분화)';
COMMENT ON COLUMN rental_items.application_sheet_url IS '구글 시트 URL (신청 현황 확인용)';
COMMENT ON COLUMN rental_items.spreadsheet_id IS '구글 스프레드시트 ID (재고 관리용)';
COMMENT ON COLUMN rental_items.quantity_cell_range IS '현재 재고 수량이 있는 셀 위치 (예: C2, C4)';

CREATE INDEX idx_rental_items_category ON rental_items(category);
CREATE INDEX idx_rental_items_is_active ON rental_items(is_active);

-- ============================================================================
-- 11. 복지사업 - 사물함 정보 (배치도 + 구글폼)
-- ============================================================================
-- 구글폼으로 신청을 받으므로 복잡한 기간 관리 테이블 불필요
-- 신청 기간이 아닐 때는 관리자가 application_form_url을 빈 문자열로 설정
-- ============================================================================
CREATE TABLE locker_info (
  id SERIAL PRIMARY KEY,
  layout_image_url TEXT NOT NULL,  -- 사물함 배치도 이미지 URL (피그마)
  application_form_url TEXT NOT NULL,  -- 구글폼 신청 URL (신청 마감 시 빈 문자열)
  description TEXT,  -- 설명 (예: 19, 35번 고장)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE locker_info IS '[공개] 사물함 배치도 및 신청 정보 (미래관 3층 사물함)';
COMMENT ON COLUMN locker_info.layout_image_url IS '피그마에서 생성된 배치도 이미지 URL';
COMMENT ON COLUMN locker_info.application_form_url IS '구글폼 신청 URL (신청 마감 시 빈 문자열로 설정)';
COMMENT ON COLUMN locker_info.updated_at IS '마지막 수정 시각 (관리자가 이미지/URL 업데이트한 시각)';

-- ============================================================================
-- 12. 선착순 신청 함수 (원자적 트랜잭션 처리)
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
BEGIN
  -- 행사 정보 조회 및 락 (다른 트랜잭션 대기)
  SELECT current_count, max_capacity, registration_start, registration_end, require_membership
  INTO v_current_count, v_max_capacity, v_registration_start, v_registration_end, v_require_membership
  FROM events
  WHERE id = p_event_id AND is_active = true AND is_deleted = false
  FOR UPDATE;  -- Pessimistic Lock (경쟁 조건 방지)
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', '행사를 찾을 수 없습니다');
  END IF;
  
  -- 사용자 회비 납부 여부 확인
  SELECT membership_paid INTO v_user_membership_paid
  FROM users WHERE id = p_user_id;
  
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

-- 7-2. 회원/비회원 모두 지원하는 행사 신청 함수 (마이그레이션 007)
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
    IF EXISTS (SELECT 1 FROM registrations WHERE event_id = p_event_id AND user_id = p_user_id) THEN
      RETURN json_build_object('success', false, 'message', '이미 신청하셨습니다');
    END IF;
  ELSE
    IF EXISTS (SELECT 1 FROM registrations WHERE event_id = p_event_id AND guest_student_id = p_guest_student_id) THEN
      RETURN json_build_object('success', false, 'message', '이미 신청하셨습니다');
    END IF;
  END IF;
  
  -- 신청 순번 생성
  v_registration_number := v_current_count + 1;
  
  -- 신청 삽입
  INSERT INTO registrations (event_id, user_id, guest_student_id, guest_name, guest_phone, registration_number)
  VALUES (p_event_id, p_user_id, p_guest_student_id, p_guest_name, p_guest_phone, v_registration_number);
  
  -- 카운트 증가
  UPDATE events 
  SET current_count = current_count + 1, updated_at = NOW()
  WHERE id = p_event_id;
  
  -- 성공 반환
  RETURN json_build_object('success', true, 'message', '신청 완료', 'registration_number', v_registration_number);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION register_for_event_guest IS '[회원/비회원] 행사 신청 (트랜잭션, 마이그레이션 007)';

-- ============================================================================
-- 8. Activities 시스템 (통합 활동 관리)
-- ============================================================================
-- 마이그레이션 008에서 추가됨
-- 행사/수요조사/설문조사/카톡방 초대/공지를 통합 관리
-- ============================================================================

-- 8-1. Activities 테이블
CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,  -- 'event', 'demand_survey', 'survey', 'kakao_invite', 'fee_payment', 'notice'
  title VARCHAR(200) NOT NULL,
  description TEXT,
  registration_start TIMESTAMPTZ,
  registration_end TIMESTAMPTZ,
  max_capacity INT,
  current_count INT DEFAULT 0,
  require_membership BOOLEAN DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}',
  form_fields JSONB DEFAULT '[]',
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_activity_capacity CHECK (max_capacity IS NULL OR current_count <= max_capacity),
  CONSTRAINT check_activity_type CHECK (type IN ('event', 'demand_survey', 'survey', 'kakao_invite', 'fee_payment', 'notice'))
);

COMMENT ON TABLE activities IS '통합 활동 관리 (행사/수요조사/설문조사/카톡방초대/회비납부/공지)';

CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_registration_dates ON activities(registration_start, registration_end);
CREATE INDEX idx_activities_is_deleted ON activities(is_deleted);
CREATE INDEX idx_activities_is_active ON activities(is_active);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_config ON activities USING GIN (config);
CREATE INDEX idx_activities_form_fields ON activities USING GIN (form_fields);

-- 8-2. Activity Images 테이블
CREATE TABLE activity_images (
  id SERIAL PRIMARY KEY,
  activity_id INT REFERENCES activities(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE activity_images IS '활동 상세 이미지 (여러 장 가능)';

CREATE INDEX idx_activity_images_activity_id ON activity_images(activity_id);
CREATE INDEX idx_activity_images_display_order ON activity_images(activity_id, display_order);

-- 8-3. Activity Registrations 테이블
CREATE TABLE activity_registrations (
  id SERIAL PRIMARY KEY,
  activity_id INT REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  name VARCHAR(100),
  student_id VARCHAR(20),
  department VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  form_responses JSONB DEFAULT '{}',
  verification_image_url TEXT,
  kakao_id VARCHAR(100),
  survey_responses JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_activity_user UNIQUE(activity_id, user_id)
);

COMMENT ON TABLE activity_registrations IS '활동 신청 내역 (회원/비회원 모두 가능)';

CREATE INDEX idx_activity_registrations_activity_id ON activity_registrations(activity_id);
CREATE INDEX idx_activity_registrations_user_id ON activity_registrations(user_id);
CREATE INDEX idx_activity_registrations_status ON activity_registrations(status);
CREATE INDEX idx_activity_registrations_created_at ON activity_registrations(created_at DESC);
CREATE INDEX idx_activity_registrations_form_responses ON activity_registrations USING GIN (form_responses);
CREATE INDEX idx_activity_registrations_survey_responses ON activity_registrations USING GIN (survey_responses);

-- 8-4. 활동 신청 함수 (선착순 처리)
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

-- 8-5. 신청 취소 함수
CREATE OR REPLACE FUNCTION cancel_activity_registration(
  p_registration_id INT,
  p_user_id UUID
) RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_activity_id INT;
  v_reg_user_id UUID;
BEGIN
  SELECT activity_id, user_id INTO v_activity_id, v_reg_user_id
  FROM activity_registrations WHERE id = p_registration_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, '신청 내역을 찾을 수 없습니다';
    RETURN;
  END IF;
  
  IF v_reg_user_id != p_user_id THEN
    RETURN QUERY SELECT false, '본인의 신청만 취소할 수 있습니다';
    RETURN;
  END IF;
  
  UPDATE activity_registrations
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_registration_id;
  
  UPDATE activities
  SET current_count = GREATEST(current_count - 1, 0), updated_at = NOW()
  WHERE id = v_activity_id;
  
  RETURN QUERY SELECT true, '신청이 취소되었습니다';
END;
$$ LANGUAGE plpgsql;

-- 8-6. 트리거: updated_at 자동 갱신
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
-- RLS (Row Level Security) 정책
-- ============================================================================
-- Supabase Anon Key로 직접 접근 시 제어
-- FastAPI는 Service Key 사용하므로 RLS 우회 (모든 데이터 접근 가능)
-- ============================================================================

-- users: 인증된 사용자만 조회, 본인만 수정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_authenticated" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);  -- 인증 필수

CREATE POLICY "users_update_own" ON users
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
      (board_id IN (SELECT id FROM boards WHERE slug IN ('notice-council', 'notice-democracy')) AND 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
      OR
      -- 다른 게시판은 인증만 하면 작성 가능
      board_id NOT IN (SELECT id FROM boards WHERE slug IN ('notice-council', 'notice-democracy'))
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
