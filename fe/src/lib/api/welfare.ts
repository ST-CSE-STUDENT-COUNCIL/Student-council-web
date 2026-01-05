import { api } from '../axios'
import type { RentalRequest, RentalItem, Locker, LockerPeriod } from '../../types/welfare'

// Welfare mock server is running on port 4000
const WELFARE_API_URL = 'http://localhost:4000'

export const welfareApi = {
    getRentalRequests: async (userId: string) => {
        const response = await api.get<RentalRequest[]>('/api/welfare_rental_requests', {
            baseURL: WELFARE_API_URL,
            params: { user_id: userId }
        })
        return response.data
    },

    getRentalItems: async () => {
        const response = await api.get<RentalItem[]>('/api/welfare_rentals', {
            baseURL: WELFARE_API_URL
        })
        return response.data
    },

    getLockerRentals: async (userId: string) => {
        const response = await api.get<Locker[]>('/api/locker_rentals', {
            baseURL: WELFARE_API_URL,
            params: { user_id: userId }
        })
        return response.data
    },

    getLockerPeriods: async () => {
        const response = await api.get<LockerPeriod[]>('/api/locker_periods', {
            baseURL: WELFARE_API_URL
        })
        return response.data
    }
}
