import { BookOpen, Code2, Paintbrush, Users } from 'lucide-react'

// 섹션 그룹 정의
export const MANUAL_GROUPS = [
    {
        id: 'user',
        title: 'PART 1. 사용자 가이드',
        icon: Users,
        color: 'text-green-600 dark:text-green-400',
        sections: [
            { id: 'user-intro', title: '1. 시스템 개요' },
            { id: 'user-interface', title: '2. 메인 화면 구성' },
            { id: 'user-features', title: '3. 주요 기능 가이드' },
        ]
    },
    {
        id: 'admin',
        title: 'PART 2. 관리자 가이드',
        icon: BookOpen,
        color: 'text-blue-600 dark:text-blue-400',
        sections: [
            { id: 'admin-intro', title: '1. 관리자 접속' },
            { id: 'admin-structure', title: '2. 대시보드 구조' },
            { id: 'admin-features', title: '3. 상세 기능 가이드' },
        ]
    },
    {
        id: 'frontend',
        title: 'PART 3. 프론트엔드 가이드',
        icon: Paintbrush,
        color: 'text-pink-600 dark:text-pink-400',
        sections: [
            { id: 'fe-intro', title: '1. 기술 스택' },
            { id: 'fe-structure', title: '2. 프로젝트 구조' },
            { id: 'fe-routing', title: '3. 라우팅 (TanStack Router)' },
            { id: 'fe-state', title: '4. 상태 관리 (Zustand)' },
            { id: 'fe-api', title: '5. API 연동' },
            { id: 'fe-styling', title: '6. 스타일링 및 컴포넌트' },
            { id: 'fe-seo', title: '7. SEO 최적화' },
            { id: 'fe-performance', title: '8. 성능 최적화' },
            { id: 'fe-build', title: '9. 개발 및 빌드' },
        ]
    },
    {
        id: 'backend',
        title: 'PART 4. 백엔드 가이드',
        icon: Code2,
        color: 'text-purple-600 dark:text-purple-400',
        sections: [
            { id: 'tech-stack', title: '1. 기술 스택 및 아키텍처' },
            { id: 'env-vars', title: '2. 환경 변수 관리' },
            { id: 'server', title: '3. 서버 관리 (Fly.io)' },
            { id: 'database', title: '4. 데이터베이스 (Supabase)' },
            { id: 'storage', title: '5. 스토리지 관리' },
            { id: 'auth-security', title: '6. 인증 및 보안' },
            { id: 'troubleshooting', title: '7. 트러블슈팅 & FAQ' },
            { id: 'checklist', title: '8. 운영 체크리스트' },
        ]
    }
]

// 전체 섹션 목록 (Flattened for Observer)
export const ALL_SECTIONS = MANUAL_GROUPS.flatMap(group => group.sections)
