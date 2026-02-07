import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import type { Suggestion, SuggestionListItem } from '../../../../types/suggestions'
import { suggestionApi } from '../../../../lib/api/suggestions'
import {
  AdminSuggestionsHeader,
  FiltersBar,
  SuggestionDetailPanel,
  SuggestionsList,
  SummaryCards,
  type ActionDraft,
  type SuggestionStatus,
  type SummaryCounts,
} from '../../../../components/suggestions/admin'
import { toast } from 'sonner'
import Swal from 'sweetalert2'

export const Route = createFileRoute('/admin/(service)/suggestions/')({
  component: AdminSuggestionsPage,
})

function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<SuggestionListItem[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | SuggestionStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
  const [actionDraft, setActionDraft] = useState<ActionDraft>({
    status: 'received',
    resolutionNote: '',
  })
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isSavingStatus, setIsSavingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setIsLoadingList(true)
        const pageSize = 100
        let currentPage = 1
        let totalPages = 1
        const allSuggestions: SuggestionListItem[] = []

        do {
          const data = await suggestionApi.getAll({ page: currentPage, page_size: pageSize })
          allSuggestions.push(...data.suggestions)
          totalPages = data.pagination?.total_pages ?? 1
          currentPage += 1
        } while (currentPage <= totalPages)

        setSuggestions(allSuggestions)
      } catch (error) {
        console.error('failed to fetch suggestions', error)
      } finally {
        setIsLoadingList(false)
      }
    }

    fetchSuggestions()
  }, [])

  const summaryCounts = useMemo<SummaryCounts>(() => {
    const base: SummaryCounts = {
      total: 0,
      received: 0,
      in_progress: 0,
      approved: 0,
      rejected: 0
    }
    return suggestions.reduce((acc, item) => {
      acc.total += 1
      acc[item.status] += 1
      return acc
    }, base)
  }, [suggestions])

  const filteredSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return suggestions.filter((suggestion) => {
      const statusMatch = statusFilter === 'all' || suggestion.status === statusFilter
      const keywordTarget = `${suggestion.title} ${suggestion.author_name}`
        .toLowerCase()
      const keywordMatch = query === '' || keywordTarget.includes(query)
      return statusMatch && keywordMatch
    })
  }, [searchQuery, statusFilter, suggestions])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredSuggestions.length / pageSize) || 1)
  }, [filteredSuggestions.length, pageSize])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    setPage(1)
  }, [pageSize, statusFilter, searchQuery])

  const visibleSuggestions = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return filteredSuggestions.slice(start, end)
  }, [filteredSuggestions, page, pageSize])

  useEffect(() => {
    if (visibleSuggestions.length === 0) {
      setSelectedId(null)
      return
    }
    if (selectedId !== null && !visibleSuggestions.some((item) => item.id === selectedId)) {
      setSelectedId(null)
    }
  }, [visibleSuggestions, selectedId])

  useEffect(() => {
    if (selectedId === null) {
      setSelectedSuggestion(null)
      return
    }
    if (selectedSuggestion?.id === selectedId) {
      return
    }
    let isActive = true
    setIsLoadingDetail(true)
    setSelectedSuggestion(null)

    suggestionApi.getById(selectedId)
      .then((data) => {
        if (isActive) {
          setSelectedSuggestion(data)
        }
      })
      .catch((error) => {
        console.error('failed to fetch suggestion detail', error)
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingDetail(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [selectedId, selectedSuggestion])

  useEffect(() => {
    if (!selectedSuggestion) return
    setActionDraft({
      status: selectedSuggestion.status,
      resolutionNote: selectedSuggestion.status === 'rejected'
        ? selectedSuggestion.rejection_reason ?? ''
        : selectedSuggestion.resolution_note ?? ''
    })
  }, [selectedSuggestion])

  const handleSaveDraft = () => {
    if (!selectedSuggestion || isSavingStatus) return
    if (actionDraft.status === 'rejected' && actionDraft.resolutionNote.trim().length === 0) {
      toast.error('반려 사유를 입력해주세요.')
      return
    }
    if (actionDraft.status === 'approved' && actionDraft.resolutionNote.trim().length === 0) {
      toast.error('승인 조치 내용을 입력해주세요.')
      return
    }

    const payload: {
      status: SuggestionStatus
      rejection_reason?: string
      resolution_note?: string
    } = { status: actionDraft.status }

    if (actionDraft.status === 'rejected') {
      payload.rejection_reason = actionDraft.resolutionNote.trim()
    }
    if (actionDraft.status === 'approved') {
      payload.resolution_note = actionDraft.resolutionNote.trim()
    }

    setIsSavingStatus(true)
    suggestionApi.updateStatus(selectedSuggestion.id, payload)
      .then((updated) => {
        setSelectedSuggestion(updated)
        setSuggestions((prev) =>
          prev.map((item) => (
            item.id === updated.id
              ? {
                ...item,
                status: updated.status,
                rejection_reason: updated.rejection_reason ?? null,
                resolution_note: updated.resolution_note ?? null,
              }
              : item
          ))
        )
        toast.success('상태가 업데이트되었습니다.')
      })
      .catch((error) => {
        console.error('failed to update suggestion status', error)
        toast.error('상태 업데이트에 실패했습니다. 잠시 후 다시 시도해주세요.')
      })
      .finally(() => {
        setIsSavingStatus(false)
      })
  }

  const handleDelete = async () => {
    if (!selectedSuggestion || isDeleting) return

    const result = await Swal.fire({
      title: '이 건의를 삭제할까요?',
      text: "삭제 후 복구할 수 없습니다.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '삭제',
      cancelButtonText: '취소'
    })

    if (!result.isConfirmed) return
    setIsDeleting(true)
    suggestionApi.delete(selectedSuggestion.id)
      .then(() => {
        setSuggestions((prev) => prev.filter((item) => item.id !== selectedSuggestion.id))
        setSelectedSuggestion(null)
        setSelectedId(null)
        toast.success('건의가 삭제되었습니다.')
      })
      .catch((error) => {
        console.error('failed to delete suggestion', error)
        toast.error('건의 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.')
      })
      .finally(() => {
        setIsDeleting(false)
      })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-900">
      <AdminSuggestionsHeader />
      <SummaryCards summaryCounts={summaryCounts} />
      <FiltersBar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-7/12">
          <SuggestionsList
            isLoading={isLoadingList}
            filteredCount={filteredSuggestions.length}
            items={visibleSuggestions}
            selectedId={selectedId}
            selectedSuggestion={selectedSuggestion}
            onSelect={setSelectedId}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>

        <div className="lg:w-5/12">
          <SuggestionDetailPanel
            isLoading={isLoadingDetail}
            selectedSuggestion={selectedSuggestion}
            actionDraft={actionDraft}
            onActionDraftChange={setActionDraft}
            onSave={handleSaveDraft}
            isSaving={isSavingStatus}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        </div>
      </div>
    </div>
  )
}
