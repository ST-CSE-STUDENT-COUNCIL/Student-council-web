import { useQuery } from '@tanstack/react-query'
import { activityApi } from '../../lib/api/activities'

// Query Keys
export const activityKeys = {
    all: ['activities'] as const,
    lists: () => [...activityKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...activityKeys.lists(), filters] as const,
    details: () => [...activityKeys.all, 'detail'] as const,
    detail: (id: number) => [...activityKeys.details(), id] as const,
}

/**
 * 활동 목록 조회 훅
 */
export function useActivities(options?: {
    type?: string
    isActiveOnly?: boolean
    page?: number
    pageSize?: number
}) {
    return useQuery({
        queryKey: activityKeys.list(options ?? {}),
        queryFn: () => activityApi.getAll({
            type_filter: options?.type as any,
            is_active_only: options?.isActiveOnly,
            page: options?.page,
            page_size: options?.pageSize,
        }),
        refetchOnWindowFocus: true, // 창 포커스 시 재조회
        staleTime: 0, // 항상 최신 데이터 조회 시도
    })
}

/**
 * 활동 상세 조회 훅
 */
export function useActivity(activityId: number) {
    return useQuery({
        queryKey: activityKeys.detail(activityId),
        queryFn: () => activityApi.getById(activityId),
        enabled: activityId > 0,
        refetchOnWindowFocus: true, // 창 포커스 시 재조회
        staleTime: 0, // 항상 최신 데이터 조회 시도
    })
}

