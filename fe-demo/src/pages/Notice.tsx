import Layout from "../components/Layout";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
// import api from "../api/axios";
import { MOCK_NOTICES } from "../mocks/data";

export default function Notice() {
    const [selectedCategory, setSelectedCategory] = useState('학생회 행사');
    const [selectedSubCategory, setSelectedSubCategory] = useState('전체보기');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: notices } = useQuery({
        queryKey: ['notices'],
        queryFn: async () => {
            // const res = await api.get('/notices');
            // return res.data;
            return MOCK_NOTICES;
        }
    });

    const filteredNotices = notices?.filter((notice: any) => {
        const matchesSearch = notice.title.includes(searchTerm) || (notice.description && notice.description.includes(searchTerm));
        let matchesCategory = true;

        if (selectedCategory === '학생회') {
            if (selectedSubCategory === '전체보기') {
                matchesCategory = ['행사', '복지', '학과소식', '공지'].includes(notice.type);
            } else {
                matchesCategory = notice.type === selectedSubCategory;
            }
        } else if (selectedCategory === '민주자치') {
            if (selectedSubCategory === '전체보기') {
                matchesCategory = ['공고', '고시', '대표자회의', '학생회칙', '선거'].includes(notice.type);
            } else {
                matchesCategory = notice.type === selectedSubCategory;
            }
        }

        return matchesSearch && matchesCategory;
    });

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">공지사항</h1>

                {/* Category Selection */}
                <div className="flex flex-col gap-6 mb-10">
                    <ul className="flex justify-center gap-4 bg-gray-100 p-2 rounded-2xl w-max mx-auto">
                        {['학생회', '민주자치'].map((category) => (
                            <li
                                key={category}
                                className={`cursor-pointer px-6 py-3 rounded-xl font-bold transition-all duration-200 ${selectedCategory === category
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-200'
                                    }`}
                                onClick={() => {
                                    setSelectedCategory(category);
                                    setSelectedSubCategory('전체보기'); // Reset subcategory
                                }}
                            >
                                {category}
                            </li>
                        ))}
                    </ul>

                    <div className="flex justify-center">
                        <ul className="flex flex-wrap justify-center gap-2">
                            {(selectedCategory === '학생회 행사' ? ['전체보기', '행사', '복지', '학과소식'] : ['전체보기', '공고', '고시', '대표자회의', '학생회칙']).map((category) => (
                                <li
                                    key={category}
                                    className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedSubCategory === category
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                        }`}
                                    onClick={() => setSelectedSubCategory(category)}
                                >
                                    {category}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-8 relative">
                    <input
                        type="text"
                        placeholder="검색어를 입력하세요 (예: 장학금, 행사)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                    <svg className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Notice List */}
                <div className="space-y-4">
                    {(filteredNotices?.length ?? 0) > 0 ? (
                        filteredNotices?.map((notice: any) => (
                            <div key={notice.id} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${notice.type === '공고' ? 'bg-red-100 text-red-600' :
                                            notice.type === '행사' ? 'bg-purple-100 text-purple-600' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {notice.type}
                                        </span>
                                        <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{notice.title}</h2>
                                    </div>
                                    <span className="text-sm text-gray-400">{notice.date}</span>
                                </div>
                                {notice.description && <p className="text-gray-600 text-sm line-clamp-1 pl-1">{notice.description}</p>}
                                {notice.file && (
                                    <div className="mt-2 pl-1">
                                        <a
                                            href={notice.file}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            📄 회칙 PDF 보기
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            검색 결과가 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}