import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { activityAdminApi, activityApi } from '../../../../lib/api/activities'
import type { ActivityListItem, ActivityRegistrationResponse, Activity } from '../../../../types/activities'

import { toast } from 'sonner'
import Swal from 'sweetalert2'
import {
    Search, CheckCircle, XCircle, Clock, User, Phone, Building,
    Hash, Calendar, Eye, ChevronLeft, ChevronRight, Users,
    MessageCircle, Image as ImageIcon, Check, Loader2, Ban,
    Plus, Edit2, Trash2
} from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { StatusDropdown } from '../../../../components/activities/admin/StatusDropdown'
import { RegistrationDetailModal } from '../../../../components/activities/admin/RegistrationDetailModal'
import { ImagePreviewModal } from '../../../../components/activities/admin/ImagePreviewModal'

export const Route = createFileRoute('/admin/(service)/kakaotalk/')({
    component: AdminKakaoTalkPage,
})

type StatusFilterType = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'

const STATUS_CONFIG: Record<StatusFilterType, { label: string; icon: React.ReactNode; bgClass: string; textClass: string }> = {
    all: { label: '전체', icon: <Users size={14} />, bgClass: 'bg-gray-100', textClass: 'text-gray-700' },
    pending: { label: '대기', icon: <Clock size={14} />, bgClass: 'bg-amber-100', textClass: 'text-amber-700' },
    approved: { label: '초대 완료', icon: <CheckCircle size={14} />, bgClass: 'bg-emerald-100', textClass: 'text-emerald-700' },
    rejected: { label: '반려', icon: <XCircle size={14} />, bgClass: 'bg-red-100', textClass: 'text-red-700' },
    cancelled: { label: '취소됨', icon: <Ban size={14} />, bgClass: 'bg-gray-100', textClass: 'text-gray-500' },
}

function AdminKakaoTalkPage() {
    const navigate = useNavigate()

    // Activity state
    const [activities, setActivities] = useState<ActivityListItem[]>([])
    const [selectedActivity, setSelectedActivity] = useState<ActivityListItem | null>(null)
    const [activityDetail, setActivityDetail] = useState<Activity | null>(null)

    // Registrations state
    const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [totalCount, setTotalCount] = useState(0)

    // Filter & Search
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all')

    // Modals
    const [selectedRegistration, setSelectedRegistration] = useState<ActivityRegistrationResponse | null>(null)
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

    // Bulk actions
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [processingBulk, setProcessingBulk] = useState(false)

    // Fetch kakao_invite activities
    const fetchActivities = useCallback(async () => {
        try {
            setLoading(true)
            const response = await activityApi.getAll({ is_active_only: false })
            const kakaoActivities = response.activities.filter(a => a.type === 'kakao_invite')
            setActivities(kakaoActivities)
        } catch (error) {
            console.error('Failed to fetch activities', error)
        } finally {
            setLoading(false)
        }
    }, [])

    // Ensure we have a selected activity if possible
    useEffect(() => {
        if (activities.length === 0) {
            setSelectedActivity(null)
            return
        }

        if (selectedActivity) {
            const found = activities.find(a => a.id === selectedActivity.id)
            if (found) {
                if (found !== selectedActivity) setSelectedActivity(found)
            } else {
                setSelectedActivity(activities[0])
            }
        } else {
            setSelectedActivity(activities[0])
        }
    }, [activities, selectedActivity])

    // Fetch activity detail
    const fetchActivityDetail = useCallback(async () => {
        if (!selectedActivity) return
        try {
            const detail = await activityApi.getById(selectedActivity.id)
            setActivityDetail(detail)
        } catch (error) {
            console.error('Failed to fetch activity detail', error)
        }
    }, [selectedActivity])

    // Fetch registrations
    const fetchRegistrations = useCallback(async (pageNum: number) => {
        if (!selectedActivity) return
        try {
            setLoading(true)
            const data = await activityAdminApi.getRegistrations(selectedActivity.id, { page: pageNum, page_size: 20 })
            setRegistrations(data.registrations)
            setTotalPages(data.pagination.total_pages)
            setTotalCount(data.pagination.total)
        } catch (error) {
            console.error('Failed to fetch registrations', error)
        } finally {
            setLoading(false)
        }
    }, [selectedActivity])

    useEffect(() => {
        fetchActivities()
    }, [fetchActivities])

    useEffect(() => {
        if (selectedActivity) {
            fetchActivityDetail()
            fetchRegistrations(page)
            setSelectedIds([]) // Clear selection on activity change
        }
    }, [selectedActivity, page, fetchActivityDetail, fetchRegistrations])

    // Handle status change
    const handleStatusChange = async (registrationId: number, status: 'pending' | 'approved' | 'rejected') => {
        if (!selectedActivity) return
        try {
            await activityAdminApi.updateRegistrationStatus(selectedActivity.id, registrationId, status)
            toast.success('상태가 변경되었습니다.')
            fetchRegistrations(page)
        } catch (error) {
            console.error('Failed to update registration status', error)
            toast.error('상태 변경에 실패했습니다.')
        }
    }

    // Handle bulk status change
    const handleBulkStatusChange = async (status: 'approved' | 'rejected') => {
        if (selectedIds.length === 0 || !selectedActivity) return

        setProcessingBulk(true)
        try {
            await Promise.all(selectedIds.map(id =>
                activityAdminApi.updateRegistrationStatus(selectedActivity.id, id, status)
            ))
            setSelectedIds([])
            toast.success(`${selectedIds.length}개 항목이 일괄 처리되었습니다.`)
            fetchRegistrations(page)
        } catch (error) {
            console.error('Failed to bulk update', error)
            toast.error('일괄 처리에 실패했습니다.')
        } finally {
            setProcessingBulk(false)
        }
    }

    // CRUD Handlers - Navigation based
    const handleCreate = () => {
        navigate({ to: '/admin/kakaotalk/create' })
    }

    const handleEdit = () => {
        if (!selectedActivity) return
        navigate({ to: `/admin/kakaotalk/${selectedActivity.id}/edit` })
    }

    const handleDelete = async () => {
        if (!selectedActivity) return
        const result = await Swal.fire({
            title: '정말 삭제하시겠습니까?',
            text: "해당 카톡방 초대와 모든 신청 정보가 삭제됩니다!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '삭제',
            cancelButtonText: '취소'
        })

        if (!result.isConfirmed) return

        try {
            await activityAdminApi.delete(selectedActivity.id)
            toast.success('삭제되었습니다.')
            fetchActivities()
        } catch (error) {
            console.error('Failed to delete activity', error)
            toast.error('삭제에 실패했습니다.')
        }
    }

    // Filter registrations client-side
    const filteredRegistrations = useMemo(() => {
        return registrations.filter(reg => {
            const matchesSearch = searchQuery === '' ||
                reg.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                reg.student_id?.includes(searchQuery) ||
                reg.phone?.includes(searchQuery) ||
                reg.kakao_id?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === 'all' || reg.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [registrations, searchQuery, statusFilter])

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
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    // Status counts
    const statusCounts = useMemo(() => {
        const counts: Record<StatusFilterType, number> = { all: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 }
        registrations.forEach(reg => {
            counts.all++
            if (reg.status === 'pending') counts.pending++
            else if (reg.status === 'approved') counts.approved++
            else if (reg.status === 'rejected') counts.rejected++
            else if (reg.status === 'cancelled') counts.cancelled++
        })
        return counts
    }, [registrations])

    return (
        <div className="p-6 max-w-7xl mx-auto font-sans">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
                        <MessageCircle size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">카톡방 초대 관리</h1>
                        <p className="text-gray-500 mt-0.5">카카오톡 오픈채팅방 초대 신청을 관리합니다</p>
                    </div>
                </div>
            </div>

            {/* Activity Tabs */}
            <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">카톡방 초대 목록</h2>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md text-sm font-medium"
                    >
                        <Plus size={18} />
                        새 카톡방 초대
                    </button>
                </div>
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <MessageCircle size={40} className="mx-auto mb-2 opacity-30" />
                        <p>아직 등록된 카톡방 초대가 없습니다.</p>
                        <button
                            onClick={handleCreate}
                            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
                        >
                            첫 번째 카톡방 초대 만들기
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {activities.map(act => (
                            <button
                                type="button"
                                key={act.id}
                                onClick={() => { setSelectedActivity(act); setPage(1) }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedActivity?.id === act.id
                                    ? 'bg-yellow-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                {act.title}
                                <span className="ml-2 text-xs opacity-70">({act.current_count}명)</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedActivity && (
                <>
                    {/* Activity Info & Actions */}
                    <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-1">{selectedActivity.title}</h2>
                                {activityDetail?.description && (
                                    <p className="text-sm text-gray-600 whitespace-pre-line max-w-2xl">{activityDetail.description}</p>
                                )}
                                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {selectedActivity.registration_start ? new Date(selectedActivity.registration_start).toLocaleDateString('ko-KR') : '미정'}
                                        {' ~ '}
                                        {selectedActivity.registration_end ? new Date(selectedActivity.registration_end).toLocaleDateString('ko-KR') : '미정'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users size={12} />
                                        {selectedActivity.current_count}명 신청
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleEdit}
                                    className="p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-all"
                                    title="수정"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all"
                                    title="삭제"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="mb-4 bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex gap-2">
                                {(Object.keys(STATUS_CONFIG) as StatusFilterType[]).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === status
                                            ? `${STATUS_CONFIG[status].bgClass} ${STATUS_CONFIG[status].textClass}`
                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {STATUS_CONFIG[status].icon}
                                        {STATUS_CONFIG[status].label}
                                        <span className="text-xs opacity-70">({statusCounts[status]})</span>
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="이름, 학번, 전화, 카톡 ID..."
                                    className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 w-64 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedIds.length > 0 && (
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center justify-between">
                            <span className="text-sm font-medium text-yellow-800">
                                {selectedIds.length}개 선택됨
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleBulkStatusChange('approved')}
                                    disabled={processingBulk}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-all"
                                >
                                    {processingBulk ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    일괄 승인
                                </button>
                                <button
                                    onClick={() => handleBulkStatusChange('rejected')}
                                    disabled={processingBulk}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-all"
                                >
                                    {processingBulk ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                    일괄 반려
                                </button>
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-all"
                                >
                                    선택 해제
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Registrations Table */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        {loading && registrations.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 size={32} className="animate-spin text-yellow-500" />
                            </div>
                        ) : filteredRegistrations.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Users size={40} className="mx-auto mb-2 opacity-30" />
                                <p>신청이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">신청자</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">학번</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">학과</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">연락처</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">카톡 ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">인증</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">상태</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredRegistrations.map(reg => (
                                            <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    {reg.status === 'pending' && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(reg.id)}
                                                            onChange={() => handleSelectOne(reg.id)}
                                                            className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <User size={14} className="text-gray-500" />
                                                        </div>
                                                        <span className="font-medium text-gray-900">{reg.name || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1.5">
                                                        <Hash size={12} className="text-gray-400" />
                                                        {reg.student_id || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1.5">
                                                        <Building size={12} className="text-gray-400" />
                                                        {reg.department || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone size={12} className="text-gray-400" />
                                                        {reg.phone || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1.5">
                                                        <MessageCircle size={12} className="text-yellow-500" />
                                                        <span className="font-medium">{reg.kakao_id || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {reg.verification_image_url ? (
                                                        <button
                                                            onClick={() => setPreviewImageUrl(reg.verification_image_url!)}
                                                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                            title="인증샷 보기"
                                                        >
                                                            <ImageIcon size={16} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">없음</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusDropdown
                                                        registrationId={reg.id}
                                                        currentStatus={reg.status}
                                                        onStatusChange={handleStatusChange}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => setSelectedRegistration(reg)}
                                                        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                        title="상세 보기"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                                <span className="text-sm text-gray-500">
                                    총 {totalCount}개 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, totalCount)}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="text-sm text-gray-700 font-medium px-2">
                                        {page} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modals */}
            <AnimatePresence>
                {selectedRegistration && (
                    <RegistrationDetailModal
                        registration={selectedRegistration}
                        activityDetail={activityDetail}
                        onClose={() => setSelectedRegistration(null)}
                        onStatusChange={(_id, status) => {
                            handleStatusChange(selectedRegistration.id, status)
                            setSelectedRegistration(null)
                        }}
                        onImagePreview={setPreviewImageUrl}
                    />
                )}

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
