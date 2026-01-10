import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authApi } from '../lib/api/auth'
import { isAxiosError } from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Key, CheckCircle2, ChevronLeft } from 'lucide-react'

export const Route = createFileRoute('/reset-password')({
    component: ResetPassword,
})

function ResetPassword() {
    const navigate = useNavigate()
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Step 1: Send Verification Code
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.endsWith('@seoultech.ac.kr')) {
            alert('서울과기대 이메일(@seoultech.ac.kr)을 입력해주세요.')
            return
        }
        setIsLoading(true)
        try {
            await authApi.sendVerification(email)
            setStep(2)
            alert('인증번호가 발송되었습니다.')
        } catch (error) {
            alert('인증번호 발송에 실패했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    // Step 2: Verify Code
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        if (code.length !== 6) {
            alert('6자리 인증번호를 입력해주세요.')
            return
        }
        setIsLoading(true)
        try {
            await authApi.verifyEmail({ email, code })
            setStep(3)
        } catch (error) {
            alert('인증번호가 올바르지 않습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    // Step 3: Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.')
            return
        }
        setIsLoading(true)
        try {
            await authApi.resetPassword({ email, new_password: password })
            alert('비밀번호가 성공적으로 변경되었습니다.')
            navigate({ to: '/login' })
        } catch (error) {
            console.error('Password reset failed:', error)
            if (isAxiosError(error) && error.response?.data?.detail) {
                alert(error.response.data.detail)
            } else {
                alert('비밀번호 변경에 실패했습니다.')
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
                        Reset<br />Password
                    </h1>
                    <p className="text-blue-100 text-lg leading-relaxed">
                        계정의 안전을 위해<br />새로운 비밀번호를 설정해주세요.
                    </p>
                </div>
            </div>

            {/* Right Section - Form */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-8 sm:p-24 bg-white">
                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="mb-10">
                        <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors group">
                            <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            로그인으로 돌아가기
                        </Link>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">비밀번호 재설정</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            {step === 1 && "가입한 이메일 주소를 입력해주세요."}
                            {step === 2 && "이메일로 전송된 인증번호를 입력해주세요."}
                            {step === 3 && "새로운 비밀번호를 입력해주세요."}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-10">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-gray-900' : 'bg-gray-100'
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            className="block w-full pl-10 py-3 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 focus:bg-white"
                                            placeholder="example@seoultech.ac.kr"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-all active:scale-[0.99]"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">인증번호</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Key className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            className="block w-full pl-10 py-3 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 text-lg tracking-widest transition-all bg-gray-50 focus:bg-white"
                                            placeholder="000000"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                        />
                                    </div>
                                    <div className="mt-2 text-right">
                                        <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                            이메일 다시 입력하기
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-all active:scale-[0.99]"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            className="block w-full pl-10 py-3 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 focus:bg-white"
                                            placeholder="새 비밀번호 입력"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <CheckCircle2 className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            className="block w-full pl-10 py-3 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 focus:bg-white"
                                            placeholder="새 비밀번호 확인"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-all active:scale-[0.99]"
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
