import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Inbox,
  MessageSquare,
  Search,
  UserRound,
  Clock,
} from 'lucide-react'
import type { Suggestion } from '../../types/suggestions'

export const Route = createFileRoute('/admin/suggestions')({
  component: AdminSuggestionsPage,
})

type SuggestionStatus = Suggestion['status']

type SummaryCounts = Record<SuggestionStatus, number> & { total: number }

const STATUS_META: Record<SuggestionStatus, {
  label: string
  badge: string
  dot: string
  border: string
}> = {
  received: {
    label: '접수됨',
    badge: 'bg-blue-50 text-blue-700',
    dot: 'bg-blue-500',
    border: 'border-blue-100'
  },
  in_progress: {
    label: '처리 중',
    badge: 'bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-100'
  },
  approved: {
    label: '반영 완료',
    badge: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-100'
  },
  rejected: {
    label: '반려됨',
    badge: 'bg-rose-50 text-rose-700',
    dot: 'bg-rose-500',
    border: 'border-rose-100'
  }
}

const STATUS_TABS: { value: 'all' | SuggestionStatus, label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'received', label: '접수됨' },
  { value: 'in_progress', label: '처리 중' },
  { value: 'approved', label: '반영 완료' },
  { value: 'rejected', label: '반려됨' },
]

const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: 1,
    author_id: '202312345',
    author_name: '김민지',
    title: '도서관 열람실 24시간 개방 요청',
    content: '기말고사 기간만이라도 열람실을 24시간 개방해 주시면 좋겠습니다.',
    status: 'received',
    rejection_reason: null,
    resolution_note: null,
    created_at: '2024-12-08T11:00:00Z',
    updated_at: '2024-12-08T11:00:00Z'
  },
  {
    id: 2,
    author_id: '202198765',
    author_name: '박지훈',
    title: '공학관 휴게공간 개선',
    content: '노후된 휴게 공간의 의자와 조명을 교체가 필요합니다.',
    status: 'in_progress',
    rejection_reason: null,
    resolution_note: '학생복지팀과 예산 검토 중입니다.',
    created_at: '2024-12-05T04:30:00Z',
    updated_at: '2024-12-10T09:12:00Z'
  },
  {
    id: 3,
    author_id: null,
    author_name: '익명',
    title: '교내 와이파이 속도 개선 요청',
    content: '강의동 와이파이가 느려서 수업 참여에 어려움이 있습니다.',
    status: 'approved',
    rejection_reason: null,
    resolution_note: '네트워크 장비 교체 완료 (12/01).',
    created_at: '2024-11-28T16:20:00Z',
    updated_at: '2024-12-02T07:45:00Z'
  },
  {
    id: 4,
    author_id: '202255555',
    author_name: '최서윤',
    title: '학생식당 저녁 운영 연장',
    content: '야간 수업이 늘어 저녁 운영 시간을 21시까지 연장 요청드립니다.',
    status: 'rejected',
    rejection_reason: '운영 인력 및 예산 부족으로 당분간 연장이 어렵습니다.',
    resolution_note: null,
    created_at: '2024-11-25T08:15:00Z',
    updated_at: '2024-11-27T10:10:00Z'
  },
  {
    id: 5,
    author_id: '202377777',
    author_name: '오세훈',
    title: '캠퍼스 야간 조명 점검',
    content: '체육관 뒤편 산책로 조명이 어두워 안전에 우려가 있습니다.',
    status: 'in_progress',
    rejection_reason: null,
    resolution_note: '시설팀 점검 일정 12/20 예정.',
    created_at: '2024-12-02T12:40:00Z',
    updated_at: '2024-12-09T13:00:00Z'
  },
]

type SummaryCardConfig = {
  key: SuggestionStatus
  label: string
  description: string
  icon: typeof Inbox
  accent: string
}

const SUMMARY_CARDS: SummaryCardConfig[] = [
  {
    key: 'received',
    label: '접수됨',
    description: '담당자 배정 필요',
    icon: Inbox,
    accent: 'bg-blue-50 text-blue-700'
  },
  {
    key: 'in_progress',
    label: '처리 중',
    description: '진행 현황 점검',
    icon: Clock,
    accent: 'bg-amber-50 text-amber-700'
  },
  {
    key: 'approved',
    label: '반영 완료',
    description: '완료 보고 필요',
    icon: CheckCircle2,
    accent: 'bg-emerald-50 text-emerald-700'
  },
  {
    key: 'rejected',
    label: '반려됨',
    description: '보완 요청 안내',
    icon: AlertCircle,
    accent: 'bg-rose-50 text-rose-700'
  },
]

const formatDateTime = (value: string) => (
  new Date(value).toLocaleString('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
)

function AdminSuggestionsPage() {
  const [suggestions] = useState<Suggestion[]>(MOCK_SUGGESTIONS)
  const [statusFilter, setStatusFilter] = useState<'all' | SuggestionStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(MOCK_SUGGESTIONS[0]?.id ?? null)
  const [actionDraft, setActionDraft] = useState({
    status: MOCK_SUGGESTIONS[0]?.status ?? 'received',
    resolutionNote: '',
    rejectionReason: ''
  })

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
      const keywordTarget = `${suggestion.title} ${suggestion.content} ${suggestion.author_name}`
        .toLowerCase()
      const keywordMatch = query === '' || keywordTarget.includes(query)
      return statusMatch && keywordMatch
    })
  }, [searchQuery, statusFilter, suggestions])

  useEffect(() => {
    if (filteredSuggestions.length === 0) {
      setSelectedId(null)
      return
    }
    if (!filteredSuggestions.some((item) => item.id === selectedId)) {
      setSelectedId(filteredSuggestions[0].id)
    }
  }, [filteredSuggestions, selectedId])

  const selectedSuggestion = useMemo(
    () => suggestions.find((item) => item.id === selectedId) ?? null,
    [selectedId, suggestions]
  )

  useEffect(() => {
    if (!selectedSuggestion) return
    setActionDraft({
      status: selectedSuggestion.status,
      resolutionNote: selectedSuggestion.resolution_note ?? '',
      rejectionReason: selectedSuggestion.rejection_reason ?? ''
    })
  }, [selectedSuggestion])

  const handleSaveDraft = () => {
    if (!selectedSuggestion) return
    console.log('미리보기 저장', {
      id: selectedSuggestion.id,
      ...actionDraft
    })
    alert('UI 데모 상태입니다. 실제 저장 로직은 추후 연동 예정이에요.')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">건의함 관리</h1>
          <p className="text-gray-500 mt-1">접수부터 반영까지 한 화면에서 확인하세요.</p>
        </div>
        <div className="text-sm text-gray-500">
          마지막 업데이트 {new Date().toLocaleDateString('ko-KR', { dateStyle: 'medium' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon
          const value = summaryCounts[card.key]
          return (
            <div
              key={card.key}
              className={`rounded-2xl border border-gray-100 p-5 flex flex-col gap-2 shadow-sm ${card.accent}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-80">{card.label}</div>
                <Icon size={18} />
              </div>
              <div className="text-3xl font-bold">{value}</div>
              <p className="text-xs opacity-70 leading-snug">{card.description}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Filter size={18} />
            <span className="text-sm font-medium">상태별 보기</span>
          </div>
          <div className="relative w-full lg:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
              placeholder="제목, 작성자, 내용 검색"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${statusFilter === tab.value
                ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-7/12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">전체 {filteredSuggestions.length}건</p>
                <h2 className="text-lg font-semibold">건의 목록</h2>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredSuggestions.length === 0 ? (
                <div className="p-10 flex flex-col items-center gap-2 text-gray-500">
                  <Inbox size={40} className="text-gray-300" />
                  <p>조건에 맞는 건의가 없습니다.</p>
                </div>
              ) : (
                filteredSuggestions.map((suggestion) => {
                  const meta = STATUS_META[suggestion.status]
                  return (
                    <button
                      key={suggestion.id}
                      onClick={() => setSelectedId(suggestion.id)}
                      className={`w-full text-left px-6 py-4 flex flex-col gap-2 transition-colors ${selectedId === suggestion.id
                        ? 'bg-gray-50'
                        : 'hover:bg-gray-50/60'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.badge} ${meta.border}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDateTime(suggestion.updated_at)}
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">
                            {suggestion.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-1 max-h-12 overflow-hidden">
                            {suggestion.content}
                          </p>
                          <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <UserRound size={14} />
                              {suggestion.author_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare size={14} />
                              {formatDateTime(suggestion.created_at)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-300" />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="lg:w-5/12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
            {!selectedSuggestion ? (
              <div className="text-center text-gray-500 py-10 flex flex-col items-center gap-2">
                <AlertCircle size={40} className="text-gray-300" />
                <p>확인할 건의를 선택하세요.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[selectedSuggestion.status].dot}`} />
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_META[selectedSuggestion.status].badge} ${STATUS_META[selectedSuggestion.status].border}`}>
                      {STATUS_META[selectedSuggestion.status].label}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold leading-tight">{selectedSuggestion.title}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <UserRound size={14} />
                      {selectedSuggestion.author_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDateTime(selectedSuggestion.created_at)}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">건의 내용</p>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                    {selectedSuggestion.content}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">건의 상태</label>
                    <select
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200"
                      value={actionDraft.status}
                      onChange={(event) => setActionDraft((prev) => ({
                        ...prev,
                        status: event.target.value as SuggestionStatus
                      }))}
                    >
                      {STATUS_TABS.filter((tab) => tab.value !== 'all').map((tab) => (
                        <option key={tab.value} value={tab.value}>
                          {tab.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">
                      조치 내용 / 비고
                    </label>
                    <textarea
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm min-h-[90px] focus:ring-2 focus:ring-gray-200"
                      placeholder="진행 경과 또는 완료 보고를 입력하세요."
                      value={actionDraft.resolutionNote}
                      onChange={(event) => setActionDraft((prev) => ({
                        ...prev,
                        resolutionNote: event.target.value
                      }))}
                    />
                  </div>

                  {actionDraft.status === 'rejected' && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">
                        반려 사유
                      </label>
                      <textarea
                        className="w-full border border-rose-200 rounded-xl px-3 py-2 text-sm min-h-[80px] focus:ring-2 focus:ring-rose-100"
                        placeholder="학생에게 전달될 반려 사유를 작성하세요."
                        value={actionDraft.rejectionReason}
                        onChange={(event) => setActionDraft((prev) => ({
                          ...prev,
                          rejectionReason: event.target.value
                        }))}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {selectedSuggestion.resolution_note && (
                    <div className="bg-emerald-50 text-emerald-700 text-sm rounded-xl p-3 flex items-start gap-2">
                      <CheckCircle2 size={16} />
                      <span>{selectedSuggestion.resolution_note}</span>
                    </div>
                  )}
                  {selectedSuggestion.rejection_reason && (
                    <div className="bg-rose-50 text-rose-700 text-sm rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle size={16} />
                      <span>{selectedSuggestion.rejection_reason}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleSaveDraft}
                    className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-black transition-colors"
                  >
                    상태 업데이트 저장
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

