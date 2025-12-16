import Layout from '../components/Layout';
import ScrollReveal from '../components/ScrollReveal';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { MOCK_NOTICES } from '../mocks/data';

export default function Home() {
    const { data: notices } = useQuery({
        queryKey: ['notices'],
        queryFn: async () => {
            // const res = await api.get('/notices');
            // return res.data;
            return MOCK_NOTICES;
        }
    });

    return (
        <Layout>
            {/* Dashboard / Hub Section */}
            <section className="py-20 bg-gray-50 min-h-[60vh] flex flex-col justify-center">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <ScrollReveal direction="up">
                        <div className="text-center mb-16">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                                Welcome to <span className="text-indigo-600">SEOULTECH CSE</span>
                            </h1>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                컴퓨터공학과 학우들을 위한 정보 허브입니다.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Quick Links */}
                        <ScrollReveal direction="right">
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-full">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <span>🔗</span> 바로가기
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {[
                                        { title: "학교 홈페이지", emoji: "🏫", url: "https://www.seoultech.ac.kr/" },
                                        { title: "학과 홈페이지", emoji: "💻", url: "https://cse.seoultech.ac.kr/" },
                                        { title: "통합정보시스템", emoji: "🔐", url: "https://portal.seoultech.ac.kr/" },
                                        { title: "생활관", emoji: "🏠", url: "https://dormitory.seoultech.ac.kr/" },
                                        { title: "수강신청", emoji: "📝", url: "http://for-s.seoultech.ac.kr/" },
                                        { title: "EPIC Folio", emoji: "🎓", url: "https://epic.seoultech.ac.kr/" },
                                    ].map((link) => (
                                        <a
                                            key={link.title}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors gap-2 text-center"
                                        >
                                            <span className="text-2xl">{link.emoji}</span>
                                            <span className="text-sm font-medium">{link.title}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Contacts & Menus */}
                        <ScrollReveal direction="left" delay={200}>
                            <div className="flex flex-col gap-6 h-full">
                                {/* Contacts */}
                                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex-1">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <span>📢</span> 학생회 소통
                                    </h2>
                                    <div className="space-y-4">
                                        {[
                                            { title: "인스타그램", emoji: "📸", url: "https://www.instagram.com/", sub: "@seoultech_cse" },
                                            { title: "카카오톡 채널", emoji: "💬", url: "https://pf.kakao.com/", sub: "서울과학기술대학교 컴퓨터공학과 학생회" },
                                        ].map((contact) => (
                                            <a
                                                key={contact.title}
                                                href={contact.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-4 p-4 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl transition-colors"
                                            >
                                                <span className="text-3xl">{contact.emoji}</span>
                                                <div>
                                                    <div className="font-bold text-gray-800">{contact.title}</div>
                                                    <div className="text-sm text-gray-500">{contact.sub}</div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                {/* Internal Nav */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Link to="/freshman" className="p-4 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl text-white font-bold text-center hover:shadow-lg transition-shadow">
                                        신입생 가이드북 📘
                                    </Link>
                                    <Link to="/intro" className="p-4 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-xl text-white font-bold text-center hover:shadow-lg transition-shadow">
                                        학생회 소개 🏛️
                                    </Link>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* Recent Event Spotlight */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <ScrollReveal direction="left">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <h2 className="text-indigo-600 font-bold tracking-wider text-sm uppercase mb-2">Spotlight</h2>
                                <h3 className="text-4xl md:text-5xl font-bold text-gray-900">Latest Event</h3>
                            </div>
                            <Link to="/events" className="hidden md:flex items-center text-gray-500 hover:text-indigo-600 transition-colors">
                                전체 행사 보기 <span className="ml-2">→</span>
                            </Link>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal direction="up" delay={200}>
                        <div className="group relative rounded-3xl overflow-hidden bg-white border border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="h-80 md:h-auto overflow-hidden bg-gray-100 relative">
                                    {/* Image Placeholder */}
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-white group-hover:scale-105 transition-transform duration-700 flex items-center justify-center">
                                        <div className="text-center p-8">
                                            <span className="text-6xl mb-4 block">🍖</span>
                                            <span className="text-indigo-900/30 font-bold text-xl uppercase tracking-widest">Coming Soon</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-10 md:p-14 flex flex-col justify-center">
                                    <span className="inline-block py-1 px-3 rounded-md bg-indigo-100 text-indigo-600 text-xs font-bold mb-4 w-fit">
                                        D-day
                                    </span>
                                    <h4 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                                        2학기 기말고사<br />
                                        <span className="text-indigo-600">간식행사</span>
                                    </h4>
                                    <p className="text-gray-600 mb-8 leading-relaxed">
                                        시험기간 지친 학우 여러분을 위해 든든한 간식을 준비했습니다.
                                        학생회비 납부자라면 누구나! 맛있는 간식 받아가시고 A+ 받으세요!
                                    </p>

                                    <div className="flex flex-col space-y-3 mb-10 text-gray-600">
                                        <div className="flex items-center">
                                            <span className="w-6 text-indigo-500">📅</span>
                                            <span>2025.12.05 (목) 18:00</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-6 text-indigo-500">📍</span>
                                            <span>신공학관 1층 로비</span>
                                        </div>
                                    </div>

                                    <Link to="/events" className="inline-flex items-center justify-center p-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all hover:shadow-lg transform hover:-translate-y-0.5 shadow-indigo-200">
                                        자세히 보기
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* Quick Stats / Notices */}
            <section className="py-24 bg-gray-50 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Notice Board */}
                        <div className="lg:col-span-2">
                            <ScrollReveal direction="left">
                                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                                    <span className="w-2 h-8 bg-indigo-600 rounded-sm mr-3"></span>
                                    Recent Notices
                                </h3>
                                <div className="grid gap-4">
                                    {notices?.map((notice: any) => (
                                        <Link key={notice.id} to="/notice" className="flex items-center justify-between p-5 bg-white rounded-xl hover:bg-indigo-50 transition-colors border border-gray-100 shadow-sm hover:shadow-md group">
                                            <div className="flex items-center gap-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${notice.type === '공고' ? 'bg-red-100 text-red-600' :
                                                    notice.type === '선거' ? 'bg-purple-100 text-purple-600' :
                                                        'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {notice.type}
                                                </span>
                                                <span className="text-gray-800 font-medium group-hover:text-indigo-600 transition-colors">
                                                    {notice.title}
                                                </span>
                                            </div>
                                            <span className="text-gray-500 text-sm hidden sm:block">{notice.date}</span>
                                        </Link>
                                    ))}
                                    {(!notices || notices.length === 0) && (
                                        <div className="text-center py-8 text-gray-500">등록된 공지사항이 없습니다.</div>
                                    )}
                                </div>
                            </ScrollReveal>
                        </div>

                        {/* Quick Links Banner */}
                        <ScrollReveal direction="right" delay={200}>
                            <div className="h-full bg-gradient-to-br from-indigo-900 to-purple-800 rounded-2xl p-8 text-white flex flex-col justify-between relative overflow-hidden group shadow-xl">
                                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                                <div>
                                    <h3 className="text-2xl font-bold mb-2">복지사업 안내</h3>
                                    <p className="text-indigo-100 mb-6">
                                        우산 대여부터 전공책 대여까지,<br />
                                        학생회가 제공하는 다양한 복지 혜택을 확인하세요.
                                    </p>
                                </div>
                                <button className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl font-bold transition-colors border border-white/20 shadow-lg">
                                    복지사업 전체보기
                                </button>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
