import { useState, useCallback } from 'react'
import { authApi } from '../lib/api/auth'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { useTimer } from './useTimer'

type VerificationStep = 'idle' | 'sent' | 'verified'

interface UseEmailVerificationReturn {
    step: VerificationStep
    isVerified: boolean
    isSending: boolean
    isVerifying: boolean
    canResend: boolean
    timer: ReturnType<typeof useTimer>
    sendVerification: () => Promise<void>
    resendVerification: () => Promise<void>
    verifyCode: (code: string) => Promise<boolean>
}

/**
 * 이메일 인증 플로우 훅
 * @param getEmail 현재 이메일 주소를 반환하는 함수
 */
export function useEmailVerification(getEmail: () => string): UseEmailVerificationReturn {
    const [step, setStep] = useState<VerificationStep>('idle')
    const [isSending, setIsSending] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const timer = useTimer(0)

    const sendVerification = useCallback(async () => {
        const email = getEmail()
        if (!email.trim()) {
            toast.error('이메일을 입력해주세요.')
            return
        }

        setIsSending(true)
        try {
            await authApi.sendVerification(email)
            setStep('sent')
            timer.start(300) // 5분 타이머
            toast.success('인증번호가 발송되었습니다. 이메일을 확인해주세요.')
        } catch (error) {
            console.error('Email send failed:', error)
            if (isAxiosError(error) && error.response?.data?.detail) {
                const detail = error.response.data.detail
                if (typeof detail === 'string' && detail.includes('이미 인증 완료된 이메일입니다')) {
                    setStep('verified')
                    timer.reset()
                    toast.info('이미 인증된 이메일입니다. 회원가입을 계속 진행해주세요.')
                } else {
                    toast.error(detail)
                }
            } else {
                toast.error('인증번호 발송에 실패했습니다.')
            }
        } finally {
            setIsSending(false)
        }
    }, [getEmail, timer])

    const resendVerification = useCallback(async () => {
        const email = getEmail()
        setIsSending(true)
        try {
            await authApi.sendVerification(email)
            timer.start(300)
            toast.success('인증번호가 재발송되었습니다.')
        } catch (error) {
            console.error('Email resend failed:', error)
            if (isAxiosError(error) && error.response?.data?.detail) {
                toast.error(error.response.data.detail)
            } else {
                toast.error('인증번호 재발송에 실패했습니다.')
            }
        } finally {
            setIsSending(false)
        }
    }, [getEmail, timer])

    const verifyCode = useCallback(async (code: string): Promise<boolean> => {
        if (code.length !== 6) {
            toast.error('6자리 인증번호를 입력해주세요.')
            return false
        }

        if (timer.isExpired) {
            toast.error('인증 시간이 만료되었습니다. 인증번호를 재발송해주세요.')
            return false
        }

        setIsVerifying(true)
        try {
            await authApi.verifyEmail({
                email: getEmail(),
                code: code
            })
            setStep('verified')
            timer.reset()
            toast.success('이메일 인증이 완료되었습니다.')
            return true
        } catch (error) {
            console.error('Verification failed:', error)
            if (isAxiosError(error) && error.response?.data?.detail) {
                toast.error(error.response.data.detail)
            } else {
                toast.error('인증번호 확인에 실패했습니다.')
            }
            return false
        } finally {
            setIsVerifying(false)
        }
    }, [getEmail, timer])

    return {
        step,
        isVerified: step === 'verified',
        isSending,
        isVerifying,
        canResend: step === 'sent' && timer.isExpired,
        timer,
        sendVerification,
        resendVerification,
        verifyCode,
    }
}
