/**
 * 앱 시작 시 인증 상태를 초기화하는 훅
 * 
 * - 저장된 세션이 있으면 토큰 갱신 시도
 * - 갱신 성공: 새 토큰으로 업데이트
 * - 갱신 실패: 로그아웃 처리
 */
import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { authApi } from '../lib/api/auth'
import { mypageApi } from '../lib/api/mypage'

export function useAuthInit() {
    const { accessToken, isInitialized, setAccessToken, setUser, logout, setInitialized } = useAuthStore()
    const initAttempted = useRef(false)

    useEffect(() => {
        // 이미 초기화되었거나 시도 중이면 스킵
        if (isInitialized || initAttempted.current) return
        initAttempted.current = true

        const initializeAuth = async () => {
            // 저장된 토큰이 없으면 초기화 완료
            if (!accessToken) {
                setInitialized(true)
                return
            }

            try {
                // 토큰 갱신 시도
                const response = await authApi.refresh()
                setAccessToken(response.access_token)

                // 사용자 정보도 갱신
                try {
                    const userInfo = await mypageApi.getProfile()
                    setUser(userInfo)
                } catch {
                    // 사용자 정보 갱신 실패해도 토큰은 유효
                    console.warn('Failed to refresh user info')
                }
            } catch (error: any) {
                // 갱신 실패 시 로그아웃
                console.warn('Token refresh failed during initialization:', error?.response?.status || error?.message)

                // 네트워크 오류인 경우는 로그아웃하지 않고 기존 토큰 유지
                if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED') {
                    console.log('Network error during token refresh, keeping existing session')
                    setInitialized(true)
                    return
                }

                // 인증 오류인 경우에만 로그아웃
                logout()
            } finally {
                setInitialized(true)
            }
        }

        initializeAuth()
    }, [accessToken, isInitialized, setAccessToken, setUser, logout, setInitialized])

    return { isInitialized }
}
