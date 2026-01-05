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
-- - 모든 게시글, 첨부파일, 행사, 신청 내역
-- - 복지 대여/사물함 신청
-- - 이메일 인증 기록
-- - 사용자 계정 (Supabase Auth 포함)
-- - 학생회 소개 이미지
--
-- 유지되는 것:
-- - 테이블 구조 (스키마)
-- - boards 기본 데이터 (재생성)
-- ============================================================================

-- ============================================================================
-- 1단계: FK로 연결된 데이터 삭제 (역순)
-- ============================================================================

-- 행사 관련
TRUNCATE TABLE event_surveys CASCADE;
TRUNCATE TABLE registrations CASCADE;
TRUNCATE TABLE event_images CASCADE;
TRUNCATE TABLE events CASCADE;

-- 복지 관련
TRUNCATE TABLE locker_rentals CASCADE;
TRUNCATE TABLE locker_periods CASCADE;
TRUNCATE TABLE welfare_rental_requests CASCADE;
TRUNCATE TABLE welfare_rentals CASCADE;
-- welfare_lockers는 마스터 데이터이므로 초기화하지 않음 (1~40번 사물함)

-- 동아리
TRUNCATE TABLE clubs CASCADE;

-- 게시판 관련
TRUNCATE TABLE attachments CASCADE;
TRUNCATE TABLE posts CASCADE;
-- boards는 나중에 재생성

-- 학생회 소개
TRUNCATE TABLE introduction_images CASCADE;

-- 이메일 인증
TRUNCATE TABLE email_verifications CASCADE;

-- 사용자 (users 테이블만 삭제, auth.users는 별도 처리)
TRUNCATE TABLE users CASCADE;

-- ============================================================================
-- 2단계: Supabase Auth 사용자 삭제
-- ============================================================================
-- 주의: auth.users를 직접 삭제하면 Supabase Auth 시스템과 동기화 문제 발생 가능
-- 권장: Supabase Dashboard → Authentication → Users에서 수동 삭제
-- 또는 아래 쿼리 사용 (관리자 권한 필요)

-- DELETE FROM auth.users;  -- 모든 Auth 사용자 삭제 (주석 해제하여 사용)

-- ============================================================================
-- 3단계: 게시판 데이터 초기화 및 재생성
-- ============================================================================

-- 기존 게시판 삭제
TRUNCATE TABLE boards RESTART IDENTITY CASCADE;

-- 게시판 재생성
INSERT INTO boards (name, slug, description, category, require_admin, allow_anonymous) VALUES
('학생회 공지', 'student-council', '학생회 공지사항 (소카테고리: 행사, 복지, 학과소식)', '학생회', true, false),
('민주자치 공지', 'democracy', '민주자치 공지사항 (소카테고리: 고시, 공고, 대표자회의, 학생회칙)', '민주자치', true, false),
('건의함', 'suggestion', '익명으로 건의할 수 있습니다', '건의함', false, true);

-- ============================================================================
-- 4단계: SERIAL 시퀀스 초기화
-- ============================================================================
-- AUTO_INCREMENT 번호를 1부터 다시 시작

ALTER SEQUENCE email_verifications_id_seq RESTART WITH 1;
ALTER SEQUENCE introduction_images_id_seq RESTART WITH 1;
ALTER SEQUENCE boards_id_seq RESTART WITH 4;  -- 3개 게시판 생성했으므로 4부터
ALTER SEQUENCE posts_id_seq RESTART WITH 1;
ALTER SEQUENCE attachments_id_seq RESTART WITH 1;
ALTER SEQUENCE events_id_seq RESTART WITH 1;
ALTER SEQUENCE event_images_id_seq RESTART WITH 1;
ALTER SEQUENCE registrations_id_seq RESTART WITH 1;
ALTER SEQUENCE event_surveys_id_seq RESTART WITH 1;
ALTER SEQUENCE clubs_id_seq RESTART WITH 1;
ALTER SEQUENCE welfare_rentals_id_seq RESTART WITH 1;
ALTER SEQUENCE welfare_rental_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE locker_periods_id_seq RESTART WITH 1;
ALTER SEQUENCE locker_rentals_id_seq RESTART WITH 1;

-- ============================================================================
-- 완료! 이제 회원가입부터 다시 시작할 수 있습니다.
-- ============================================================================
-- 확인 쿼리:
-- SELECT COUNT(*) FROM users;           -- 0이어야 함
-- SELECT COUNT(*) FROM posts;           -- 0이어야 함
-- SELECT COUNT(*) FROM boards;          -- 3이어야 함
-- SELECT * FROM boards ORDER BY id;     -- 3개 게시판 확인
-- ============================================================================
