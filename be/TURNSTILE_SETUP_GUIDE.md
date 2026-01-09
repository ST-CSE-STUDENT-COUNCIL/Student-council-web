# Cloudflare Turnstile 설정 가이드

Cloudflare Turnstile은 reCAPTCHA의 대안으로, 봇 방지 기능을 제공하는 무료 서비스입니다.

## 1. Cloudflare Turnstile 설정

### 1.1 사이트 등록

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) 로그인
2. 좌측 메뉴에서 **Turnstile** 선택
3. **Add Site** 클릭
4. 사이트 정보 입력:
   - **Site name**: 서울과기대 총학생회 (또는 원하는 이름)
   - **Domains**: 프론트엔드 도메인 입력 (예: `seoultech.com`, `localhost`)
   - **Widget Mode**: **Managed** 선택 (자동으로 챌린지 수준 조절)
5. **Create** 클릭

### 1.2 키 확인

사이트 생성 후 다음 키를 확인할 수 있습니다:
- **Site Key**: 프론트엔드에서 사용 (공개 가능)
- **Secret Key**: 백엔드에서 사용 (비밀 유지)

## 2. 백엔드 환경변수 설정

`.env` 파일에 다음 변수를 추가:

```env
# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=your_secret_key_here
TURNSTILE_SITE_KEY=your_site_key_here
```

> **주의**: `TURNSTILE_SECRET_KEY`는 절대 공개하지 마세요!

## 3. 프론트엔드 구현

### 3.1 스크립트 추가

HTML `<head>` 태그에 Turnstile 스크립트 추가:

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

### 3.2 위젯 렌더링

Turnstile이 필요한 페이지(로그인, 회원가입, 건의함 작성)에 다음 코드 추가:

```html
<!-- 로그인 폼 예시 -->
<form id="login-form">
  <input type="text" name="student_id" placeholder="학번" required>
  <input type="password" name="password" placeholder="비밀번호" required>
  
  <!-- Turnstile 위젯 -->
  <div class="cf-turnstile" 
       data-sitekey="your_site_key_here"
       data-callback="onTurnstileSuccess">
  </div>
  
  <button type="submit">로그인</button>
</form>
```

### 3.3 JavaScript 처리

```javascript
let turnstileToken = null;

// Turnstile 검증 성공 시 호출
function onTurnstileSuccess(token) {
  turnstileToken = token;
}

// 폼 제출 시 토큰 포함
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    student_id: document.querySelector('input[name="student_id"]').value,
    password: document.querySelector('input[name="password"]').value,
    turnstile_token: turnstileToken  // 토큰 추가
  };
  
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  // 응답 처리...
});
```

## 4. 적용 대상 API

다음 API에 Turnstile 검증이 적용되었습니다:

### 4.1 인증 API (`/auth`)

- **POST /auth/send-verification**: 이메일 인증번호 발송
  - Request Body에 `turnstile_token` 추가 (선택사항)
  
- **POST /auth/signup**: 회원가입
  - Request Body에 `turnstile_token` 추가 (선택사항)
  
- **POST /auth/login**: 로그인
  - Request Body에 `turnstile_token` 추가 (선택사항)

### 4.2 건의함 API (`/suggestions`)

- **POST /suggestions**: 건의함 작성
  - Request Body에 `turnstile_token` 추가 (선택사항)

## 5. Request Body 예시

### 5.1 로그인

```json
{
  "student_id": "12345678",
  "password": "mypassword123!",
  "turnstile_token": "0.abc123..."
}
```

### 5.2 회원가입

```json
{
  "email": "test@seoultech.ac.kr",
  "password": "password123!",
  "name": "홍길동",
  "student_id": "12345678",
  "phone": "01012345678",
  "department": "컴퓨터공학과",
  "turnstile_token": "0.abc123..."
}
```

### 5.3 건의함 작성

```json
{
  "title": "건의사항 제목",
  "content": "건의사항 내용",
  "turnstile_token": "0.abc123..."
}
```

## 6. 검증 로직

백엔드에서 Turnstile 토큰 검증:

1. `turnstile_token`이 제공된 경우 → Cloudflare API로 검증
2. `turnstile_token`이 없는 경우:
   - `TURNSTILE_SECRET_KEY`가 설정된 경우 → 400 에러
   - `TURNSTILE_SECRET_KEY`가 없는 경우 → 검증 우회 (개발 환경)

> **프로덕션 환경에서는 반드시 `TURNSTILE_SECRET_KEY`를 설정하세요!**

## 7. 테스트

### 7.1 개발 환경 (Turnstile 비활성화)

`.env`에서 `TURNSTILE_SECRET_KEY`를 빈 문자열로 설정:

```env
TURNSTILE_SECRET_KEY=
```

이 경우 모든 API가 Turnstile 검증 없이 동작합니다.

### 7.2 프로덕션 환경 (Turnstile 활성화)

`.env`에 실제 Secret Key 설정:

```env
TURNSTILE_SECRET_KEY=0x4AAA...
```

이 경우 `turnstile_token`이 없거나 유효하지 않으면 400 에러가 발생합니다.

## 8. 에러 처리

### 8.1 400 Bad Request

```json
{
  "detail": "Turnstile 토큰이 필요합니다"
}
```

또는

```json
{
  "detail": "Turnstile 검증 실패: invalid-input-response"
}
```

### 8.2 일반적인 에러 코드

- `missing-input-secret`: Secret Key 없음
- `invalid-input-secret`: 잘못된 Secret Key
- `missing-input-response`: 토큰 없음
- `invalid-input-response`: 잘못된 토큰
- `timeout-or-duplicate`: 토큰 만료 또는 중복 사용

## 9. 프론트엔드 라이브러리 예시

### 9.1 React (Next.js)

```tsx
'use client';

import { useEffect, useRef } from 'react';

export default function LoginPage() {
  const turnstileRef = useRef<string | null>(null);

  useEffect(() => {
    // Turnstile 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    document.head.appendChild(script);

    // 전역 콜백 함수
    (window as any).onTurnstileSuccess = (token: string) => {
      turnstileRef.current = token;
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = {
      student_id: '12345678',
      password: 'password123!',
      turnstile_token: turnstileRef.current
    };

    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    // 응답 처리...
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="text" name="student_id" placeholder="학번" />
      <input type="password" name="password" placeholder="비밀번호" />
      
      <div 
        className="cf-turnstile" 
        data-sitekey="your_site_key_here"
        data-callback="onTurnstileSuccess"
      />
      
      <button type="submit">로그인</button>
    </form>
  );
}
```

## 10. 참고 자료

- [Cloudflare Turnstile 공식 문서](https://developers.cloudflare.com/turnstile/)
- [Turnstile 위젯 설정](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
- [서버 측 검증](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
