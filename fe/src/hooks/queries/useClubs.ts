import { useQuery } from '@tanstack/react-query'
import { clubApi } from '../../lib/api/clubs'

export const clubKeys = {
    all: ['clubs'] as const,
    list: () => [...clubKeys.all, 'list'] as const,
    detail: (id: number) => [...clubKeys.all, 'detail', id] as const,
}

export function useClubs() {
    return useQuery({
        queryKey: clubKeys.list(),
        queryFn: () => clubApi.getAll(),
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 30, // Clubs don't change often
    })
}
