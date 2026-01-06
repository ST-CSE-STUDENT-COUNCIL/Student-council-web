import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { authApi } from '../lib/api/auth'
import { isAxiosError } from 'axios'

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
        department: '',
    })

    // Verification States
    const [verificationStep, setVerificationStep] = useState<'idle' | 'sent' | 'verified'>('idle')
    const [verificationCode, setVerificationCode] = useState('')
    const [isEmailVerified, setIsEmailVerified] = useState(false)
    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)

    // Student ID Check States
    const [isStudentIdChecking, setIsStudentIdChecking] = useState(false)
    const [isStudentIdAvailable, setIsStudentIdAvailable] = useState<boolean | null>(null)

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
            alert('인증번호가 발송되었습니다. 이메일을 확인해주세요.')
        } catch (error) {
            console.error('Email send failed:', error)
            if (isAxiosError(error) && error.response?.data?.detail) {
                alert(error.response.data.detail)
            } else {
                alert('인증번호 발송에 실패했습니다.')
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

        setIsVerifying(true)
        try {
            await authApi.verifyEmail({
                email: formData.email,
                code: verificationCode
            })
            setIsEmailVerified(true)
            setVerificationStep('verified')
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

        if (formData.password !== formData.password_confirm) {
            alert('비밀번호가 일치하지 않습니다.')
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
                        Join Us
                    </h1>
                    <p className="text-blue-100 text-lg leading-relaxed">
                        컴퓨터공학과 학생회 홈페이지에서 <br />회원가입하기
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
                                    <label className="block text-sm font-medium text-blue-900 mb-2">인증번호 확인</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            className="block w-full px-4 py-3 border-blue-200 rounded-xl text-blue-900 placeholder-blue-300 focus:ring-blue-500 focus:border-blue-500 sm:text-lg tracking-widest transition-all bg-white"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            placeholder="000000"
                                        />
                                        <button
                                            type="button"
                                            onClick={verifyCode}
                                            disabled={isVerifying}
                                            className="whitespace-nowrap px-6 py-3 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
                                        >
                                            {isVerifying ? '확인중' : '확인'}
                                        </button>
                                    </div>
                                    <p className="mt-2 text-sm text-blue-600">이메일로 전송된 6자리 인증번호를 입력해주세요.</p>
                                </div>
                            )}

                            {/* Phone */}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    className="block w-full px-4 py-3 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 focus:bg-white"
                                    placeholder="010-0000-0000"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Password */}
                            <div className="sm:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        className="block w-full px-4 py-3 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 focus:bg-white"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="8자 이상 입력"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
                                    <input
                                        type="password"
                                        name="password_confirm"
                                        required
                                        className="block w-full px-4 py-3 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all bg-gray-50 focus:bg-white"
                                        value={formData.password_confirm}
                                        onChange={handleChange}
                                        placeholder="비밀번호 재입력"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={!isEmailVerified || isStudentIdAvailable !== true}
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
