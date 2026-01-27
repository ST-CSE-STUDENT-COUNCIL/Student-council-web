import { useState, useEffect, useCallback } from 'react'

interface UseTimerReturn {
    timeLeft: number
    isExpired: boolean
    start: (seconds: number) => void
    reset: () => void
    formatTime: () => string
}

/**
 * 타이머 훅 - 이메일 인증 등에서 카운트다운에 사용
 * @param initialSeconds 초기 시간 (초)
 */
export function useTimer(initialSeconds = 0): UseTimerReturn {
    const [timeLeft, setTimeLeft] = useState(initialSeconds)

    useEffect(() => {
        if (timeLeft <= 0) return

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft])

    const start = useCallback((seconds: number) => {
        setTimeLeft(seconds)
    }, [])

    const reset = useCallback(() => {
        setTimeLeft(0)
    }, [])

    const formatTime = useCallback(() => {
        const mins = Math.floor(timeLeft / 60)
        const secs = timeLeft % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }, [timeLeft])

    return {
        timeLeft,
        isExpired: timeLeft <= 0,
        start,
        reset,
        formatTime,
    }
}
