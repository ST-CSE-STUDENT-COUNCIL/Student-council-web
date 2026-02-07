import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { authApi } from '../lib/api/auth'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, Key, CheckCircle2, ChevronLeft, Mail, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { Turnstile } from '../components/common/Turnstile'

export const Route = createFileRoute('/reset-password')({
    component: ResetPassword,
})

function ResetPassword() {
    const navigate = useNavigate()
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [studentId, setStudentId] = useState('')
    const [maskedEmail, setMaskedEmail] = useState('')
    const [code, setCode] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
    const [timeLeft, setTimeLeft] = useState(0)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // 비밀번호 유효성 검사
    const passwordValidation = {
        minLength: password.length >= 8,
        hasNumber: /\d/.test(password),
        hasLetter: /[a-zA-Z]/.test(password),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
    }

    const isPasswordValid =
        passwordValidation.minLength &&
        passwordValidation.hasNumber &&
        passwordValidation.hasLetter &&
        passwordValidation.hasSpecialChar

    // 타이머 로직
    useEffect(() => {
        if (timeLeft <= 0) return

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft])

    // 시간 포맷 함수 (mm:ss)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // 이메일 마스킹 (예: ex***@seoultech.ac.kr)
    const maskEmail = (email: string) => {
        const [local, domain] = email.split('@')
        if (local.length <= 2) return email
        return `${local.slice(0, 2)}${'*'.repeat(Math.min(local.length - 2, 5))}@${domain}`
    }

    // Step 1: 학번으로 인증번호 발송
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault()
        if (studentId.length < 4) {
            toast.error('학번을 입력해주세요.')
            return
        }
        if (!turnstileToken) {
            toast.error('보안 검증을 완료해주세요.')
            return
        }
        setIsLoading(true)
        try {
            const result = await authApi.forgotPassword(studentId)
            setMaskedEmail(maskEmail(result.email))
            setStep(2)
            setTimeLeft(300) // 5분 타이머 시작
            toast.success(`${maskEmail(result.email)}로 인증번호가 발송되었습니다.`)
        } catch (error) {
            if (isAxiosError(error) && error.response?.data?.detail) {
                toast.error(error.response.data.detail)
            } else {
                toast.error('인증번호 발송에 실패했습니다.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Step 2: 인증번호 확인
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        if (code.length !== 6) {
            toast.error('6자리 인증번호를 입력해주세요.')
            return
        }
        if (timeLeft <= 0) {
            toast.error('인증 시간이 만료되었습니다. 처음부터 다시 시도해주세요.')
            return
        }
        setIsLoading(true)
        try {
            await authApi.verifyResetCode({ student_id: studentId, code })
            setStep(3)
        } catch (error) {
            if (isAxiosError(error) && error.response?.data?.detail) {
                toast.error(error.response.data.detail)
            } else {
                toast.error('인증번호가 올바르지 않습니다.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Step 3: 비밀번호 재설정
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast.error('비밀번호가 일치하지 않습니다.')
            return
        }
        if (!isPasswordValid) {
            toast.error('비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.')
            return
        }
        setIsLoading(true)
        try {
            await authApi.resetPassword({ student_id: studentId, new_password: password })
            toast.success('비밀번호가 성공적으로 변경되었습니다.')
            navigate({ to: '/login' })
        } catch (error) {
            console.error('Password reset failed:', error)
            if (isAxiosError(error) && error.response?.data?.detail) {
                toast.error(error.response.data.detail)
            } else {
                toast.error('비밀번호 변경에 실패했습니다.')
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
                        Reset<br />Password
                    </h1>
                    <p className="text-blue-100 text-lg leading-relaxed">
                        계정의 안전을 위해<br />새로운 비밀번호를 설정해주세요.
                    </p>
                </div>
            </div>

            {/* Right Section - Form */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-8 sm:p-24 bg-white dark:bg-slate-900">
                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="mb-10">
                        <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6 transition-colors group">
                            <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            로그인으로 돌아가기
                        </Link>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">비밀번호 재설정</h2>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {step === 1 && "가입한 학번을 입력해주세요."}
                            {step === 2 && (
                                <>
                                    <Mail className="inline-block w-4 h-4 mr-1" />
                                    {maskedEmail}로 전송된 인증번호를 입력해주세요.
                                </>
                            )}
                            {step === 3 && "새로운 비밀번호를 입력해주세요."}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-10">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-gray-900 dark:bg-blue-500' : 'bg-gray-100 dark:bg-slate-700'
                                    }`}
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSendCode}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">학번</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            maxLength={8}
                                            className="block w-full pl-10 py-3 border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800"
                                            placeholder="학번을 입력해주세요"
                                            value={studentId}
                                            onChange={(e) => setStudentId(e.target.value)}
                                        />
                                    </div>
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
                                    disabled={isLoading || !turnstileToken || studentId.length < 4}
                                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-blue-600 disabled:opacity-50 transition-all active:scale-[0.99]"
                                >
                                    {isLoading ? '전송 중...' : '인증번호 받기'}
                                </button>
                            </motion.form>
                        )}

                        {step === 2 && (
                            <motion.form
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleVerifyCode}
                                className="space-y-6"
                            >
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">인증번호</label>
                                        <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${timeLeft <= 60 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            <span>{timeLeft > 0 ? formatTime(timeLeft) : '만료됨'}</span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Key className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            className="block w-full pl-10 py-3 border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 text-lg tracking-widest transition-all bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800"
                                            placeholder="000000"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>
                                    <div className="mt-2 text-right">
                                        <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                                            학번 다시 입력하기
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading || code.length !== 6 || timeLeft <= 0}
                                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-blue-600 disabled:opacity-50 transition-all active:scale-[0.99]"
                                >
                                    {isLoading ? '확인 중...' : '인증하기'}
                                </button>
                            </motion.form>
                        )}

                        {step === 3 && (
                            <motion.form
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleResetPassword}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">새 비밀번호</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={8}
                                            className={`block w-full pl-10 pr-10 py-3 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 sm:text-sm transition-all bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 ${password.length > 0 && isPasswordValid
                                                ? 'border-green-500 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-900/30'
                                                : password.length > 0 && !isPasswordValid
                                                    ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-200 dark:focus:ring-amber-900/30'
                                                    : 'border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-900/30'
                                                }`}
                                            placeholder="8자 이상, 영문+숫자+특수문자"
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

                                    {/* Password Requirements */}
                                    {password.length > 0 && (
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <div className={`flex items-center gap-1.5 text-xs ${passwordValidation.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                <CheckCircle size={12} />
                                                8자 이상
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-xs ${passwordValidation.hasLetter ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                <CheckCircle size={12} />
                                                영문 포함
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-xs ${passwordValidation.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                <CheckCircle size={12} />
                                                숫자 포함
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                <CheckCircle size={12} />
                                                특수문자 포함
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">비밀번호 확인</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <CheckCircle2 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            className={`block w-full pl-10 pr-10 py-3 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 sm:text-sm transition-all bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 ${confirmPassword && password !== confirmPassword
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/30'
                                                : confirmPassword && password === confirmPassword
                                                    ? 'border-green-500 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-900/30'
                                                    : 'border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-900/30'
                                                }`}
                                            placeholder="새 비밀번호 확인"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {confirmPassword && password !== confirmPassword && (
                                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">비밀번호가 일치하지 않습니다.</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading || password !== confirmPassword || !isPasswordValid}
                                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-blue-600 disabled:opacity-50 transition-all active:scale-[0.99]"
                                >
                                    {isLoading ? '변경 중...' : '비밀번호 변경하기'}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
