import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import {
    School,
    BookOpen,
    MonitorPlay,
    Building,
    Megaphone,
    ChevronRight,
    ChevronLeft,
    MonitorCheck,
    Flag,
    Phone,
    GraduationCap,
    Clock,
    Laptop,
    Instagram
} from 'lucide-react'
import { eventApi } from '../lib/api/events'
import { noticeApi } from '../lib/api/notices'
import type { Event } from '../types/events'
import type { Notice } from '../types/notices'
import { EventCard } from '../components/events/EventCard'

export const Route = createFileRoute('/')({
    component: Index,
})

const PORTALS = [
    { name: '학교 홈페이지', icon: School, url: 'https://www.seoultech.ac.kr/index.jsp', color: 'bg-blue-50 text-blue-600' },
    { name: '학과 홈페이지', icon: Laptop, url: 'https://computer.seoultech.ac.kr/', color: 'bg-slate-50 text-slate-600' },
    { name: 'SUIS', icon: MonitorCheck, url: 'https://suis.seoultech.ac.kr/nxui/index.html', color: 'bg-cyan-50 text-cyan-600' },
    { name: 'E-Class', icon: MonitorPlay, url: 'https://eclass.seoultech.ac.kr/ilos/main/main_form.acl', color: 'bg-cyan-50 text-cyan-600' },
    { name: '학생포탈', icon: GraduationCap, url: 'https://stportal.seoultech.ac.kr/', color: 'bg-indigo-50 text-indigo-600' },
    { name: '도서관', icon: BookOpen, url: 'https://library.seoultech.ac.kr/#/', color: 'bg-emerald-50 text-emerald-600' },
    { name: '생활관', icon: Building, url: 'https://domi.seoultech.ac.kr/', color: 'bg-orange-50 text-orange-600' },
    { name: '총학생회', icon: Flag, url: 'https://gwack2.seoultech.ac.kr/', color: 'bg-red-50 text-red-600' },
    { name: '교내연락', icon: Phone, url: 'https://www.seoultech.ac.kr/intro/campinfo/interph/', color: 'bg-green-50 text-green-600' },
    { name: '인스타그램', icon: Instagram, url: 'https://www.instagram.com/seoultech_com/', color: 'bg-pink-50 text-pink-600' },
]

const getSubCategoryLabel = (_main: string, sub: string) => {
    const labels: Record<string, string> = {
        'event': '행사', 'welfare': '복지', 'news': '학과소식',
        'announcement': '공고', 'notice': '고시', 'meeting': '대표자회의', 'rules': '학생회칙'
    };
    return labels[sub] || sub;
};

function Index() {
    const [events, setEvents] = useState<Event[]>([])
    const [notices, setNotices] = useState<Notice[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 병렬 데이터 패칭
                const [eventsData, noticesResponse] = await Promise.all([
                    eventApi.getAll(),
                    noticeApi.getAll({
                        page: 1,
                        page_size: 5,
                        sort: 'newest'
                    })
                ])

                // 행사 데이터 처리: 진행중/예정 -> ID 내림차순 정렬 -> 상위 5개
                const activeEvents = eventsData
                    .filter(e => e.status === 'active' || e.status === 'scheduled')
                    .sort((a, b) => b.id - a.id)
                    .slice(0, 5)

                // 공지사항 데이터 처리: 이미 서버에서 정렬 및 slicing 완료됨
                const sortedNotices = noticesResponse.notices

                setEvents(activeEvents)
                setNotices(sortedNotices)
            } catch (error) {
                console.error('Failed to fetch data', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen text-gray-500">
            데이터 불러오는중...
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* 1. 바로가기 섹션 */}
            <section className="bg-white px-5 pt-8 pb-10 rounded-b-[2.5rem] shadow-sm mb-10 transition-all duration-500 ease-in-out">
                <div className="max-w-4xl mx-auto">
                    {/* 환영 인사 헤더 */}
                    <div className="mb-8 px-1">
                        <h1 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">안녕하세요, 학우님! 👋</h1>
                        <p className="text-sm text-gray-500 font-medium">오늘도 즐거운 학교 생활 되세요.</p>
                    </div>

                    <div className="grid grid-cols-5 gap-y-6 gap-x-2">
                        {PORTALS.map((portal) => (
                            <a
                                key={portal.name}
                                href={portal.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 group cursor-pointer"
                            >
                                <div className={`p-3.5 rounded-2xl ${portal.color} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ring-1 ring-inset ring-black/5`}>
                                    <portal.icon size={24} strokeWidth={1.5} />
                                </div>
                                <span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-900 text-center tracking-tight">{portal.name}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* 2. 주요 행사 / 이벤트 슬라이더 섹션 */}
            <section className="px-4 mb-12 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        <h2 className="text-xl font-bold text-gray-900">지금 주목할 행사</h2>
                    </div>
                    <Link
                        to="/events"
                        className="text-xs font-medium text-gray-500 flex items-center gap-1 hover:text-blue-600 transition-colors bg-gray-100 px-3 py-1.5 rounded-full"
                    >
                        전체보기 <ChevronRight size={14} />
                    </Link>
                </div>

                <div className="relative group">
                    <Swiper
                        modules={[Autoplay, Pagination, Navigation]}
                        navigation={{
                            nextEl: '.swiper-button-next-custom',
                            prevEl: '.swiper-button-prev-custom',
                        }}
                        pagination={{
                            clickable: true,
                            dynamicBullets: true
                        }}
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                        }}
                        spaceBetween={20}
                        slidesPerView={1}
                        className="pb-10"
                    >
                        {events.map((event) => (
                            <SwiperSlide key={event.id} className="pt-2 pb-8 px-1">
                                <EventCard event={event} />
                            </SwiperSlide>
                        ))}
                        {events.length === 0 && (
                            <div className="h-64 bg-white rounded-3xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 gap-3">
                                <div className="p-3 bg-gray-50 rounded-full">
                                    <Megaphone size={24} className="text-gray-300" />
                                </div>
                                <span className="text-sm">현재 진행 중인 행사가 없습니다.</span>
                            </div>
                        )}
                    </Swiper>

                    {/* 커스텀 네비게이션 버튼 */}
                    <button className="swiper-button-prev-custom absolute top-1/2 -left-4 md:-left-12 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-lg ring-1 ring-gray-900/5 flex items-center justify-center text-gray-700 disabled:opacity-0 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 hover:text-blue-600 hover:bg-white hidden md:flex">
                        <ChevronLeft size={28} strokeWidth={2} />
                    </button>
                    <button className="swiper-button-next-custom absolute top-1/2 -right-4 md:-right-12 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-lg ring-1 ring-gray-900/5 flex items-center justify-center text-gray-700 disabled:opacity-0 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 hover:text-blue-600 hover:bg-white hidden md:flex">
                        <ChevronRight size={28} strokeWidth={2} />
                    </button>
                </div>
            </section>

            {/* 3. 최근 공지사항 섹션 */}
            <section className="px-4 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-gray-800 rounded-full"></span>
                        <h2 className="text-xl font-bold text-gray-900">최근 공지사항</h2>
                    </div>
                    <Link
                        to="/notices"
                        search={{ mainCategory: 'student_council', subCategory: 'all', page: 1, sort: 'newest', search: '' }}
                        className="text-xs font-medium text-gray-500 flex items-center gap-1 hover:text-blue-600 transition-colors bg-gray-100 px-3 py-1.5 rounded-full"
                    >
                        전체보기 <ChevronRight size={14} />
                    </Link>
                </div>

                <div className="grid gap-3">
                    {notices.map((notice) => (
                        <Link
                            key={notice.id}
                            to="/notices/$noticeId"
                            params={{ noticeId: notice.id.toString() }}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight
                                            ${notice.main_category === 'student_council'
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'bg-green-50 text-green-700'
                                            }`}
                                        >
                                            {getSubCategoryLabel(notice.main_category, notice.sub_category)}
                                        </span>
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                            <Clock size={10} />
                                            {notice.created_at.split('T')[0]}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                        {notice.is_pinned && <span className="mr-1.5 text-xs">📌</span>}
                                        {notice.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 line-clamp-1 mt-1 font-medium text-opacity-80">
                                        {notice.content}
                                    </p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shrink-0">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        </Link>
                    ))}
                    {notices.length === 0 && (
                        <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
                            <Megaphone size={32} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm">등록된 공지사항이 없습니다.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
