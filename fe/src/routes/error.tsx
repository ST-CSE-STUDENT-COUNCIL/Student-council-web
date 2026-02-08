import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { Home, AlertTriangle, RefreshCw } from 'lucide-react'
import { type ErrorComponentProps } from '@tanstack/react-router'

export const Route = createFileRoute('/error')({
  component: ErrorPage,
})

export function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 px-4 transition-colors">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 relative group">
          <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative inline-flex items-center justify-center w-24 h-24 bg-red-50 dark:bg-red-900/30 rounded-full mb-4 animate-pulse">
            <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
          오류가 발생했습니다
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          {error?.message || '예기치 않은 오류가 발생했습니다.'}<br />
          잠시 후 다시 시도해주세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {reset ? (
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-red-600 text-white font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl active:scale-[0.98] duration-200"
            >
              <RefreshCw size={20} />
              다시 시도하기
            </button>
          ) : (
            <button
              onClick={() => router.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <RefreshCw size={20} />
              이전 페이지
            </button>
          )}

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Home size={20} />
            홈으로 가기
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            문제가 계속되면{' '}
            <a href="mailto:seoultech.cs.42.compass@gmail.com" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
              학생회에 문의
            </a>
            해주세요.
          </p>
        </div>
      </div>
    </div>
  )
}

function ErrorPage() {
  const router = useRouter()
  return <ErrorComponent error={new Error('예기치 않은 오류가 발생했습니다.')} reset={() => router.navigate({ to: '/' })} />
}
