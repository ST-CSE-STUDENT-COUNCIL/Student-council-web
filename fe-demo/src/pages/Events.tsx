import Layout from "../components/Layout";
import { useQuery } from '@tanstack/react-query';
// import api from '../api/axios';
import { MOCK_EVENTS } from "../mocks/data";

export default function Events() {
    const { data: events } = useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            // const res = await api.get('/events');
            // return res.data;
            return MOCK_EVENTS;
        }
    });

    return (
        <Layout>
            <div className="flex flex-col gap-10 bg-gray-50 min-h-screen py-10 items-center">
                <div className="w-full max-w-4xl px-4">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center md:text-left">행사 알림</h1>

                    <div className="grid gap-6">
                        {events?.map((event: any) => (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow" key={event.id}>
                                <div className="w-full md:w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center text-6xl flex-shrink-0">
                                    {event.image || '📅'}
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between mb-2">
                                            <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
                                            {event.status === 'wip' && (
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">진행중</span>
                                            )}
                                            {event.status === 'planned' && (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">예정</span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                            <span className="flex items-center gap-1">
                                                📅 {event.date}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                        >
                                            자세히 보기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
} 