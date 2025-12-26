# GitHub Copilot Instructions

## 프로젝트 개요
서울과학기술대학교 학생회 홈페이지 백엔드 API (FastAPI + Supabase)

## 1. 주석 작성 규칙
- **모든 함수, 클래스에 한국어 docstring 필수**
- **복잡한 로직에는 라인별 주석 작성** (관리 주체가 클라이언트로 넘어가므로 세세하게)
- **보안 관련 코드는 특히 상세하게 설명**
- 주석 예시:
```python
"""
이메일 인증번호 발송
학교 이메일로 6자리 인증번호를 발송하고, Redis에 5분간 저장합니다.
중복 가입 방지를 위해 이미 사용된 이메일인지 확인합니다.
"""
```

## 2. Git 브랜치 전략
- **커밋은 자주**: 작은 단위로 기능 구현 시마다 커밋
- **푸시는 신중하게**: 큰 기능이 완전히 완성되었을 때만 푸시
- 커밋 메시지는 명확하게 (예: "feat: 이메일 인증 API 구현", "fix: 비밀번호 해싱 버그 수정")

## 3. 네이밍 컨벤션
### Python (FastAPI 백엔드)
- **파일명**: `snake_case` (예: `auth.py`, `database.py`)
- **클래스명**: `PascalCase` (예: `LoginRequest`, `UserProfile`)
- **함수/변수명**: `snake_case` (예: `send_verification_email`, `user_id`)
- **상수**: `UPPER_SNAKE_CASE` (예: `MAX_LOGIN_ATTEMPTS`)
- **private 변수/함수**: `_leading_underscore` (예: `_hash_password`)

### API 엔드포인트
- **RESTful 규칙 준수**: `/auth/login`, `/users/{user_id}`
- **kebab-case 사용**: `/send-verification`, `/check-student-id`

## 4. 보안 강화 (최우선)
### 개인정보 보호
- **학생 개인정보(학번, 이메일, 이름, 연락처 등) 처리 시 각별히 주의**
- 비밀번호는 절대 평문 저장 금지, bcrypt 사용
- JWT 토큰 보안 유지 (짧은 만료 시간, HttpOnly 쿠키)

### 필수 보안 조치
- **Rate Limiting**: 모든 인증 관련 API에 적용
- **Input Validation**: Pydantic으로 모든 입력값 검증
- **SQL Injection 방지**: Supabase SDK 사용, 직접 SQL 작성 금지
- **XSS 방지**: HTML escape 처리
- **CORS 설정**: 허용된 도메인만 접근 가능
- **환경변수 사용**: API 키, 비밀키는 절대 하드코딩 금지 (.env 사용)
- **에러 메시지**: 민감한 정보 노출 금지 (구체적인 에러는 로그에만)

### 인증/인가
- 모든 민감한 API는 JWT 토큰 검증 필수
- 토큰 검증 실패 시 명확한 에러 반환 (401, 403)

## 5. 코드 효율성
- **간결하고 읽기 쉬운 코드 작성**
- 불필요한 중복 제거 (DRY 원칙)
- 성능 최적화:
  - DB 쿼리 최소화
  - N+1 문제 방지
  - 캐싱 활용 (Redis)
- 단, **보안과 효율성이 충돌하면 보안 우선**

## 6. 코드 스타일
### 일반 규칙
- Python: PEP 8 준수
- 최대 줄 길이: 100자
- Import 정렬: 표준 라이브러리 → 서드파티 → 로컬 모듈
```python
from fastapi import APIRouter, HTTPException
from typing import Optional

from app.schemas.auth import LoginRequest
from app.database import supabase
```

### Type Hints
- **모든 함수 매개변수와 반환값에 타입 힌트 필수**
```python
def verify_token(token: str) -> dict[str, Any]:
    ...
```

## 7. 에러 처리
- **예외 상황은 적절한 HTTP 상태 코드와 함께 명확한 에러 메시지 반환**
- HTTPException 사용
```python
if not user:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="사용자를 찾을 수 없습니다"
    )
```

## 8. API 문서화
- **모든 엔드포인트에 summary, description 작성**
- **Pydantic 모델에 Field description 작성**
- **가능한 에러 응답도 responses에 명시**

## 9. 테스트
- 중요한 기능에는 단위 테스트 작성 (pytest)
- 특히 인증, 결제 등 보안 관련 기능은 테스트 필수

## 10. 로깅
- 중요한 작업(로그인, 회원가입, 데이터 변경 등)은 로그 기록
- 개인정보는 로그에 기록 금지
```python
logger.info(f"사용자 로그인 성공: user_id={user_id}")
# 비밀번호, 이메일 등은 로그에서 제외
```

## 11. 문서화
- **README.md 파일은 사용자 요청 시에만 작성**
- 코드 작업 후 자동으로 README 생성하지 않음

## 우선순위
1. 보안 > 효율성
2. 가독성 > 간결성 (클라이언트 인수인계 고려)
3. 명확한 주석 > 코드만으로 설명

---
**이 규칙은 프로젝트 진행 중 지속적으로 업데이트됩니다.**
