import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { activityAdminApi, activityApi } from '../../../../../lib/api/activities'
import type { ActivityRegistrationResponse, Activity } from '../../../../../types/activities'
import {
    User, Phone, Building,
    Hash, Calendar, Eye, BarChart3, Check, Loader2, ArrowLeft, Users,
    PieChart as PieChartIcon, Image as ImageIcon, FileText, Download
} from 'lucide-react'
import {
    useReactTable,
    getCoreRowModel,
    createColumnHelper,
    type RowSelectionState,
    type ColumnDef
} from '@tanstack/react-table'
import { AnimatePresence } from 'framer-motion'
import { StatusDropdown } from '../../../../../components/activities/admin/StatusDropdown'
import { RegistrationDetailModal } from '../../../../../components/activities/admin/RegistrationDetailModal'
import { ImagePreviewModal } from '../../../../../components/activities/admin/ImagePreviewModal'
import { SurveyStatsPanel } from '../../../../../components/activities/admin/SurveyStatsPanel'
import { SurveyRegistrationsPanel } from '../../../../../components/activities/admin/SurveyRegistrationsPanel'
import type { SurveyQuestionStat } from '../../../../../components/activities/admin/surveyStatsTypes'
import type { StatusFilterType } from '../../../../../components/activities/admin/surveyTypes'

export const Route = createFileRoute('/admin/(service)/surveys/$activityId/')({
    component: SurveyActivityDetailPage,
})

type Tab = 'list' | 'stats'

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

    // Excel Download
    const [downloading, setDownloading] = useState(false)

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

    // Handle Excel Download
    const handleDownloadExcel = async () => {
        if (!activityDetail) return
        try {
            setDownloading(true)

            // 1. Fetch first page to know total pages
            const pageSize = 100
            const firstResponse = await activityAdminApi.getRegistrations(id, {
                page: 1,
                page_size: pageSize
            })

            let allRegistrations = [...firstResponse.registrations]
            const totalPages = firstResponse.pagination.total_pages

            // 2. Fetch remaining pages in parallel
            if (totalPages > 1) {
                const promises = []
                for (let i = 2; i <= totalPages; i++) {
                    promises.push(activityAdminApi.getRegistrations(id, {
                        page: i,
                        page_size: pageSize
                    }))
                }
                const responses = await Promise.all(promises)
                responses.forEach(res => {
                    allRegistrations = [...allRegistrations, ...res.registrations]
                })
            }

            if (allRegistrations.length === 0) {
                alert('다운로드할 신청자 데이터가 없습니다.')
                return
            }

            // 2. Prepare data headers
            const headers: string[] = []

            // Basic fields for non-anonymous surveys
            const isAnonymous = ['survey', 'demand_survey'].includes(activityDetail.type) && (activityDetail.config?.is_anonymous ?? true)
            if (!isAnonymous) {
                headers.push('이름', '학번', '학과', '전화번호')
            }

            headers.push('상태', '참여일시')

            // Add custom dynamic form fields headers
            if (activityDetail.form_fields) {
                activityDetail.form_fields.forEach(field => {
                    headers.push(field.label)
                })
            } else if (activityDetail.config?.questions) {
                // Fallback for surveys without form_fields (using config.questions)
                activityDetail.config.questions.forEach((q: any) => {
                    headers.push(q.question)
                })
            }

            // 3. Transform data rows
            const data = allRegistrations.map(reg => {
                const row: any[] = []

                if (!isAnonymous) {
                    row.push(
                        reg.name || '-',
                        reg.student_id || '-',
                        reg.department || '-',
                        reg.phone || '-'
                    )
                }

                row.push(
                    reg.status, // You might want to map this to Korean label if needed
                    new Date(reg.created_at).toLocaleString('ko-KR')
                )

                // Custom fields/questions data matching headers
                if (activityDetail.form_fields) {
                    activityDetail.form_fields.forEach(field => {
                        const val = reg.form_responses?.[field.name] ?? (reg as any).survey_responses?.[field.name]
                        row.push(Array.isArray(val) ? val.join(', ') : val || '')
                    })
                } else if (activityDetail.config?.questions) {
                    activityDetail.config.questions.forEach((q: any) => {
                        const val = reg.form_responses?.[String(q.id)] ?? (reg as any).survey_responses?.[String(q.id)]
                        row.push(Array.isArray(val) ? val.join(', ') : val || '')
                    })
                }

                return row
            })

            // 4. Create Workbook
            const ws = XLSX.utils.aoa_to_sheet([headers, ...data])

            // Set column widths
            const wscols = headers.map(() => ({ wch: 15 }))
            ws['!cols'] = wscols

            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "참여자 목록")

            // 5. Trigger download
            const sanitizedTitle = activityDetail.title.replace(/[:\/\\?*|"<>;]/g, '_')
            XLSX.writeFile(wb, `${sanitizedTitle}_참여자목록_${new Date().toISOString().slice(0, 10)}.xlsx`)

        } catch (error) {
            console.error('Excel download failed', error)
            alert('엑셀 다운로드에 실패했습니다.')
        } finally {
            setDownloading(false)
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
        const isAnonymous = ['survey', 'demand_survey'].includes(activityDetail.type) && (activityDetail.config?.is_anonymous ?? true)

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

                <div className="ml-auto flex gap-2">
                    <button
                        onClick={handleDownloadExcel}
                        disabled={downloading}
                        className="px-4 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-xl hover:bg-emerald-100 disabled:opacity-50 transition-all border border-emerald-100 flex items-center gap-2"
                    >
                        {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        {downloading ? '다운로드 중...' : '엑셀 다운로드'}
                    </button>
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

            {
                currentTab === 'list' ? (
                    <SurveyRegistrationsPanel
                        activityDetail={activityDetail}
                        loading={loading}
                        filteredRegistrations={filteredRegistrations}
                        totalCount={totalCount}
                        statusCounts={statusCounts}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        searchQuery={searchQuery}
                        onSearchQueryChange={setSearchQuery}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        selectedIds={selectedIds}
                        processingBulk={processingBulk}
                        onBulkStatusChange={handleBulkStatusChange}
                        onSelectOne={handleSelectOne}
                        onSelectRegistration={setSelectedRegistration}
                        onPreviewImage={setPreviewImageUrl}
                        table={table}
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        onStatusChange={handleStatusChange}
                    />
                ) : (
                    <SurveyStatsPanel
                        loading={loadingStats}
                        surveyStats={surveyStats}
                        questionStats={resolvedQuestionStats}
                    />
                )
            }

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
        </div >
    )
}
