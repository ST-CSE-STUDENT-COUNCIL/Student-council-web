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
export function useNotices(options?: {
    boardId?: number
    page?: number
    pageSize?: number
}) {
    return useQuery({
        queryKey: noticeKeys.list(options ?? {}),
        queryFn: () => postApi.getAll({
            page: options?.page,
            page_size: options?.pageSize,
        }),
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

