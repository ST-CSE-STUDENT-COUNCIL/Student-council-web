import { useQuery } from '@tanstack/react-query'
import { welfareApi } from '../../lib/api/welfare'

export const welfareKeys = {
    all: ['welfare'] as const,
    rentals: () => [...welfareKeys.all, 'rentals'] as const,
    locker: () => [...welfareKeys.all, 'locker'] as const,
    printer: () => [...welfareKeys.all, 'printer'] as const,
    rentalConfig: () => [...welfareKeys.all, 'rentalConfig'] as const,
    guidebook: () => [...welfareKeys.all, 'guidebook'] as const,
}

export function useRentals() {
    return useQuery({
        queryKey: welfareKeys.rentals(),
        queryFn: () => welfareApi.getRentals(),
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 5, // 5 minutes (inventory doesn't change *that* fast usually, but user said 5min cache in logic)
    })
}

export function useLockerInfo() {
    return useQuery({
        queryKey: welfareKeys.locker(),
        queryFn: () => welfareApi.getLockerInfo(),
        refetchOnWindowFocus: true,
    })
}

export function usePrinterInfo() {
    return useQuery({
        queryKey: welfareKeys.printer(),
        queryFn: () => welfareApi.getPrinterInfo(),
        refetchOnWindowFocus: true,
    })
}

export function useRentalConfig() {
    return useQuery({
        queryKey: welfareKeys.rentalConfig(),
        queryFn: () => welfareApi.getRentalConfig(),
        refetchOnWindowFocus: true,
    })
}

export function useGuidebookInfo() {
    return useQuery({
        queryKey: welfareKeys.guidebook(),
        queryFn: () => welfareApi.getGuidebookInfo(),
        refetchOnWindowFocus: true,
    })
}
