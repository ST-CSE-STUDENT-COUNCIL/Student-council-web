import { useEffect, useRef, useState } from 'react'

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
    const [isLoaded, setIsLoaded] = useState(false)

    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''

    useEffect(() => {
        // Turnstile 스크립트 로드
        const scriptId = 'cf-turnstile-script'
        let script = document.getElementById(scriptId) as HTMLScriptElement | null

        const initTurnstile = () => {
            if (containerRef.current && window.turnstile && siteKey) {
                // 기존 위젯 제거
                if (widgetIdRef.current) {
                    window.turnstile.remove(widgetIdRef.current)
                }

                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    callback: onVerify,
                    'error-callback': onError,
                    'expired-callback': onExpire,
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
            script.onload = initTurnstile
        }

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current)
            }
        }
    }, [siteKey, onVerify, onError, onExpire])

    if (!siteKey) {
        // Site Key가 없으면 경고 메시지 표시 (개발 환경)
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
