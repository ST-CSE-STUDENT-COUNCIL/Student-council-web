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
    { name: '학교 홈페이지', icon: School, url: 'https://www.seoultech.ac.kr/index.jsp', color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: '학과 홈페이지', icon: Laptop, url: 'https://computer.seoultech.ac.kr/', color: 'text-slate-600', bg: 'bg-slate-50' },
    { name: 'SUIS', icon: MonitorCheck, url: 'https://suis.seoultech.ac.kr/nxui/index.html', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { name: 'E-Class', icon: MonitorPlay, url: 'https://eclass.seoultech.ac.kr/ilos/main/main_form.acl', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: '학생포탈', icon: GraduationCap, url: 'https://stportal.seoultech.ac.kr/', color: 'text-violet-600', bg: 'bg-violet-50' },
    { name: '도서관', icon: BookOpen, url: 'https://library.seoultech.ac.kr/#/', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: '생활관', icon: Building, url: 'https://domi.seoultech.ac.kr/', color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: '총학생회', icon: Flag, url: 'https://gwack2.seoultech.ac.kr/', color: 'text-rose-600', bg: 'bg-rose-50' },
    { name: '교내연락', icon: Phone, url: 'https://www.seoultech.ac.kr/intro/campinfo/interph/', color: 'text-green-600', bg: 'bg-green-50' },
    { name: '인스타그램', icon: Instagram, url: 'https://www.instagram.com/seoultech_com/', color: 'text-pink-600', bg: 'bg-pink-50' },
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
                const [eventsData, noticesResponse] = await Promise.all([
                    eventApi.getAll(),
                    noticeApi.getAll({ page: 1, page_size: 5, sort: 'newest' })
                ])

                const activeEvents = eventsData
                    .filter(e => e.status === 'active' || e.status === 'scheduled')
                    .sort((a, b) => b.id - a.id)
                    .slice(0, 5)

                setEvents(activeEvents)
                setNotices(noticesResponse.notices)
            } catch (error) {
                console.error('Failed to fetch data', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">데이터를 불러오고 있습니다...</p>
        </div>
    )

    return (
        <div className="pb-20 space-y-12">
            {/* 1. Hero Section */}
            <section className="relative bg-slate-50 pt-20 pb-32 overflow-hidden -mt-16 sm:-mt-20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 z-10" />
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
                <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />

                <div className="container mx-auto px-6 pt-20 relative z-20 text-center">
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                        서울과학기술대학교 컴퓨터공학과 홈페이지입니다. <br className="hidden sm:block" />
                        행사신청, 공지사항, 학과소식, 학생회 정보 등을 확인할 수 있습니다.
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 -mt-24 relative z-30">
                {/* 2. Shortcuts Grid */}
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-12 border border-blue-50/50 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        자주 찾는 서비스
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6">
                        {PORTALS.map((portal) => (
                            <a
                                key={portal.name}
                                href={portal.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className={`p-4 rounded-2xl ${portal.bg} ${portal.color} transition-all duration-300 group-hover:scale-110 shadow-sm ring-1 ring-black/5`}>
                                    <portal.icon size={24} strokeWidth={2} />
                                </div>
                                <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                                    {portal.name}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* 3. Event Slider (Left 7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    지금 주목할 행사 <span className="text-blue-500 animate-pulse">✨</span>
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">놓치지 말아야 할 주요 행사들을 확인하세요.</p>
                            </div>
                            <Link to="/events" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
                                전체보기 <ChevronRight size={16} />
                            </Link>
                        </div>

                        {/* Slider Area with Outside Buttons */}
                        <div className="relative group px-2">
                            {/* Swiper Container */}
                            <div className="rounded-3xl overflow-hidden shadow-lg ring-1 ring-black/5 bg-gray-50">
                                <Swiper
                                    modules={[Autoplay, Pagination, Navigation]}
                                    navigation={{ nextEl: '.custom-next', prevEl: '.custom-prev' }}
                                    pagination={{ clickable: true, dynamicBullets: true }}
                                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                                    spaceBetween={0}
                                    slidesPerView={1}
                                    className="h-auto min-h-[500px]"
                                >
                                    {events.map((event) => (
                                        <SwiperSlide key={event.id} className="p-4 sm:p-6 box-border">
                                            <div className="w-full h-full relative">
                                                <EventCard event={event} />
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                    {events.length === 0 && (
                                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-gray-400 gap-4">
                                            <div className="p-4 bg-white rounded-full shadow-sm">
                                                <Megaphone size={32} className="text-gray-300" />
                                            </div>
                                            <span>현재 진행 중인 행사가 없습니다.</span>
                                        </div>
                                    )}
                                </Swiper>
                            </div>

                            {/* Navigation Buttons (Outside) */}
                            <button className="custom-prev absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg ring-1 ring-black/5 flex items-center justify-center text-gray-700 hover:text-blue-600 hover:scale-110 transition-all cursor-pointer hidden md:flex">
                                <ChevronLeft size={24} strokeWidth={2.5} />
                            </button>
                            <button className="custom-next absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg ring-1 ring-black/5 flex items-center justify-center text-gray-700 hover:text-blue-600 hover:scale-110 transition-all cursor-pointer hidden md:flex">
                                <ChevronRight size={24} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* 4. Recent Notices (Right 5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    최근 공지사항 <Megaphone size={20} className="text-orange-500" />
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">학과와 학생회의 새로운 소식입니다.</p>
                            </div>
                            <Link
                                to="/notices"
                                search={{ page: 1, sort: 'newest', search: '', mainCategory: 'student_council', subCategory: 'all' }}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                            >
                                더보기 <ChevronRight size={16} />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {notices.map((notice) => (
                                <Link
                                    key={notice.id}
                                    to="/notices/$noticeId"
                                    params={{ noticeId: notice.id.toString() }}
                                    className="block group"
                                >
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-tight ${notice.main_category === 'student_council'
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'bg-green-50 text-green-700'
                                                }`}>
                                                {getSubCategoryLabel(notice.main_category, notice.sub_category)}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium font-mono">
                                                {notice.created_at.split('T')[0]}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                            {notice.is_pinned && <span className="mr-1.5 text-rose-500">📌</span>}
                                            {notice.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-1 opacity-80">
                                            {notice.content}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                            {notices.length === 0 && (
                                <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                                    <p>등록된 공지사항이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
