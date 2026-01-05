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
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        회원가입
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">이름</label>
                            <input
                                type="text"
                                name="name"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 py-1.5 px-3 focus:ring-blue-500 sm:text-sm"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        {/* Student ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">학번</label>
                            <input
                                type="text"
                                name="student_id"
                                required
                                maxLength={8}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 py-1.5 px-3 focus:ring-blue-500 sm:text-sm"
                                value={formData.student_id}
                                onChange={handleChange}
                            />
                        </div>
                        {/* Department */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">학과</label>
                            <input
                                type="text"
                                name="department"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 py-1.5 px-3 focus:ring-blue-500 sm:text-sm"
                                value={formData.department}
                                onChange={handleChange}
                                placeholder="예: 컴퓨터공학과"
                            />
                        </div>

                        {/* Email Verification Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">이메일 (@seoultech.ac.kr)</label>
                            <div className="flex gap-2 mt-1">
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    disabled={isEmailVerified}
                                    className="block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 py-1.5 px-3 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={sendVerificationEmail}
                                    disabled={isEmailVerified || isSendingEmail || !formData.email}
                                    className="whitespace-nowrap rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:bg-gray-400"
                                >
                                    {isSendingEmail ? '발송중...' : (isEmailVerified ? '인증완료' : '인증번호 발송')}
                                </button>
                            </div>
                        </div>

                        {/* Verification Code Input */}
                        {verificationStep === 'sent' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">인증번호</label>
                                <div className="flex gap-2 mt-1">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        className="block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 py-1.5 px-3 focus:ring-blue-500 sm:text-sm"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        placeholder="6자리 숫자"
                                    />
                                    <button
                                        type="button"
                                        onClick={verifyCode}
                                        disabled={isVerifying}
                                        className="whitespace-nowrap rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:bg-gray-400"
                                    >
                                        {isVerifying ? '확인중...' : '확인'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">전화번호</label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 py-1.5 px-3 focus:ring-blue-500 sm:text-sm"
                                placeholder="010-0000-0000"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">비밀번호 (영문, 숫자, 특수문자 포함 8자 이상)</label>
                            <input
                                type="password"
                                name="password"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 py-1.5 px-3 focus:ring-blue-500 sm:text-sm"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">비밀번호 확인</label>
                            <input
                                type="password"
                                name="password_confirm"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 py-1.5 px-3 focus:ring-blue-500 sm:text-sm"
                                value={formData.password_confirm}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={!isEmailVerified}
                            className="group relative flex w-full justify-center rounded-md bg-white border border-gray-300 py-2 px-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            가입하기
                        </button>
                    </div>

                    <div className="text-center text-sm">
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            이미 계정이 있으신가요? 로그인
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
