import { useState, useCallback } from 'react'
import { authApi } from '../lib/api/auth'
import { toast } from 'sonner'

interface UseStudentIdCheckReturn {
    isChecking: boolean
    isAvailable: boolean | null
    check: (studentId: string) => Promise<boolean>
    reset: () => void
}

/**
 * 학번 중복 확인 훅
 */
export function useStudentIdCheck(): UseStudentIdCheckReturn {
    const [isChecking, setIsChecking] = useState(false)
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

    const check = useCallback(async (studentId: string): Promise<boolean> => {
        if (studentId.length < 8) {
            return false
        }

        setIsChecking(true)
        try {
            const result = await authApi.checkStudentId(studentId)
            setIsAvailable(result.available)
            if (!result.available) {
                toast.error(result.message)
            }
            return result.available
        } catch (error) {
            console.error('Student ID check failed:', error)
            toast.error('학번 중복 확인 중 오류가 발생했습니다.')
            return false
        } finally {
            setIsChecking(false)
        }
    }, [])

    const reset = useCallback(() => {
        setIsAvailable(null)
    }, [])

    return {
        isChecking,
        isAvailable,
        check,
        reset,
    }
}
