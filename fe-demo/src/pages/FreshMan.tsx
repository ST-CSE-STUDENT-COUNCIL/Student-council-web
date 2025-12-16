import Layout from "../components/Layout";

export default function FreshMan() {
    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
                {/* Header Section */}
                <header className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                        과기대 컴공 신입생 가이드북 📘
                    </h1>
                    <p className="text-lg text-gray-600">
                        서울과학기술대학교 컴퓨터공학과에 오신 것을 환영합니다!
                    </p>
                </header>

                {/* Greeting Section */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>👋</span> 인사말
                    </h2>
                    <div className="space-y-4 text-gray-700 leading-relaxed font-medium">
                        <p>
                            안녕하세요 신입생 여러분, <span className="text-blue-600">서울과학기술대 컴퓨터공학과 ‘웰컴(WELL.COM)‘ 학생회</span>입니다!
                        </p>
                        <p>
                            여러분들의 입학을 진심으로 축하드립니다! 🎉<br />
                            새내기 여러분과 학우 여러분들께서 학교 정보에 쉽게 접근할 수 있게 하고자 신입생 가이드북이 탄생하였습니다!
                        </p>
                        <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                            💡 <strong>Tip:</strong> 큰 화면으로 접속시, 더 편하게 볼 수 있습니다! 정보는 꾸준히 업데이트 됩니다.
                        </p>
                    </div>
                </section>

                {/* Student Council Events Section */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>🎊</span> 학생회 주관 행사
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { title: "새내기 배움터", emoji: "🚌" },
                            { title: "대동제", emoji: "🎪" },
                            { title: "MT", emoji: "🍖" },
                            { title: "개강/종강파티", emoji: "🎉" },
                            { title: "컴공인의 밤", emoji: "🌙" },
                            { title: "간식행사", emoji: "🍔" },
                            { title: "시험기간 강의실 개방", emoji: "📖" },
                            { title: "대여 사업", emoji: "☂️" },
                        ].map((item) => (
                            <div key={item.title} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-2 hover:shadow-md transition-shadow">
                                <span className="text-3xl mb-1">{item.emoji}</span>
                                <span className="font-semibold text-gray-800 text-sm">{item.title}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Clubs Section */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>🤝</span> 동아리/소모임 소개
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: "다락방", emoji: "🎸", desc: "밴드 소모임" },
                            { title: "E.C", emoji: "💻", desc: "알고리즘 학술 소모임" },
                            { title: "N.L", emoji: "⚽", desc: "축구 소모임" },
                            { title: "T.C.P", emoji: "🖥️", desc: "학술 소모임" },
                            { title: "TOOLS", emoji: "🔧", desc: "시스템/보안 학술 소모임" },
                            { title: "I.G.A", emoji: "🎲", desc: "게임 제작 소모임" },
                        ].map((club) => (
                            <div key={club.title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:border-blue-100 transition-colors">
                                <div className="text-4xl mb-4">{club.emoji}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{club.title}</h3>
                                <p className="text-gray-500 text-sm">{club.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* University Life / Tips Section */}
                <section className="bg-blue-50 rounded-3xl p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>💡</span> 대학 생활 꿀팁 & 모아보기
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                            { title: "대학 수업", emoji: "📚" },
                            { title: "수강신청", emoji: "📝" },
                            { title: "장학금 & 근로", emoji: "💰" },
                            { title: "캠퍼스 안내", emoji: "🏫" },
                            { title: "기숙사 생활", emoji: "🛏️" },
                            { title: "학식 정보", emoji: "🍽️" },
                            { title: "공부할 장소", emoji: "✏️" },
                            { title: "학교 지원 서비스", emoji: "ℹ️" },
                        ].map((item) => (
                            <button key={item.title} className="bg-white/80 hover:bg-white p-4 rounded-xl text-left transition-colors flex items-center gap-3">
                                <span className="text-2xl">{item.emoji}</span>
                                <span className="font-medium text-gray-700">{item.title}</span>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </Layout>
    );
}