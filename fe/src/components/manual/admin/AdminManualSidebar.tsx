import { useEffect, useState, useRef } from 'react'
import { MANUAL_GROUPS } from './AdminManualConstants'

interface AdminManualSidebarProps {
    activePart: 'user' | 'admin' | 'frontend' | 'backend'
}

export const AdminManualSidebar = ({ activePart }: AdminManualSidebarProps) => {
    const [activeSection, setActiveSection] = useState('')
    const observer = useRef<IntersectionObserver | null>(null)

    // 탭 변경 시 스크롤 초기화 및 첫 섹션 활성화
    useEffect(() => {
        const container = document.getElementById('manual-scroll-container')
        if (container) container.scrollTo(0, 0)

        const group = MANUAL_GROUPS.find(g => g.id === activePart)
        if (group && group.sections.length > 0) {
            setActiveSection(group.sections[0].id)
        }
    }, [activePart])

    useEffect(() => {
        const container = document.getElementById('manual-scroll-container')
        if (!container) return

        observer.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id)
                    }
                })
            },
            {
                root: container,
                rootMargin: '-10% 0px -80% 0px',
                threshold: 0,
            }
        )

        // 현재 탭에 해당하는 섹션만 관찰
        const currentGroup = MANUAL_GROUPS.find(g => g.id === activePart)
        if (currentGroup) {
            currentGroup.sections.forEach((section) => {
                const element = document.getElementById(section.id)
                if (element) observer.current?.observe(element)
            })
        }

        return () => observer.current?.disconnect()
    }, [activePart])

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id)
        const container = document.getElementById('manual-scroll-container')

        if (element && container) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    const currentGroup = MANUAL_GROUPS.find(g => g.id === activePart)

    if (!currentGroup) return null

    return (
        <aside className="w-full h-full overflow-y-auto hidden xl:block shrink-0 relative p-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-6 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-gray-900 dark:bg-gray-100 rounded-full"></span>
                목차
            </h3>

            <nav className="space-y-8">
                <div>
                    <div className={`flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider ${currentGroup.color}`}>
                        <currentGroup.icon className="w-4 h-4" />
                        {currentGroup.title}
                    </div>
                    <div className="space-y-1 pl-2 border-l-2 border-gray-100 dark:border-slate-800">
                        {currentGroup.sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`block w-full text-left px-3 py-2 text-sm rounded-r-md transition-all duration-200 border-l-2 -ml-[2px] ${activeSection === section.id
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                {section.title}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>
        </aside>
    )
}
