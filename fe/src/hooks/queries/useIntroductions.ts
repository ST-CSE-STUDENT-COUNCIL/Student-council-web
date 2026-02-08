import { useQuery } from '@tanstack/react-query'
import { introductionApi } from '../../lib/api/introductions'

export const introductionKeys = {
    all: ['introductions'] as const,
    lists: () => [...introductionKeys.all, 'list'] as const,
    list: (isActiveOnly: boolean) => [...introductionKeys.lists(), { isActiveOnly }] as const,
}

export function useIntroductions(isActiveOnly: boolean = true) {
    return useQuery({
        queryKey: introductionKeys.list(isActiveOnly),
        queryFn: () => introductionApi.getAll(isActiveOnly),
    })
}
