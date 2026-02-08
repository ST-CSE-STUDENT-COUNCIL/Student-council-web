import { useQuery } from '@tanstack/react-query'
import { postApi } from '../../lib/api/notices'

// Query Keys
export const noticeKeys = {
    all: ['notices'] as const,
    lists: () => [...noticeKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...noticeKeys.lists(), filters] as const,
    details: () => [...noticeKeys.all, 'detail'] as const,
    detail: (id: number) => [...noticeKeys.details(), id] as const,
}

/**
 * 공지사항 목록 조회 훅
 */
export type UseNoticesOptions = {
    mainCategory?: string
    subCategory?: string
    search?: string
    sort?: string
    page?: number
    pageSize?: number
}

/**
 * 공지사항 목록 조회 훅
 */
export function useNotices(options?: UseNoticesOptions) {
    return useQuery({
        queryKey: noticeKeys.list(options ?? {}),
        queryFn: () => postApi.getAll({
            mainCategory: options?.mainCategory,
            subCategory: options?.subCategory,
            search: options?.search,
            sort: options?.sort,
            page: options?.page,
            page_size: options?.pageSize,
        }),
        placeholderData: (previousData) => previousData, // 페이지네이션 시 깜빡임 방지
    })
}

/**
 * 공지사항 상세 조회 훅
 */
export function useNotice(noticeId: number) {
    return useQuery({
        queryKey: noticeKeys.detail(noticeId),
        queryFn: () => postApi.getById(noticeId),
        enabled: noticeId > 0,
    })
}

