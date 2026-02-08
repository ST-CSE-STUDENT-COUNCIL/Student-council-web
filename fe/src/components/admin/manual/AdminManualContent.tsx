import { Server, Database, Code, Shield, Terminal, Layout, Monitor, BookOpen, Code2, Megaphone, Calendar, Users, MessageSquare, AlertTriangle, CheckSquare, Cloud, FileText, Key, Paintbrush } from 'lucide-react'

interface AdminManualContentProps {
    activePart: 'usage' | 'frontend' | 'backend'
}

export const AdminManualContent = ({ activePart }: AdminManualContentProps) => {
    return (
        <div className="flex-1 min-w-0 pr-0 xl:pr-8 pb-20">
            <div className="prose prose-slate dark:prose-invert max-w-none">

                {/* PART 1. 학생회 운영 가이드 */}
                {activePart === 'usage' && (
                    <>
                        {/* 1. 시스템 개요 */}
                        <section id="intro" className="scroll-mt-24 mb-16">
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 pb-2 border-b border-gray-200 dark:border-slate-800">
                                1. 시스템 개요
                            </h1>
                            <p className="lead text-lg text-gray-600 dark:text-gray-400">
                                본 학생회 관리 시스템은 서울과학기술대학교 컴퓨터공학과 학생회 활동의 효율적인 관리와 학우들과의 소통을 위해 제작되었습니다.<br />
                                프론트엔드와 백엔드가 분리된 모던 웹 아키텍처를 따르며, 클라우드 서비스를 적극 활용하여 유지보수 편의성을 높였습니다.
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm mt-4">
                                <strong>연락처:</strong> 전산팀장 (ehgis2344@seoultech.ac.kr)
                            </div>
                        </section>

                        <div className="flex items-center gap-3 mb-8 pb-2 border-b-2 border-blue-600 dark:border-blue-400">
                            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-2xl font-black text-blue-900 dark:text-blue-100 m-0">
                                PART 1. 학생회 운영 가이드
                            </h2>
                        </div>

                        {/* 2. 사용자 페이지 구조 */}
                        <section id="user-interface" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <Monitor className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                2. 사용자 페이지 구조
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                일반 학우들이 접속하는 페이지입니다. 주요 기능은 정보 확인 및 신청입니다.
                            </p>

                            <h3 className="text-xl font-semibold mt-4 mb-2">2.1. 메인 레이아웃</h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                <li><strong>Header:</strong> 로고, 네비게이션 메뉴(소개, 공지, 행사 등), 로그인/마이페이지 버튼이 위치합니다.</li>
                                <li><strong>Footer:</strong> 학생회 정보, 관련 사이트 링크, 저작권 표시가 있습니다.</li>
                            </ul>

                            <h3 className="text-xl font-semibold mt-4 mb-2">2.2. 주요 메뉴</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                                    <h4 className="font-bold mb-2">📢 공지사항 (Notices)</h4>
                                    <p className="text-sm">학생회의 공식 알림을 확인합니다. 학사, 일반, 제휴 혜택 등으로 카테고리가 나뉩니다.</p>
                                </div>
                                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                                    <h4 className="font-bold mb-2">📅 행사/사업 (Activities)</h4>
                                    <p className="text-sm">진행 중인 행사에 참여 신청하거나, 설문조사에 응답할 수 있습니다. 실시간으로 신청 인원을 확인할 수 있습니다.</p>
                                </div>
                                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                                    <h4 className="font-bold mb-2">🎁 복지사업 (Welfare)</h4>
                                    <p className="text-sm">우산/보조배터리 대여, 사물함 신청 등 복지 혜택을 이용할 수 있는 페이지입니다. 대여 현황은 구글 시트와 연동될 수 있습니다.</p>
                                </div>
                                <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                                    <h4 className="font-bold mb-2">👤 마이페이지 (My Page)</h4>
                                    <p className="text-sm">내 정보 관리, 학생회비 납부 내역 확인, 행사 신청 내역 조회 및 취소가 가능합니다.</p>
                                </div>
                            </div>
                        </section>

                        {/* 3. 관리자 페이지 구조 */}
                        <section id="admin-interface" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <Layout className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                                </div>
                                3. 관리자 페이지 구조
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                학생회 임원들만 접근 가능한 페이지입니다. <strong>Footer가 보이지 않는 것이 정상</strong>이며, 좌측 사이드바를 통해 네비게이션합니다.
                            </p>

                            <h3 className="text-xl font-semibold mt-4 mb-2">3.1. 대시보드 (Dashboard)</h3>
                            <p className="text-gray-700 dark:text-gray-300">
                                접속 시 가장 먼저 보이는 화면으로, 현재 진행 중인 행사 현황, 미처리된 승인 요청 건수 등 주요 지표를 한눈에 볼 수 있습니다.
                            </p>

                            <h3 className="text-xl font-semibold mt-4 mb-2">3.2. 사이드바 메뉴</h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                <li>상단에는 주요 관리 기능(프로필, 회장 정보 등)이 위치합니다.</li>
                                <li>하단에는 컨텐츠 관리 기능(공지, 행사, 복지 등)이 위치합니다.</li>
                            </ul>
                        </section>

                        {/* 4. 관리자 기능 상세 가이드 */}
                        <section id="feature-details" className="scroll-mt-24 mb-20">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                4. 관리자 기능 상세 가이드
                            </h2>
                            <div className="space-y-8">
                                {/* 공지사항 관리 */}
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-3">
                                        <Megaphone className="w-5 h-5 text-blue-500" />
                                        공지사항 관리
                                    </h3>
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
                                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                            <li><strong>작성:</strong> 제목, 내용, 태그(일반/학사/장학 등)를 설정하여 공지를 등록합니다.</li>
                                            <li><strong>상단 고정:</strong> 중요한 공지는 '상단 고정' 체크박스를 통해 목록 최상단에 노출할 수 있습니다.</li>
                                            <li><span className="text-red-500 font-bold">주의:</span> 공지를 삭제하면 복구할 수 없으므로 신중해야 합니다. 수정 기능을 활용하세요.</li>
                                        </ul>
                                    </div>
                                </div>
                                {/* 행사/사업 관리 */}
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-3">
                                        <Calendar className="w-5 h-5 text-green-500" />
                                        행사·공지 신청 관리
                                    </h3>
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                            가장 복잡하고 중요한 기능입니다. 3가지 타입(행사, 설문, 모집) 중 하나를 선택하여 생성합니다.
                                        </p>
                                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                            <li><strong>신청 기간 설정:</strong> 시작일과 종료일을 정확히 설정해야 합니다. 설정된 기간 외에는 신청 버튼이 비활성화됩니다.</li>
                                            <li><strong>설문 폼 빌더:</strong> 객관식, 주관식, 체크박스 등 다양한 질문을 추가할 수 있습니다.</li>
                                            <li><strong>신청자 관리:</strong> 신청자 목록을 엑셀(CSV)로 다운로드하거나, 특정 신청을 취소 처리할 수 있습니다.</li>
                                        </ul>
                                    </div>
                                </div>
                                {/* 프로필 변경 요청 */}
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-3">
                                        <Users className="w-5 h-5 text-purple-500" />
                                        프로필 변경 요청 관리
                                    </h3>
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            학적 변동(전과 등)이나 개명으로 인해 학우들이 정보 변경을 요청하면 이곳에 표시됩니다.
                                            증빙 자료(이미지)를 확인 후 <strong>승인</strong> 또는 <strong>반려</strong> 처리해야 합니다.
                                        </p>
                                    </div>
                                </div>
                                {/* 건의함 관리 */}
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-3">
                                        <MessageSquare className="w-5 h-5 text-orange-500" />
                                        건의함 관리
                                    </h3>
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            익명으로 접수된 학우들의 건의사항을 확인합니다.
                                            답변이 필요한 경우, 별도의 소통 채널(카카오톡 채널 등)을 통해 공지하거나 답변해야 합니다.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {/* PART 2. 프론트엔드 가이드 */}
                {activePart === 'frontend' && (
                    <>
                        <div className="flex items-center gap-3 mb-8 pb-2 border-b-2 border-pink-600 dark:border-pink-400">
                            <Paintbrush className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                            <h2 className="text-2xl font-black text-pink-900 dark:text-pink-100 m-0">
                                PART 2. 프론트엔드 가이드
                            </h2>
                        </div>

                        {/* 1. 프로젝트 구조 */}
                        <section id="fe-structure" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                    <Paintbrush className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                                </div>
                                1. 프로젝트 구조 (File-system Routing)
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                TanStack Router를 사용하여 <code>src/routes</code> 폴더 구조가 곧 URL 경로가 됩니다.
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 mb-6">
                                <li><code>__root.tsx</code>: 최상위 레이아웃 (Header, Footer 포함)</li>
                                <li><code>index.tsx</code>: 메인 페이지 (/)</li>
                                <li><code>_main.tsx</code>: 메인 서비스 레이아웃 그룹</li>
                                <li><code>admin.tsx</code>: 관리자 페이지 레이아웃 (Sidebar 포함)</li>
                            </ul>
                        </section>

                        {/* 2. 주요 디렉토리 */}
                        <section id="fe-directories" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                2. 주요 디렉토리
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="border border-gray-200 dark:border-slate-700 p-3 rounded-lg">
                                    <code className="font-bold text-blue-600">src/components</code>
                                    <p className="text-xs text-gray-500 mt-1">재사용 가능한 UI 컴포넌트 (`common`, `ui` 등)</p>
                                </div>
                                <div className="border border-gray-200 dark:border-slate-700 p-3 rounded-lg">
                                    <code className="font-bold text-blue-600">src/hooks</code>
                                    <p className="text-xs text-gray-500 mt-1">커스텀 훅 (비즈니스 로직 분리)</p>
                                </div>
                                <div className="border border-gray-200 dark:border-slate-700 p-3 rounded-lg">
                                    <code className="font-bold text-blue-600">src/lib/api</code>
                                    <p className="text-xs text-gray-500 mt-1">Backend API 호출 함수 모음</p>
                                </div>
                                <div className="border border-gray-200 dark:border-slate-700 p-3 rounded-lg">
                                    <code className="font-bold text-blue-600">src/store</code>
                                    <p className="text-xs text-gray-500 mt-1">전역 상태 관리 (Zustand)</p>
                                </div>
                            </div>
                        </section>

                        {/* 3. 개발 및 빌드 */}
                        <section id="fe-build" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                    <Terminal className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                3. 개발 및 빌드
                            </h2>
                            <code className="block bg-gray-900 text-gray-100 p-4 rounded-md text-sm font-mono overflow-x-auto whitespace-pre">
                                {`# 개발 서버 실행
npm run dev

# 프로덕션 빌드 (dist 폴더 생성)
npm run build

# 프리뷰 (빌드 결과물 확인)
npm run preview`}
                            </code>
                        </section>
                    </>
                )}

                {/* PART 3. 백엔드 가이드 */}
                {activePart === 'backend' && (
                    <>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800 mb-8 text-sm">
                            <h3 className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100 mb-2">
                                <FileText className="w-4 h-4" />
                                문서 정보
                            </h3>
                            <p className="text-amber-800 dark:text-amber-200">
                                최종 업데이트: 2026년 2월<br />
                                연락처: ehgis2344@seoultech.ac.kr (전산팀장)<br />
                                ℹ️ 이 문서는 백엔드 코드 없이 웹 대시보드만으로 운영하는 것을 기준으로 작성되었습니다.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 mb-8 pb-2 border-b-2 border-purple-600 dark:border-purple-400">
                            <Code2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            <h2 className="text-2xl font-black text-purple-900 dark:text-purple-100 m-0">
                                PART 3. 백엔드 가이드
                            </h2>
                        </div>

                        {/* 1. 기술 스택 및 아키텍처 */}
                        <section id="tech-stack" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Code className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                1. 기술 스택 및 아키텍처
                            </h2>

                            <h3 className="text-xl font-semibold mt-4 mb-2">1.1 기술 스택</h3>
                            <div className="overflow-x-auto mb-6">
                                <table className="min-w-full text-left text-sm whitespace-nowrap">
                                    <thead className="uppercase tracking-wider border-b-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-6 py-4">구분</th>
                                            <th className="px-6 py-4">기술</th>
                                            <th className="px-6 py-4">비고</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                        <tr>
                                            <td className="px-6 py-4 font-bold">런타임</td>
                                            <td className="px-6 py-4">Python 3.12</td>
                                            <td className="px-6 py-4">FastAPI 프레임워크</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-bold">DB</td>
                                            <td className="px-6 py-4">Supabase (PostgreSQL)</td>
                                            <td className="px-6 py-4">리전: ap-northeast-2 (서울)</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-bold">인증</td>
                                            <td className="px-6 py-4">Supabase Auth</td>
                                            <td className="px-6 py-4">JWT 토큰 기반</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-bold">스토리지</td>
                                            <td className="px-6 py-4">Cloudflare R2 + Supabase</td>
                                            <td className="px-6 py-4">용도별 분리</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-bold">호스팅</td>
                                            <td className="px-6 py-4">Fly.io</td>
                                            <td className="px-6 py-4">리전: nrt (도쿄), Docker</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 font-bold">이메일</td>
                                            <td className="px-6 py-4">Gmail API (OAuth 2.0)</td>
                                            <td className="px-6 py-4">인증번호 발송</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <h3 className="text-xl font-semibold mt-4 mb-2">1.2 아키텍처 흐름</h3>
                            <code className="block bg-gray-900 text-gray-100 p-4 rounded-md text-sm font-mono overflow-x-auto whitespace-pre mb-6">
                                {`[프론트엔드 (Vercel)]
        │
        ▼
[Fly.io - FastAPI 서버 (도쿄)]
        │
        ├──▶ Supabase DB (서울) ─── PostgreSQL + Auth
        ├──▶ Cloudflare R2 ─────── 파일 스토리지 (Presigned URL)
        ├──▶ Supabase Storage ──── 학적 인증 이미지 (private)
        ├──▶ Gmail API ─────────── 이메일 발송
        ├──▶ Google Sheets API ─── 대여 물품 재고
        └──▶ Cloudflare Turnstile ─ CAPTCHA 검증`}
                            </code>

                            <h3 className="text-xl font-semibold mt-4 mb-2">1.3 API 라우트 구조</h3>
                            <ul className="list-none space-y-2 text-sm">
                                <li className="flex gap-2"><span className="font-bold text-green-600">공개</span> <code>/</code>, <code>/docs</code>, <code>/signup</code>, <code>/clubs</code>, <code>/send-verification</code></li>
                                <li className="flex gap-2"><span className="font-bold text-blue-600">인증</span> <code>/notices</code>, <code>/activities</code>, <code>/suggestions</code>, <code>/welfare</code></li>
                                <li className="flex gap-2"><span className="font-bold text-red-600">관리자</span> <code>/admin/pending-users</code>, <code>/admin/notices</code>, <code>/admin/activities</code>, <code>/admin/users</code></li>
                            </ul>
                        </section>

                        {/* 2. 환경 변수 관리 */}
                        <section id="env-vars" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                    <Terminal className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                2. 환경 변수 관리
                            </h2>

                            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-md text-sm mb-4 border border-yellow-200 dark:border-yellow-800">
                                <strong>⚠️ 중요:</strong> Secret을 변경하면 서버가 자동으로 재시작됩니다. 관리 페이지: <a href="https://fly.io/dashboard" target="_blank" className="underline">Fly.io Dashboard</a>
                            </div>

                            <table className="min-w-full text-left text-sm whitespace-nowrap mb-6 border-collapse">
                                <thead className="bg-gray-50 dark:bg-slate-800 border-b dark:border-slate-700">
                                    <tr>
                                        <th className="px-4 py-2">카테고리</th>
                                        <th className="px-4 py-2">변수명</th>
                                        <th className="px-4 py-2">설명</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    <tr>
                                        <td className="px-4 py-2 font-bold" rowSpan={3}>Supabase</td>
                                        <td className="px-4 py-2 text-red-600 font-mono">SUPABASE_URL</td>
                                        <td className="px-4 py-2">프로젝트 URL</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 text-red-600 font-mono">SUPABASE_KEY</td>
                                        <td className="px-4 py-2">Service Role Key (서버 전용)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 font-mono">SUPABASE_ANON_KEY</td>
                                        <td className="px-4 py-2">Anon Key</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 font-bold" rowSpan={3}>Gmail API</td>
                                        <td className="px-4 py-2 font-mono">GOOGLE_CLIENT_ID</td>
                                        <td className="px-4 py-2">OAuth ID</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 text-red-600 font-mono">GOOGLE_REFRESH_TOKEN</td>
                                        <td className="px-4 py-2">OAuth Refresh Token (주기적 갱신 필수)</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 font-mono">GMAIL_FROM_EMAIL</td>
                                        <td className="px-4 py-2">발신자 이메일</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 font-bold">R2</td>
                                        <td className="px-4 py-2 font-mono">R2_ACCESS_KEY_ID</td>
                                        <td className="px-4 py-2">Cloudflare R2 API Key</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* 3. 서버 관리 (Fly.io) + 모니터링 */}
                        <section id="server" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <Server className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                3. 서버 관리 (Fly.io)
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                                    <h4 className="font-bold mb-2">기본 정보</h4>
                                    <ul className="text-sm space-y-1">
                                        <li><strong>앱 이름:</strong> `seoultech-cse-backend`</li>
                                        <li><strong>리전:</strong> nrt (도쿄)</li>
                                        <li><strong>스펙:</strong> shared CPU 1x, 512MB RAM</li>
                                        <li><strong>최소 머신:</strong> 1 (상시 가동)</li>
                                    </ul>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                                    <h4 className="font-bold mb-2">모니터링 & 로그</h4>
                                    <ul className="text-sm space-y-1">
                                        <li><strong>Dashboard:</strong> <a href="https://fly.io/dashboard" target="_blank" className="text-blue-600 hover:underline">바로가기</a></li>
                                        <li><strong>Logs:</strong> Dashboard 👉 Logs & Errors</li>
                                        <li><strong>재시작:</strong> Dashboard 👉 Machines 👉 Restart</li>
                                    </ul>
                                </div>
                            </div>

                            <h3 className="text-xl font-semibold mt-4 mb-2">로그 필터링 가이드</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                <li><code>[API ERROR]</code>: API 핸들러 에러</li>
                                <li><code>[CLEANUP]</code>: Draft 자동 정리 로그</li>
                                <li><code>[STARTUP]</code>: 서버 시작 워밍업 완료</li>
                                <li><code>429</code>: Rate Limit 초과 (정상)</li>
                            </ul>
                        </section>

                        {/* 4. 데이터베이스 (Supabase) + 관리자 계정 */}
                        <section id="database" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                4. 데이터베이스 (Supabase)
                            </h2>

                            <h3 className="text-xl font-semibold mt-4 mb-2">4.1 주요 테이블 구조</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                                <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-center text-sm font-bold">users</div>
                                <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-center text-sm">activities</div>
                                <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-center text-sm">posts</div>
                                <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-center text-sm">suggestions</div>
                                <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-center text-sm">registrations</div>
                                <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded text-center text-sm">rental_items</div>
                            </div>

                            <h3 className="text-xl font-semibold mt-4 mb-2">4.2 관리자 승격 (SQL)</h3>
                            <p className="text-sm mb-2">홈페이지 가입 후 Supabase SQL Editor에서 아래 명령어를 실행하여 관리자로 승격시킵니다.</p>
                            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                                {`-- 학번으로 관리자 승격
UPDATE users SET role = 'admin' WHERE student_id = '학번';

-- 현재 관리자 목록 확인
SELECT name, student_id, email, role FROM users WHERE role = 'admin';`}
                            </pre>

                            <h3 className="text-xl font-semibold mt-6 mb-2">4.3 유지보수 쿼리 모음</h3>
                            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                                {`-- 만료된 인증 코드 정리
DELETE FROM email_verifications WHERE expires_at < NOW();

-- 고아 Draft 게시글 정리 (1일 이상)
DELETE FROM posts WHERE is_draft = true AND created_at < NOW() - INTERVAL '1 day';

-- 활동 신청 인원 수 보정 (불일치 시)
UPDATE activities SET current_count = (
  SELECT COUNT(*) FROM activity_registrations WHERE activity_id = activities.id
);`}
                            </pre>
                        </section>

                        {/* 5. 스토리지 관리 */}
                        <section id="storage" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <Cloud className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                5. 스토리지 관리
                            </h2>
                            <div className="flex flex-col gap-4">
                                <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
                                    <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">Cloudflare R2 (Public)</h3>
                                    <p className="text-sm mb-2">일반 이미지용. Presigned URL을 사용하여 프론트엔드에서 직접 업로드합니다.</p>
                                    <ul className="text-xs list-disc list-inside text-gray-600 dark:text-gray-400">
                                        <li><code>club-images</code></li>
                                        <li><code>event-images</code></li>
                                        <li><code>post-attachments</code></li>
                                    </ul>
                                </div>
                                <div className="border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Supabase Storage (Private)</h3>
                                    <p className="text-sm mb-2">보안이 필요한 파일용. 관리자만 접근 가능합니다.</p>
                                    <ul className="text-xs list-disc list-inside text-gray-600 dark:text-gray-400">
                                        <li><code>verification-images</code> (학적 인증용)</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 6. 인증 및 보안 */}
                        <section id="auth-security" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                6. 인증 및 보안
                            </h2>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                <li><strong>이메일 제한:</strong> <code>@seoultech.ac.kr</code> 도메인만 가입 허용</li>
                                <li><strong>CAPTCHA:</strong> Cloudflare Turnstile (회원가입/로그인 시)</li>
                                <li><strong>로그인 차단:</strong>
                                    <ul className="pl-6 list-[circle] text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        <li>5회 실패 → 10분 차단</li>
                                        <li>10회 실패 → 1시간 차단</li>
                                        <li>15회 실패 → 영구 차단 (관리자 해제 필요)</li>
                                    </ul>
                                </li>
                                <li><strong>Rate Limiting:</strong> 상습적인 과도한 요청 시 자동 차단 (HTTP 429)</li>
                            </ul>
                        </section>

                        {/* 7. 트러블슈팅 & FAQ */}
                        <section id="troubleshooting" className="scroll-mt-24 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                                </div>
                                7. 트러블슈팅 & FAQ
                            </h2>

                            <div className="space-y-6">
                                <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-xl border border-red-100 dark:border-red-900">
                                    <h3 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-3">
                                        <Key className="w-5 h-5" />
                                        Q. 인증 이메일이 안 와요! (Gmail Refresh Token 재발급)
                                    </h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                        <strong>원인:</strong> Gmail Refresh Token 만료.<br />
                                        <strong>해결:</strong> Google OAuth Playground에서 Refresh Token을 재발급받아야 합니다.
                                    </p>
                                    <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                        <li><a href="https://developers.google.com/oauthplayground" target="_blank" className="underline font-bold">OAuth Playground</a> 접속</li>
                                        <li>상단 톱니바퀴 ⚙️ → "Use your own OAuth credentials" 체크</li>
                                        <li>Client ID, Secret 입력 (Fly.io Secrets 값)</li>
                                        <li>API 목록에서 "Gmail API v1" 선택 후 Authorize</li>
                                        <li>"Exchange authorization code for tokens" 클릭</li>
                                        <li>새 Refresh Token을 Fly.io Secrets의 <code>GOOGLE_REFRESH_TOKEN</code>에 업데이트</li>
                                    </ol>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Q. 429 Too Many Requests 에러</h3>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                                        정상적인 Rate Limiting 동작입니다. 또는 중복 클릭 방지일 수 있습니다.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Q. Supabase 무료 플랜 멈춤</h3>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                                        1주일 미사용 시 자동 일시정지됩니다. Supabase Dashboard에서 "Restore" 버튼을 누르세요.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 8. 운영 체크리스트 */}
                        <section id="checklist" className="scroll-mt-24">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <CheckSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                8. 운영 체크리스트
                            </h2>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700">
                                <h3 className="font-bold mb-4 border-b pb-2 border-gray-100 dark:border-slate-700">⚠️ 금지 사항 (Do Not)</h3>
                                <ul className="space-y-2 text-sm text-red-600 dark:text-red-400 mb-6">
                                    <li className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>SUPABASE_KEY(Service Role) 외부 노출 절대 금지</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>프로덕션 DB에서 `reset.sql` 절대 실행 금지 (데이터 증발)</span>
                                    </li>
                                </ul>

                                <h3 className="font-bold mb-4 border-b pb-2 border-gray-100 dark:border-slate-700">학기 시작 전 체크</h3>
                                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded" /> 관리자 계정 권한 확인 및 비밀번호 변경
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded" /> Gmail Refresh Token 유효성 테스트 (회원가입 시도)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded" /> Supabase 프로젝트 상태 확인 (일시정지 여부)
                                    </li>
                                </ul>

                                <h3 className="font-bold mt-6 mb-4 border-b pb-2 border-gray-100 dark:border-slate-700">임기 교체 시 (인수인계)</h3>
                                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded" /> 관련 계정(Fly.io, Supabase, Cloudflare, Google) 소유권 이관
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded" /> 구 임원 계정 `admin` 권한 회수 (SQL UPDATE)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded" /> 이 문서(Manual) 최신화 여부 확인
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-8">
                                <h3 className="font-bold mb-2">관리자 링크 모음</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    <a href="https://fly.io/dashboard" target="_blank" className="p-3 border rounded text-center text-sm hover:bg-gray-50 dark:hover:bg-slate-800">Fly.io Dashboard</a>
                                    <a href="https://supabase.com/dashboard" target="_blank" className="p-3 border rounded text-center text-sm hover:bg-gray-50 dark:hover:bg-slate-800">Supabase Dashboard</a>
                                    <a href="https://dash.cloudflare.com" target="_blank" className="p-3 border rounded text-center text-sm hover:bg-gray-50 dark:hover:bg-slate-800">Cloudflare Dash</a>
                                    <a href="https://console.cloud.google.com" target="_blank" className="p-3 border rounded text-center text-sm hover:bg-gray-50 dark:hover:bg-slate-800">Google Cloud</a>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                <div className="mt-20 pt-10 border-t border-gray-200 dark:border-slate-800 text-center text-gray-400 text-sm">
                    <p>시스템 운영 매뉴얼 v3.0 (2026.02)</p>
                    <p>문의: 전산팀장</p>
                </div>
            </div>
        </div>
    )
}
