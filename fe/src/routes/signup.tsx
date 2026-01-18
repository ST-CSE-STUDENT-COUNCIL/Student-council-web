import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { authApi } from '../lib/api/auth'
import { isAxiosError } from 'axios'
import { PhoneInput } from '../components/common/PhoneInput'
import { Turnstile } from '../components/common/Turnstile'
import { CheckCircle } from 'lucide-react'

export const Route = createFileRoute('/signup')({
    component: SignUp,
})

function SignUp() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        name: '',
        student_id: '',
        email: '',
        phone: '',
        password: '',
        password_confirm: '',
        department: '컴퓨터공학과',
    })

    // Verification States
    const [verificationStep, setVerificationStep] = useState<'idle' | 'sent' | 'verified'>('idle')
    const [verificationCode, setVerificationCode] = useState('')
    const [isEmailVerified, setIsEmailVerified] = useState(false)
    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)

    // Timer States (5분 = 300초)
    const [timeLeft, setTimeLeft] = useState(0)
    const [canResend, setCanResend] = useState(false)

    // Student ID Check States
    const [isStudentIdChecking, setIsStudentIdChecking] = useState(false)
    const [isStudentIdAvailable, setIsStudentIdAvailable] = useState<boolean | null>(null)

    // Turnstile State
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

    // 타이머 로직
    useEffect(() => {
        if (timeLeft <= 0) {
            if (verificationStep === 'sent') {
                setCanResend(true)
            }
            return
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft, verificationStep])

    // 시간 포맷 함수 (mm:ss)
    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }, [])

    // 비밀번호 일치 여부 확인
    const passwordsMatch = formData.password === formData.password_confirm
    const showPasswordError = formData.password_confirm.length > 0 && !passwordsMatch

    // 비밀번호 유효성 검사
    const passwordValidation = {
        minLength: formData.password.length >= 8,
        hasNumber: /\d/.test(formData.password),
        hasLetter: /[a-zA-Z]/.test(formData.password),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(formData.password)
    }

    const isPasswordValid =
        passwordValidation.minLength &&
        passwordValidation.hasNumber &&
        passwordValidation.hasLetter &&
        passwordValidation.hasSpecialChar

    const checkStudentId = async () => {
        if (formData.student_id.length < 4) return // 최소 길이 체크

        setIsStudentIdChecking(true)
        try {
            const result = await authApi.checkStudentId(formData.student_id)
            setIsStudentIdAvailable(result.available)
            if (!result.available) {
                alert(result.message)
            }
        } catch (error) {
            console.error('Student ID check failed:', error)
            alert('학번 중복 확인 중 오류가 발생했습니다.')
        } finally {
            setIsStudentIdChecking(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const sendVerificationEmail = async () => {
        if (!formData.email.endsWith('@seoultech.ac.kr')) {
            alert('서울과기대 이메일(@seoultech.ac.kr)을 입력해주세요.')
            return
        }

        setIsSendingEmail(true)
        try {
            await authApi.sendVerification(formData.email)
            setVerificationStep('sent')
            setTimeLeft(300) // 5분 타이머 시작
            setCanResend(false)
            alert('인증번호가 발송되었습니다. 이메일을 확인해주세요.')
        } catch (error) {
            console.error('Email send failed:', error)
            if (isAxiosError(error) && error.response?.data?.detail) {
                const detail = error.response.data.detail
                // 이미 인증된 이메일인 경우 자동 처리
                if (typeof detail === 'string' && detail.includes('이미 인증 완료된 이메일입니다')) {
                    setIsEmailVerified(true)
                    setVerificationStep('verified')
                    setTimeLeft(0)
                    alert('이미 인증된 이메일입니다. 회원가입을 계속 진행해주세요.')
                } else {
                    alert(detail)
                }
            } else {
                alert('인증번호 발송에 실패했습니다.')
            }
        } finally {
            setIsSendingEmail(false)
        }
    }

    const resendVerificationEmail = async () => {
        setIsSendingEmail(true)
        try {
            await authApi.sendVerification(formData.email)
            setTimeLeft(300) // 5분 타이머 재시작
            setCanResend(false)
            setVerificationCode('')
            alert('인증번호가 재발송되었습니다.')
        } catch (error) {
            console.error('Email resend failed:', error)
            if (isAxiosError(error) && error.response?.data?.detail) {
                alert(error.response.data.detail)
            } else {
                alert('인증번호 재발송에 실패했습니다.')
            }
        } finally {
            setIsSendingEmail(false)
        }
    }

    const verifyCode = async () => {
        if (verificationCode.length !== 6) {
            alert('6자리 인증번호를 입력해주세요.')
            return
        }

        if (timeLeft <= 0) {
            alert('인증 시간이 만료되었습니다. 인증번호를 재발송해주세요.')
            return
        }

        setIsVerifying(true)
        try {
            await authApi.verifyEmail({
                email: formData.email,
                code: verificationCode
            })
            setIsEmailVerified(true)
            setVerificationStep('verified')
            setTimeLeft(0)
            alert('이메일 인증이 완료되었습니다.')
        } catch (error) {
            console.error('Verification failed:', error)
            if (isAxiosError(error) && error.response?.data?.detail) {
                alert(error.response.data.detail)
            } else {
                alert('인증번호 확인에 실패했습니다.')
            }
        } finally {
            setIsVerifying(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!passwordsMatch) {
            alert('비밀번호가 일치하지 않습니다.')
            return
        }

        if (!isPasswordValid) {
            alert('비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.')
            return
        }

        if (isStudentIdAvailable !== true) {
            alert('학번 중복 확인을 완료해주세요.')
            return
        }

        if (!isEmailVerified) {
            alert('이메일 인증을 완료해주세요.')
            return
        }

        if (!turnstileToken) {
            alert('보안 검증을 완료해주세요.')
            return
        }

        try {
            await authApi.signup({
                name: formData.name,
                student_id: formData.student_id,
                email: formData.email,
                phone: formData.phone.replace(/-/g, ''), // Remove hyphens
                password: formData.password,
                department: formData.department
            })
            alert('회원가입이 완료되었습니다. 로그인해주세요.')
            navigate({ to: '/login' })
        } catch (error) {
            console.error('Registration failed:', error)
            if (isAxiosError(error) && error.response?.data?.detail) {
                alert(error.response.data.detail)
            } else {
                alert('회원가입에 실패했습니다.')
            }
        }
    }

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Section - Branding */}
            <div className="hidden lg:flex w-5/12 bg-[#0F172A] relative overflow-hidden items-center justify-center sticky top-0 h-screen">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/40 z-10" />
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />

                <div className="relative z-20 text-center px-12">
                    <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
                        Student Council
                    </h1>
                    <p className="text-blue-100 text-lg leading-relaxed">
                        회원가입을 통해 다양한 혜택을 누리세요!
                    </p>
                </div>
            </div>

            {/* Right Section - Form */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white overflow-y-auto">
                <div className="w-full max-w-xl space-y-10">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">회원가입</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            이미 계정이 있으신가요?
                            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 ml-1">
                                로그인하기
                            </Link>
                        </p>
                    </div>

                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                            {/* Name */}
                            <div className="sm:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="block w-full px-4 py-3 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 focus:bg-white"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="홍길동"
                                />
                            </div>

                            {/* Department */}
                            <div className="sm:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">학과</label>
                                <input
                                    type="text"
                                    name="department"
                                    required
                                    className="block w-full px-4 py-3 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 focus:bg-white"
                                    value={formData.department}
                                    onChange={handleChange}
                                    placeholder="컴퓨터공학과"
                                />
                            </div>

                            {/* Student ID */}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">학번</label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            name="student_id"
                                            required
                                            maxLength={8}
                                            className={`block w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 sm:text-sm transition-all bg-gray-50 focus:bg-white ${isStudentIdAvailable === true ? 'border-green-500 focus:border-green-500 focus:ring-green-200' :
                                                isStudentIdAvailable === false ? 'border-red-500 focus:border-red-500 focus:ring-red-200' :
                                                    'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                                                }`}
                                            value={formData.student_id}
                                            onChange={(e) => {
                                                handleChange(e)
                                                setIsStudentIdAvailable(null)
                                            }}
                                            placeholder="8자리 학번 입력"
                                        />
                                        {isStudentIdAvailable === true && (
                                            <div className="absolute right-3 top-3.5 text-green-500">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={checkStudentId}
                                        disabled={formData.student_id.length < 8 || isStudentIdChecking}
                                        className="whitespace-nowrap px-6 py-3 border border-transparent rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isStudentIdChecking ? '확인중' : '중복확인'}
                                    </button>
                                </div>
                                {isStudentIdAvailable === false && (
                                    <p className="mt-2 text-sm text-red-600">🚫 이미 가입된 학번입니다.</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">이메일 (@seoultech.ac.kr)</label>
                                <div className="flex gap-3">
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        disabled={isEmailVerified}
                                        className="block w-full px-4 py-3 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="example@seoultech.ac.kr"
                                    />
                                    <button
                                        type="button"
                                        onClick={sendVerificationEmail}
                                        disabled={isEmailVerified || isSendingEmail || !formData.email}
                                        className={`whitespace-nowrap px-6 py-3 border border-transparent rounded-xl text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isEmailVerified ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                    >
                                        {isSendingEmail ? '발송중...' : (isEmailVerified ? '인증완료' : '인증번호 발송')}
                                    </button>
                                </div>
                            </div>

                            {/* Verification Code */}
                            {verificationStep === 'sent' && (
                                <div className="sm:col-span-2 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-medium text-blue-900">인증번호 확인</label>
                                        {/* 타이머 표시 */}
                                        <div className={`flex items-center gap-2 text-sm font-mono font-bold ${timeLeft <= 60 ? 'text-red-600' : 'text-blue-600'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>{formatTime(timeLeft)}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            className="block w-full px-4 py-3 border-blue-200 rounded-xl text-blue-900 placeholder-blue-300 focus:ring-blue-500 focus:border-blue-500 sm:text-lg tracking-widest transition-all bg-white"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000"
                                        />
                                        <button
                                            type="button"
                                            onClick={verifyCode}
                                            disabled={isVerifying || timeLeft <= 0}
                                            className="whitespace-nowrap px-6 py-3 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
                                        >
                                            {isVerifying ? '확인중' : '확인'}
                                        </button>
                                    </div>

                                    {/* 안내 메시지 및 재전송 버튼 */}
                                    <div className="mt-3 flex items-center justify-between">
                                        <p className="text-sm text-blue-600">
                                            {timeLeft > 0
                                                ? '이메일로 전송된 6자리 인증번호를 입력해주세요.'
                                                : '⏰ 인증 시간이 만료되었습니다.'}
                                        </p>
                                        {(canResend || timeLeft <= 0) && (
                                            <button
                                                type="button"
                                                onClick={resendVerificationEmail}
                                                disabled={isSendingEmail}
                                                className="text-sm font-semibold text-blue-700 hover:text-blue-800 underline underline-offset-2 disabled:opacity-50"
                                            >
                                                {isSendingEmail ? '발송중...' : '재전송'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Phone */}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                                <div className="pb-6">
                                    <PhoneInput
                                        value={formData.phone}
                                        onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                                        required
                                        showValidation={true}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="sm:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        minLength={8}
                                        className={`block w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 sm:text-sm transition-all bg-gray-50 focus:bg-white ${formData.password.length > 0 && isPasswordValid
                                            ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
                                            : formData.password.length > 0 && !isPasswordValid
                                                ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-200'
                                                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                                            }`}
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="8자 이상, 영문+숫자+특수문자"
                                    />

                                    {/* Password Requirements */}
                                    {formData.password.length > 0 && (
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <div className={`flex items-center gap-1.5 text-xs ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                                                <CheckCircle size={12} />
                                                8자 이상
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-xs ${passwordValidation.hasLetter ? 'text-green-600' : 'text-gray-400'}`}>
                                                <CheckCircle size={12} />
                                                영문 포함
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-xs ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                                                <CheckCircle size={12} />
                                                숫자 포함
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
                                                <CheckCircle size={12} />
                                                특수문자 포함
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            name="password_confirm"
                                            required
                                            className={`block w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 sm:text-sm transition-all bg-gray-50 focus:bg-white ${showPasswordError
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                                                : formData.password_confirm && passwordsMatch
                                                    ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
                                                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                                                }`}
                                            value={formData.password_confirm}
                                            onChange={handleChange}
                                            placeholder="비밀번호 재입력"
                                        />
                                        {/* 일치/불일치 아이콘 */}
                                        {formData.password_confirm && (
                                            <div className={`absolute right-3 top-3.5 ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                                                {passwordsMatch ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {/* 불일치 메시지 */}
                                    {showPasswordError && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            비밀번호가 일치하지 않습니다
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Turnstile */}
                            <div className="sm:col-span-2 py-2">
                                <Turnstile
                                    onVerify={(token) => setTurnstileToken(token)}
                                    onExpire={() => setTurnstileToken(null)}
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={!isEmailVerified || isStudentIdAvailable !== true || showPasswordError || !isPasswordValid || !passwordsMatch || !turnstileToken}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
                            >
                                가입하기
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

