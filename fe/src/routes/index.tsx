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
import { activityApi } from '../lib/api/activities'
import { postApi } from '../lib/api/notices'
import type { ActivityListItem } from '../types/activities'
import { getActivityStatus } from '../types/activities'
import type { NoticeListItem } from '../types/posts'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

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

const getSubCategoryLabel = (sub: string) => {
    const labels: Record<string, string> = {
        'event': '행사', 'welfare': '복지', 'notification': '공지',
        'announcement': '공고', 'notice': '고시', 'meeting': '대표자회의', 'rules': '학생회칙'
    };
    return labels[sub] || sub;
};

function Index() {
    const [featuredActivities, setFeaturedActivities] = useState<ActivityListItem[]>([])
    const [posts, setPosts] = useState<NoticeListItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [activitiesResponse, postsResponse] = await Promise.all([
                    activityApi.getAll({ is_active_only: true, page: 1, page_size: 20 }),
                    postApi.getAll({ page: 1, page_size: 5, sort: 'newest' })
                ])

                const validActivities = activitiesResponse.activities.filter(activity => {
                    const status = getActivityStatus(activity)
                    return status === 'active' || status === 'scheduled'
                })

                setFeaturedActivities(validActivities)
                setPosts(postsResponse.posts)
            } catch (error) {
                console.error('Failed to fetch data', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <LoadingSpinner message="홈페이지를 불러오고 있습니다..." />

    return (
        <div className="pb-20 space-y-12">
            {/* Bento Grid Hero Layout */}
            <section className="container mx-auto px-4 pt-6 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
                    {/* 1. Main Featured Carousel (Large, 8 cols) */}
                    <div className="lg:col-span-8 relative group rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 dark:shadow-none ring-1 ring-black/5 dark:ring-white/10 bg-surface">
                        {loading ? (
                            <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-surface-muted animate-pulse">
                                <LoadingSpinner />
                            </div>
                        ) : (
                            <>
                                <Swiper
                                    key={featuredActivities.length}
                                    modules={[Autoplay, Pagination, Navigation]}
                                    navigation={{ nextEl: '.hero-next', prevEl: '.hero-prev' }}
                                    pagination={{ clickable: true, dynamicBullets: true, bulletClass: 'swiper-pagination-bullet !bg-white/80 !w-2 !h-2' }}
                                    autoplay={{ delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                                    loop={featuredActivities.length > 1}
                                    className="h-full w-full"
                                >
                                    {featuredActivities.length > 0 ? (
                                        featuredActivities.map((activity) => (
                                            <SwiperSlide key={activity.id}>
                                                <div className="relative w-full h-full min-h-[400px] lg:min-h-full group/slide overflow-hidden bg-slate-900">
                                                    {/* 1. Background Blur Layer */}
                                                    <div className="absolute inset-0">
                                                        {activity.thumbnail_url ? (
                                                            <>
                                                                <img
                                                                    src={activity.thumbnail_url}
                                                                    alt=""
                                                                    className="w-full h-full object-cover blur-2xl opacity-40 scale-110 transform"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-slate-900/30" />
                                                            </>
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 opacity-50" />
                                                        )}
                                                    </div>

                                                    {/* 2. Content Layout */}
                                                    <div className="relative z-10 h-full p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                                                        {/* Left: Text Content */}
                                                        <div className="flex-1 w-full lg:w-3/5 flex flex-col justify-center items-start space-y-6 transform transition-transform duration-500 group-hover/slide:translate-x-2">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${getActivityStatus(activity) === 'active'
                                                                ? 'bg-indigo-500 shadow-indigo-500/30'
                                                                : 'bg-slate-500 shadow-slate-500/30'
                                                                }`}>
                                                                {getActivityStatus(activity) === 'active' ? '모집중' : '접수예정'}
                                                            </span>

                                                            <div className="space-y-4">
                                                                <h2 className="text-3xl md:text-5xl lg:text-5xl font-bold text-white leading-tight break-keep drop-shadow-lg">
                                                                    {activity.title}
                                                                </h2>
                                                                <p className="text-gray-200 text-sm md:text-lg line-clamp-3 max-w-2xl leading-relaxed drop-shadow-md">
                                                                    {activity.description || '새로운 행사가 여러분을 기다립니다.'}
                                                                </p>
                                                            </div>

                                                            <Link
                                                                to="/activities"
                                                                className="inline-flex items-center gap-2 px-6 py-3.5 bg-surface text-foreground rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                                                            >
                                                                자세히 보기 <ChevronRight size={16} />
                                                            </Link>
                                                        </div>

                                                        {/* Right: Poster Card (Desktop Only) */}
                                                        {activity.thumbnail_url ? (
                                                            <div className="hidden lg:block w-[320px] shrink-0 transform transition-all duration-700 ease-out translate-x-12 opacity-0 [.swiper-slide-active_&]:translate-x-0 [.swiper-slide-active_&]:opacity-100">
                                                                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10 transition-transform duration-500 bg-slate-800">
                                                                    <img
                                                                        src={activity.thumbnail_url}
                                                                        alt={activity.title}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="hidden lg:flex w-[320px] aspect-[3/4] shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-2xl">
                                                                <Megaphone className="w-24 h-24 text-white/20" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </SwiperSlide>
                                        ))
                                    ) : (
                                        <SwiperSlide>
                                            <div className="relative w-full h-full min-h-[400px] bg-surface-muted flex items-center justify-center">
                                                <div className="text-center p-8">
                                                    <h2 className="text-3xl font-bold text-foreground-muted mb-2">진행 중인 행사가 없습니다</h2>
                                                    <p className="text-foreground-secondary">새로운 소식을 기다려주세요!</p>
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    )}
                                </Swiper>
                                {/* Custom Nav Buttons */}
                                <button className="hero-prev absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                                    <ChevronLeft size={24} />
                                </button>
                                <button className="hero-next absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 translate-x-[-16px] group-hover:translate-x-0">
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* 2. Right Column (4 cols) - Intro & Shortcuts */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* 2-1. Intro Card (Gradient) */}
                        <div className="flex-1 bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-violet-900 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20 dark:shadow-none flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

                            <div className="relative z-10">
                                <h3 className="text-3xl font-bold leading-tight mb-2">
                                    미래를 코딩하는<br />컴퓨터공학과 학생회
                                </h3>
                                <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                                    학우 여러분의 목소리에 귀 기울이고,<br />
                                    더 나은 학교 생활을 만들어갑니다.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 relative z-10" >
                                <Link
                                    to="/notices"
                                    search={{ page: 1, sort: 'newest', search: '', board_id: 1, subCategory: 'all' }}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-surface text-foreground rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
                                >
                                    공지사항 <ChevronRight size={16} />
                                </Link>
                                <Link
                                    to="/activities"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-surface text-foreground rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
                                >
                                    행사 신청<ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>

                        {/* 2-2. Shortcuts Grid (Scrollable or Grid) */}
                        <div className="flex-1 bg-surface rounded-3xl p-6 border border-border-default shadow-lg dark:shadow-none overflow-hidden flex flex-col">
                            <h4 className="text-sm font-bold text-foreground-secondary mb-4 px-1 flex items-center justify-between">
                                자주 찾는 서비스
                                <span className="text-xs font-normal text-foreground-muted">Quick Links</span>
                            </h4>
                            <div className="grid grid-cols-4 gap-2 flex-1 content-start">
                                {PORTALS.slice(0, 8).map((portal) => (
                                    <a
                                        key={portal.name}
                                        href={portal.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-surface-muted transition-colors group text-center"
                                        title={portal.name}
                                    >
                                        <div className={`w-10 h-10 rounded-full ${portal.bg} dark:bg-surface-subtle ${portal.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                                            <portal.icon size={18} strokeWidth={2} />
                                        </div>
                                        <span className="text-[11px] font-medium text-foreground-secondary group-hover:text-foreground leading-tight break-keep">
                                            {portal.name}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recent Notices Section */}
            <section className="container mx-auto px-4 pb-20">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        최근 소식
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    </h2>
                    <Link
                        to="/notices"
                        search={{ page: 1, sort: 'newest', search: '', board_id: 1, subCategory: 'all' }}
                        className="text-sm font-medium text-foreground-secondary hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
                    >
                        전체보기 <ChevronRight size={16} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <Link
                            key={post.id}
                            to="/notices/$noticeId"
                            params={{ noticeId: post.id.toString() }}
                            className="group bg-surface rounded-2xl p-6 border border-border-default hover:border-indigo-100 dark:hover:border-indigo-900 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${post.board.id === 1
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                                    : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300'
                                    }`}>
                                    {getSubCategoryLabel(post.subcategory || '공지')}
                                </span>
                                <span className="text-xs text-foreground-muted font-medium">
                                    {post.created_at.split('T')[0]}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {post.is_pinned && <span className="mr-2 inline-block text-rose-500">📌</span>}
                                {post.title}
                            </h3>
                            <p className="text-sm text-foreground-secondary line-clamp-2 leading-relaxed h-11">
                                {post.content}
                            </p>
                        </Link>
                    ))}
                    {posts.length === 0 && (
                        <div className="col-span-full py-20 text-center text-foreground-muted bg-surface-muted rounded-2xl border border-dashed border-border-default">
                            <Megaphone size={32} className="mx-auto mb-3 opacity-50" />
                            <p>등록된 게시글이 없습니다.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}