import { createFileRoute } from '@tanstack/react-router'
import { ServerOff, RefreshCw, Mail } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/maintenance')({
    component: MaintenancePage,
})

function MaintenancePage() {
    const navigate = useNavigate()
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 px-4 transition-colors">
            <div className="max-w-md w-full text-center">
                <div className="mb-8 relative group">
                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="relative inline-flex items-center justify-center w-24 h-24 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-4 animate-pulse">
                        <ServerOff className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
                    서버 점검 중입니다
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                    안정적인 서비스를 위해 서버 점검을 진행하고 있습니다.<br className="hidden sm:block" />
                    잠시 후 다시 접속해주시기 바랍니다.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate({ to: '/' })}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-blue-600 text-white font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl active:scale-[0.98] duration-200"
                    >
                        <RefreshCw size={20} />
                        다시 접속하기
                    </button>
                    <a
                        href="mailto:seoultech.cs.42.compass@gmail.com"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        <Mail size={20} />
                        문의하기
                    </a>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        이용에 불편을 드려 죄송합니다.
                    </p>
                </div>
            </div>
        </div>
    )
}
