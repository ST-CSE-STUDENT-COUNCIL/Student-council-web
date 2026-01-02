import Layout from "../components/Layout";
import { useState } from "react";

import { MOCK_CLUBS } from "../mocks/data";

export default function Clubs() {
    const [selectedCategory, setSelectedCategory] = useState("전체");

    const categories = ["전체", ...Array.from(new Set(MOCK_CLUBS.map(club => club.category)))];

    const filteredClubs = selectedCategory === "전체"
        ? MOCK_CLUBS
        : MOCK_CLUBS.filter(club => club.category === selectedCategory);

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">소모임 / 동아리</h1>
                    <p className="text-xl text-gray-500">컴퓨터공학과의 다양한 학술 동아리를 소개합니다.</p>
                </div>

                {/* Category Filter */}
                <div className="flex justify-center gap-2 mb-12 flex-wrap">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${selectedCategory === category
                                ? "bg-indigo-600 text-white shadow-lg transform -translate-y-0.5"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Clubs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredClubs.map((club) => (
                        <div key={club.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                            <div className="h-48 bg-gray-50 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform duration-300">
                                {club.image}
                            </div>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-2xl font-bold text-gray-900">{club.name}</h3>
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                                        {club.category}
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-6 line-clamp-2 h-12">
                                    {club.description}
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span className="mr-2">🕒</span>
                                        {club.meetingTime}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {club.tags.map((tag) => (
                                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <button className="w-full mt-6 py-3 rounded-xl border border-indigo-600 text-indigo-600 font-bold hover:bg-indigo-600 hover:text-white transition-colors duration-200">
                                    가입 문의하기
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
