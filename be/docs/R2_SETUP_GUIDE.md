# ============================================================================
# Cloudflare R2 설정 가이드
# ============================================================================

## 1. Cloudflare 계정 생성 및 R2 활성화

1. https://dash.cloudflare.com/ 접속 후 회원가입
2. 좌측 메뉴에서 "R2" 클릭
3. "Enable R2" 버튼 클릭
4. 결제 정보 입력 (무료 티어 사용, 과금 안 됨)

## 2. R2 버킷 생성

1. "Create bucket" 클릭
2. 버킷 생성:
   - `club-images`
   - `post-attachments`
   - `welfare-images`
   - `event-images`
   - `introduction-images`
   - `verification-images` (Private - Custom Domain 필요)

## 3. API 토큰 생성

1. R2 페이지에서 "Manage R2 API Tokens" 클릭
2. "Create API Token" 클릭
3. 설정:
   - **Token Name**: `seoultechcom-backend`
   - **Permissions**: `Object Read & Write`
   - **TTL**: `Forever` (또는 원하는 기간)
4. "Create API Token" 클릭
5. 다음 정보 복사 (한 번만 표시됨):
   - `Access Key ID`
   - `Secret Access Key`
   - `Endpoint`에서 Account ID 확인

## 4. Public URL 설정

### 옵션 A: R2 기본 URL (간단)
1. 각 버킷 설정 > "Public Access" 활성화
2. Public URL: `https://pub-{account_id}.r2.dev`

### 옵션 B: Custom Domain (권장, CDN)
1. 버킷 설정 > "Connect Domain"
2. 도메인 연결 (예: `cdn.yourdomain.com`)
3. DNS 설정 (Cloudflare가 자동 안내)

## 5. 환경변수 설정 (.env)

```env
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_PUBLIC_URL=https://pub-your_account_id.r2.dev
```

## 6. 패키지 설치

```bash
pip install boto3==1.35.0
```

## 7. 마이그레이션 (Supabase → R2)

### 기존 Supabase 파일 다운로드 (선택사항)
```python
# 기존 파일들을 R2로 옮기려면:
# 1. Supabase Storage에서 모든 파일 URL 조회
# 2. 각 파일 다운로드
# 3. R2에 업로드
```

### 코드 변경
기존 코드에서 import만 변경:
```python
# Before
from app.utils.storage import upload_file_to_supabase

# After
from app.utils.r2_storage import upload_file_to_r2 as upload_file_to_supabase
```

## 8. 테스트

```bash
# 서버 재시작
uvicorn app.main:app --reload

# Swagger에서 파일 업로드 테스트
# http://localhost:8000/docs
```

## 9. CORS 설정 (필요시)

R2 버킷 설정 > CORS Policy:
```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

## 10. 비용 확인

Cloudflare R2 Dashboard에서 실시간 사용량 확인:
- Storage: 10GB까지 무료
- Class A Operations: 월 100만건 무료
- Class B Operations: 월 1000만건 무료
- Egress: **무제한 무료**

## ============================================================================
## 문제 해결
## ============================================================================

### 업로드 실패
- API 토큰 권한 확인 (Read & Write)
- Account ID 정확한지 확인
- Endpoint URL 형식: `https://{account_id}.r2.cloudflarestorage.com`

### 파일 접근 불가
- 버킷 Public Access 활성화 확인
- Public URL 형식 확인: `https://pub-{account_id}.r2.dev/{bucket}/{file}`
- Custom Domain 사용 시 DNS 전파 대기 (최대 24시간)

### boto3 에러
- boto3 버전 확인: `pip show boto3`
- Region을 'auto'로 설정 (R2는 auto 사용)

## ============================================================================
## 보안 권장사항
## ============================================================================

1. **API 토큰 보호**
   - `.env` 파일을 `.gitignore`에 추가
   - 프로덕션에서는 환경변수로 주입

2. **파일 검증**
   - 확장자 화이트리스트 사용
   - 파일 크기 제한
   - MIME 타입 검증

3. **Private 파일**
   - `verification-images`는 Custom Domain + Signed URL 사용
   - 또는 Supabase Storage Private 유지

## ============================================================================
## Supabase 병행 사용 (선택사항)
## ============================================================================

Private 파일(학생 인증 이미지)만 Supabase 유지하고,
Public 파일(카드뉴스, 행사 이미지)은 R2 사용:

```python
# Private: Supabase
from app.utils.storage import upload_verification_image

# Public: R2
from app.utils.r2_storage import upload_file_to_r2
```
