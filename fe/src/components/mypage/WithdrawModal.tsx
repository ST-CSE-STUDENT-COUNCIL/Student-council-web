import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { mypageApi } from '../../lib/api/mypage'
import { useAuthStore } from '../../store/useAuthStore'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '../ui/Button'
import { toast } from 'sonner'
import Swal from 'sweetalert2'

interface WithdrawModalProps {
    onClose: () => void
}

export function WithdrawModal({ onClose }: WithdrawModalProps) {
    const [password, setPassword] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState('')
    const { logout } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password) return

        if (!password) return

        const result = await Swal.fire({
            title: '정말로 탈퇴하시겠습니까?',
            text: "이 작업은 되돌릴 수 없습니다.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '탈퇴',
            cancelButtonText: '취소'
        })

        if (!result.isConfirmed) return

        setLoading(true)
        setError('')

        try {
            await mypageApi.withdraw(password)
            toast.success('회원 탈퇴가 완료되었습니다.')
            logout()
            await navigate({ to: '/' })
        } catch (err: any) {
            console.error('Failed to withdraw', err)
            const status = err.response?.status
            const detail = err.response?.data?.detail
            const errorMessage = detail || (status ? `오류가 발생했습니다 (${status})` : '회원 탈퇴에 실패했습니다.')
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-700">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                            <AlertTriangle size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">회원 탈퇴</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            계정을 삭제하려면 비밀번호를 입력해주세요.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                비밀번호 확인
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors dark:bg-slate-900 dark:text-white"
                                placeholder="현재 비밀번호를 입력하세요"
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex items-center gap-2">
                                <AlertTriangle size={14} />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors"
                            >
                                취소
                            </button>
                            <Button
                                type="submit"
                                variant="danger"
                                loading={loading}
                                className="flex-1"
                            >
                                탈퇴하기
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

