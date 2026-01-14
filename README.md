# 🎓 컴퓨터공학과 학생회 서비스 (Student Council Service)

<div align="center">

![Project Banner](https://via.placeholder.com/1000x300?text=Computer+Science+Student+Council+Service)

<br/>

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

<br/>

**서울과학기술대학교 컴퓨터공학과 학생들을 위한 통합 정보 및 편의 서비스**

[데모 보기](https://seoultech.vercel.app/) • [API 문서](https://seoultechcom-api.onrender.com/docs#/) • [팀원 소개](#-프로젝트-구성원-team-members)

</div>

---

## 📖 목차 (Table of Contents)

1. [📌 프로젝트 소개](#-프로젝트-소개-project-overview)
2. [🛠️ 기술 스택](#-기술-스택-tech-stack)
3. [🏛️ 주요 기능 및 서비스](#-주요-기능-및-서비스-features)
4. [🚀 시작하기](#-시작하기-getting-started)
5. [👥 프로젝트 구성원](#-프로젝트-구성원-team-members)
6. [🔗 관련 링크](#-관련-링크-links)

---

## 📌 프로젝트 소개 (Project Overview)

**Student Council Service**는 학과 내의 정보 불균형을 해소하고 학생들이 학생회 사업(행사, 물품 대여, 사물함 등)을 보다 편리하게 이용할 수 있도록 돕는 웹 플랫폼입니다.

기존의 오프라인 또는 파편화된 온라인 소통 방식을 통합하여 다음과 같은 가치를 제공합니다.

- **📢 통합된 정보 제공**: 공지사항, 행사, 학생회 소식을 한 곳에서 확인
- **📱 편의성 증대**: 행사 신청, 물품 대여, 사물함 신청의 전산화 및 간편화
- **🔐 투명성 및 보안**: 학생회비 납부 여부에 따른 권한 관리 및 사업 진행 현황 공유

---

## 🛠️ 기술 스택 (Tech Stack)

### Frontend (`fe-demo`)
| Tech | Description |
|------|-------------|
| **React 19** | Component-Based UI 라이브러리 |
| **TypeScript** | 정적 타입 시스템을 통한 안정성 확보 |
| **Vite** | 초고속 빌드 및 개발 환경 제공 |
| **Tailwind CSS 4** | 유틸리티 퍼스트 CSS 스타일링 |
| **Zustand** | 가볍고 직관적인 전역 상태 관리 |
| **TanStack Query** | 서버 상태 관리 및 데이터 캐싱 |
| **React Router Dom 7** | 클라이언트 사이드 라우팅 |

### Backend (`be`)
| Tech | Description |
|------|-------------|
| **FastAPI** | 고성능 Python 비동기 API 프레임워크 |
| **Supabase** | BaaS (Auth, Database, Storage) 솔루션 |
| **PostgreSQL** | 강력한 오픈소스 관계형 데이터베이스 |
| **Pydantic** | 데이터 유효성 검사 및 설정 관리 |

---

## 🏛️ 주요 기능 및 서비스 (Features)

### 1. 홈 및 대시보드 (Home)
- **바로가기**: 자주 사용하는 학과 관련 사이트 링크 제공
- **최신 소식**: 주요 공지사항 및 진행 중인 행사 요약 노출

### 2. 학생회 소개 (Intro)
- **조직도 및 공약**: 학생회 구성원 및 공약 사항 소개
- **관리자 기능**: 관리자 페이지를 통한 이미지 및 정보 업데이트

### 3. 행사 관리 (Events)
- **행사 목록**: 예정 / 진행중 / 마감된 행사 필터링 조회
- **행사 신청**: 학생회비 납부 여부에 따른 신청 권한 제어
- **만족도 조사**: 행사 종료 후 참여자 대상 설문 조사 기능

### 4. 공지사항 (Notice)
- **카테고리별 분류**: 학생회(행사, 복지) / 민주자치(회의록, 회칙) 등
- **검색 및 필터**: 제목/내용 검색 및 첨부파일 다운로드 지원

### 5. 복지 사업 (Welfare)
- **물품 대여**: 대여 가능 물품 재고 확인 및 실시간 대여 신청
- **사물함 신청**: 사물함 위치 확인 및 학기별 사용 신청

### 6. 마이 페이지 (My Page)
- **내 정보 관리**: 학생 정보 수정 및 학생회비 납부 상태 확인
- **활동 내역**: 신청한 행사, 대여 중인 물품, 사물함 정보 확인

---

## 🚀 시작하기 (Getting Started)

이 프로젝트를 로컬 환경에서 실행하려면 다음 단계가 필요합니다.

### 1. Frontend (`fe-demo`) 실행

```bash
# 1. Repository Clone
git clone https://github.com/jaehoya/Student-council.git

# 2. Frontend 디렉토리로 이동
cd fe

# 3. 패키지 설치
npm install

# 4. 개발 서버 실행
npm run dev
```

### 2. Backend 실행

백엔드는 `be/requirements.txt`의 의존성을 설치하고 Supabase 환경 변수를 설정해야 합니다. 자세한 설정 방법은 `be/README.md` (혹은 `be/db/README.md`)를 참고하세요.

```bash
# Backend 디렉토리로 이동
cd be

# 의존성 설치
pip install -r requirements.txt

# 서버 실행 (uvicorn)
uvicorn app.main:app --reload
```

---

## 👥 프로젝트 구성원 (Team Members)

| Name | Role | GitHub |
|------|------|--------|
| **이재호** | PM / Frontend | [@jaehoya](https://github.com/jaehoya) |
| **이준석** | Frontend | [@biabio503](https://github.com/biabio0503) |
| **최도현** | Backend | [@casing1](https://github.com/casing1) |
| **황정민** | Frontend | [@surphur](https://github.com/surphur) |
---

## 🔗 관련 링크 (Links)

- **Figma Design**: [Link](https://www.figma.com/design/wQi9vCJzLnIQQHEsV7Npi7/%EC%BB%B4%ED%93%A8%ED%84%B0%EA%B3%B5%ED%95%99%EA%B3%BC-%ED%95%99%EC%83%9D%ED%9A%8C-%ED%99%88%ED%8E%98%EC%9D%B4%EC%A7%80?node-id=0-1&p=f)
- **API Swagger**: [https://seoultechcom-api.onrender.com/docs#/](https://seoultechcom-api.onrender.com/docs#/)
