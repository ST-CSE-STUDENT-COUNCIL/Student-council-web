import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { User, Lock, AlertCircle, Clock, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../../../store/useAuthStore'
import { authApi } from '../../../../lib/api/auth'
import { Turnstile } from '../../../../components/common/Turnstile'

export const Route = createFileRoute('/_main/(auth)/login/')({
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null)
  const [remainingDisplay, setRemainingDisplay] = useState<string>('')

  useEffect(() => {
    if (!blockedUntil) return

    const timer = setInterval(() => {
      const now = new Date()
      const diff = blockedUntil.getTime() - now.getTime()

      if (diff <= 0) {
        setBlockedUntil(null)
        setErrorMessage(null)
        setRemainingDisplay('')
        clearInterval(timer)
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setRemainingDisplay(`${minutes}분 ${seconds}초`)
    }, 1000)

    return () => clearInterval(timer)
  }, [blockedUntil])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (studentId.length < 8) {
      setErrorMessage('학번은 8자리 이상이어야 합니다.')
      return
    }

    if (!turnstileToken) {
      toast.error('보안 검증을 완료해주세요.')
      return
    }

    setIsLoading(true)

    try {
      const response = await authApi.login({
        student_id: studentId,
        password: password
      })

      login(response.data.user, response.data.access_token, rememberMe)
      navigate({ to: '/' })
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        const status = error.response.status
        const detail = error.response.data?.detail || ''

        if (status === 403) {
          // Check for block message
          // Backend format: "로그인이 일시 차단되었습니다. 약 10분 후 다시 시도해주세요."
          const match = detail.match(/약 (\d+)분/)
          if (match) {
            const minutes = parseInt(match[1])
            const unblockTime = new Date(Date.now() + minutes * 60 * 1000)
            setBlockedUntil(unblockTime)
            setRemainingDisplay(`${minutes}분 0초`)
            setErrorMessage(`로그인이 일시적으로 제한되었습니다.`)
          } else {
            setErrorMessage(detail || '접근이 거부되었습니다.')
          }
        } else if (status === 401) {
          setErrorMessage(detail || '학번 또는 비밀번호가 일치하지 않습니다.')
        } else if (status === 404) {
          setErrorMessage(detail || '등록되지 않은 학번입니다.')
        } else {
          navigate({ to: '/error' })
        }
      } else {
        console.error('Login failed:', error)
        navigate({ to: '/error' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-900">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex w-5/12 bg-[#0F172A] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/40 z-10" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />

        <div className="relative z-20 text-center px-12">
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
            Student Council
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            컴퓨터공학과 학생회 홈페이지에<br />오신 것을 환영합니다.
          </p>
        </div>
      </div>
      {/* Right Section - Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 sm:p-24 bg-white dark:bg-slate-900">
        <div className="w-full max-w-sm space-y-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">로그인</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              계정이 없으신가요?
              <Link to="/signup" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 ml-1">
                회원가입하기
              </Link>
            </p>
          </div>

          {blockedUntil && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-100 dark:border-red-800 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-red-500 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                    로그인 제한됨
                  </h3>
                  <div className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                    {remainingDisplay}
                  </div>
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400/80">
                    잠시 후 다시 시도해주세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {errorMessage && !blockedUntil && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 animate-in fade-in slide-in-from-top-2 duration-300 border border-red-100 dark:border-red-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                    {errorMessage}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">학번</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    className="block w-full pl-10 py-3 border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800"
                    placeholder="학번을 입력해주세요"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">비밀번호</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-10 pr-10 py-3 border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800"
                    placeholder="비밀번호를 입력해주세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-800 cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500 dark:text-gray-400">
                  로그인 유지
                </label>
              </div>
              <Link to="/reset-password" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                비밀번호 재설정
              </Link>
            </div>

            {/* Turnstile */}
            <div className="py-2">
              <Turnstile
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !turnstileToken}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-blue-600 disabled:opacity-50 transition-all active:scale-[0.99]"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
