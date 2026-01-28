import { createFileRoute, Link } from '@tanstack/react-router'
import { Home, RefreshCw, AlertTriangle } from 'lucide-react'

export const Route = createFileRoute('/error')({
  component: ErrorPage,
})

function ErrorPage() {


  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-background) px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-foreground mb-4">
          오류가 발생했습니다
        </h2>

        <p className="text-foreground-secondary mb-8 leading-relaxed">
          예기치 않은 오류가 발생했습니다.<br />
          잠시 후 다시 시도해주세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-border-default text-foreground font-semibold rounded-xl hover:bg-surface-muted transition-colors shadow-sm"
          >
            <RefreshCw size={20} />
            새로고침
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-surface font-semibold rounded-xl hover:opacity-90 transition-colors shadow-sm"
          >
            <Home size={20} />
            홈으로 가기
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-border-default">
          <p className="text-sm text-foreground-secondary">
            문제가 계속되면{' '}
            <a href="mailto:seoultech.cs.42.compass@gmail.com" className="text-blue-600 hover:text-blue-700 font-medium">
              학생회에 문의
            </a>
            해주세요.
          </p>
        </div>
      </div>
    </div>
  )
}
