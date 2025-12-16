import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    name: string;
    studentId: string;
    department: string;
    grade: string;
    feeStatus: boolean;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoggedIn: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isLoggedIn: false,
            login: (user, token) => set({ user, token, isLoggedIn: true }),
            logout: () => set({ user: null, token: null, isLoggedIn: false }),
        }),
        {
            name: 'auth-storage-v2', // Versioned to clear old cache
        }
    )
);
