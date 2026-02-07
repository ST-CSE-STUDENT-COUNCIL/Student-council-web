import { Link } from '@tanstack/react-router'

export const navItems = [
    { to: '/intro', label: '학생회 소개' },
    { to: '/activities', label: '신청' },
    {
        to: '/notices',
        label: '공지사항',
        search: {
            mainCategory: 'student_council',
            subCategory: 'all',
            search: '',
            sort: 'newest',
            page: 1
        }
    },
    { to: '/welfare', label: '복지' },
    { to: '/clubs', label: '동아리' },
    { to: '/suggestion', label: '건의함' },
]

export default function Menu() {
    return (
        <nav className="flex items-center space-x-1">
            {navItems.map((item) => (
                <Link
                    key={item.to}
                    to={item.to}
                    search={item.search}
                    activeOptions={{ includeSearch: false }}
                    className="relative px-4 py-2 text-sm font-medium text-gray-500 rounded-full transition-all duration-200 hover:text-indigo-600 hover:bg-indigo-50 [&.active]:text-indigo-700 [&.active]:bg-indigo-50"
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    )
}
