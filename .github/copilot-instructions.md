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
### 커밋 타이밍 (자주)
다음 상황에서 **즉시 커밋**:
- 새로운 API 엔드포인트 1개 완성
- 스키마 파일 추가/수정 완료
- 유틸리티 함수 1개 작성 완료
- 버그 수정 완료
- 설정 파일 변경 (config, requirements 등)
- 작은 단위로 작업이 완료될 때마다

### 푸시 타이밍 (신중하게)
다음과 같은 **큰 기능 완성 시에만 푸시**:
- 회원가입/로그인 전체 플로우 완성
- 게시판 CRUD 전체 완성
- 결제 시스템 완성
- 이메일 인증 시스템 완성
- 관리자 페이지 완성
- 여러 개의 관련 API가 모두 테스트되고 동작 확인됨

**기준**: 최소 3~5개 이상의 커밋이 쌓였고, 해당 기능이 독립적으로 동작 가능한 상태

### 커밋 메시지 규칙
- `feat:` 새로운 기능 추가
- `fix:` 버그 수정
- `refactor:` 코드 리팩토링
- `docs:` 문서 수정
- `style:` 코드 포맷팅
- `test:` 테스트 추가
- `chore:` 빌드, 설정 파일 수정

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
