import Layout from '../components/Layout';
import ScrollReveal from '../components/ScrollReveal';

export default function Intro() {
    return (
        <Layout>
            {/* Hero Section (Moved from Home) */}
            <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-[#0a0a2a] text-white">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/50 via-[#0a0a2a] to-[#0a0a2a] z-10 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-40 animate-pulse-slow"></div>

                <div className="relative z-20 text-center px-4 max-w-5xl mx-auto">
                    <ScrollReveal direction="up">
                        <div className="mb-6 flex justify-center">
                            <span className="py-1.5 px-4 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-sm font-medium backdrop-blur-md">
                                2025 Computer Science
                            </span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                            OUR FUTURE<br />
                            YOUR DREAM
                        </h1>
                        <p className="text-xl md:text-2xl text-indigo-200/80 mb-12 max-w-2xl mx-auto font-light tracking-wide">
                            컴퓨터공학과 학생회 제42대 학생회<br />
                            여러분의 즐거운 학과생활을 위해 최선을 다하겠습니다.
                        </p>
                    </ScrollReveal>
                </div>
            </section>

            {/* Introduction Content */}
            <section className="max-w-7xl mx-auto px-6 mb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <ScrollReveal direction="right" delay={200}>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
                            <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                                <div className="h-64 bg-gray-200 rounded-xl mb-6 overflow-hidden">
                                    {/* Placeholder for an image */}
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-300">
                                        <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-sm text-gray-500 font-semibold mb-1">Since 1984</p>
                                        <h3 className="text-2xl font-bold text-gray-900">제42대 학생회</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-4xl font-bold text-indigo-600">42</p>
                                        <p className="text-sm text-gray-500">Members</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal direction="left" delay={400}>
                        <div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                학우 여러분의 <br />
                                <span className="text-indigo-600">든든한 버팀목</span>이 되겠습니다.
                            </h2>
                            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                컴퓨터공학과 학생회는 학우 여러분의 권익 보호와 복지 증진을 최우선으로 생각합니다.
                                학업, 진로, 그리고 즐거운 대학 문화를 만들기 위해 끊임없이 소통하고 노력하겠습니다.
                            </p>
                            <ul className="space-y-4 mb-8">
                                {[
                                    '투명한 학생회비 운영 및 정기 감사',
                                    '다채로운 학과 행사 및 복지 개최',
                                    '학우들의 목소리에 귀 기울이는 소통 창구',
                                    '시험 기간 간식행사 및 강의실 개방 사업'
                                ].map((item, index) => (
                                    <li key={index} className="flex items-center text-gray-700">
                                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* Student Council Events Section */}
            <section className="bg-white py-24 -mx-6 px-6 mb-20">
                <div className="max-w-7xl mx-auto">
                    <ScrollReveal direction="up">
                        <div className="text-center mb-16">
                            <span className="text-indigo-600 font-semibold tracking-wide uppercase text-sm">Main Events</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">학생회 주관 행사</h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                지난해 1년 동안 진행된 주요 행사를 소개합니다.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: '새내기 배움터', date: '2월', desc: '신입생과 재학생이 함께하는 첫 만남의 장', icon: '🚌' },
                            { title: '개강파티', date: '3월', desc: '한 해의 시작을 알리는 컴퓨터공학과 출범식', icon: '🌅' },
                            { title: 'MT 연합 모꼬지', date: '4월', desc: '대학 행사의 꽃, MT 연합 모꼬지', icon: '🎪' },
                            { title: '대동제 주점', date: '5월', desc: '축제의 꽃, 컴공인들이 함께 운영하는 주점', icon: '🎪' },
                            { title: 'e-Sports 대회', date: '9월', desc: '학우들의 게임 실력을 뽐내는 대회', icon: '🎮' },
                            { title: '텀프로젝트 경진대회', date: '11월', desc: '1년 동안의 프로젝트 성과를 공유하는 자리', icon: '💻' },
                            { title: '컴공인의 밤', date: '11월', desc: '한 해를 마무리하며 즐기는 파티', icon: '🌙' },
                            { title: '간식행사', date: '시험기간', desc: '마지막까지 힘내는 학우들을 위한 간식', icon: '🥪' },
                            { title: '강의실 개방사업', date: '시험기간', desc: '시험기간 학습공간 보충을 위한 강의실 개방', icon: '🥪' },
                        ].map((event, idx) => (
                            <ScrollReveal key={idx} direction="up" delay={idx * 100}>
                                <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-gray-100 group">
                                    <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{event.icon}</div>
                                    <div className="text-xs font-bold text-indigo-500 mb-1 bg-indigo-50 inline-block px-2 py-0.5 rounded-full">{event.date}</div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
                                    <p className="text-sm text-gray-500">{event.desc}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="bg-gray-50 py-24 -mx-6 px-6 mb-20">
                <div className="max-w-7xl mx-auto">
                    <ScrollReveal direction="up">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Core Values</h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                우리가 지향하는 핵심 가치입니다.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: 'Communication', desc: '학우들과의 끊임없는 소통을 통해 니즈를 파악합니다.', color: 'from-pink-500 to-rose-500', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
                            { title: 'Innovation', desc: '새로운 문화를 선도하고 창의적인 행사를 기획합니다.', color: 'from-blue-500 to-cyan-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                            { title: 'Passion', desc: '모든 활동에 열정을 다해 임하며 최선을 다합니다.', color: 'from-amber-500 to-orange-500', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' }
                        ].map((item, idx) => (
                            <ScrollReveal key={idx} direction="up" delay={idx * 200}>
                                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-2 h-full">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${item.color} mb-6 flex items-center justify-center text-white shadow-md`}>
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Organization Chart Section */}
            <section className="max-w-7xl mx-auto px-6 mb-32">
                <ScrollReveal direction="up">
                    <div className="text-center mb-16">
                        <span className="text-indigo-600 font-semibold tracking-wide uppercase text-sm">Organization</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">학생회 조직도</h2>
                        <p className="text-gray-600 mb-12">체계적인 조직 구성을 통해 효율적으로 업무를 수행합니다.</p>

                        {/* Tree Structure */}
                        <div className="relative py-8">
                            {/* President */}
                            <div className="flex justify-center mb-16 relative">
                                <div className="z-10 bg-indigo-900 text-white px-8 py-4 rounded-xl shadow-lg border-2 border-indigo-800 w-64">
                                    <p className="text-xs text-indigo-300 mb-1">학생회장단</p>
                                    <p className="text-xl font-bold">회장 · 부회장</p>
                                </div>
                                <div className="absolute top-full left-1/2 w-0.5 h-16 bg-gray-300 -translate-x-1/2"></div>
                            </div>

                            {/* Departments */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 relative">
                                {/* Connecting line */}
                                <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gray-300 -mt-8 hidden md:block"></div>
                                <div className="absolute top-0 left-1/2 h-8 w-0.5 bg-gray-300 -mt-8 -translate-x-1/2 hidden md:block"></div>

                                {[
                                    { name: '기획부', role: '행사 기획 및 운영' },
                                    { name: '재정부', role: '회계 및 물품 관리' },
                                    { name: '홍보부', role: 'SNS 운영 및 포스터 제작' },
                                    { name: '복지부', role: '과방 관리 및 복지 사업' },
                                ].map((dept, idx) => (
                                    <div key={idx} className="relative flex flex-col items-center">
                                        <div className="absolute -top-8 left-1/2 w-0.5 h-8 bg-gray-300 -translate-x-1/2 hidden md:block"></div>
                                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 w-full text-center hover:border-indigo-500 transition-colors">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">{dept.name}</h3>
                                            <p className="text-sm text-gray-500">{dept.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </Layout >
    );
}