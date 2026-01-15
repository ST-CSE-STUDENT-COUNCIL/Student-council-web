import { useEffect, useRef, useState, useCallback } from 'react'

declare global {
    interface Window {
        turnstile?: {
            render: (
                container: HTMLElement,
                options: {
                    sitekey: string
                    callback: (token: string) => void
                    'error-callback'?: () => void
                    'expired-callback'?: () => void
                    theme?: 'light' | 'dark' | 'auto'
                    size?: 'normal' | 'compact'
                }
            ) => string
            reset: (widgetId: string) => void
            remove: (widgetId: string) => void
        }
    }
}

type TurnstileProps = {
    onVerify: (token: string) => void
    onError?: () => void
    onExpire?: () => void
}

export function Turnstile({ onVerify, onError, onExpire }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const isInitializedRef = useRef(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // 콜백을 ref로 저장하여 의존성 문제 해결
    const onVerifyRef = useRef(onVerify)
    const onErrorRef = useRef(onError)
    const onExpireRef = useRef(onExpire)

    // 콜백 업데이트
    useEffect(() => {
        onVerifyRef.current = onVerify
        onErrorRef.current = onError
        onExpireRef.current = onExpire
    }, [onVerify, onError, onExpire])

    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''

    // 안정적인 콜백 래퍼
    const handleVerify = useCallback((token: string) => {
        onVerifyRef.current(token)
    }, [])

    const handleError = useCallback(() => {
        onErrorRef.current?.()
    }, [])

    const handleExpire = useCallback(() => {
        onExpireRef.current?.()
    }, [])

    useEffect(() => {
        // 이미 초기화되었으면 스킵
        if (isInitializedRef.current) return
        if (!siteKey) return

        const scriptId = 'cf-turnstile-script'
        let script = document.getElementById(scriptId) as HTMLScriptElement | null

        const initTurnstile = () => {
            if (containerRef.current && window.turnstile && !widgetIdRef.current) {
                isInitializedRef.current = true

                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    callback: handleVerify,
                    'error-callback': handleError,
                    'expired-callback': handleExpire,
                    theme: 'light',
                    size: 'normal',
                })
                setIsLoaded(true)
            }
        }

        if (!script) {
            script = document.createElement('script')
            script.id = scriptId
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
            script.async = true
            script.defer = true
            script.onload = initTurnstile
            document.head.appendChild(script)
        } else if (window.turnstile) {
            initTurnstile()
        } else {
            script.addEventListener('load', initTurnstile)
        }

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current)
                } catch (e) {
                    // 이미 제거된 경우 무시
                }
                widgetIdRef.current = null
                isInitializedRef.current = false
            }
        }
    }, [siteKey, handleVerify, handleError, handleExpire])

    if (!siteKey) {
        return (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                ⚠️ Turnstile Site Key가 설정되지 않았습니다.
            </div>
        )
    }

    return (
        <div className="flex justify-center">
            <div ref={containerRef} />
            {!isLoaded && (
                <div className="h-[65px] w-[300px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                    <span className="text-sm text-gray-400">보안 확인 로딩중...</span>
                </div>
            )}
        </div>
    )
}
