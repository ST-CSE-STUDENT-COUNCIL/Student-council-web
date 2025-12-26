import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// 커스텀 Axios 인스턴스 생성
export const api = axios.create({
    // 백엔드 생기면, 나중에 연결
    // baseURL: 'http://localhost:3000', 
});

// 헤더에 액세스 토큰을 추가하기 위한 요청 인터셉터
api.interceptors.request.use(
    (config) => {
        const accessToken = useAuthStore.getState().accessToken;
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 401 오류를 처리하기 위한 응답 인터셉터
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // 무단 액세스 처리 (예: 사용자 로그아웃)
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);
