# 🎓 컴퓨터공학과 학생회 서비스 (Student Council Service)

서울과학기술대학교 컴퓨터공학과 학생들을 위한 통합 학생회 서비스입니다.  
공지사항, 행사 신청, 복지 사업(대여, 사물함), 동아리 홍보, 건의함 등의 기능을 제공합니다.

---

## 👥 프로젝트 구성원 (Team Members)

| 이름 | 역할 | GitHub |
|------|------|----------------|
| 이재호 | **PM / Frontend** | @jaehoya |
| 이준석 | **Frontend** | @junsik |
| 최도현 | **Backend** | @doheon |

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" /> <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" /> <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white" /> <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
- **State Management**: Zustand, React Query (@tanstack/react-query)
- **Routing**: React Router Dom
- **HTTP Client**: Axios
- **UI/UX**: React Hot Toast

### Backend & Database
<img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" /> <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" /> <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
- **Auth**: Supabase Auth (Google/Email)
- **Database**: PostgreSQL (with Row Level Security)
- **Storage**: Supabase Storage (Images, Files)

---

## 🔗 프로젝트 링크 (Links)

| 서비스 | URL | 비고 |
|--------|-----|------|
| **Figma** | [Figma Link Here](figma.com/design/wQi9vCJzLnIQQHEsV7Npi7/컴퓨터공학과-학생회-홈페이지?node-id=0-1&p=f) | 디자인 시안 |
| **Notion** | [Notion Link Here](https://notion.so/...) | 기획서 및 회의록(미공개) |
| **Swagger** | [API Docs Here](http://localhost:8000/api-docs) | API 명세서(미배포) |
| **Deploy** | [Service Link](https://...) | 배포 주소(미배포) |

---

## 🚀 시안 설치 및 실행 방법 (How to Run)

### 1. Frontend (`fe-demo`)
```bash
# 레포지토리 클론
git clone https://github.com/jaehoya/Student-council.git

# 프론트엔드 디렉토리로 이동
cd fe-demo

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 2. Backend & Database
백엔드 및 데이터베이스 설정에 대한 자세한 내용은 [be/db/README.md](./be/db/README.md) 파일을 참고하세요.
기본적으로 Supabase 프로젝트를 생성하고 `be/db/schema.sql`을 실행하여 스키마를 설정해야 합니다.

---

## 🏛️ 주요 서비스 및 기능 (Services)

### 1. 홈페이지 (Home)
- **바로가기**: 자주 사용하는 메뉴로 빠른 이동
- **학생회 공지**: 최신 학생회 중요 공지 사항 노출
- **최신 행사**: 가장 최근에 진행된 행사 정보 표시

![Home Screenshot](https://via.placeholder.com/800x400?text=Home+Page+Screenshot)

### 2. 학생회 소개 (Intro)
- **소개 컨텐츠**: 현행 학생회, 공약, 역할, 행사 정보, 조직도, 연락처 등을 이미지로 제공
- **관리자 기능**: 관리자가 이미지를 업데이트하여 내용 수정 가능

![Intro Screenshot](https://via.placeholder.com/800x400?text=Intro+Page+Screenshot)

### 3. 행사 (Events)
- **카테고리**: [예정 | 진행중 | 신청 마감] 탭으로 구분
- **UI**: 3:4 비율의 카드 형태 (썸네일 + 간략 설명)
- **상세 보기**: 클릭 시 상세 공지/정보 페이지로 이동
- **신청 시스템**:
  - **신청 버튼**: 진행중인 행사에만 활성화
  - **권한 체크**: 학생회비 납부 여부에 따라 신청 가능/불가 구분 (미납부자 신청 불가)
  - **만족도 조사**: 행사 종료(완료된 카테고리) 후 '만족도 조사 참가하기' 버튼으로 변경

![Event Screenshot](https://via.placeholder.com/800x400?text=Event+Page+Screenshot)

### 4. 공지사항 (Notice)
- **검색**: 제목/내용 검색 기능
- **카테고리**:
  - **학생회**: [행사, 복지, 학과 소식]
  - **민주자치**: [고시, 공고, 대표자 회의, 학생회칙]
- **상세 페이지**: 제목, 내용, 작성일시, 사진, 첨부파일 다운로드

![Notice Screenshot](https://via.placeholder.com/800x400?text=Notice+Page+Screenshot)

### 5. 복지사업 (Welfare)
- **대여사업**: 대여 가능한 물품 목록 및 남은 수량(재고) 확인, 대여 신청
- **사물함**: 사물함 배치도(표), 내 사물함 위치 확인, 신청하기

![Welfare Screenshot](https://via.placeholder.com/800x400?text=Welfare+Page+Screenshot)

### 6. 동아리 (Clubs)
- **목록**: 전체 동아리 리스트업
- **상세 보기**: 동아리 클릭 시 DB에서 상세 소개 이미지 로드 및 라우팅
- **정보**: 동아리 회장단이 제공한 상세 소개 자료 게시

![Club Screenshot](https://via.placeholder.com/800x400?text=Club+Page+Screenshot)

### 7. 건의함 (Suggestion Box)
- **익명 게시판**: 누구나 자유롭게 의견 개진 (로그인 필요, 작성자는 관리자만 확인 가능)

### 8. 마이 페이지 (My Page)
- **내 정보**: 이름, 학번, Email, **학생회비 납부여부** (확인중 / 납부 / 미납부)
- **신청 행사**: 예정된 행사(신청 완료, 입금 대기, 접수 완료, 반려), 참여 완료한 행사 목록
- **복지 현황**:
  - 대여 물품 반납 기간 및 상태
  - 내 사물함 위치 및 사용 기간
- **인증 상태**: 학생 가입 인증 대기 상태 확인

![MyPage Screenshot](https://via.placeholder.com/800x400?text=MyPage+Screenshot)

---

## 💾 데이터베이스 구조 (Database Schema)

Supabase PostgreSQL을 사용하며, 주요 테이블 구조는 다음과 같습니다. 상세 내용은 `be/db/schema.sql`을 참조하세요.

| 테이블명 | 설명 | 비고 |
|----------|------|------|
| `users` | 사용자 정보 | 학번, 이름, 권한(Student/Council/Admin), 납부여부 |
| `registrations` | 행사 신청 내역 | 행사ID, 유저ID, 신청상태 |
| `events` | 행사 정보 | 제목, 일정, 정원, 납부자전용여부 |
| `posts` | 게시글 | 공지사항, 건의함 (익명/실명) |
| `welfare_rentals` | 대여 물품 | 물품명, 총수량, 잔여수량 |
| `welfare_lockers` | 사물함 | 번호, 위치, 점유상태 |
| `clubs` | 동아리 | 이름, 소개 이미지 URL |

### ERD Diagram (Placeholder)
![ERD](https://via.placeholder.com/800x400?text=ERD+Diagram)

---

## 📄 API 문서 (Swagger)

Backend API는 FastAPI로 구축되어 있으며 Swagger UI를 통해 테스트할 수 있습니다.

![Swagger Screenshot](https://via.placeholder.com/800x400?text=Swagger+UI+Screenshot)

1. 백엔드 서버 실행
2. `http://localhost:8000/docs` 접속

---
