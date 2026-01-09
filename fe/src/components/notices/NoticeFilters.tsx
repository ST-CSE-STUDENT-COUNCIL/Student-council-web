import type { ChangeEvent } from 'react';

type NoticeFiltersProps = {
    mainCategory: string;
    onMainCategoryChange: (category: string) => void;
    subCategory: string;
    onSubCategoryChange: (category: string) => void;
    search: string;
    onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
    sort: string;
    onSortChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

export const NoticeFilters = ({
    mainCategory,
    onMainCategoryChange,
    subCategory,
    onSubCategoryChange,
    search,
    onSearchChange,
    sort,
    onSortChange
}: NoticeFiltersProps) => {

    // Main Categories
    const mainCategories = [
        { value: 'student_council', label: '학생회' },
        { value: 'democracy', label: '민주자치' }
    ];

    // Sub Categories based on Main Category selection
    const subCategories = mainCategory === 'student_council'
        ? [
            { value: 'all', label: '전체보기' },
            { value: 'event', label: '행사' },
            { value: 'welfare', label: '복지' }
        ]
        : [
            { value: 'all', label: '전체보기' },
            { value: 'announcement', label: '공고' },
            { value: 'notice', label: '고시' },
            { value: 'meeting', label: '대표자회의' },
            { value: 'rules', label: '학생회칙' }
        ];

    return (
        <div className="flex flex-col items-center w-full mb-10">
            {/* Main Category Buttons */}
            <div className="flex gap-4 mb-6 bg-gray-50 p-2 rounded-2xl">
                {mainCategories.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => {
                            onMainCategoryChange(cat.value);
                            onSubCategoryChange('all'); // Reset sub category when main changes
                        }}
                        className={`px-8 py-3 rounded-xl font-bold transition-all duration-200 text-lg ${mainCategory === cat.value
                            ? 'bg-blue-600 text-white shadow-lg scale-105'
                            : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Sub Category Links */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
                {subCategories.map((sub) => (
                    <button
                        key={sub.value}
                        onClick={() => onSubCategoryChange(sub.value)}
                        className={`text-base font-medium transition-colors relative py-1 ${subCategory === sub.value
                            ? 'text-blue-600'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        {sub.label}
                        {subCategory === sub.value && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Search and Sort */}
            <div className="w-full flex flex-col md:flex-row gap-4 max-w-4xl">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-full leading-5 bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="검색어를 입력하세요 (예: 장학금, 행사)"
                        value={search}
                        onChange={onSearchChange}
                    />
                </div>

                <div className="relative shrink-0 w-full md:w-40">
                    <select
                        value={sort}
                        onChange={onSortChange}
                        className="appearance-none block w-full pl-4 pr-10 py-3 border border-gray-200 rounded-full text-base font-medium text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:border-blue-400 transition-colors"
                    >
                        <option value="newest">최신순</option>
                        <option value="oldest">오래된순</option>

                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};
