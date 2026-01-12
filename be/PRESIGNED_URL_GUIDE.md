# Presigned URL 이미지 업로드 가이드

## 개요

Presigned URL 방식은 서버를 거치지 않고 클라이언트에서 직접 Cloudflare R2에 파일을 업로드하는 방식입니다.

**장점:**
- ⚡ 서버 대역폭 절약
- 🚀 업로드 속도 향상
- 💰 서버 비용 절감
- 📈 확장성 향상

## 기본 플로우

```
1. 백엔드에 Presigned URL 요청 → { presigned_url, public_url, file_key }
2. 프론트엔드에서 Presigned URL로 직접 PUT 요청 → R2에 업로드
3. 백엔드에 업로드 완료 알림 (선택적) → DB에 public_url 저장
```

## API 엔드포인트

### 1. 사물함 이미지 업로드

#### Step 1: Presigned URL 발급
```bash
POST /admin/welfare/locker_image/presigned-url
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "filename": "locker_layout.png"
}
```

**Response:**
```json
{
  "presigned_url": "https://{account_id}.r2.cloudflarestorage.com/welfare-images/lockers/{uuid}.png?X-Amz-...",
  "public_url": "https://pub-{id}.r2.dev/lockers/{uuid}.png",
  "file_key": "lockers/{uuid}.png"
}
```

#### Step 2: R2에 직접 업로드
```bash
PUT {presigned_url}
Content-Type: image/png
Body: [binary file data]
```

#### Step 3: 업로드 완료 알림
```bash
POST /admin/welfare/locker_image/complete
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "public_url": "https://pub-{id}.r2.dev/lockers/{uuid}.png"
}
```

### 2. 동아리 이미지 업로드

```bash
# 1. Presigned URL 발급
POST /admin/clubs/presigned-url?filename=club_logo.jpg
Authorization: Bearer {admin_token}

# 2. R2에 업로드 (Step 2는 동일)

# 3. 동아리 생성 (public_url 사용)
POST /admin/clubs
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "ICPC 준비반",
  "description": "알고리즘 스터디",
  "image_url": "{public_url}",
  "website_url": "https://icpc.seoultech.ac.kr"
}
```

### 3. 학생회 소개 이미지 (여러 장)

```bash
# 이미지 1
POST /admin/introductions/images/presigned-url?filename=intro_1.jpg
# 이미지 2
POST /admin/introductions/images/presigned-url?filename=intro_2.jpg

# 각각 R2에 업로드 후

# 이미지 1 등록
POST /admin/introductions/images
{
  "title": "학생회 소개 1페이지",
  "image_url": "{public_url_1}",
  "display_order": 0
}

# 이미지 2 등록
POST /admin/introductions/images
{
  "title": "학생회 소개 2페이지",
  "image_url": "{public_url_2}",
  "display_order": 1
}
```

### 4. 공지사항 첨부파일 (여러 개)

```bash
# 1. 게시글 먼저 생성
POST /admin/notices
{
  "title": "OT 안내",
  "content": "첨부파일 참고",
  "board_id": 1,
  "attachment_urls": null  # 일단 null
}
# → post_id 받음

# 2. 각 첨부파일에 대해 Presigned URL 발급
POST /admin/notices/presigned-url
{
  "filename": "ot_schedule.pdf",
  "post_id": {post_id}
}

# 3. R2에 업로드

# 4. 게시글 수정 (첨부파일 정보 추가)
PATCH /admin/notices/{post_id}
{
  "attachment_urls": "[{\"filename\":\"ot_schedule.pdf\",\"public_url\":\"{url}\",\"file_size\":1024,\"mime_type\":\"application/pdf\"}]"
}
```

### 5. 활동 신청 인증 이미지 (비로그인 가능)

```bash
# 1. Presigned URL 발급 (로그인 불필요)
POST /activities/{activity_id}/register/presigned-url?filename=verification.jpg

# 2. R2에 업로드

# 3. 활동 신청
POST /activities/{activity_id}/register
{
  "body": "{\"name\":\"홍길동\",\"student_id\":\"2024000001\",...}",
  "verification_image_url": "{public_url}"
}
```

### 6. 학적 인증 이미지

```bash
# 1. Presigned URL 발급
POST /verification-image/presigned-url?filename=student_card.jpg
Authorization: Bearer {token}

# 2. R2에 업로드

# 3. 업로드 완료 알림
POST /verification-image
Authorization: Bearer {token}
Content-Type: application/x-www-form-urlencoded

image_url={public_url}
```

## 프론트엔드 구현

### React + TypeScript 예시

```typescript
// 파일 업로드 함수
async function uploadImageWithPresignedUrl(
  file: File,
  presignedUrlEndpoint: string,
  token?: string
): Promise<string> {
  // 1. Presigned URL 요청
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const { presigned_url, public_url } = await fetch(presignedUrlEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ filename: file.name }),
  }).then(res => res.json());

  // 2. R2에 직접 업로드
  await fetch(presigned_url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  // 3. public_url 반환
  return public_url;
}

// 사용 예시: 동아리 생성
async function createClub(clubData: ClubFormData, logoFile: File) {
  // 1. 이미지 업로드
  const imageUrl = await uploadImageWithPresignedUrl(
    logoFile,
    '/admin/clubs/presigned-url',
    adminToken
  );

  // 2. 동아리 생성
  const response = await fetch('/admin/clubs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: clubData.name,
      description: clubData.description,
      image_url: imageUrl,
      website_url: clubData.websiteUrl,
    }),
  });

  return response.json();
}
```

### Vue 3 + Composition API 예시

```vue
<script setup lang="ts">
import { ref } from 'vue'

const imageFile = ref<File | null>(null)
const uploading = ref(false)

async function handleImageUpload() {
  if (!imageFile.value) return
  
  uploading.value = true
  
  try {
    // 1. Presigned URL 요청
    const { presigned_url, public_url } = await $fetch('/admin/clubs/presigned-url', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        filename: imageFile.value.name
      }
    })
    
    // 2. R2에 업로드
    await fetch(presigned_url, {
      method: 'PUT',
      body: imageFile.value,
      headers: {
        'Content-Type': imageFile.value.type
      }
    })
    
    // 3. 동아리 생성
    await $fetch('/admin/clubs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        name: form.name,
        description: form.description,
        image_url: public_url
      }
    })
    
    alert('동아리가 생성되었습니다!')
  } catch (error) {
    console.error('업로드 실패:', error)
  } finally {
    uploading.value = false
  }
}
</script>
```

## 주의사항

1. **Presigned URL 유효 시간**: 5분 (300초)
   - 발급 후 5분 이내에 업로드 완료해야 함
   - 실패 시 새로운 Presigned URL 재발급 필요

2. **파일 확장자 검증**:
   - 이미지: `.jpg`, `.jpeg`, `.png`
   - 첨부파일: `.jpg`, `.jpeg`, `.png`, `.pdf`
   - 서버에서 검증하므로 프론트에서 먼저 체크 권장

3. **CORS 설정**:
   - R2 버킷의 CORS 설정이 되어 있어야 브라우저에서 PUT 요청 가능
   - 이미 설정되어 있으므로 별도 작업 불필요

4. **Content-Type 헤더**:
   - R2 업로드 시 반드시 `Content-Type` 헤더 포함
   - 파일 타입과 일치해야 함 (예: `image/jpeg`, `application/pdf`)

5. **에러 처리**:
   - Presigned URL 발급 실패: 파일명 확인
   - R2 업로드 실패: 네트워크 또는 파일 크기 확인
   - 완료 알림 실패: public_url 정확성 확인

## 마이그레이션 가이드 (기존 코드 → Presigned URL)

### Before (기존 방식)
```typescript
// FormData로 직접 서버에 업로드
const formData = new FormData()
formData.append('name', clubName)
formData.append('description', description)
formData.append('image', imageFile)  // 파일도 함께 전송

await fetch('/admin/clubs', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### After (Presigned URL 방식)
```typescript
// 1. 이미지 먼저 업로드
const imageUrl = await uploadImageWithPresignedUrl(
  imageFile,
  '/admin/clubs/presigned-url',
  token
)

// 2. JSON으로 데이터 전송
await fetch('/admin/clubs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: clubName,
    description: description,
    image_url: imageUrl  // 업로드한 이미지 URL
  })
})
```

## 트러블슈팅

### 문제: Presigned URL 만료
```
에러: Request has expired
해결: 5분 이내에 업로드하지 못했을 경우 새로운 URL 재발급
```

### 문제: CORS 에러
```
에러: Access to fetch at '...' from origin '...' has been blocked by CORS policy
해결: R2 버킷 CORS 설정 확인 (이미 설정되어 있어야 함)
```

### 문제: 파일 타입 불일치
```
에러: SignatureDoesNotMatch
해결: PUT 요청 시 Content-Type 헤더가 파일 타입과 일치하는지 확인
```

### 문제: public_url로 이미지 접근 불가
```
에러: 404 Not Found
해결: 
1. R2에 업로드가 완료되었는지 확인
2. public_url이 정확한지 확인
3. 버킷이 public인지 확인
```
