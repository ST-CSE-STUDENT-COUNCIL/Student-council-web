import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { Modal } from '../common/Modal'

export function VerificationPromptModal() {
    const navigate = useNavigate()
    const { user, isAuthenticated } = useAuthStore()
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (isAuthenticated && user) {
            // Check if already approved
            if (user.verification_status === 'approved') return

            // Check if submission is pending (and presumably uploaded)
            // If it's pending AND has an image, it's under review, so don't prompt.
            // If it's pending AND NO image, it means they haven't submitted yet (or initial state).
            // If it's rejected, they need to fix it.
            const needsVerification =
                user.verification_status === 'rejected' ||
                (user.verification_status === 'pending' && !user.verification_image_url)

            if (needsVerification) {
                const dismissed = sessionStorage.getItem('verification_prompt_dismissed')
                if (!dismissed) {
                    setIsOpen(true)
                }
            } else {
                setIsOpen(false)
            }
        }
    }, [isAuthenticated, user])

    const handleClose = () => {
        setIsOpen(false)
        sessionStorage.setItem('verification_prompt_dismissed', 'true')
    }

    const handleNavigate = () => {
        setIsOpen(false)
        navigate({ to: '/mypage' })
    }

    if (!isOpen || !user) return null

    const isRejected = user.verification_status === 'rejected'

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isRejected ? "인증 반려 알림" : "학적 인증 안내"}
            maxWidth="max-w-md"
            footer={
                <div className="flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        나중에 하기
                    </button>
                    <button
                        onClick={handleNavigate}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        인증하러 가기
                        <ArrowRight size={18} />
                    </button>
                </div>
            }
        >
            <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isRejected ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                        <AlertCircle size={32} />
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-lg font-bold text-gray-900">
                            {isRejected ? '학적 인증이 반려되었습니다' : '학적 인증이 필요합니다'}
                        </h4>
                        <p className="text-gray-600 leading-relaxed break-keep">
                            {isRejected
                                ? <>사유: {user.rejection_reason || '확인 불가'}<br />정보를 수정하여 다시 인증을 진행해주세요.</>
                                : <>
                                    원활한 서비스 이용을 위해 학적 인증을 진행해주세요.<br />
                                    학생증 또는 재학증명서를 업로드해야 합니다.
                                </>
                            }
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
