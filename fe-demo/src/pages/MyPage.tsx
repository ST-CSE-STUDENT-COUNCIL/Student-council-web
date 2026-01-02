import { useState } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
// import api from '../api/axios';
import { MOCK_MY_EVENTS, MOCK_BOOKMARKS, MOCK_PAST_EVENTS } from '../mocks/data';

export default function MyPage() {
    // Current user from store
    const { user } = useAuthStore();

    // Fetch my events
    const { data: myEvents } = useQuery({
        queryKey: ['myEvents'],
        queryFn: async () => {
            // const res = await api.get('/my/events');
            // return res.data;
            return MOCK_MY_EVENTS;
        }
    });

    // Fetch bookmarks
    const { data: bookmarks } = useQuery({
        queryKey: ['bookmarks'],
        queryFn: async () => {
            // const res = await api.get('/my/bookmarks');
            // return res.data;
            return MOCK_BOOKMARKS;
        }
    });

    const pastEvents = MOCK_PAST_EVENTS;

    const [activeTab, setActiveTab] = useState<'current' | 'past'>('current');

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-4 py-8">
                {!user ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                        <div className="text-6xl mb-4">🔒</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">로그인이 필요한 페이지입니다</h2>
                        <p className="text-gray-500 mb-6">학생회비 납부 내역과 행사 신청 내역을 확인하려면 로그인해주세요.</p>
                        <Link to="/login" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
                            로그인하러 가기
                        </Link>
                    </div>
                ) : (
                    <>
                        <h1 className="text-3xl font-bold text-gray-900 mb-8">마이페이지</h1>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Profile Card */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <div className="flex flex-col items-center">
                                        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-4xl mb-4">
                                            🧑‍🎓
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                                        <p className="text-gray-500 mb-6">{user?.studentId} | {user?.department}</p>

                                        <div className="w-full bg-gray-50 rounded-xl p-4 mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600 font-medium">학생회비 납부 여부</span>
                                                {user?.feeStatus ? (
                                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">납부 완료</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">미납</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 text-right">최근 확인일: 2025.12.06</p>
                                        </div>

                                        <button className="w-full py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                                            내 정보 수정
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                                        <div className="text-2xl font-bold text-indigo-600 mb-1">{myEvents?.length || 0}</div>
                                        <div className="text-xs text-gray-500">참여 예정</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 text-center">
                                        <div className="text-2xl font-bold text-gray-600 mb-1">{pastEvents?.length || 0}</div>
                                        <div className="text-xs text-gray-500">참여 완료</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Content */}
                            <div className="lg:col-span-2 space-y-8">

                                {/* Events Section */}
                                <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-gray-900">내 행사 관리</h3>
                                        <div className="flex bg-gray-100 p-1 rounded-lg">
                                            <button
                                                onClick={() => setActiveTab('current')}
                                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'current' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                신청 내역
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('past')}
                                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'past' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                과거 내역
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {activeTab === 'current' ? (
                                            user?.feeStatus ? (
                                                myEvents?.map((event: any) => (
                                                    <div key={event.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                                        <div className="w-16 h-16 bg-indigo-50 rounded-lg flex items-center justify-center text-2xl">
                                                            {event.image}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-gray-900">{event.title}</h4>
                                                            <p className="text-sm text-gray-500">{event.date}</p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${event.status === '참여확정' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'
                                                            }`}>
                                                            {event.status}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <p className="mb-2">학생회비를 납부하지 않아 행사 신청 내역을 확인할 수 없습니다.</p>
                                                </div>
                                            )
                                        ) : (
                                            pastEvents.map(event => (
                                                <div key={event.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors opacity-75">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl grayscale">
                                                        {event.image}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900">{event.title}</h4>
                                                        <p className="text-sm text-gray-500">{event.date}</p>
                                                    </div>
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                                                        참여완료
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>

                                {/* Bookmarks Section */}
                                <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">즐겨찾는 글 ⭐</h3>
                                    <div className="grid gap-3">
                                        {bookmarks?.map((bookmark: any) => (
                                            <Link to="#" key={bookmark.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-500">{bookmark.category}</span>
                                                    <span className="font-medium text-gray-700 group-hover:text-indigo-600">{bookmark.title}</span>
                                                </div>
                                                <span className="text-sm text-gray-400">{bookmark.date}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}
