import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Create a custom Axios instance
export const api = axios.create({
    // You might want to set a baseURL here if your API is elsewhere
    // baseURL: 'http://localhost:3000', 
});

// Request interceptor to add the Access Token to headers
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

// Response interceptor to handle 401 errors (optional but good practice)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access (e.g., logout user)
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);
