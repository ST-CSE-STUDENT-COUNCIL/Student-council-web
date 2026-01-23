import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'
import { router } from './router'

// 커스텀 Axios 인스턴스 생성
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
})

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

// 응답 인터셉터
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ERR_NETWORK') {
            router.navigate({ to: '/maintenance' })
            return Promise.reject(error)
        }

        if (error.response) {
            const status = error.response.status

            if (status === 401) {
                useAuthStore.getState().logout()
            } else if (status === 502 || status === 503) {
                router.navigate({ to: '/maintenance' })
            } else if (status >= 500) {
                router.navigate({ to: '/error' })
            }
        }

        return Promise.reject(error)
    }
)
