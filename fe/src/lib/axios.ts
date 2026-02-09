import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/useAuthStore'
import { useSystemStore } from '../store/useSystemStore'
import { router } from './router'

// 커스텀 Axios 인스턴스 생성
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,  // 쿠키 전송을 위해 필수
})

// 토큰 갱신 진행 중인지 추적
let isRefreshing = false
let failedQueue: Array<{
    resolve: (token: string) => void
    reject: (error: unknown) => void
}> = []

// 대기 중인 요청들 처리
const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (token) {
            prom.resolve(token)
        } else {
            prom.reject(error)
        }
    })
    failedQueue = []
}

// 헤더에 액세스 토큰을 추가하기 위한 요청 인터셉터
api.interceptors.request.use(
    (config) => {
        const accessToken = useAuthStore.getState().accessToken
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 응답 인터셉터 (자동 토큰 갱신 포함)
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        if (error.code === 'ERR_NETWORK') {
            useSystemStore.getState().setMaintenance(true)
            return Promise.reject(error)
        }

        if (error.response) {
            const status = error.response.status

            // 401 에러 + 재시도 안 함 + refresh 요청이 아닌 경우
            if (status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
                // ... (keep existing 401 logic)
                const authState = useAuthStore.getState()

                // 토큰이 있었던 경우에만 갱신 시도
                if (authState.accessToken) {
                    if (isRefreshing) {
                        // 이미 갱신 중이면 대기
                        return new Promise((resolve, reject) => {
                            failedQueue.push({ resolve, reject })
                        }).then((token) => {
                            originalRequest.headers['Authorization'] = `Bearer ${token}`
                            return api(originalRequest)
                        }).catch((err) => {
                            return Promise.reject(err)
                        })
                    }

                    originalRequest._retry = true
                    isRefreshing = true

                    try {
                        // 토큰 갱신 시도
                        const response = await api.post<{ access_token: string; token_type: string }>(
                            '/auth/refresh',
                            null,
                            { withCredentials: true }
                        )

                        const newAccessToken = response.data.access_token

                        // 스토어 업데이트
                        useAuthStore.setState({ accessToken: newAccessToken })

                        // 대기 중인 요청들 처리
                        processQueue(null, newAccessToken)

                        // 원래 요청 재시도
                        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
                        return api(originalRequest)
                    } catch (refreshError) {
                        // 갱신 실패 - 로그아웃 및 로그인 페이지로 리다이렉트
                        processQueue(refreshError, null)
                        useAuthStore.getState().logout()

                        // 현재 경로 저장 후 로그인 페이지로 리다이렉트
                        const currentPath = window.location.pathname + window.location.search
                        router.navigate({
                            to: '/login',
                            search: { redirect: currentPath }
                        })

                        return Promise.reject(refreshError)
                    } finally {
                        isRefreshing = false
                    }
                } else {
                    // 토큰이 없었던 경우 바로 로그아웃 및 로그인 페이지로 리다이렉트
                    useAuthStore.getState().logout()

                    // 현재 경로 저장 후 로그인 페이지로 리다이렉트
                    const currentPath = window.location.pathname + window.location.search
                    router.navigate({
                        to: '/login',
                        search: { redirect: currentPath }
                    })
                }
            } else if (status === 502 || status === 503 || status === 504) {
                useSystemStore.getState().setMaintenance(true)
            } else if (status >= 500) {
                router.navigate({ to: '/error' })
            }
        }

        return Promise.reject(error)
    }
)
