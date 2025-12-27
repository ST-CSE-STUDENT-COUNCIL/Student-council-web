import { createFileRoute, Link } from '@tanstack/react-router'

import { useAuthStore } from '../store/useAuthStore'

import React from 'react'

  

export const Route = createFileRoute('/mypage')({

component: MyPage,

})

  

function MyPage() {

const { user, isAuthenticated, logout } = useAuthStore()

  

// 로그인하지 않은 경우

if (!isAuthenticated || !user) {

return (

<div className="flex min-h-[calc(100vh-300px)] items-center justify-center px-4 py-12">

<div className="text-center">

<div className="text-6xl mb-4">🔒</div>

<h2 className="text-2xl font-bold text-gray-900 mb-2">

로그인이 필요한 페이지입니다

</h2>

<p className="text-gray-600 mb-6">

마이페이지를 이용하려면 로그인해주세요.

</p>

<Link

to="/login"

className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"

>

로그인하러 가기

</Link>

</div>

</div>

)

}

  

const upcomingEvents = [

{ title: '학생회 MT', date: '2025.01.15', status: '신청 완료' },

{ title: '동아리 박람회', date: '2025.02.02', status: '입금 대기' },

{ title: '신입생 오리엔테이션', date: '2025.03.01', status: '접수 완료' },

]

  

const completedEvents = [

{ title: '가을 체육대회', date: '2024.10.12' },

{ title: '학과 네트워킹 데이', date: '2024.11.05' },

]

  

const welfareInfo = {

returnPeriod: '2025.01.20 ~ 2025.01.27',

itemName: '보조 배터리 (대여 중)',

lockerLocation: '학생회관 2층 A-12',

lockerPeriod: '2025.02.01까지',

verificationStatus: user.verification_status === 'pending' ? '가입 인증 대기' : '가입 인증 완료',

}

  

const [activeTab, setActiveTab] = React.useState<'info' | 'events' | 'welfare'>('info')

  

const sidebarItems = [

{ id: 'info', label: '내 정보' },

{ id: 'events', label: '행사' },

{ id: 'welfare', label: '복지사업' },

]

  

return (

<div className="max-w-6xl mx-auto px-4 py-8">

<h1 className="text-3xl font-bold text-gray-900 mb-8">마이페이지</h1>

  

<div className="flex flex-col lg:flex-row gap-6">

{/* 왼쪽 사이드바 */}

<aside className="w-full lg:w-64 flex-shrink-0">

{/* 프로필 카드 */}

<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">

<div className="flex flex-col items-center text-center">

<div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl mb-3">

🧑‍🎓

</div>

<h2 className="text-lg font-bold text-gray-900">{user.name}</h2>

<p className="text-sm text-gray-500 mb-4">{user.student_id}</p>

</div>

</div>

  

{/* 정보 요약 */}

<div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6 space-y-3 text-sm">

<InfoRow label="학생회비" value={getMembershipStatus(user)} />

<InfoRow label="가입 인증" value={getVerificationStatus(user)} />

</div>

  

{/* 요약 카드 */}

<div className="grid grid-cols-2 gap-3 mb-6">

<SummaryCard title="예정 행사" value={upcomingEvents.length} tone="blue" />

<SummaryCard title="완료 행사" value={completedEvents.length} tone="gray" />

</div>

  

{/* 메뉴 */}

<div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">

{sidebarItems.map((item) => (

<button

key={item.id}

onClick={() => setActiveTab(item.id as typeof activeTab)}

className={`w-full px-4 py-3 text-left font-medium text-sm transition ${

activeTab === item.id

? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'

: 'text-gray-700 hover:bg-gray-50'

}`}

>

{item.label}

</button>

))}

</div>

  

{/* 액션 버튼 */}

<div className="mt-6 space-y-2">

<button className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium text-sm">

내 정보 수정

</button>

<button

onClick={logout}

className="w-full py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition font-medium text-sm"

>

로그아웃

</button>

</div>

</aside>

  

{/* 오른쪽 콘텐츠 */}

<main className="flex-1 space-y-6">

{/* 내 정보 탭 */}

{activeTab === 'info' && (

<section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">

<h2 className="text-xl font-bold text-gray-900 mb-6">내 정보</h2>

<div className="space-y-4">

<div className="flex items-center justify-between py-3 border-b border-gray-100">

<span className="text-gray-600 font-medium">이름</span>

<span className="text-gray-900">{user.name}</span>

</div>

<div className="flex items-center justify-between py-3 border-b border-gray-100">

<span className="text-gray-600 font-medium">학번</span>

<span className="text-gray-900">{user.student_id}</span>

</div>

<div className="flex items-center justify-between py-3 border-b border-gray-100">

<span className="text-gray-600 font-medium">이메일</span>

<span className="text-gray-900">{user.email}</span>

</div>

<div className="flex items-center justify-between py-3 border-b border-gray-100">

<span className="text-gray-600 font-medium">학과</span>

<span className="text-gray-900">{user.department || '미등록'}</span>

</div>

<div className="flex items-center justify-between py-3 border-b border-gray-100">

<span className="text-gray-600 font-medium">학생회비</span>

<Badge tone={getMembershipStatus(user)} />

</div>

<div className="flex items-center justify-between py-3">

<span className="text-gray-600 font-medium">가입 인증</span>

<Badge tone={getVerificationStatus(user)} />

</div>

</div>

</section>

)}

  

{/* 행사 탭 */}

{activeTab === 'events' && (

<>

<section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">

<div className="flex justify-between items-center mb-6">

<h2 className="text-xl font-bold text-gray-900">내가 신청한 행사 (예정)</h2>

<Link to="/events" className="text-sm text-blue-600 hover:underline">

행사 보기

</Link>

</div>

<div className="grid md:grid-cols-2 gap-4">

{upcomingEvents.map((event) => (

<div key={event.title} className="border border-gray-100 rounded-lg p-4">

<div className="flex items-center justify-between mb-2">

<p className="text-sm text-gray-500">{event.date}</p>

<StatusPill status={event.status} />

</div>

<p className="font-semibold text-gray-900">{event.title}</p>

</div>

))}

{upcomingEvents.length === 0 && (

<p className="text-gray-400 text-center py-4 md:col-span-2">신청한 예정 행사가 없습니다.</p>

)}

</div>

</section>

  

<section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">

<div className="flex justify-between items-center mb-6">

<h2 className="text-xl font-bold text-gray-900">참여 완료한 행사</h2>

<Link to="/events" className="text-sm text-blue-600 hover:underline">

지난 행사 보기

</Link>

</div>

<div className="grid md:grid-cols-2 gap-4">

{completedEvents.map((event) => (

<div key={event.title} className="border border-gray-100 rounded-lg p-4">

<p className="text-sm text-gray-500 mb-1">{event.date}</p>

<p className="font-semibold text-gray-900">{event.title}</p>

</div>

))}

{completedEvents.length === 0 && (

<p className="text-gray-400 text-center py-4 md:col-span-2">참여 완료한 행사가 없습니다.</p>

)}

</div>

</section>

</>

)}

  

{/* 복지사업 탭 */}

{activeTab === 'welfare' && (

<section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">

<div className="flex justify-between items-center mb-6">

<h2 className="text-xl font-bold text-gray-900">복지사업</h2>

<Link to="/welfare" className="text-sm text-blue-600 hover:underline">

복지사업 보기

</Link>

</div>

<div className="grid md:grid-cols-2 gap-4">

<InfoCard title="물품 반납 기간" value={welfareInfo.returnPeriod} />

<InfoCard title="물품 여부" value={welfareInfo.itemName || '대여 없음'} />

<InfoCard title="내 사물함 위치" value={welfareInfo.lockerLocation} sub={welfareInfo.lockerPeriod} />

<InfoCard title="학생 가입 인증" value={welfareInfo.verificationStatus} />

</div>

</section>

)}

</main>

</div>

</div>

)

}

  

function InfoRow({ label, value }: { label: string; value: string }) {

return (

<div className="flex justify-between items-center text-sm bg-white border border-gray-200 rounded-lg px-3 py-2">

<span className="text-gray-600">{label}</span>

<span className="font-medium text-gray-900">{value}</span>

</div>

)

}

  

function SummaryCard({ title, value, tone }: { title: string; value: number; tone: 'blue' | 'gray' }) {

const colors = tone === 'blue' ? 'text-blue-600' : 'text-gray-700'

return (

<div className="bg-white p-4 rounded-xl border border-gray-200 text-center">

<div className={`text-2xl font-bold ${colors} mb-1`}>{value}</div>

<div className="text-xs text-gray-500">{title}</div>

</div>

)

}

  

function StatusPill({ status }: { status: string }) {

const colors: Record<string, string> = {

'신청 완료': 'bg-blue-100 text-blue-700',

'입금 대기': 'bg-yellow-100 text-yellow-700',

'접수 완료': 'bg-green-100 text-green-700',

}

  

const colorClass = colors[status] || 'bg-gray-100 text-gray-700'

  

return <span className={`${colorClass} px-3 py-1 rounded-full text-xs font-bold`}>{status}</span>

}

  

function Badge({ tone }: { tone: string }) {

const colorMap: Record<string, string> = {

확인중: 'bg-yellow-100 text-yellow-700',

납부: 'bg-green-100 text-green-700',

미납부: 'bg-red-100 text-red-700',

'인증 완료': 'bg-green-100 text-green-700',

'인증 대기': 'bg-yellow-100 text-yellow-700',

미인증: 'bg-red-100 text-red-700',

}

const cls = colorMap[tone] || 'bg-gray-100 text-gray-700'

return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>{tone}</span>

}

  

function InfoCard({ title, value, sub }: { title: string; value: string; sub?: string }) {

return (

<div className="border border-gray-100 rounded-xl p-4">

<p className="text-sm text-gray-500 mb-1">{title}</p>

<p className="font-semibold text-gray-900">{value}</p>

{sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}

</div>

)

}

  

function getMembershipStatus(user: { membership_paid: boolean; verification_status: string }) {

if (user.verification_status === 'pending') return '확인중'

if (user.membership_paid) return '납부'

return '미납부'

}

  

function getVerificationStatus(user: { verification_status: string }) {

if (user.verification_status === 'approved') return '인증 완료'

if (user.verification_status === 'pending') return '인증 대기'

return '미인증'

}