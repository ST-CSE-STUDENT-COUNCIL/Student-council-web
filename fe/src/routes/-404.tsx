import { Link } from '@tanstack/react-router'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-800 select-none">404</h1>
          <div className="relative -mt-12">
            <div className="text-6xl ">🔍</div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          페이지를 찾을 수 없습니다
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.<br />
          주소를 다시 확인해주세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
            이전 페이지
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-blue-600 text-white font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Home size={20} />
            홈으로 가기
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            문제가 계속되면{' '}
            <a href="mailto:seoultech.cs.42.compass@gmail.com" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              학생회에 문의
            </a>
            해주세요.
          </p>
        </div>
      </div>
    </div>
  )
}
