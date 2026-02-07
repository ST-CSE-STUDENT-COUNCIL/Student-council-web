-- ============================================================================
-- 데이터베이스 초기화 스크립트
-- ============================================================================
-- 주의: 이 스크립트는 모든 사용자 데이터를 삭제합니다!
-- Supabase SQL Editor에서 실행하세요.
--
-- 실행 순서:
-- 1. 이 파일 전체를 복사
-- 2. Supabase Dashboard → SQL Editor → New query
-- 3. 붙여넣기 후 Run
--
-- 삭제되는 데이터:
-- - 모든 게시글, 첨부파일, 활동, 신청 내역
-- - 복지 대여 신청
-- - 이메일 인증 기록
-- - 비밀번호 재설정 토큰
-- - 로그인 시도 기록
-- - 사용자 계정 (Supabase Auth 포함)
-- - 학생회 소개 이미지
-- - 건의함
--
-- 유지되는 것:
-- - 테이블 구조 (스키마)
-- - boards 기본 데이터 (재생성)
-- - 싱글 행 설정 테이블 빈 행 (print_welfare_info, guidebook_info, privacy_officer_info)
-- ============================================================================

-- ============================================================================
-- 1단계: FK로 연결된 데이터 삭제 (역순)
-- ============================================================================

-- 활동 관련 (Activities: 구 Events 통합)
TRUNCATE TABLE activity_registrations CASCADE;
TRUNCATE TABLE activity_images CASCADE;
TRUNCATE TABLE activities CASCADE;

-- 구 Events 테이블 (삭제 예정이지만 혹시 남아있을 경우)
-- TRUNCATE TABLE event_surveys CASCADE;
-- TRUNCATE TABLE registrations CASCADE;
-- TRUNCATE TABLE event_images CASCADE;
-- TRUNCATE TABLE events CASCADE;

-- 복지 관련
TRUNCATE TABLE rental_items CASCADE;
TRUNCATE TABLE rental_config CASCADE;
TRUNCATE TABLE locker_info CASCADE;
TRUNCATE TABLE print_welfare_info CASCADE;
TRUNCATE TABLE guidebook_info CASCADE;
TRUNCATE TABLE privacy_officer_info CASCADE;

-- 동아리
TRUNCATE TABLE club_introduction_images CASCADE;
TRUNCATE TABLE clubs CASCADE;

-- 프로필 변경 요청
TRUNCATE TABLE profile_update_requests CASCADE;

-- 게시판 관련
TRUNCATE TABLE suggestions CASCADE;
TRUNCATE TABLE attachments CASCADE;
TRUNCATE TABLE posts CASCADE;
-- boards는 나중에 재생성

-- 학생회 소개
TRUNCATE TABLE introduction_images CASCADE;

-- 인증 및 보안 관련
TRUNCATE TABLE login_blocks CASCADE;
TRUNCATE TABLE login_attempts CASCADE;
TRUNCATE TABLE password_resets CASCADE;
TRUNCATE TABLE email_verifications CASCADE;

-- 사용자 (users 테이블만 삭제, auth.users는 별도 처리)
TRUNCATE TABLE rejected_users CASCADE;
TRUNCATE TABLE users CASCADE;

-- ============================================================================
-- 2단계: Supabase Auth 사용자 삭제
-- ============================================================================
-- 주의: auth.users를 직접 삭제하면 Supabase Auth 시스템과 동기화 문제 발생 가능
-- 방법 1 (권장): Supabase Dashboard → Authentication → Users에서 수동 삭제
-- 방법 2: 아래 쿼리 사용 (관리자 권한 필요, 주석 해제하여 사용)

DELETE FROM auth.users;  -- 모든 Auth 사용자 삭제

-- ============================================================================
-- 3단계: 게시판 데이터 초기화 및 재생성
-- ============================================================================
-- 참고: rental_items와 locker_info는 구글 시트 연동 방식이므로
--      별도 status 컬럼이 없고, 데이터를 유지합니다.
-- rental_config 싱글톤 재생성
INSERT INTO rental_config (id) VALUES (1) ON CONFLICT DO NOTHING;
-- 기존 게시판 삭제
TRUNCATE TABLE boards RESTART IDENTITY CASCADE;

-- 게시판 재생성
INSERT INTO boards (name, slug, description, category, require_admin, allow_anonymous) VALUES
('학생회 공지', 'student-council', '학생회 공지사항 (소카테고리: 행사, 복지)', '학생회', true, false),
('민주자치 공지', 'democracy', '민주자치 공지사항 (소카테고리: 고시, 공고, 대표자회의, 학생회칙)', '민주자치', true, false),
('건의함', 'suggestion', '익명으로 건의할 수 있습니다', '건의함', false, true);

-- ============================================================================
-- 4단계: SERIAL 시퀀스 초기화
-- ============================================================================
-- AUTO_INCREMENT 번호를 1부터 다시 시작

-- 인증 및 보안
ALTER SEQUENCE email_verifications_id_seq RESTART WITH 1;
ALTER SEQUENCE password_resets_id_seq RESTART WITH 1;
ALTER SEQUENCE login_attempts_id_seq RESTART WITH 1;
ALTER SEQUENCE login_blocks_id_seq RESTART WITH 1;

-- 컨텐츠
ALTER SEQUENCE introduction_images_id_seq RESTART WITH 1;
ALTER SEQUENCE boards_id_seq RESTART WITH 4;  -- 3개 게시판 생성했으므로 4부터
ALTER SEQUENCE posts_id_seq RESTART WITH 1;
ALTER SEQUENCE attachments_id_seq RESTART WITH 1;
ALTER SEQUENCE suggestions_id_seq RESTART WITH 1;

-- 활동 (Activities: 구 Events 통합)
ALTER SEQUENCE activities_id_seq RESTART WITH 1;
ALTER SEQUENCE activity_images_id_seq RESTART WITH 1;
ALTER SEQUENCE activity_registrations_id_seq RESTART WITH 1;

-- 동아리
ALTER SEQUENCE clubs_id_seq RESTART WITH 1;
ALTER SEQUENCE club_introduction_images_id_seq RESTART WITH 1;

-- 프로필 변경 요청
ALTER SEQUENCE profile_update_requests_id_seq RESTART WITH 1;

-- 복지 마스터 데이터
ALTER SEQUENCE rental_items_id_seq RESTART WITH 1;

-- ============================================================================
-- 5단계: 싱글 행 설정 테이블 재생성
-- ============================================================================
-- TRUNCATE 했으므로 초기 행 재생성
INSERT INTO print_welfare_info (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO guidebook_info (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO privacy_officer_info (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 완료! 이제 회원가입부터 다시 시작할 수 있습니다.
-- ============================================================================
-- 확인 쿼리:
-- SELECT COUNT(*) FROM auth.users;           -- 0이어야 함 (Auth 사용자 삭제 시)
-- SELECT COUNT(*) FROM users;                -- 0이어야 함
-- SELECT COUNT(*) FROM posts;                -- 0이어야 함
-- SELECT COUNT(*) FROM activities;           -- 0이어야 함
-- SELECT COUNT(*) FROM boards;               -- 3이어야 함
-- SELECT * FROM boards ORDER BY id;          -- 3개 게시판 확인
-- SELECT COUNT(*) FROM print_welfare_info;   -- 1이어야 함 (빈 행)
-- SELECT COUNT(*) FROM guidebook_info;       -- 1이어야 함 (빈 행)
-- SELECT COUNT(*) FROM privacy_officer_info; -- 1이어야 함 (빈 행)
-- ============================================================================
