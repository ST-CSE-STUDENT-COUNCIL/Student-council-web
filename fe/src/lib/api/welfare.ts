import { api } from '../axios'
import type { RentalRequest, RentalItem, Locker, LockerPeriod } from '../../types/welfare'

const API_BASE_URL = '/welfare'

export const welfareApi = {
    getRentalRequests: async (userId: string) => {
        const response = await api.get<RentalRequest[]>(`${API_BASE_URL}/welfare_rental_requests`, {
            params: { user_id: userId }
        })
        return response.data
    },

    getRentalItems: async () => {
        const response = await api.get<RentalItem[]>(`${API_BASE_URL}/welfare_rentals`)
        return response.data
    },

    getLockerRentals: async (userId: string) => {
        const response = await api.get<Locker[]>(`${API_BASE_URL}/locker_rentals`, {
            params: { user_id: userId }
        })
        return response.data
    },

    getLockerPeriods: async () => {
        const response = await api.get<LockerPeriod[]>(`${API_BASE_URL}/locker_periods`)
        return response.data
    }
}
