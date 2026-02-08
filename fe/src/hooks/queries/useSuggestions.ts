import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suggestionApi } from '../../lib/api/suggestions'
import type { Suggestion, SuggestionListItem } from '../../types/suggestions'
import { toast } from 'sonner'

export const suggestionKeys = {
    all: ['suggestions'] as const,
    lists: () => [...suggestionKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...suggestionKeys.lists(), filters] as const,
    details: () => [...suggestionKeys.all, 'detail'] as const,
    detail: (id: number) => [...suggestionKeys.details(), id] as const,
}

// ... imports

export function useSuggestions(options?: {
    status?: 'all' | Suggestion['status']
    page?: number
    pageSize?: number
}) {
    return useQuery({
        queryKey: suggestionKeys.list(options ?? {}),
        queryFn: () => suggestionApi.getAll({
            status_filter: options?.status === 'all' ? undefined : options?.status,
            page: options?.page,
            page_size: options?.pageSize,
        }),
        refetchOnWindowFocus: true,
    })
}

export function useAllSuggestions(status: 'all' | Suggestion['status'] = 'all') {
    return useQuery({
        queryKey: suggestionKeys.list({ status, type: 'all' }), // Add type: 'all' to differentiate key
        queryFn: async () => {
            const pageSizeAll = 100
            let pageIndex = 1
            let totalPagesAll = 1
            const allItems: SuggestionListItem[] = []

            do {
                const data = await suggestionApi.getAll({
                    status_filter: status === 'all' ? undefined : status,
                    page: pageIndex,
                    page_size: pageSizeAll,
                })
                allItems.push(...data.suggestions)
                if (data.pagination.total_pages) {
                    totalPagesAll = data.pagination.total_pages
                } else {
                    // If unexpected, break to avoid infinite loop
                    break;
                }
                pageIndex += 1
            } while (pageIndex <= totalPagesAll)

            return {
                suggestions: allItems,
                total: allItems.length
            }
        },
        refetchOnWindowFocus: true,
    })
}

export function useSuggestionStats() {
    return useQuery({
        queryKey: suggestionKeys.list({ status: 'all', type: 'stats' }),
        queryFn: async () => {
            const data = await suggestionApi.getAll({
                page: 1,
                page_size: 1
            })
            return { total: data.pagination.total }
        },
        staleTime: 1000 * 60 * 5, // 5 min
    })
}

export function useSuggestion(id: number | null) {
    return useQuery({
        queryKey: suggestionKeys.detail(id!),
        queryFn: () => suggestionApi.getById(id!),
        enabled: !!id,
    })
}

export function useCreateSuggestion() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: { title: string; content: string }) => suggestionApi.create(data),
        onSuccess: () => {
            toast.success('건의사항이 등록되었습니다.')
            queryClient.invalidateQueries({ queryKey: suggestionKeys.lists() })
        },
        onError: (err) => {
            console.error(err)
            toast.error('건의 등록에 실패했습니다.')
        }
    })
}
