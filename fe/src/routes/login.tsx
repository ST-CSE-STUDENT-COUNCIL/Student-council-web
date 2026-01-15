import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { isAxiosError } from 'axios'
import { User, Lock } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { authApi } from '../lib/api/auth'
import { Turnstile } from '../components/common/Turnstile'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!turnstileToken) {
      alert('보안 검증을 완료해주세요.')
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
      if (isAxiosError(error) && error.response?.status === 401) {
        alert('학번 또는 비밀번호가 일치하지 않습니다.')
      } else {
        console.error('Login failed:', error)
        alert('로그인 중 오류가 발생했습니다.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
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
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 sm:p-24 bg-white">
        <div className="w-full max-w-sm space-y-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">로그인</h2>
            <p className="mt-2 text-sm text-gray-500">
              계정이 없으신가요?
              <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-500 ml-1">
                회원가입하기
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">학번</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 py-3 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 focus:bg-white"
                    placeholder="학번을 입력해주세요"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-10 py-3 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 focus:bg-white"
                    placeholder="비밀번호를 입력해주세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
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
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500">
                  로그인 유지
                </label>
              </div>
              <Link to="/reset-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
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
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-all active:scale-[0.99]"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
