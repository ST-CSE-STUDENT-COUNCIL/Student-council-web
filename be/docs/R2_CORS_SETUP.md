# Cloudflare R2 CORS 설정 가이드

## 문제 상황
- Presigned URL로 업로드한 이미지를 브라우저에서 로드할 때 CORS 에러 발생
- 특정 API에서 403 Forbidden 에러 발생

## 해결 방법: R2 버킷 CORS 설정

### 1. Cloudflare Dashboard 접속
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) 로그인
2. **R2** 메뉴 선택
3. 각 버킷 선택

### 2. 각 버킷에 CORS 정책 추가

**설정이 필요한 버킷:**
- `club-images`
- `event-images`
- `introduction-images`
- `post-attachments`
- `welfare-images`

**CORS 설정 방법:**
1. 버킷 상세 페이지 → **Settings** 탭
2. **CORS Policy** 섹션에서 **Edit** 클릭
3. 아래 JSON 설정 붙여넣기:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
      "https://seoultechcom.vercel.app",
      "https://www.seoultechcom.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**운영 환경 설정 (실제 도메인):**
```json
[
  {
    "AllowedOrigins": [
      "https://seoultechcom.vercel.app",
      "https://www.seoultechcom.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. 버킷을 Public으로 설정
1. 버킷 상세 페이지 → **Settings** 탭
2. **Public Access** 섹션에서 **Allow Public Access** 활성화
3. Custom Domain 연결 (선택사항)

### 4. 프론트엔드 코드 수정

**Presigned URL로 이미지 업로드 시:**
```typescript
// PUT 요청 시 Content-Type 헤더 필수
const response = await fetch(presignedUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': file.type || 'application/octet-stream'
  },
  body: file
});
```

**이미지 로드 시 (CORS 확인):**
```typescript
// img 태그에서 직접 로드
<img src={publicUrl} crossOrigin="anonymous" />

// 또는 fetch로 로드
const response = await fetch(publicUrl, {
  mode: 'cors',
  credentials: 'omit'
});
```

## 백엔드 변경사항
- `r2_storage.py`의 `generate_presigned_url()`에 `ContentType` 파라미터 추가
- FastAPI CORS 설정은 이미 올바르게 되어 있음

## 테스트 방법
1. Presigned URL 발급 → PUT 요청으로 이미지 업로드
2. 반환된 `public_url`을 브라우저 주소창에 직접 입력
3. 이미지가 정상적으로 표시되면 CORS 설정 완료

## 주의사항
- 모든 5개 버킷에 동일한 CORS 설정 적용 필요
- Public Access를 활성화하지 않으면 인증 없이 이미지 로드 불가
- 운영 환경 배포 시 실제 도메인을 `AllowedOrigins`에 추가
