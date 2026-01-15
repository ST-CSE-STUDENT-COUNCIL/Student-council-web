import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { mypageApi } from '../../lib/api/mypage'

type ChangePasswordModalProps = {
    onClose: () => void
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
    const [currentPassword, setCurrentPassword] = React.useState('')
    const [newPassword, setNewPassword] = React.useState('')
    const [confirmPassword, setConfirmPassword] = React.useState('')
    const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
    const [showNewPassword, setShowNewPassword] = React.useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState('')
    const [success, setSuccess] = React.useState(false)

    // 비밀번호 유효성 검사
    const passwordValidation = {
        minLength: newPassword.length >= 8,
        hasNumber: /\d/.test(newPassword),
        hasLetter: /[a-zA-Z]/.test(newPassword),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword),
        match: newPassword === confirmPassword && confirmPassword.length > 0
    }

    const isValid =
        currentPassword.length > 0 &&
        passwordValidation.minLength &&
        passwordValidation.hasNumber &&
        passwordValidation.hasLetter &&
        passwordValidation.hasSpecialChar &&
        passwordValidation.match

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid) return

        setLoading(true)
        setError('')

        try {
            await mypageApi.changePassword({
                current_password: currentPassword,
                new_password: newPassword
            })
            setSuccess(true)
            setTimeout(() => {
                onClose()
            }, 2000)
        } catch (err: any) {
            const message = err.response?.data?.detail || '비밀번호 변경에 실패했습니다.'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Lock size={20} className="text-blue-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">비밀번호 변경</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                {success ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} className="text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">비밀번호가 변경되었습니다</h3>
                        <p className="text-sm text-gray-500">다음 로그인 시 새 비밀번호를 사용해주세요.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Error Message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm"
                                >
                                    <AlertCircle size={16} />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                현재 비밀번호
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="현재 비밀번호를 입력하세요"
                                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                >
                                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                새 비밀번호
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="새 비밀번호를 입력하세요"
                                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                >
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Password Requirements */}
                            {newPassword.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                    <div className={`flex items-center gap-2 text-xs ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                                        <CheckCircle size={14} />
                                        8자 이상
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs ${passwordValidation.hasLetter ? 'text-green-600' : 'text-gray-400'}`}>
                                        <CheckCircle size={14} />
                                        영문 포함
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                                        <CheckCircle size={14} />
                                        숫자 포함
                                    </div>
                                    <div className={`flex items-center gap-2 text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
                                        <CheckCircle size={14} />
                                        특수문자 포함 (!@#$%^&* 등)
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                새 비밀번호 확인
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="새 비밀번호를 다시 입력하세요"
                                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${confirmPassword.length > 0 && !passwordValidation.match
                                        ? 'border-red-300 bg-red-50/50'
                                        : 'border-gray-200'
                                        }`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {confirmPassword.length > 0 && !passwordValidation.match && (
                                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    비밀번호가 일치하지 않습니다
                                </p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={!isValid || loading}
                                className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        변경 중...
                                    </>
                                ) : (
                                    '비밀번호 변경'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </motion.div>
        </motion.div>
    )
}
