import { Link } from '@tanstack/react-router'

export default function Menu() {
    return (
        <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
                to="/intro"
                className="transition-colors hover:text-blue-600 [&.active]:text-blue-600 [&.active]:font-bold"
            >
                학생회 소개
            </Link>
            <Link
                to="/events"
                className="transition-colors hover:text-blue-600 [&.active]:text-blue-600 [&.active]:font-bold"
            >
                행사
            </Link>
            <Link
                to="/notice"
                className="transition-colors hover:text-blue-600 [&.active]:text-blue-600 [&.active]:font-bold"
            >
                공지사항
            </Link>
            <Link
                to="/welfare"
                className="transition-colors hover:text-blue-600 [&.active]:text-blue-600 [&.active]:font-bold"
            >
                복지
            </Link>
            <Link
                to="/clubs"
                className="transition-colors hover:text-blue-600 [&.active]:text-blue-600 [&.active]:font-bold"
            >
                동아리
            </Link>
            <Link
                to="/suggestion"
                className="transition-colors hover:text-blue-600 [&.active]:text-blue-600 [&.active]:font-bold"
            >
                건의함
            </Link>
        </nav>
    )
}
