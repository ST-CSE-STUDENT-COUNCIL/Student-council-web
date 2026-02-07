import { Link, useLocation } from '@tanstack/react-router'
import { LayoutDashboard, Megaphone, Calendar, Gift, Users, FileText, MessageSquare, BarChart3, MessageCircle, Shield, UserRoundPen, ClipboardList } from 'lucide-react'

export const ADMIN_MENU_ITEMS = [
    { label: '대시보드', href: '/admin', icon: LayoutDashboard },
    { label: '프로필 변경 요청', href: '/admin/profile-updates', icon: UserRoundPen },
    { label: '회장 정보 관리', href: '/admin/privacy-officer', icon: Shield },
    { label: '학생회 소개', href: '/admin/intro', icon: FileText },
    { label: '공지사항 관리', href: '/admin/notices', icon: Megaphone },
    { label: '행사·공지 신청', href: '/admin/events', icon: Calendar },
    { label: '출석 관리', href: '/admin/attendance', icon: ClipboardList },
    { label: '수요조사·설문조사', href: '/admin/surveys', icon: BarChart3 },
    { label: '카톡방 초대', href: '/admin/kakaotalk', icon: MessageCircle },
    { label: '복지 사업 관리', href: '/admin/welfare', icon: Gift },
    { label: '동아리 관리', href: '/admin/clubs', icon: Users },
    { label: '건의함 관리', href: '/admin/suggestions', icon: MessageSquare },
]

export const AdminSidebar = () => {
    const location = useLocation()

    return (
        <aside className="w-64 bg-slate-900 min-h-screen text-white shrink-0 hidden md:block">
            <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>🛡️ 관리자 페이지</span>
                </h2>
            </div>

            <nav className="p-4 space-y-1">
                {ADMIN_MENU_ITEMS.map((item) => {
                    const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href))
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
