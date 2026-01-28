import { useState, useEffect, useCallback, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { activityAdminApi, activityApi } from '../../../lib/api/activities'
import type { ActivityListItem, ActivityRegistrationResponse, Activity } from '../../../types/activities'
import {
    X, Search, CheckCircle, XCircle, Clock, User, Phone, Building,
    Hash, Calendar, Eye, ChevronLeft, ChevronRight, Users, BarChart3,
    MessageCircle, Image as ImageIcon, Check, Loader2
} from 'lucide-react'

// Sub-components
import { StatusDropdown } from './StatusDropdown'
import { RegistrationDetailModal } from './RegistrationDetailModal'
import { SurveyStatsModal } from './SurveyStatsModal'
import { ImagePreviewModal } from './ImagePreviewModal'
import { AnimatePresence, motion } from 'framer-motion'

type RegistrationsModalProps = {
    activity: ActivityListItem
    onClose: () => void
}

type StatusFilterType = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'

const STATUS_CONFIG: Record<StatusFilterType, { label: string; color: string; icon: React.ReactNode }> = {
    all: { label: '전체', color: 'gray', icon: <Users size={14} /> },
    pending: { label: '대기', color: 'amber', icon: <Clock size={14} /> },
    approved: { label: '승인', color: 'emerald', icon: <CheckCircle size={14} /> },
    rejected: { label: '거절', color: 'red', icon: <XCircle size={14} /> },
    cancelled: { label: '취소', color: 'gray', icon: <XCircle size={14} /> }
}

/**
 * 활동 신청자 목록을 보여주는 관리자 모달
 * 개별 신청자의 추가 정보, 상태 변경, 설문조사 통계 지원
 */
export const RegistrationsModal = ({ activity, onClose }: RegistrationsModalProps) => {
    const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([])
    const [activityDetail, setActivityDetail] = useState<Activity | null>(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [totalCount, setTotalCount] = useState(0)

    // Filter & Search
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all')

    // Modals
    const [selectedRegistration, setSelectedRegistration] = useState<ActivityRegistrationResponse | null>(null)
    const [showSurveyStats, setShowSurveyStats] = useState(false)
    const [surveyStats, setSurveyStats] = useState<any>(null)
    const [loadingSurveyStats, setLoadingSurveyStats] = useState(false)
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

    // Bulk actions
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [processingBulk, setProcessingBulk] = useState(false)

    // Fetch activity detail
    const fetchActivityDetail = useCallback(async () => {
        try {
            const detail = await activityApi.getById(activity.id)
            setActivityDetail(detail)
        } catch (error) {
            console.error('Failed to fetch activity detail', error)
        }
    }, [activity.id])

    // Fetch registrations
    const fetchRegistrations = useCallback(async (pageNum: number) => {
        try {
            setLoading(true)
            const data = await activityAdminApi.getRegistrations(activity.id, { page: pageNum, page_size: 15 })
            setRegistrations(data.registrations)
            setTotalPages(data.pagination.total_pages)
            setTotalCount(data.pagination.total)
        } catch (error) {
            console.error('Failed to fetch registrations', error)
            alert('신청자 목록을 불러오는데 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }, [activity.id])

    // Fetch survey stats
    const fetchSurveyStats = async () => {
        try {
            setLoadingSurveyStats(true)
            const stats = await activityAdminApi.getSurveyStats(activity.id)
            setSurveyStats(stats)
            setShowSurveyStats(true)
        } catch (error) {
            console.error('Failed to fetch survey stats', error)
            alert('설문조사 통계를 불러오는데 실패했습니다.')
        } finally {
            setLoadingSurveyStats(false)
        }
    }

    // Handle status change
    const handleStatusChange = async (registrationId: number, status: 'pending' | 'approved' | 'rejected') => {
        try {
            await activityAdminApi.updateRegistrationStatus(activity.id, registrationId, status)
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
            await Promise.all(selectedIds.map(id =>
                activityAdminApi.updateRegistrationStatus(activity.id, id, status)
            ))
            setSelectedIds([])
            fetchRegistrations(page)
        } catch (error) {
            console.error('Failed to bulk update', error)
            alert('일괄 처리에 실패했습니다.')
        } finally {
            setProcessingBulk(false)
        }
    }

    useEffect(() => {
        fetchRegistrations(page)
    }, [page, fetchRegistrations])

    useEffect(() => {
        fetchActivityDetail()
    }, [fetchActivityDetail])

    // Filter registrations client-side
    const filteredRegistrations = registrations.filter(reg => {
        const matchesSearch = searchQuery === '' ||
            reg.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reg.student_id?.includes(searchQuery) ||
            reg.phone?.includes(searchQuery)
        const matchesStatus = statusFilter === 'all' || reg.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const isSurvey = activity.type === 'survey' || activity.type === 'demand_survey'
    const pendingRegistrations = filteredRegistrations.filter(r => r.status === 'pending')
    const isAllSelected = pendingRegistrations.length > 0 && pendingRegistrations.every(r => selectedIds.includes(r.id))

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds([])
        } else {
            setSelectedIds(pendingRegistrations.map(r => r.id))
        }
    }

    const handleSelectOne = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(i => i !== id))
        } else {
            setSelectedIds(prev => [...prev, id])
        }
    }

    // Status counts
    const statusCounts = registrations.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return (
        <Transition appear show={true} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="bg-white rounded-2xl w-full max-w-[95vw] h-[90vh] overflow-hidden shadow-2xl flex flex-col transform transition-all">
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200">
                                            <Users size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">신청자 목록</h2>
                                            <p className="text-sm text-gray-500">{activity.title}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        {isSurvey && (
                                            <button
                                                onClick={fetchSurveyStats}
                                                disabled={loadingSurveyStats}
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 font-medium rounded-xl hover:bg-purple-100 disabled:opacity-50 transition-all"
                                            >
                                                <BarChart3 size={16} />
                                                {loadingSurveyStats ? '로딩중...' : '설문 통계'}
                                            </button>
                                        )}
                                        <button
                                            onClick={onClose}
                                            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats Bar */}
                                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-4 overflow-x-auto">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">총</span>
                                            <span className="text-lg font-bold text-gray-900">{totalCount}</span>
                                            <span className="text-sm text-gray-500">명</span>
                                        </div>
                                        <div className="h-6 w-px bg-gray-200" />
                                        <div className="flex gap-3">
                                            {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'all').map(([key, config]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setStatusFilter(key as StatusFilterType)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === key
                                                        ? `bg-${config.color}-100 text-${config.color}-700 ring-2 ring-${config.color}-200`
                                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {config.icon}
                                                    {config.label}
                                                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-xs font-bold">
                                                        {statusCounts[key] || 0}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Toolbar */}
                                <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-4">
                                    {/* Search */}
                                    <div className="flex-1 relative max-w-md">
                                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="이름, 학번, 연락처 검색..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm"
                                        />
                                        {searchQuery && (
                                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Bulk Actions */}
                                    {selectedIds.length > 0 && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                                            <span className="text-sm font-medium text-gray-600">
                                                <span className="text-purple-600 font-bold">{selectedIds.length}</span>명 선택
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

                                {/* Content */}
                                <div className="flex-1 overflow-auto p-6">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
                                                <Loader2 size={28} className="text-purple-600 animate-spin" />
                                            </div>
                                            <p className="text-gray-500">신청자 목록을 불러오는 중...</p>
                                        </div>
                                    ) : filteredRegistrations.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                                <Users size={32} className="text-gray-400" />
                                            </div>
                                            <p className="font-medium text-gray-900">신청자가 없습니다</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {searchQuery || statusFilter !== 'all' ? '검색 조건에 맞는 신청자가 없습니다' : '아직 신청한 사람이 없습니다'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                                            <table className="w-full whitespace-nowrap text-sm">
                                                <thead className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left w-12">
                                                            <button
                                                                onClick={handleSelectAll}
                                                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isAllSelected
                                                                    ? 'bg-purple-600 border-purple-600 text-white'
                                                                    : 'border-gray-300 hover:border-gray-400'
                                                                    }`}
                                                            >
                                                                {isAllSelected && <Check size={12} strokeWidth={3} />}
                                                            </button>
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">
                                                            <div className="flex items-center gap-1.5"><User size={14} />이름</div>
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">
                                                            <div className="flex items-center gap-1.5"><Hash size={14} />학번</div>
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">
                                                            <div className="flex items-center gap-1.5"><Building size={14} />학과</div>
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">
                                                            <div className="flex items-center gap-1.5"><Phone size={14} />연락처</div>
                                                        </th>

                                                        {/* Kakao invite specific */}
                                                        {activity.type === 'kakao_invite' && (
                                                            <>
                                                                <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">
                                                                    <div className="flex items-center gap-1.5"><MessageCircle size={14} />카카오톡 ID</div>
                                                                </th>
                                                                <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">
                                                                    <div className="flex items-center gap-1.5"><ImageIcon size={14} />인증자료</div>
                                                                </th>
                                                            </>
                                                        )}

                                                        {/* Dynamic form fields */}
                                                        {activityDetail?.form_fields?.map((field) => (
                                                            <th key={field.name} className="px-4 py-3 text-left font-semibold text-purple-700 uppercase text-xs tracking-wider bg-purple-50/50 min-w-[150px] border-l border-purple-100">
                                                                {field.label}
                                                            </th>
                                                        ))}

                                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider border-l border-gray-100">
                                                            <div className="flex items-center gap-1.5"><Calendar size={14} />신청일시</div>
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">상태</th>
                                                        <th className="px-4 py-3 text-center font-semibold text-gray-600 uppercase text-xs tracking-wider">관리</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 bg-white">
                                                    {filteredRegistrations.map(reg => {
                                                        const isSelected = selectedIds.includes(reg.id)
                                                        const isPending = reg.status === 'pending'
                                                        return (
                                                            <tr
                                                                key={reg.id}
                                                                onClick={() => isPending && handleSelectOne(reg.id)}
                                                                className={`transition-colors ${isPending ? 'cursor-pointer hover:bg-gray-50/80' : 'hover:bg-gray-50/50'} ${isSelected ? 'bg-purple-50/50' : ''}`}
                                                            >
                                                                <td className="px-4 py-3">
                                                                    {isPending && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleSelectOne(reg.id) }}
                                                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
                                                                                ? 'bg-purple-600 border-purple-600 text-white'
                                                                                : 'border-gray-300 hover:border-gray-400'
                                                                                }`}
                                                                        >
                                                                            {isSelected && <Check size={12} strokeWidth={3} />}
                                                                        </button>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 font-medium text-gray-900">{reg.name || '-'}</td>
                                                                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{reg.student_id || '-'}</td>
                                                                <td className="px-4 py-3 text-gray-600">{reg.department || '-'}</td>
                                                                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{reg.phone || '-'}</td>

                                                                {/* Kakao invite specific */}
                                                                {activity.type === 'kakao_invite' && (
                                                                    <>
                                                                        <td className="px-4 py-3 text-gray-600">{reg.kakao_id || '-'}</td>
                                                                        <td className="px-4 py-3">
                                                                            {reg.verification_image_url ? (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(reg.verification_image_url!) }}
                                                                                    className="flex items-center gap-1 text-purple-600 hover:text-purple-800 text-xs font-medium"
                                                                                >
                                                                                    <Eye size={14} />
                                                                                    보기
                                                                                </button>
                                                                            ) : (
                                                                                <span className="text-gray-300">-</span>
                                                                            )}
                                                                        </td>
                                                                    </>
                                                                )}

                                                                {/* Dynamic form responses */}
                                                                {activityDetail?.form_fields?.map((field) => {
                                                                    const formValue = reg.form_responses?.[field.name]
                                                                    const surveyValue = (reg as any).survey_responses?.[field.name]
                                                                    const value = formValue ?? surveyValue
                                                                    return (
                                                                        <td
                                                                            key={field.name}
                                                                            className="px-4 py-3 text-gray-700 max-w-[200px] truncate bg-purple-50/20 border-l border-purple-50"
                                                                            title={Array.isArray(value) ? value.join(', ') : String(value || '')}
                                                                        >
                                                                            {value === undefined || value === null || value === ''
                                                                                ? <span className="text-gray-300">-</span>
                                                                                : (Array.isArray(value) ? value.join(', ') : String(value))
                                                                            }
                                                                        </td>
                                                                    )
                                                                })}

                                                                <td className="px-4 py-3 text-gray-500 text-xs border-l border-gray-100">
                                                                    {new Date(reg.created_at).toLocaleString('ko-KR', {
                                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </td>
                                                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                                    <StatusDropdown
                                                                        registrationId={reg.id}
                                                                        currentStatus={reg.status}
                                                                        onStatusChange={handleStatusChange}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSelectedRegistration(reg)}
                                                                        className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-all"
                                                                        title="상세"
                                                                    >
                                                                        <Eye size={14} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-center gap-2 bg-gray-50/50">
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
                                                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
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
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>

                {/* Sub-modals */}
                {selectedRegistration && (
                    <RegistrationDetailModal
                        registration={selectedRegistration}
                        activityDetail={activityDetail}
                        onClose={() => setSelectedRegistration(null)}
                        onStatusChange={handleStatusChange}
                        onImagePreview={setPreviewImageUrl}
                    />
                )}

                {showSurveyStats && surveyStats && (
                    <SurveyStatsModal
                        surveyStats={surveyStats}
                        onClose={() => setShowSurveyStats(false)}
                    />
                )}

                {previewImageUrl && (
                    <ImagePreviewModal
                        imageUrl={previewImageUrl}
                        onClose={() => setPreviewImageUrl(null)}
                    />
                )}
            </Dialog>
        </Transition>
    )
}
