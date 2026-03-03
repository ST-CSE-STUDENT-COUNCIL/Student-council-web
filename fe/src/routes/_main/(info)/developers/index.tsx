/**
 * 개발자 소개 페이지
 *
 * SC Dev Team - 서울과학기술대학교 컴퓨터공학과 학생회 웹사이트를 제작한
 * 개발팀 멤버를 소개하는 페이지입니다.
 * Bento Grid + 호버 인터랙션 + 기술 스택 강조 디자인
 */

import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Mail, Github, Code2, Monitor, Server, Globe, GitFork, Star, Shield, Users, Bell, CalendarCheck, Calendar, FileCode2, Flame } from 'lucide-react'
import { SEO } from '../../../../components/common/SEO'

/** GitHub API에서 가져온 프로필 데이터 */
type GitHubProfile = {
   avatar_url: string
   bio: string | null
   public_repos: number
   followers: number
}

export const Route = createFileRoute('/_main/(info)/developers/')({
   component: DevelopersPage,
})

type Developer = {
   name: string
   nameEn: string
   role: string
   roleLabel: string
   roleBadgeColor: string
   accentFrom: string
   accentTo: string

   /** 아바타 이모지 (GitHub 이미지 로딩 전 폴백) */
   avatar: string
   email: string
   github?: string
   blog?: string
   techStack: { label: string; color: string }[]
}

const DEVELOPERS: Developer[] = [
   {
      name: '이재호',
      nameEn: 'Jaeho Lee',
      role: 'Project Manager · Frontend',
      roleLabel: 'PM / FE',
      roleBadgeColor: 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30',
      accentFrom: '#7c3aed',
      accentTo: '#4f46e5',
      avatar: '🎯',
      email: 'idjaeho@seoultech.ac.kr',
      github: 'https://github.com/jaehoya',
      techStack: [
         { label: 'React', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
         { label: 'TypeScript', color: 'text-blue-600 dark:text-blue-400 bg-blue-400/10 border-blue-400/20' },
         { label: 'TanStack', color: 'text-red-600 dark:text-red-400 bg-red-400/10 border-red-400/20' },
         { label: 'Zustand', color: 'text-orange-600 dark:text-orange-400 bg-orange-400/10 border-orange-400/20' },
      ],
   },
   {
      name: '최도현',
      nameEn: 'Dohyun Choi',
      role: 'Backend Developer',
      roleLabel: 'Backend',
      roleBadgeColor: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
      accentFrom: '#2563eb',
      accentTo: '#0891b2',
      avatar: '⚙️',
      email: 'ehgis2344@seoultech.ac.kr',
      github: 'https://github.com/casing1',
      techStack: [
         { label: 'FastAPI', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
         { label: 'Python', color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
         { label: 'PostgreSQL', color: 'text-blue-600 dark:text-blue-400 bg-blue-400/10 border-blue-400/20' },
         { label: 'Docker', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
      ],
   },
   {
      name: '이준석',
      nameEn: 'Junseok Lee',
      role: 'Frontend Developer',
      roleLabel: 'Frontend',
      roleBadgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      accentFrom: '#059669',
      accentTo: '#0d9488',
      avatar: '🎨',
      email: 'biabio@seoultech.ac.kr',
      github: 'https://github.com/biabio0503',
      techStack: [
         { label: 'React', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
         { label: 'TypeScript', color: 'text-blue-600 dark:text-blue-400 bg-blue-400/10 border-blue-400/20' },
         { label: 'Tailwind CSS', color: 'text-teal-600 dark:text-teal-400 bg-teal-400/10 border-teal-400/20' },
         { label: 'Zustand', color: 'text-orange-600 dark:text-orange-400 bg-orange-400/10 border-orange-400/20' },
      ],
   },
   {
      name: '황정민',
      nameEn: '',
      role: 'Frontend Developer (Sub)',
      roleLabel: 'FE SUB',
      roleBadgeColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
      accentFrom: '#d97706',
      accentTo: '#ea580c',
      avatar: '💡',
      email: 'ghkdwjdals5@gmail.com',
      github: 'https://github.com/surphur',
      techStack: [
         { label: 'React', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
         { label: 'TypeScript', color: 'text-blue-600 dark:text-blue-400 bg-blue-400/10 border-blue-400/20' },
         { label: 'Tailwind CSS', color: 'text-teal-600 dark:text-teal-400 bg-teal-400/10 border-teal-400/20' },
      ],
   },
]

/**
 * GitHub 유저네임을 URL에서 추출
 * 'https://github.com/jaehoya' → 'jaehoya'
 */
function extractGithubUsername(url?: string): string | null {
   if (!url) return null
   return url.replace(/\/$/, '').split('/').pop() ?? null
}

/**
 * GitHub API로 프로필 데이터를 가져오는 커스텀 훅
 * Rate limit 방지를 위해 캐싱 적용 (sessionStorage, 10분)
 */
function useGitHubProfiles(developers: Developer[]): Record<string, GitHubProfile> {
   const [profiles, setProfiles] = useState<Record<string, GitHubProfile>>({})

   useEffect(() => {
      const CACHE_KEY = 'gh_profiles'
      const CACHE_TTL = 10 * 60 * 1000 // 10분

      // 캐시 확인
      try {
         const cached = sessionStorage.getItem(CACHE_KEY)
         if (cached) {
            const { data, ts } = JSON.parse(cached)
            if (Date.now() - ts < CACHE_TTL) {
               setProfiles(data)
               return
            }
         }
      } catch { /* 캐시 없으면 무시 */ }

      // GitHub API에서 프로필 가져오기
      const fetchAll = async () => {
         const result: Record<string, GitHubProfile> = {}
         await Promise.all(
            developers.map(async (dev) => {
               const username = extractGithubUsername(dev.github)
               if (!username) return
               try {
                  const res = await fetch(`https://api.github.com/users/${username}`)
                  if (!res.ok) return
                  const data = await res.json()
                  result[dev.name] = {
                     avatar_url: data.avatar_url,
                     bio: data.bio,
                     public_repos: data.public_repos,
                     followers: data.followers,
                  }
               } catch { /* 네트워크 오류 무시 */ }
            })
         )
         setProfiles(result)
         try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, ts: Date.now() }))
         } catch { /* storage full 무시 */ }
      }
      fetchAll()
   }, [developers])

   return profiles
}

/** 개발자 카드 — 3열 균등 배치 */
function DeveloperCard({ dev, profile }: { dev: Developer; profile?: GitHubProfile }) {
   return (
      <div
         className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-300/50 dark:hover:shadow-black/40"
         style={
            {
               '--accent-from': dev.accentFrom,
               '--accent-to': dev.accentTo,
            } as React.CSSProperties
         }
      >
         {/* hover 시 상단 액센트 라인 */}
         <div
            className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-3xl"
            style={{ background: `linear-gradient(to right, ${dev.accentFrom}, ${dev.accentTo})` }}
         />

         {/* hover 시 배경 글로우 */}
         <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
            style={{ background: `radial-gradient(ellipse at top left, ${dev.accentFrom}18, transparent 60%)` }}
         />

         <div className="relative flex flex-col h-full">
            {/* 상단: 아바타 + 역할 뱃지 */}
            <div className="flex items-start justify-between mb-5">
               {/* 아바타 (깃허브 프로필 이미지 또는 이모지 폴백) */}
               <div className="relative">
                  {profile?.avatar_url ? (
                     <img
                        src={profile.avatar_url}
                        alt={`${dev.name} GitHub 프로필`}
                        className="w-14 h-14 rounded-2xl object-cover shadow-lg"
                        style={{ outline: `1px solid ${dev.accentFrom}40` }}
                        loading="lazy"
                     />
                  ) : (
                     <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${dev.accentFrom}30, ${dev.accentTo}30)`, border: `1px solid ${dev.accentFrom}40` }}
                     >
                        {dev.avatar}
                     </div>
                  )}
                  {/* 온라인 도트 */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900" />
               </div>

               {/* 역할 뱃지 */}
               <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${dev.roleBadgeColor}`}>
                  {dev.roleLabel}
               </span>
            </div>

            {/* 이름 + 한 줄 소개 */}
            <div className="mb-4">
               <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{dev.name}</h3>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{dev.nameEn}</span>
               </div>
               <p className="text-xs text-slate-500 dark:text-slate-400">{dev.role}</p>
            </div>

            {/* GitHub 통계 */}
            {profile && (
               <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                     <GitFork size={12} className="text-slate-400 dark:text-slate-500" />
                     <span>{profile.public_repos} repos</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                     <Star size={12} className="text-slate-400 dark:text-slate-500" />
                     <span>{profile.followers} followers</span>
                  </div>
               </div>
            )}

            {/* 기술 스택 뱃지 */}
            <div className="flex flex-wrap gap-1.5 mb-5">
               {dev.techStack.map(tech => (
                  <span
                     key={tech.label}
                     className={`px-2 py-0.5 text-xs rounded-md border font-medium ${tech.color}`}
                  >
                     {tech.label}
                  </span>
               ))}
            </div>

            {/* 연락처 */}
            <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
               <a
                  href={`mailto:${dev.email}`}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors min-w-0"
                  title={dev.email}
               >
                  <Mail size={13} className="shrink-0" />
                  <span className="truncate">{dev.email}</span>
               </a>
               <div className="flex items-center gap-2 ml-auto shrink-0">
                  {dev.github && (
                     <a href={dev.github} target="_blank" rel="noreferrer"
                        className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors"
                        title="GitHub"
                     >
                        <Github size={15} />
                     </a>
                  )}
                  {dev.blog && (
                     <a href={dev.blog} target="_blank" rel="noreferrer"
                        className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors"
                        title="Blog"
                     >
                        <Globe size={15} />
                     </a>
                  )}
               </div>
            </div>
         </div>
      </div>
   )
}

/** 기능 소개 아이템 — 담당자 네임 배지 포함 */
function FeatureItem({ title, desc, dev }: { title: string; desc: string; dev: string }) {
   const devColors: Record<string, string> = {
      '이재호': 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20',
      '최도현': 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20',
      '이준석': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      '황정민': 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20',
   }
   return (
      <div className="bg-slate-100 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/40 hover:border-slate-300 dark:hover:border-slate-600/60 transition-colors">
         <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{title}</h4>
            <span className={`shrink-0 px-2 py-0.5 text-[10px] rounded-full border font-medium whitespace-nowrap ${devColors[dev] ?? 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/20'}`}>{dev}</span>
         </div>
         <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
      </div>
   )
}

function DevelopersPage() {
   /** GitHub API로 프로필 정보 가져오기 (아바타, bio, repos, followers) */
   const profiles = useGitHubProfiles(DEVELOPERS)

   return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
         <SEO
            title="개발팀 소개"
            description="서울과학기술대학교 컴퓨터공학과 학생회 웹사이트를 만든 SC Dev Team을 소개합니다."
            url="/developers"
         />

         {/* ─── Hero ─── */}
         <section className="relative overflow-hidden pt-20 pb-16 px-4">
            {/* 배경 글로우 */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.08),transparent_50%)] pointer-events-none" />

            <div className="relative container mx-auto max-w-4xl text-center">

               {/* 아이콘 */}
               <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl">
                     <Code2 className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                  </div>
               </div>

               <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-linear-to-r from-slate-900 via-indigo-600 to-cyan-600 dark:from-white dark:via-indigo-200 dark:to-cyan-200 bg-clip-text text-transparent">
                  SC Dev Team
               </h1>
               <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed whitespace-nowrap">
                  서울과학기술대학교 컴퓨터공학과 학생회 홈페이지를 함께 만든 개발팀입니다.
               </p>
            </div>
         </section>

         {/* ─── Project Effort Stats ─── */}
         <section className="px-4 pb-14">
            <div className="container mx-auto max-w-4xl">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                     { icon: Calendar, value: '3개월', label: '개발 기간', detail: '2025.12 – 2026.03', color: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
                     { icon: GitFork, value: '583+', label: '커밋', detail: '4명의 개발자', color: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
                     { icon: FileCode2, value: '40,000+', label: '코드 라인', detail: '254개 소스 파일', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                     { icon: Flame, value: '34', label: '구현 기능', detail: '38개 페이지', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                  ].map(({ icon: Icon, value, label, detail, color, bg }) => (
                     <div
                        key={label}
                        className={`relative overflow-hidden rounded-2xl border p-4 text-center transition-colors hover:border-opacity-50 ${bg}`}
                     >
                        {/* 배경 글로우 */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_70%)] pointer-events-none" />
                        <Icon size={18} className={`mx-auto mb-2 ${color}`} />
                        <p className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-0.5">{value}</p>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{label}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{detail}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* ─── Developer Cards (4열 균등 배치) ─── */}
         <section className="px-4 pb-16">
            <div className="container mx-auto max-w-5xl">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {DEVELOPERS.map(dev => (
                     <DeveloperCard key={dev.name} dev={dev} profile={profiles[dev.name]} />
                  ))}
               </div>
            </div>
         </section>

         {/* ─── Tech Stack Bento ─── */}
         <section className="px-4 pb-16">
            <div className="container mx-auto max-w-5xl">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Frontend */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-cyan-500/30 transition-colors group">
                     <div className="flex items-center gap-2 mb-4">
                        <Monitor size={16} className="text-cyan-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Frontend</h3>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {['React 19', 'TypeScript', 'Vite', 'TanStack Router', 'TanStack Query', 'Zustand', 'Tailwind CSS v4', 'React Hook Form', 'Zod', 'Framer Motion', 'Axios', 'Recharts'].map(item => (
                           <span key={item} className="px-2.5 py-1 text-xs rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20">
                              {item}
                           </span>
                        ))}
                     </div>
                  </div>

                  {/* Backend */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-blue-500/30 transition-colors group">
                     <div className="flex items-center gap-2 mb-4">
                        <Server size={16} className="text-blue-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Backend</h3>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {['FastAPI', 'Python 3.12', 'Supabase', 'PostgreSQL', 'Pydantic v2', 'JWT Auth', 'SlowAPI', 'Gmail API', 'Google Sheets API', 'Boto3', 'HTTPX', 'BeautifulSoup4'].map(item => (
                           <span key={item} className="px-2.5 py-1 text-xs rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
                              {item}
                           </span>
                        ))}
                     </div>
                  </div>

                  {/* Infrastructure */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-violet-500/30 transition-colors group">
                     <div className="flex items-center gap-2 mb-4">
                        <Globe size={16} className="text-violet-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Infrastructure</h3>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {['Fly.io', 'Vercel', 'Docker', 'Cloudflare R2', 'Cloudflare Turnstile', 'Supabase Auth', 'Supabase Storage'].map(item => (
                           <span key={item} className="px-2.5 py-1 text-xs rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20">
                              {item}
                           </span>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* ─── Feature Showcase ─── */}
         <section className="px-4 pb-16">
            <div className="container mx-auto max-w-5xl">
               {/* 섹션 헤더 */}
               <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">구현한 기능들</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">38개 페이지 · 100+ API 엔드포인트 · 14개 DB 테이블</p>
                  {/* 담당자 범례 */}
                  <div className="inline-flex flex-wrap items-center justify-center gap-2">
                     {[
                        { name: '이재호', c: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20' },
                        { name: '최도현', c: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20' },
                        { name: '이준석', c: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' },
                        { name: '황정민', c: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20' },
                     ].map(({ name, c }) => (
                        <span key={name} className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border font-medium ${c}`}>
                           <span className="w-1.5 h-1.5 rounded-full bg-current" />
                           {name}
                        </span>
                     ))}
                  </div>
               </div>

               <div className="space-y-5">
                  {/* ── 인증 · 계정 ── */}
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, #7c3aed, #4f46e5)' }} />
                        <Shield size={16} className="text-violet-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">인증 · 계정</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <FeatureItem title="로그인" desc="Turnstile 봇 방지 · Rate Limiting · 아이디 기억 · 로그인 차단 타이머" dev="이재호" />
                        <FeatureItem title="회원가입" desc="2단계 가입 플로우 · 학번 중복확인 · 학교 이메일 인증 · Zod 실시간 검증" dev="이재호" />
                        <FeatureItem title="비밀번호 재설정" desc="3단계 절차 (학번→인증번호→재설정) · 이메일 마스킹 · Turnstile" dev="이재호" />
                        <FeatureItem title="마이페이지" desc="프로필 조회·수정 · 이메일·전화번호 변경 · 학생증 인증 업로드 · 내 행사 내역 · 회원 탈퇴" dev="이준석" />
                     </div>
                  </div>

                  {/* ── 콘텐츠 · 정보 ── */}
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, #3b82f6, #06b6d4)' }} />
                        <Bell size={16} className="text-blue-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">콘텐츠 · 정보</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        <FeatureItem title="메인 홈" desc="배너 슬라이더 · 진행 중 활동 · 최신 공지사항 · 학교 포탈 바로가기" dev="이재호" />
                        <FeatureItem title="공지사항" desc="게시판 분류 · 7개 카테고리 필터 · 검색 · 정렬 · 페이지네이션 · 첨부파일" dev="이재호" />
                        <FeatureItem title="학생회 소개" desc="학생회 임원·비전·활동 소개 이미지 갤러리" dev="황정민" />
                        <FeatureItem title="동아리" desc="동아리 카드 목록 · 카테고리 필터 · 상세 모달 · 이미지 갤러리" dev="이준석" />
                        <FeatureItem title="개발자 소개" desc="개발팀 프로필 · GitHub API 연동 · 기술 스택 · 기능 소개" dev="이재호" />
                        <FeatureItem title="시스템 페이지" desc="404 · 에러 바운더리 · 서버 점검 안내" dev="이재호" />
                     </div>
                  </div>

                  {/* ── 서비스 ── */}
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, #06b6d4, #10b981)' }} />
                        <CalendarCheck size={16} className="text-cyan-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">서비스</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        <FeatureItem title="활동 목록" desc="행사·설문·카톡 통합 · 상태·유형 필터 · 상세 모달 · 실시간 Supabase 구독" dev="이재호" />
                        <FeatureItem title="출석 체크" desc="학번 입력→이름 확인→출석 인증 플로우" dev="이준석" />
                        <FeatureItem title="건의사항" desc="건의 작성·조회 · 상태 필터 · Turnstile 봇 방지 · 페이지네이션" dev="이준석" />
                        <FeatureItem title="복지 서비스" desc="대여사업 · 사물함 배치도 · 프린터 안내 · 신입생 가이드북" dev="이준석" />
                        <FeatureItem title="통합 검색" desc="공지·활동·동아리 통합 검색 · 결과 캐싱" dev="이재호" />
                        <FeatureItem title="정책 페이지" desc="이용약관 · 개인정보처리방침 · 비회원 개인정보 규정" dev="학생회" />
                     </div>
                  </div>

                  {/* ── 관리자 시스템 ── */}
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, #6366f1, #8b5cf6)' }} />
                        <Users size={16} className="text-indigo-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">관리자 시스템</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">ADMIN</span>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        <FeatureItem title="회원 관리 대시보드" desc="대기·승인·반려·차단 회원 탭 · 통계 카드 · 가입 승인·반려 · 학생증 미리보기" dev="이준석" />
                        <FeatureItem title="공지사항 관리" desc="공지 목록·작성·수정 · 게시판·카테고리 필터 · 일괄 선택·삭제 · 첨부파일 업로드" dev="이재호" />
                        <FeatureItem title="행사 관리" desc="행사 CRUD · 신청자 목록·승인·반려 · 출석 관리·QR코드 · 통계 · 엑셀 다운로드" dev="이재호" />
                        <FeatureItem title="설문조사 관리" desc="설문 CRUD · 응답 분석 차트 · 승인·반려 · 엑셀 다운로드" dev="이재호" />
                        <FeatureItem title="카카오톡 관리" desc="오픈채팅방 초대 활동 CRUD · 신청자 상태 관리 (대기·초대완료·반려)" dev="이재호" />
                        <FeatureItem title="활동 관리" desc="행사·설문·카톡 통합 관리 · 테이블/카드 뷰 · 커스텀 폼 필드 · 이미지 관리" dev="이재호" />
                        <FeatureItem title="건의사항 관리" desc="전체 건의 목록 · 상태별 통계 · 상태 변경 (접수→처리중→승인/반려) · 답변 작성" dev="이준석" />
                        <FeatureItem title="복지 관리" desc="대여물품 재고 관리 · 사물함 신청 기간·URL 설정 · 프린터·가이드북 관리" dev="이준석" />
                        <FeatureItem title="동아리 관리" desc="동아리 CRUD · 썸네일·소개 이미지 업로드 · 표시 순서 변경" dev="이준석" />
                        <FeatureItem title="학생회 소개 관리" desc="소개 이미지 CRUD · 표시 순서 변경 · 활성화 토글" dev="황정민" />
                        <FeatureItem title="프로필 변경 요청" desc="회원 프로필 변경 요청 목록 · 승인·반려 · 인증 이미지 미리보기" dev="이준석" />
                        <FeatureItem title="시스템 매뉴얼" desc="사용자·관리자·프론트엔드·백엔드 4종 가이드 문서" dev="이재호" />
                     </div>
                  </div>

                  {/* ── 백엔드 · 인프라 ── */}
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, #2563eb, #0891b2)' }} />
                        <Server size={16} className="text-blue-400" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">백엔드 · 인프라</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/20">API</span>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        <FeatureItem title="REST API 설계·구현" desc="10+ 라우트 모듈 · 100+ 엔드포인트 · Pydantic v2 스키마 검증 · OpenAPI 문서화" dev="최도현" />
                        <FeatureItem title="인증·인가 시스템" desc="JWT 토큰 발급·갱신 · RBAC 4단계 권한 · 중복 로그인 방지" dev="최도현" />
                        <FeatureItem title="이메일 인증" desc="Gmail API OAuth2 · 6자리 인증번호 발송·검증 · 일일 300건 한도 관리" dev="최도현" />
                        <FeatureItem title="파일 스토리지" desc="Cloudflare R2 5개 버킷 · Presigned URL 업로드 · Supabase Storage · 확장자·MIME·크기 검증" dev="최도현" />
                        <FeatureItem title="로그인 보안" desc="로그인 시도 기록 · 실패 횟수 추적 · 임시·영구 차단 (15회 초과 시)" dev="최도현" />
                        <FeatureItem title="DB 설계" desc="14개 테이블 · PostgreSQL · 마이그레이션 스크립트 관리" dev="최도현" />
                        <FeatureItem title="외부 서비스 연동" desc="Google Sheets API (재고 조회) · Cloudflare Turnstile (봇 방지) · Gmail API" dev="최도현" />
                        <FeatureItem title="인프라 운영" desc="Fly.io 도쿄 리전 배포 · Docker 컨테이너화 · Vercel 프론트엔드 호스팅" dev="최도현" />
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* Footer */}
         <div className="pb-12 text-center">
            <p className="text-slate-600 text-sm">
               © 2025 SC Dev Team · 서울과학기술대학교 컴퓨터공학과 학생회
            </p>
         </div>
      </div>
   )
}
