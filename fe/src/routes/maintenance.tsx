import { createFileRoute } from '@tanstack/react-router'
import { ServerOff, RefreshCw, Mail } from 'lucide-react'

export const Route = createFileRoute('/maintenance')({
    component: MaintenancePage,
})

function MaintenancePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-4 animate-pulse">
                        <ServerOff className="w-12 h-12 text-blue-600" />
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    서버 점검 중입니다
                </h2>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    안정적인 서비스를 위해 서버 점검을 진행하고 있습니다.<br />
                    잠시 후 다시 접속해주시기 바랍니다.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        <RefreshCw size={20} />
                        다시 접속하기
                    </button>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
                        <p>점검이 장시간 지속되면 아래로 문의해주세요.</p>
                        <a
                            href="mailto:seoultech.cs.42.compass@gmail.com"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <Mail size={16} />
                            학생회에 문의하기
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
