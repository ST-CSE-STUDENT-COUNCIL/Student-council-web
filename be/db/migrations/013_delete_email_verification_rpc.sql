-- ============================================================================
-- email_verifications 삭제를 위한 RPC 함수
-- 거절된 사용자의 재가입을 위해 email_verifications 레코드 삭제
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_email_verification(p_email TEXT)
RETURNS void AS $$
BEGIN
  DELETE FROM email_verifications WHERE email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 권한 부여
GRANT EXECUTE ON FUNCTION delete_email_verification(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_email_verification(TEXT) TO service_role;
