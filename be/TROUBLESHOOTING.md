
## 백엔드 트러블슈팅 가이드

### HTTP 상태 코드 정리

| 코드 | 의미 | 사용 상황 |
| --- | --- | --- |
| 200 | OK | 조회, 수정 성공 |
| 201  | Created | 생성 성공 (회원가입, 신청, 게시글 작성 등) |
| 204 | No Content | 삭제 성공 (응답 body 없음) |
| ——— | ————————————————— | —————————————————————————————————— |
| 400 | Bad Request | 잘못된 요청 형식, 필수 값 누락, 유효성 검증 실패 |
| 401 | Unauthorized | 로그인 필요, 토큰 만료, 토큰 없음 |
| 403  | Forbidden | 퀀한 없음 (admin 전용 API를 student가 호출 등) |
| 404  | Not Found | 존재하지 않는 리소스 |
| 409 | Conflict | 중복 (이미 신청함, 이미 존재하는 학번 등) |
| 422 | Unprocessable | 요청 형식은 맞지만 처리 불가 (비즈니스 로직 오류) |
| ——— | ————————————————— | —————————————————————————————————— |
| 500 | Internal Server Error | 서버 버그, DB 오류, 예외 처리 안됨 |
| 502 | Bad Gateway | 서버 다운, [Fly.io](http://Fly.io) / Supabase 연결 실패 |
| 503  | Service Unavailable | 서버 과부하, 점검 등 |

---

## 자주 발생하는 에러 & 해결법

### 1. “이미 신청하셨습니다” (400/409)

원인: 같은 활동에 중복 신청 시도

확인 사항: 

- activity_registrations 테이블에 해당 user_id + activity_id 조합이 있는지 확인
- DB 함수 register_for_activity가 activity_id 를 제대로 체크하는지 확인

해결:

```sql
-- 중복 신청 확인
SELECT * FROM activity_registrations 
WHERE user_id = 'xxx' AND activity_id = 123;
```

### 2. “인증이 필요합니다” (401)

원인:

- 토큰 없음 (로그인 안함)
- 토큰 만료
- 토큰 형식 오류

확인 사항:

- 프론트에서 Authorization: Bearer {token} 헤더 전송 여부
- 토큰 만료 시간 확인 (Supabase 기본: 1시간)

해결:

- 프로트에서 토큰 갱신 로직 확인
- Supabase Dashboard → Authentication → Settings에서 JWT 만료 시간 조정 (Free tier에서 안될 가능성 있음)

### 3. “권한이 없습니다” (401)

원인: admin.py 전용 API를 student가 호출

확인 사항:

- 해당 유저의 role 확인 (관리자 계정을 제외한 모든 계정은 학생 권한 계정)

```sql
SELECT role FROM users WHERE id = 'student_id';
```

- 해결 (관리자 계정은 반드시 분리해놓고 사용하는 것을 추천합니다):

```sql
UPDATE users SET role = 'admin' WHERE
student_id = 'student_id';
```

### 4. “인증 이메일이 안 보내져요”

원인: 

1. Google OAuth Refresh Token 만료/무효
2. Gmail API 권한 문제
3. 환경변수 누락/오류
4. Gmail 일일 발송 한도 초과 

확인 사항:

1. 서버 로그 확인
    
    ```bash
    fly logs | grep -i "gmail"
    fly logs | grep -i "email"
    ```
    
2. 환경 변수 확인
    
    ```bash
    fly secrets list
    ```
    

해결 방법:

Refresh Token 재발급이 필요한 경우:

1. https://developers.google.com/oauthplayground/ 접속
2. 우측 상단 톱니바퀴(설정) 클릭
3. OAuth 2.0 configuration에서 하단 Use your own OAuth credentials 클릭
4. .env 파일 안에 있는 GOOGLE_CLIENT_ID=17…. / GOOGLE_CLIENT_SECRET=GO…. 각각 복사 후 Client ID, Client secret에 붙여넣기
5. 이후 좌측에 Gmail API v1 찾아서 누른 뒤 https://www.googleapis.com/gmail.send 선택
6. 아래 파란색 버튼(Authorize APIs) 누르기
7. 이후 Step 2 Exchange authorization code for tokens 누른 뒤 파란 박스(Exchange authorization code for tokens) 누르기
8. Refresh token 부분 복사 및 하단 Auto-refresh the token before it expires 체크
9. 이후 2가지 방법 존재 바로 아래는 첫번째 방법
    1. .env 파일에 존재하는 GOOGLE_REFRESH_TOKEN에 붙여넣고 아래 명령어 실행
    2. fly secrets import < .env (안되면 ai 한테 물어보세요)
10. 2번 째 방법
    1. (선택) .env 파일 업데이트
    2. fly secrets set KEY=VALUE 형식을 맞춰 해당 키값만 업데이트
11. 잘 되는지 테스트하기
12. 안되면 물어보기

에러 메시지별 원인

| 에러 메시지 | 원인 | 해결 |
| --- | --- | --- |
| invalid_scope | Refresh Token 생성 시 권한 누락 | 토큰 재발급 필요 |
| invalid_grant | Refresh Token 만료/폐기됨 | 토큰 재발급 필요 |
| Token has been expired or revoked | 토큰 만료 | 토큰 재발급 필요 |
| Daily Limit Exceeded | Gmail 일일 한도 초과 | 다음날 자동 복구 |

### 5. “신청 인원 수가 안 맞아요”

원인: current_count와 실제 신청 수 불일치

확인:

```sql
SELECT 
  a.title,
  a.current_count as saved_count,
  COUNT(r.id) as actual_count
FROM activities a
LEFT JOIN activity_registrations r 
  ON a.id = r.activity_id AND r.status != 'cancelled'
WHERE a.id = 123
GROUP BY a.id;
```

수정:

```sql
UPDATE activities 
SET current_count = (
  SELECT COUNT(*) FROM activity_registrations 
  WHERE activity_id = 123 AND status != 'cancelled'
)
WHERE id = 123;
```

### 6. DB 함수 버그 수정

상황: register_for_activity 등 PostgreSQL 함수에 버그가 있을 때

해결 방법:

1. be/db/ 폴더에 수정 SQL 파일 작성 (예: fix_xxx.sql)
2. Supabase Dashboard → SQL Editor에서 실행

### 7. 긴급 롤백 방법 (Fly.io)

아래 방법은 [Fly.io](http://Fly.io) CLI가 설치되어 있다는 가정 하에 설명을 진행합니다.

1. [Fly.io](http://Fly.io) 로그 확인
    
    ```bash
    # 실시간 로그 확인
    fly logs
    
    # 최근 로그 100줄 보기
    fly logs -n 100
    ```
    
2. [Fly.io](http://Fly.io) 배포 롤백
    
    ```bash
    # 배포 목록 확인
    fly releases
    
    # 특정 버전으로 롤백 (예: v15로 롤백)
    fly deploy --image registry.fly.io/<app-name>:deployment-<release-id>
    
    # 또는 이전 이미지로 간단 롤백
    fly releases rollback
    ```
    
3. [Fly.io](http://Fly.io) 앱 상태 확인
    
    ```bash
    # 앱 상태 확인
    fly status
    
    # 인스턴스 확인
    fly machines list
    
    # 앱 재시작
    fly apps restart
    ```
