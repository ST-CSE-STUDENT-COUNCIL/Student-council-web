-- ============================================================================
-- 006: 학생회 소개 이미지 Storage 버킷 및 정책 생성
-- ============================================================================
-- 실행 일시: 2026-01-08
-- 설명: introduction-images Storage 버킷 생성 및 RLS 정책 설정
--       - 모든 사용자: 읽기(SELECT) 가능
--       - 관리자만: 업로드(INSERT), 수정(UPDATE), 삭제(DELETE) 가능
-- ============================================================================

-- 1. Storage 버킷 생성 (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'introduction-images',
    'introduction-images',
    true,  -- public 읽기 허용
    10485760,  -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS 정책 설정

-- 2-1. 모든 사용자에게 읽기 권한 부여
CREATE POLICY "Public read access for introduction images"
ON storage.objects FOR SELECT
USING (bucket_id = 'introduction-images');

-- 2-2. 관리자만 업로드 가능
CREATE POLICY "Admin insert access for introduction images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'introduction-images' 
    AND auth.jwt() ->> 'role' = 'admin'
);

-- 2-3. 관리자만 수정 가능
CREATE POLICY "Admin update access for introduction images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'introduction-images' 
    AND auth.jwt() ->> 'role' = 'admin'
);

-- 2-4. 관리자만 삭제 가능
CREATE POLICY "Admin delete access for introduction images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'introduction-images' 
    AND auth.jwt() ->> 'role' = 'admin'
);

-- ============================================================================
-- 확인 쿼리
-- ============================================================================

-- 버킷 생성 확인
-- SELECT * FROM storage.buckets WHERE id = 'introduction-images';

-- 정책 확인
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%introduction%';

-- ============================================================================
-- Rollback (필요시)
-- ============================================================================

-- 정책 삭제
-- DROP POLICY IF EXISTS "Public read access for introduction images" ON storage.objects;
-- DROP POLICY IF EXISTS "Admin insert access for introduction images" ON storage.objects;
-- DROP POLICY IF EXISTS "Admin update access for introduction images" ON storage.objects;
-- DROP POLICY IF EXISTS "Admin delete access for introduction images" ON storage.objects;

-- 버킷 삭제 (주의: 버킷 내 모든 파일도 삭제됨)
-- DELETE FROM storage.buckets WHERE id = 'introduction-images';
