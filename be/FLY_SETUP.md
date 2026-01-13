# Fly.io 배포 가이드

## 1. flyctl 설치

```bash
# macOS
brew install flyctl

# 또는 공식 스크립트
curl -L https://fly.io/install.sh | sh
```

## 2. 로그인

```bash
fly auth login
```
브라우저에서 로그인 후 자동 인증됩니다.

## 3. 앱 생성 (최초 1회)

```bash
cd be
fly launch --no-deploy
```
- 앱 이름: `seoultech-cse-backend` (또는 원하는 이름)
- 리전: `nrt` (도쿄) 선택
- PostgreSQL/Redis: No

## 4. 환경변수 설정

```bash
# 한 번에 설정
fly secrets set \
  SUPABASE_URL="https://xxx.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="xxx" \
  SUPABASE_ANON_KEY="xxx" \
  GOOGLE_CLIENT_ID="xxx" \
  GOOGLE_CLIENT_SECRET="xxx" \
  GOOGLE_REFRESH_TOKEN="xxx" \
  GMAIL_FROM_EMAIL="xxx@gmail.com" \
  GMAIL_FROM_NAME="서울과기대 컴공학생회" \
  GOOGLE_SHEETS_API_KEY="xxx" \
  R2_ACCOUNT_ID="xxx" \
  R2_ACCESS_KEY_ID="xxx" \
  R2_SECRET_ACCESS_KEY="xxx" \
  R2_CLUB_IMAGES_URL="https://pub-xxx.r2.dev" \
  R2_EVENT_IMAGES_URL="https://pub-xxx.r2.dev" \
  R2_INTRODUCTION_IMAGES_URL="https://pub-xxx.r2.dev" \
  R2_POST_ATTACHMENTS_URL="https://pub-xxx.r2.dev" \
  R2_WELFARE_IMAGES_URL="https://pub-xxx.r2.dev" \
  TURNSTILE_SECRET_KEY="xxx" \
  TURNSTILE_SITE_KEY="xxx" \
  SECRET_KEY="xxx" \
  ALLOWED_EMAIL_DOMAIN="seoultech.ac.kr" \
  ENVIRONMENT="production" \
  DEBUG="false" \
  FRONTEND_URL="https://your-frontend.com"
```

## 5. 배포

```bash
fly deploy
```

## 6. 확인

```bash
# 상태 확인
fly status

# 로그 확인
fly logs

# 앱 열기
fly open
```

---

## 유용한 명령어

```bash
# 스케일업 (행사일)
fly scale memory 512

# 스케일다운 (평소)
fly scale memory 256

# 재배포
fly deploy

# SSH 접속
fly ssh console
```

## 커스텀 도메인

```bash
fly certs create api.yourdomain.com
```
이후 DNS에 CNAME 레코드 추가

---

## 예상 비용

| 상황 | 비용 |
|------|------|
| 평소 (256MB) | 무료 |
| 행사일 (512MB, 몇 시간) | ~$0.01 |
| 월간 | **거의 무료** |
