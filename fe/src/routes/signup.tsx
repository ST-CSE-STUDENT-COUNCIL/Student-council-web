import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '../lib/axios'

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
        password_confirm: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.password !== formData.password_confirm) {
            alert('비밀번호가 일치하지 않습니다.')
            return
        }

        try {
            await api.post('/auth/signup', {
                name: formData.name,
                student_id: formData.student_id,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            })
            alert('회원가입이 완료되었습니다. 로그인해주세요.')
            navigate({ to: '/login' })
        } catch (error) {
            console.error('Registration failed:', error)
            alert('회원가입에 실패했습니다.')
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700">학번</label>
                            <input
                                type="text"
                                name="student_id"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 py-1.5 px-3 focus:ring-blue-500 sm:text-sm"
                                value={formData.student_id}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">이메일 (@seoultech.ac.kr)</label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 py-1.5 px-3 focus:ring-blue-500 sm:text-sm"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700">비밀번호</label>
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
                            className="group relative flex w-full justify-center rounded-md bg-white border border-gray-300 py-2 px-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
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
