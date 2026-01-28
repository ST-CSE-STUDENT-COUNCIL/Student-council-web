import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authApi } from '../lib/api/auth'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'

import { PhoneInput } from '../components/common/PhoneInput'
import { Turnstile } from '../components/common/Turnstile'
import { signupFormSchema, type SignupFormData } from '../schemas/auth'
import { useEmailVerification } from '../hooks/useEmailVerification'
import { useStudentIdCheck } from '../hooks/useStudentIdCheck'

export const Route = createFileRoute('/signup')({
    component: SignUp,
})

function SignUp() {
    const navigate = useNavigate()
    const [step, setStep] = useState<'agreement' | 'form'>('agreement')
    const [agreements, setAgreements] = useState({
        terms: false,
        privacy: false,
    })
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
    const [verificationCode, setVerificationCode] = useState('')

    // react-hook-form with zod
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupFormSchema),
        defaultValues: {
            name: '',
            student_id: '',
            emailPrefix: '',
            phone: '',
            password: '',
            password_confirm: '',
            department: '컴퓨터공학과',
        },
        mode: 'onChange',
    })

    const watchedPassword = watch('password')
    const watchedPasswordConfirm = watch('password_confirm')
    const watchedEmailPrefix = watch('emailPrefix')
    const watchedStudentId = watch('student_id')

    // Custom hooks
    const getFullEmail = useCallback(() => {
        return watchedEmailPrefix ? `${watchedEmailPrefix}@seoultech.ac.kr` : ''
    }, [watchedEmailPrefix])

    const emailVerification = useEmailVerification(getFullEmail)
    const studentIdCheck = useStudentIdCheck()

    // Password validation display
    const passwordValidation = {
        minLength: watchedPassword?.length >= 8,
        hasNumber: /\d/.test(watchedPassword || ''),
        hasLetter: /[a-zA-Z]/.test(watchedPassword || ''),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(watchedPassword || '')
    }

    const passwordsMatch = watchedPassword === watchedPasswordConfirm
    const showPasswordError = (watchedPasswordConfirm?.length ?? 0) > 0 && !passwordsMatch

    // Handlers
    const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numbers = e.target.value.replace(/\D/g, '').slice(0, 8)
        setValue('student_id', numbers, { shouldValidate: true })
        studentIdCheck.reset()
    }

    const handleEmailPrefixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (value.includes('@')) {
            toast.error("'@'를 제외한 아이디만 입력해주세요.")
            return
        }
        setValue('emailPrefix', value, { shouldValidate: true })
    }

    const onSubmit = async (data: SignupFormData) => {
        if (studentIdCheck.isAvailable !== true) {
            toast.error('학번 중복 확인을 완료해주세요.')
            return
        }

        if (!emailVerification.isVerified) {
            toast.error('이메일 인증을 완료해주세요.')
            return
        }

        if (!turnstileToken) {
            toast.error('보안 검증을 완료해주세요.')
            return
        }

        try {
            await authApi.signup({
                name: data.name,
                student_id: data.student_id,
                email: getFullEmail(),
                phone: data.phone,
                password: data.password,
                department: data.department
            })
            toast.success('회원가입이 완료되었습니다. 로그인해주세요.')
            navigate({ to: '/login' })
        } catch (error) {
            console.error('Registration failed:', error)
            if (isAxiosError(error) && error.response?.data?.detail) {
                toast.error(error.response.data.detail)
            } else {
                toast.error('회원가입에 실패했습니다.')
            }
        }
    }

    return (
        <div className="min-h-screen flex bg-surface">
            {/* Left Section - Branding */}
            <div className="hidden lg:flex w-5/12 bg-[#0F172A] relative overflow-hidden items-center justify-center sticky top-0 h-screen">
                <div className="absolute inset-0 bg-linear-to-br from-blue-600/20 to-indigo-600/40 z-10" />
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
            <div className="w-full lg:w-7/12 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-surface overflow-y-auto">
                <div className="w-full max-w-xl space-y-10">
                    {step === 'agreement' ? (
                        <AgreementStep
                            agreements={agreements}
                            setAgreements={setAgreements}
                            onNext={() => setStep('form')}
                        />
                    ) : (
                        <div>
                            <div className="mb-8">
                                <button
                                    onClick={() => setStep('agreement')}
                                    className="text-sm text-foreground-secondary hover:text-foreground flex items-center gap-1 mb-4"
                                >
                                    ← 약관 동의로 돌아가기
                                </button>
                                <h2 className="text-3xl font-bold tracking-tight text-foreground">회원정보 입력</h2>
                                <p className="mt-2 text-sm text-foreground-secondary">
                                    학생회 서비스를 이용하기 위한 정보를 입력해주세요.
                                </p>
                            </div>

                            <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
                                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                                    {/* Name */}
                                    <div className="sm:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">이름</label>
                                        <input
                                            type="text"
                                            {...register('name')}
                                            className="block w-full px-4 py-3 border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800"
                                            placeholder="홍길동"
                                        />
                                        {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}
                                    </div>

                                    {/* Department */}
                                    <div className="sm:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">학과</label>
                                        <input
                                            type="text"
                                            {...register('department')}
                                            className="block w-full px-4 py-3 border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800"
                                            placeholder="컴퓨터공학과"
                                        />
                                    </div>

                                    {/* Student ID */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">학번</label>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    value={watchedStudentId}
                                                    onChange={handleStudentIdChange}
                                                    maxLength={8}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    className={`block w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 sm:text-sm transition-all bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 ${studentIdCheck.isAvailable === true ? 'border-green-500 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-900/30' :
                                                        studentIdCheck.isAvailable === false ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/30' :
                                                            'border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-900/30'
                                                        }`}
                                                    placeholder="8자리 학번 입력"
                                                />
                                                {studentIdCheck.isAvailable === true && (
                                                    <div className="absolute right-3 top-3.5 text-green-500">
                                                        <CheckCircle size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => studentIdCheck.check(watchedStudentId)}
                                                disabled={watchedStudentId.length < 8 || studentIdCheck.isChecking}
                                                className="whitespace-nowrap px-6 py-3 border border-transparent rounded-xl text-sm font-semibold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                {studentIdCheck.isChecking ? '확인중' : '중복확인'}
                                            </button>
                                        </div>
                                        {studentIdCheck.isAvailable === false && (
                                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">🚫 이미 가입된 학번입니다.</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">이메일</label>
                                        <div className="flex gap-3 items-center">
                                            <div className="flex items-center gap-2 flex-1">
                                                <input
                                                    type="text"
                                                    value={watchedEmailPrefix}
                                                    onChange={handleEmailPrefixChange}
                                                    disabled={emailVerification.isVerified}
                                                    className="block w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 sm:text-sm transition-all bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:text-gray-500 border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-900/30"
                                                    placeholder="example"
                                                />
                                                <span className="text-gray-700 dark:text-gray-300 text-md whitespace-nowrap">@seoultech.ac.kr</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={emailVerification.sendVerification}
                                                disabled={emailVerification.isVerified || emailVerification.isSending || !watchedEmailPrefix?.trim()}
                                                className={`whitespace-nowrap px-6 py-3 border border-transparent rounded-xl text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${emailVerification.isVerified ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                                                    }`}
                                            >
                                                {emailVerification.isSending ? '발송중...' : (emailVerification.isVerified ? '인증완료' : '인증번호 발송')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Verification Code */}
                                    {emailVerification.step === 'sent' && (
                                        <div className="sm:col-span-2 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="block text-sm font-medium text-blue-900 dark:text-blue-200">인증번호 확인</label>
                                                <div className={`flex items-center gap-2 text-sm font-mono font-bold ${emailVerification.timer.timeLeft <= 60 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>{emailVerification.timer.formatTime()}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    className="block w-full px-4 py-3 border-blue-200 dark:border-blue-800 rounded-xl text-blue-900 dark:text-blue-100 placeholder-blue-300 dark:placeholder-blue-600 focus:ring-blue-500 focus:border-blue-500 sm:text-lg tracking-widest transition-all bg-white dark:bg-slate-800"
                                                    value={verificationCode}
                                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="000000"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => emailVerification.verifyCode(verificationCode)}
                                                    disabled={emailVerification.isVerifying || emailVerification.timer.isExpired}
                                                    className="whitespace-nowrap px-6 py-3 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
                                                >
                                                    {emailVerification.isVerifying ? '확인중' : '확인'}
                                                </button>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                                    {!emailVerification.timer.isExpired
                                                        ? '이메일로 전송된 6자리 인증번호를 입력해주세요.'
                                                        : '⏰ 인증 시간이 만료되었습니다.'}
                                                </p>
                                                {emailVerification.canResend && (
                                                    <button
                                                        type="button"
                                                        onClick={emailVerification.resendVerification}
                                                        disabled={emailVerification.isSending}
                                                        className="text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline underline-offset-2 disabled:opacity-50"
                                                    >
                                                        {emailVerification.isSending ? '발송중...' : '재전송'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Phone */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">전화번호</label>
                                        <div className="pb-6">
                                            <PhoneInput
                                                value={watch('phone')}
                                                onChange={(value) => setValue('phone', value, { shouldValidate: true })}
                                                required
                                                showValidation={true}
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="sm:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">비밀번호</label>
                                            <input
                                                type="password"
                                                {...register('password')}
                                                className={`block w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 sm:text-sm transition-all bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 ${watchedPassword?.length > 0 && Object.values(passwordValidation).every(Boolean)
                                                    ? 'border-green-500 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-900/30'
                                                    : watchedPassword?.length > 0
                                                        ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-200 dark:focus:ring-amber-900/30'
                                                        : 'border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-900/30'
                                                    }`}
                                                placeholder="8자 이상, 영문+숫자+특수문자"
                                            />
                                            {watchedPassword?.length > 0 && (
                                                <div className="mt-3 grid grid-cols-2 gap-2">
                                                    <div className={`flex items-center gap-1.5 text-xs ${passwordValidation.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                        <CheckCircle size={12} /> 8자 이상
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 text-xs ${passwordValidation.hasLetter ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                        <CheckCircle size={12} /> 영문 포함
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 text-xs ${passwordValidation.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                        <CheckCircle size={12} /> 숫자 포함
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                        <CheckCircle size={12} /> 특수문자 포함
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">비밀번호 확인</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    {...register('password_confirm')}
                                                    className={`block w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 sm:text-sm transition-all bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 ${showPasswordError ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/30'
                                                        : watchedPasswordConfirm && passwordsMatch ? 'border-green-500 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-900/30'
                                                            : 'border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-900/30'
                                                        }`}
                                                    placeholder="비밀번호 재입력"
                                                />
                                                {watchedPasswordConfirm && (
                                                    <div className={`absolute right-3 top-3.5 ${passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                                                        <CheckCircle size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            {showPasswordError && (
                                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">비밀번호가 일치하지 않습니다</p>
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
                                        disabled={!emailVerification.isVerified || studentIdCheck.isAvailable !== true || showPasswordError || !turnstileToken}
                                        className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
                                    >
                                        가입하기
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Agreement Step Component
function AgreementStep({
    agreements,
    setAgreements,
    onNext,
}: {
    agreements: { terms: boolean; privacy: boolean }
    setAgreements: React.Dispatch<React.SetStateAction<{ terms: boolean; privacy: boolean }>>
    onNext: () => void
}) {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">약관 동의</h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    서비스 이용을 위해 약관 및 개인정보 수집에 동의해주세요.
                </p>
            </div>

            <div className="space-y-6">
                {/* Terms */}
                <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <div className="flex items-start">
                        <div className="flex h-6 items-center">
                            <input
                                id="terms"
                                type="checkbox"
                                className="h-5 w-5 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-600 bg-white dark:bg-slate-700 cursor-pointer"
                                checked={agreements.terms}
                                onChange={(e) => setAgreements(prev => ({ ...prev, terms: e.target.checked }))}
                            />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                            <label htmlFor="terms" className="font-medium text-gray-900 dark:text-gray-200 cursor-pointer">
                                이용약관 동의 (필수)
                            </label>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                학생회 서비스 이용과 관련된 제반 사항에 동의합니다.
                                <Link to="/terms" target="_blank" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 ml-1 underline">
                                    약관 전문 보기
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Privacy */}
                <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <div className="flex items-start">
                        <div className="flex h-6 items-center">
                            <input
                                id="privacy"
                                type="checkbox"
                                className="h-5 w-5 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-600 bg-white dark:bg-slate-700 cursor-pointer"
                                checked={agreements.privacy}
                                onChange={(e) => setAgreements(prev => ({ ...prev, privacy: e.target.checked }))}
                            />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                            <label htmlFor="privacy" className="font-medium text-gray-900 dark:text-gray-200 cursor-pointer">
                                개인정보 수집 및 이용 동의 (필수)
                            </label>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                원활한 서비스 제공을 위한 개인정보 수집에 동의합니다.
                                <Link to="/privacy" target="_blank" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 ml-1 underline">
                                    내용 상세보기
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-start p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        모든 약관에 동의하셔야 회원가입을 진행할 수 있습니다.
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={onNext}
                disabled={!agreements.terms || !agreements.privacy}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
            >
                다음으로
            </button>

            <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    이미 계정이 있으신가요?
                    <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 ml-1">
                        로그인하기
                    </Link>
                </p>
            </div>
        </div>
    )
}
