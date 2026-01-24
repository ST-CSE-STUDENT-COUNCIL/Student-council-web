import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { activityAdminApi, activityApi } from '../../../lib/api/activities'
import type { ActivityRegistrationResponse, Activity } from '../../../types/activities'
import {
    Search, CheckCircle, XCircle, Clock, User, Phone, Building,
    Hash, Calendar, Eye, ChevronLeft, ChevronRight, Users,
    BarChart3, Check, Loader2, ArrowLeft,
    PieChart as PieChartIcon, LayoutGrid, List, Image as ImageIcon, FileText
} from 'lucide-react'
import { Card } from '@tremor/react'
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
    type RowSelectionState,
    type ColumnDef
} from '@tanstack/react-table'
import { AnimatePresence } from 'framer-motion'
import { StatusDropdown } from '../../../components/activities/admin/StatusDropdown'
import { RegistrationDetailModal } from '../../../components/activities/admin/RegistrationDetailModal'
import { ImagePreviewModal } from '../../../components/activities/admin/ImagePreviewModal'

export const Route = createFileRoute('/admin/surveys/$activityId')({
    component: SurveyActivityDetailPage,
})

type StatusFilterType = 'all' | 'pending' | 'approved' | 'rejected'
type Tab = 'list' | 'stats'

const STATUS_CONFIG: Record<StatusFilterType, { label: string; icon: React.ReactNode; bgClass: string; textClass: string }> = {
    all: { label: '전체', icon: <Users size={14} />, bgClass: 'bg-gray-100', textClass: 'text-gray-700' },
    pending: { label: '대기', icon: <Clock size={14} />, bgClass: 'bg-amber-100', textClass: 'text-amber-700' },
    approved: { label: '승인', icon: <CheckCircle size={14} />, bgClass: 'bg-emerald-100', textClass: 'text-emerald-700' },
    rejected: { label: '거절', icon: <XCircle size={14} />, bgClass: 'bg-red-100', textClass: 'text-red-700' },
}

const OBJECTIVE_TYPES = new Set(['multiple_choice', 'radio', 'checkbox'])
const QUESTION_TYPE_LABELS: Record<string, string> = {
    multiple_choice: '객관식',
    radio: '단일 선택',
    checkbox: '다중 선택',
    text: '주관식',
    textarea: '장문형',
    number: '숫자형',
    date: '날짜형'
}
const STATS_CHART_COLORS = [
    '#3b82f6',
    '#06b6d4',
    '#6366f1',
    '#8b5cf6',
    '#d946ef',
    '#10b981',
    '#f43f5e',
    '#f59e0b',
    '#84cc16',
    '#14b8a6',
    '#0ea5e9',
    '#a855f7'
]

type SurveyQuestionStat = {
    question_id: number | string
    question: string
    type: string
    responses: Record<string, number> | string[] | null
}

type SubjectiveSummaryItem = {
    answer: string
    count: number
}

function SurveyActivityDetailPage() {
    const navigate = useNavigate()
    const { activityId } = Route.useParams()
    const id = Number(activityId)

    // Activity state
    const [activityDetail, setActivityDetail] = useState<Activity | null>(null)

    // Registrations state
    const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [totalCount, setTotalCount] = useState(0)

    // Survey Stats state
    const [surveyStats, setSurveyStats] = useState<any>(null)
    const [loadingStats, setLoadingStats] = useState(false)
    const [currentTab, setCurrentTab] = useState<Tab>('list')
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table')

    // Filter & Search
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all')

    // Modals
    const [selectedRegistration, setSelectedRegistration] = useState<ActivityRegistrationResponse | null>(null)
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

    // Bulk actions
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const selectedIds = useMemo(() => Object.keys(rowSelection).map(Number), [rowSelection])

    const [processingBulk, setProcessingBulk] = useState(false)

    // Fetch activity detail
    const fetchActivityDetail = useCallback(async () => {
        try {
            const detail = await activityApi.getById(id)
            setActivityDetail(detail)
        } catch (error) {
            console.error('Failed to fetch activity detail', error)
            alert('설문조사 정보를 불러오는데 실패했습니다.')
            navigate({ to: '/admin/surveys' })
        }
    }, [id, navigate])

    // Fetch registrations
    const fetchRegistrations = useCallback(async (pageNum: number) => {
        try {
            setLoading(true)
            const data = await activityAdminApi.getRegistrations(id, { page: pageNum, page_size: 20 })
            setRegistrations(data.registrations)
            setTotalPages(data.pagination.total_pages)
            setTotalCount(data.pagination.total)
        } catch (error) {
            console.error('Failed to fetch registrations', error)
        } finally {
            setLoading(false)
        }
    }, [id])

    // Fetch survey stats
    const fetchSurveyStats = useCallback(async () => {
        try {
            if (!activityDetail) return
            setLoadingStats(true)
            if (activityDetail.type === 'demand_survey') {
                const stats = await activityAdminApi.getDemandSurveyStats(id)
                const questionStats = [
                    ...stats.objective_questions.map(question => ({
                        question_id: question.field_name,
                        question: question.label,
                        type: question.type === 'select' ? 'multiple_choice' : question.type,
                        responses: {
                            ...question.counts,
                            ...(question.other_count ? { 기타: question.other_count } : {})
                        }
                    })),
                    ...stats.subjective_questions.map(question => ({
                        question_id: question.field_name,
                        question: question.label,
                        type: question.type,
                        responses: (question.responses || []).map(response => String(response.answer))
                    }))
                ]
                setSurveyStats({
                    activity_id: stats.activity_id,
                    total_responses: stats.total_responses,
                    question_stats: questionStats
                })
            } else {
                const stats = await activityAdminApi.getSurveyStats(id)
                setSurveyStats(stats)
            }
        } catch (error) {
            console.error('Failed to fetch survey stats', error)
        } finally {
            setLoadingStats(false)
        }
    }, [activityDetail, id])

    // Handle single row selection
    const handleSelectOne = (registrationId: number) => {
        setRowSelection(prev => {
            const newSelection = { ...prev }
            if (newSelection[registrationId]) {
                delete newSelection[registrationId]
            } else {
                newSelection[registrationId] = true
            }
            return newSelection
        })
    }

    // Handle status change
    const handleStatusChange = async (registrationId: number, status: 'pending' | 'approved' | 'rejected') => {
        try {
            await activityAdminApi.updateRegistrationStatus(id, registrationId, status)
            fetchRegistrations(page)
        } catch (error) {
            console.error('Failed to update registration status', error)
            alert('상태 변경에 실패했습니다.')
        }
    }

    // Handle bulk status change
    const handleBulkStatusChange = async (status: 'approved' | 'rejected') => {
        if (selectedIds.length === 0) return

        setProcessingBulk(true)
        try {
            await Promise.all(selectedIds.map(regId =>
                activityAdminApi.updateRegistrationStatus(id, regId, status)
            ))
            setRowSelection({})
            fetchRegistrations(page)
        } catch (error) {
            console.error('Failed to bulk update', error)
            alert('일괄 처리에 실패했습니다.')
        } finally {
            setProcessingBulk(false)
        }
    }

    useEffect(() => {
        fetchActivityDetail()
        fetchRegistrations(page)
    }, [fetchActivityDetail, fetchRegistrations, page])

    useEffect(() => {
        fetchSurveyStats()
    }, [fetchSurveyStats])

    // Filter registrations client-side
    const filteredRegistrations = useMemo(() => {
        return registrations.filter(reg => {
            const matchesSearch = searchQuery === '' ||
                reg.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                reg.student_id?.includes(searchQuery) ||
                reg.phone?.includes(searchQuery)
            const matchesStatus = statusFilter === 'all' || reg.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [registrations, searchQuery, statusFilter])

    const columnHelper = createColumnHelper<ActivityRegistrationResponse>()

    const columns = useMemo(() => {
        if (!activityDetail) return []
        const isAnonymous = ['survey', 'demand_survey'].includes(activityDetail.type)

        const cols: ColumnDef<ActivityRegistrationResponse, any>[] = [
            columnHelper.display({
                id: 'select',
                header: ({ table }) => (
                    <button
                        onClick={table.getToggleAllRowsSelectedHandler()}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${table.getIsAllRowsSelected()
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                            }`}
                    >
                        {table.getIsAllRowsSelected() && <Check size={12} strokeWidth={3} />}
                    </button>
                ),
                cell: ({ row }) => (
                    <button
                        onClick={row.getToggleSelectedHandler()}
                        disabled={!row.getCanSelect()}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${row.getIsSelected()
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : !row.getCanSelect() ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'border-gray-300 hover:border-gray-400'
                            }`}
                    >
                        {row.getIsSelected() && <Check size={12} strokeWidth={3} />}
                    </button>
                ),
                meta: { className: 'w-12 text-center sticky left-0 z-10' }
            }),
            columnHelper.display({
                id: 'index',
                header: () => <div className="flex items-center gap-1.5"><Hash size={14} />No.</div>,
                cell: ({ row }) => <span className="text-gray-500 font-mono text-xs">{totalCount - ((page - 1) * 20 + row.index)}</span>,
                meta: { className: 'w-16 sticky left-12 z-10 border-r border-gray-200/50 shadow-[1px_0_2px_rgba(0,0,0,0.02)]' }
            }),
        ]

        if (!isAnonymous) {
            cols.push(
                columnHelper.accessor('name', {
                    header: () => <div className="flex items-center gap-1.5"><User size={14} />이름</div>,
                    cell: info => <span className="font-medium text-gray-900">{info.getValue() || '-'}</span>
                }),
                columnHelper.accessor('student_id', {
                    header: () => <div className="flex items-center gap-1.5"><Hash size={14} />학번</div>,
                    cell: info => <span className="text-gray-600 font-mono text-xs">{info.getValue() || '-'}</span>
                }),
                columnHelper.accessor('department', {
                    header: () => <div className="flex items-center gap-1.5"><Building size={14} />학과</div>,
                    cell: info => <span className="text-gray-600">{info.getValue() || '-'}</span>
                }),
                columnHelper.accessor('phone', {
                    header: () => <div className="flex items-center gap-1.5"><Phone size={14} />연락처</div>,
                    cell: info => <span className="text-gray-600 font-mono text-xs">{info.getValue() || '-'}</span>
                })
            )
        }

        activityDetail.form_fields?.forEach(field => {
            cols.push(columnHelper.accessor(row => {
                const formValue = row.form_responses?.[field.name]
                const surveyValue = (row as any).survey_responses?.[field.name]
                return formValue ?? surveyValue
            }, {
                id: field.name,
                header: field.label,
                cell: info => {
                    const value = info.getValue()
                    if (value === undefined || value === null || value === '') return <span className="text-gray-300">-</span>

                    if (field.type === 'file') {
                        const urls = Array.isArray(value) ? value : [value]
                        return (
                            <div className="flex flex-col gap-1">
                                {urls.map((url: string, idx: number) => {
                                    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)
                                    return (
                                        <div key={idx} className="flex items-center gap-1">
                                            {isImage ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setPreviewImageUrl(url)
                                                    }}
                                                    className="text-indigo-600 hover:underline text-xs flex items-center gap-1"
                                                >
                                                    <ImageIcon size={12} />
                                                    {urls.length > 1 ? `이미지 ${idx + 1}` : '미리보기'}
                                                </button>
                                            ) : (
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gray-600 hover:underline text-xs flex items-center gap-1"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <FileText size={12} />
                                                    {urls.length > 1 ? `파일 ${idx + 1}` : '다운로드'}
                                                </a>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    }

                    return (
                        <div className="max-w-[200px] truncate" title={Array.isArray(value) ? value.join(', ') : String(value || '')}>
                            {(Array.isArray(value) ? value.join(', ') : String(value))}
                        </div>
                    )
                },
                meta: { className: 'bg-indigo-50/20 border-l border-indigo-50' }
            }))
        })

        cols.push(columnHelper.accessor('created_at', {
            header: () => <div className="flex items-center gap-1.5"><Calendar size={14} />참여일시</div>,
            cell: info => <span className="text-gray-500 text-xs">{new Date(info.getValue()).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>,
            meta: { className: 'border-l border-gray-100' }
        }))

        cols.push(columnHelper.accessor('status', {
            header: '상태',
            cell: ({ row }) => (
                <div onClick={e => e.stopPropagation()}>
                    <StatusDropdown
                        registrationId={row.original.id}
                        currentStatus={row.original.status}
                        onStatusChange={handleStatusChange}
                    />
                </div>
            )
        }))

        cols.push(columnHelper.display({
            id: 'actions',
            header: '관리',
            cell: ({ row }) => (
                <div className="flex justify-center" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setSelectedRegistration(row.original)}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-all"
                    >
                        <Eye size={14} />
                    </button>
                </div>
            ),
            meta: { className: 'text-center sticky right-0 z-10 border-l border-gray-200/50 shadow-[-1px_0_2px_rgba(0,0,0,0.02)]' }
        }))

        return cols
    }, [activityDetail, totalCount, page])

    const table = useReactTable({
        data: filteredRegistrations,
        columns,
        state: { rowSelection },
        enableRowSelection: row => row.original.status === 'pending',
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getRowId: row => row.id.toString(),
        manualPagination: true,
        pageCount: totalPages,
    })

    // Status counts
    const statusCounts = registrations.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const surveyQuestionStats: SurveyQuestionStat[] = surveyStats?.question_stats ?? []
    const fallbackQuestionStats = useMemo(() => {
        if (!activityDetail || activityDetail.type !== 'survey' || registrations.length === 0) {
            return [] as SurveyQuestionStat[]
        }

        const formFields = activityDetail.form_fields?.length
            ? activityDetail.form_fields
            : (activityDetail.config?.questions || []).map((q: any) => ({
                name: String(q.id),
                label: q.question,
                type: q.type === 'multiple_choice' ? 'radio' : q.type,
                options: q.options || []
            }))

        return formFields.map((field: any) => {
            const fieldName = field.name
            const fieldType = field.type
            const isObjective = ['select', 'radio', 'checkbox', 'multiple_choice'].includes(fieldType)

            if (isObjective) {
                const counts: Record<string, number> = {}
                const options = field.options || []
                options.forEach((option: string) => {
                    counts[option] = 0
                })

                registrations.forEach(reg => {
                    const rawResponses = (reg as any).form_responses || (reg as any).survey_responses || {}
                    const answer = rawResponses[fieldName]
                    if (!answer) return
                    if (Array.isArray(answer)) {
                        answer.forEach((item) => {
                            counts[item] = (counts[item] || 0) + 1
                        })
                    } else {
                        counts[answer] = (counts[answer] || 0) + 1
                    }
                })

                return {
                    question_id: fieldName,
                    question: field.label,
                    type: fieldType === 'select' ? 'multiple_choice' : fieldType,
                    responses: counts
                }
            }

            const answers: string[] = []
            registrations.forEach(reg => {
                const rawResponses = (reg as any).form_responses || (reg as any).survey_responses || {}
                const answer = rawResponses[fieldName]
                if (answer === undefined || answer === null || answer === '') return
                answers.push(String(answer))
            })

            return {
                question_id: fieldName,
                question: field.label,
                type: fieldType,
                responses: answers
            }
        })
    }, [activityDetail, registrations, totalCount])

    const resolvedQuestionStats = surveyQuestionStats.length > 0 ? surveyQuestionStats : fallbackQuestionStats
    const objectiveQuestionCount = resolvedQuestionStats.filter((stat: SurveyQuestionStat) => OBJECTIVE_TYPES.has(stat.type)).length
    const subjectiveQuestionCount = resolvedQuestionStats.length - objectiveQuestionCount

    if (!activityDetail) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 size={32} className="text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-500">정보를 불러오는 중...</p>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-full mx-auto min-h-screen bg-gray-50/30">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate({ to: '/admin/surveys' })}
                    className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-all"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <BarChart3 size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{activityDetail.title}</h1>
                        <p className="text-sm text-gray-500">
                            {activityDetail.type === 'demand_survey' ? '수요조사' : '설문조사'} 관리 • 총 {totalCount}명 참여
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setCurrentTab('list')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${currentTab === 'list'
                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-100'
                        : 'text-gray-500 hover:bg-white hover:text-gray-700'
                        }`}
                >
                    <Users size={18} />
                    참여자 목록
                </button>
                <button
                    onClick={() => setCurrentTab('stats')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${currentTab === 'stats'
                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-100'
                        : 'text-gray-500 hover:bg-white hover:text-gray-700'
                        }`}
                >
                    <PieChartIcon size={18} />
                    통계 및 분석
                </button>
            </div>

            {currentTab === 'list' ? (
                <>
                    {/* Stats Bar */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            <div className="flex items-center gap-6 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">총</span>
                                    <span className="text-2xl font-bold text-gray-900">{totalCount}</span>
                                    <span className="text-sm text-gray-500">명 참여</span>
                                </div>
                                <div className="h-8 w-px bg-gray-200 hidden lg:block" />
                                <div className="flex gap-2 flex-wrap">
                                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                        <button
                                            key={key}
                                            onClick={() => setStatusFilter(key as StatusFilterType)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${statusFilter === key
                                                ? `${config.bgClass} ${config.textClass} ring-2 ring-offset-1`
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {config.icon}
                                            {config.label}
                                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${statusFilter === key ? 'bg-white/50' : 'bg-white'}`}>
                                                {key === 'all' ? totalCount : (statusCounts[key] || 0)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            {/* Search */}
                            {!['survey', 'demand_survey'].includes(activityDetail?.type) ? (
                                <div className="flex-1 relative max-w-md w-full">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="이름, 학번, 연락처 검색..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 text-sm text-gray-500 font-medium px-2 flex items-center gap-4">
                                    <span>익명 설문조사입니다.</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 ml-auto">
                                {/* View Mode Toggle */}
                                <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        title="리스트 보기"
                                    >
                                        <List size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('card')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        title="카드 보기"
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                </div>

                                {/* Bulk Actions */}
                                {selectedIds.length > 0 && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl ml-2">
                                        <span className="text-sm font-medium text-gray-600">
                                            <span className="text-indigo-600 font-bold">{selectedIds.length}</span>명 선택
                                        </span>
                                        <button
                                            onClick={() => handleBulkStatusChange('approved')}
                                            disabled={processingBulk}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-200 disabled:opacity-50"
                                        >
                                            {processingBulk ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                            일괄 승인
                                        </button>
                                        <button
                                            onClick={() => handleBulkStatusChange('rejected')}
                                            disabled={processingBulk}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 disabled:opacity-50"
                                        >
                                            {processingBulk ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                            일괄 거절
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 flex-1">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
                                    <Loader2 size={28} className="text-indigo-600 animate-spin" />
                                </div>
                                <p className="text-gray-500">신청자 목록을 불러오는 중...</p>
                            </div>
                        ) : filteredRegistrations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 flex-1">
                                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                    <Users size={32} className="text-gray-400" />
                                </div>
                                <p className="font-medium text-gray-900">참여자가 없습니다</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {searchQuery || statusFilter !== 'all' ? '검색 조건에 맞는 참여자가 없습니다' : '아직 설문에 참여한 사람이 없습니다'}
                                </p>
                            </div>
                        ) : viewMode === 'table' ? (
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full whitespace-nowrap text-sm">
                                    <thead className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-b border-gray-200">
                                        {table.getHeaderGroups().map(headerGroup => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map(header => {
                                                    const meta = header.column.columnDef.meta as any
                                                    return (
                                                        <th
                                                            key={header.id}
                                                            className={`px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider ${meta?.className || ''} ${meta?.className?.includes('sticky') ? 'bg-gray-50' : ''}`}
                                                        >
                                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                        </th>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {table.getRowModel().rows.map(row => (
                                            <tr
                                                key={row.id}
                                                onClick={() => row.original.status === 'pending' && row.toggleSelected()}
                                                className={`group transition-colors ${row.original.status === 'pending' ? 'cursor-pointer hover:bg-gray-50/80' : 'hover:bg-gray-50/50'} ${row.getIsSelected() ? 'bg-indigo-50/50' : ''}`}
                                            >
                                                {row.getVisibleCells().map(cell => {
                                                    const meta = cell.column.columnDef.meta as any
                                                    return (
                                                        <td
                                                            key={cell.id}
                                                            className={`px-4 py-3 ${meta?.className || ''} ${meta?.className?.includes('sticky') ? 'bg-white group-hover:bg-gray-50/80' : ''}`}
                                                        >
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min flex-1">
                                {filteredRegistrations.map((reg, index) => {
                                    const isSelected = selectedIds.includes(reg.id)
                                    const isPending = reg.status === 'pending'
                                    const seqNum = (totalCount - ((page - 1) * 20 + index))

                                    return (
                                        <div
                                            key={reg.id}
                                            onClick={() => isPending && handleSelectOne(reg.id)}
                                            className={`relative flex flex-col bg-white border rounded-xl overflow-hidden transition-all hover:shadow-md cursor-pointer
                                                ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/10' : 'border-gray-200'}
                                                ${isPending ? '' : 'opacity-80 hover:opacity-100'}
                                            `}
                                        >
                                            {/* Selection Overlay */}
                                            {isPending && (
                                                <div className="absolute top-3 right-3 z-10">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSelectOne(reg.id) }}
                                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                                            : 'bg-white border-gray-300 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {isSelected && <Check size={14} strokeWidth={3} />}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Card Header */}
                                            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                                                <span className="font-mono text-sm font-bold text-indigo-600">#{seqNum}</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(reg.created_at).toLocaleString('ko-KR', {
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>

                                            {/* Card Body */}
                                            <div className="p-5 flex-1 space-y-4">
                                                {!['survey', 'demand_survey'].includes(activityDetail?.type) && (
                                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-50">
                                                        <div className="font-bold text-gray-900">{reg.name}</div>
                                                        <div className="text-xs text-gray-500">{reg.department} {reg.student_id}</div>
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    {activityDetail?.form_fields?.map((field) => {
                                                        const formValue = reg.form_responses?.[field.name]
                                                        const surveyValue = (reg as any).survey_responses?.[field.name]
                                                        const value = formValue ?? surveyValue

                                                        // Skip empty values in card view to make it cleaner
                                                        if (value === undefined || value === null || value === '') return null;

                                                        return (
                                                            <div key={field.name} className="bg-gray-50/50 rounded-lg p-3">
                                                                <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                                                                    <div className="w-1 h-1 rounded-full bg-indigo-400"></div>
                                                                    {field.label}
                                                                </div>
                                                                <div className="text-sm text-gray-800 break-words leading-relaxed">
                                                                    {field.type === 'file' ? (
                                                                        <div className="flex flex-col gap-1 mt-1">
                                                                            {(Array.isArray(value) ? value : [value]).map((url: string, idx: number) => {
                                                                                const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)
                                                                                return (
                                                                                    <div key={idx} className="flex items-center gap-2">
                                                                                        {isImage ? (
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation()
                                                                                                    setPreviewImageUrl(url)
                                                                                                }}
                                                                                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                                                                                            >
                                                                                                <ImageIcon size={14} />
                                                                                                {Array.isArray(value) ? `이미지 ${idx + 1} 미리보기` : '미리보기'}
                                                                                            </button>
                                                                                        ) : (
                                                                                            <a
                                                                                                href={url}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 font-medium hover:underline"
                                                                                                onClick={e => e.stopPropagation()}
                                                                                            >
                                                                                                <FileText size={14} />
                                                                                                {Array.isArray(value) ? `파일 ${idx + 1} 다운로드` : '다운로드'}
                                                                                            </a>
                                                                                        )}
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        (Array.isArray(value) ? value.join(', ') : String(value))
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Card Footer */}
                                            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/30">
                                                <div onClick={e => e.stopPropagation()} className="flex-1">
                                                    <StatusDropdown
                                                        registrationId={reg.id}
                                                        currentStatus={reg.status}
                                                        onStatusChange={handleStatusChange}
                                                    />
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedRegistration(reg); }}
                                                    className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors shadow-sm"
                                                    title="상세 보기"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-center gap-2 bg-gray-50/50 mt-auto">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                        .map((p, idx, arr) => {
                                            const showEllipsis = idx > 0 && arr[idx - 1] !== p - 1
                                            return (
                                                <div key={p} className="flex items-center">
                                                    {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                                                    <button
                                                        onClick={() => setPage(p)}
                                                        className={`w-10 h-10 rounded-lg font-medium transition-all ${page === p
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                            : 'text-gray-600 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {p}
                                                    </button>
                                                </div>
                                            )
                                        })}
                                </div>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                // Stats Tab
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
                    {loadingStats ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 size={32} className="text-indigo-600 animate-spin mb-4" />
                            <p className="text-gray-500">통계 데이터를 불러오는 중...</p>
                        </div>
                    ) : surveyStats ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col gap-1">
                                    <p className="text-xs uppercase text-gray-500 tracking-wide">총 응답자</p>
                                    <p className="text-3xl font-semibold text-gray-900">{surveyStats.total_responses}</p>
                                    <p className="text-xs text-gray-400">제출된 응답자 수</p>
                                </div>
                                <div className="p-4 bg-white border border-gray-100 rounded-2xl flex flex-col gap-1">
                                    <p className="text-xs uppercase text-gray-500 tracking-wide">객관식 문항</p>
                                    <p className="text-2xl font-semibold text-gray-900">{objectiveQuestionCount}</p>
                                    <p className="text-xs text-gray-400">선택형 문항 수</p>
                                </div>
                                <div className="p-4 bg-white border border-gray-100 rounded-2xl flex flex-col gap-1">
                                    <p className="text-xs uppercase text-gray-500 tracking-wide">주관식 문항</p>
                                    <p className="text-2xl font-semibold text-gray-900">{subjectiveQuestionCount}</p>
                                    <p className="text-xs text-gray-400">텍스트형 문항 수</p>
                                </div>
                            </div>

                            {resolvedQuestionStats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                    <BarChart3 size={48} className="text-gray-300 mb-4" />
                                    <p className="text-lg font-semibold text-gray-900 mb-1">분석 중입니다</p>
                                    <p className="text-xs text-gray-400 text-center max-w-xs">
                                        아직 문항 정보가 준비되지 않았거나 응답 정리 중입니다. 총 {surveyStats.total_responses}명 응답이 접수되었습니다.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {resolvedQuestionStats.map((stat: SurveyQuestionStat, index: number) => {
                                        const isChoice = OBJECTIVE_TYPES.has(stat.type)
                                        const chartData = Object.entries(stat.responses || {})
                                            .map(([name, value], idx) => ({
                                                name,
                                                value: Number(value),
                                                color: STATS_CHART_COLORS[idx % STATS_CHART_COLORS.length]
                                            }))

                                        const totalForQuestion = chartData.reduce((sum, entry) => sum + entry.value, 0)
                                        const maxItem = chartData.reduce(
                                            (max, item) => (item.value > max.value ? item : max),
                                            { name: '', value: 0, color: STATS_CHART_COLORS[0] }
                                        )
                                        const subjectiveAnswers = Array.isArray(stat.responses) ? stat.responses : []
                                        const subjectiveSummary: SubjectiveSummaryItem[] = Object.entries(
                                            subjectiveAnswers.reduce((acc: Record<string, number>, answer: unknown) => {
                                                const key = String(answer).trim()
                                                if (!key) return acc
                                                acc[key] = (acc[key] || 0) + 1
                                                return acc
                                            }, {} as Record<string, number>)
                                        )
                                            .map(([answer, count]) => ({ answer, count: Number(count) }))
                                            .sort((a, b) => b.count - a.count)
                                            .slice(0, 3)

                                        return (
                                            <Card key={index} className="space-y-4">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-full px-2 py-1">Q{index + 1}</span>
                                                    <span className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-500">
                                                        {QUESTION_TYPE_LABELS[stat.type] || '응답'}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        응답 {isChoice ? totalForQuestion : subjectiveAnswers.length}건
                                                    </span>
                                                </div>
                                                <h4 className="text-lg font-semibold text-gray-900">{stat.question}</h4>

                                                {isChoice ? (
                                                    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                                                        <div className="flex items-center justify-center">
                                                            {chartData.length > 0 ? (
                                                                <div className="relative w-full h-40">
                                                                    <ResponsiveContainer>
                                                                        <PieChart>
                                                                            <Pie
                                                                                data={chartData}
                                                                                dataKey="value"
                                                                                nameKey="name"
                                                                                innerRadius="75%"
                                                                                outerRadius="100%"
                                                                                startAngle={90}
                                                                                endAngle={-270}
                                                                                stroke="#ffffff"
                                                                                strokeWidth={2}
                                                                            >
                                                                                {chartData.map(item => (
                                                                                    <Cell key={item.name} fill={item.color} />
                                                                                ))}
                                                                            </Pie>
                                                                        </PieChart>
                                                                    </ResponsiveContainer>
                                                                    <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-gray-900 pointer-events-none">
                                                                        {totalForQuestion}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-gray-400">응답이 없습니다.</p>
                                                            )}
                                                        </div>
                                                    <div className="space-y-3">
                                                        {chartData.length > 0 ? (
                                                            <>
                                                                <div className="text-sm text-gray-500 flex justify-between">
                                                                    <span>가장 많은 응답</span>
                                                                    <span className="font-semibold text-gray-900">{maxItem.name} ({maxItem.value}명)</span>
                                                                </div>
                                                                <div className="mt-2 space-y-3">
                                                                    {chartData.map(item => {
                                                                        const maxValue = maxItem.value ?? 0
                                                                        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
                                                                        return (
                                                                            <div key={item.name} className="space-y-1">
                                                                                <div className="flex items-center justify-between text-sm text-gray-600">
                                                                                    <span className="font-medium text-gray-900">{item.name}</span>
                                                                                    <span>{item.value}명</span>
                                                                                </div>
                                                                                <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                                                                                    <div
                                                                                        className="h-full rounded-full"
                                                                                        style={{ width: `${percentage}%`, backgroundColor: item.color }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-gray-400">옵션 응답이 없습니다.</p>
                                                        )}
                                                    </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3 bg-gray-50/60 p-4 rounded-2xl">
                                                        <p className="text-sm text-gray-500">{`주관식 응답 ${subjectiveAnswers.length}건`}</p>
                                                        {subjectiveSummary.length > 0 ? (
                                                            <ul className="space-y-2 text-sm text-gray-700">
                                                            {subjectiveSummary.map((item: SubjectiveSummaryItem, idx) => (
                                                                    <li key={idx} className="flex items-center justify-between gap-3">
                                                                        <span className="truncate">{item.answer}</span>
                                                                        <span className="text-indigo-600 font-semibold text-xs">{item.count}회</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-sm text-gray-400">응답이 아직 없습니다.</p>
                                                        )}
                                                        <p className="text-xs text-gray-400">
                                                            추가 답변은 신청자 상세 정보를 확인하세요.
                                                        </p>
                                                    </div>
                                                )}
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <BarChart3 size={48} className="text-gray-300 mb-4" />
                            <p>표시할 통계 데이터가 없습니다.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Sub-modals */}
            <AnimatePresence>
                {selectedRegistration && (
                    <RegistrationDetailModal
                        registration={selectedRegistration}
                        activityDetail={activityDetail}
                        onClose={() => setSelectedRegistration(null)}
                        onStatusChange={handleStatusChange}
                        onImagePreview={setPreviewImageUrl}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {previewImageUrl && (
                    <ImagePreviewModal
                        imageUrl={previewImageUrl}
                        onClose={() => setPreviewImageUrl(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
