import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react'
import { activityAdminApi, activityApi } from '../../../lib/api/activities'
import type { ActivityListItem, ActivityRegistrationResponse, Activity, ActivityCreateRequest, ActivityType } from '../../../types/activities'
import { activityTypeLabels } from '../../../types/activities'
import { FormFieldsManager, ImageUploader, type UploadImage } from '../../../components/activities/admin'
import { toast } from 'sonner'
import Swal from 'sweetalert2'
import TextareaAutosize from 'react-textarea-autosize'
import {
    Search, CheckCircle, XCircle, Clock, User, Phone, Building,
    Hash, Calendar, Eye, ChevronLeft, ChevronRight, Users,
    MessageCircle, Image as ImageIcon, Check, Loader2, ArrowLeft, Ban,
    Plus, Edit2, Trash2
} from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { StatusDropdown } from '../../../components/activities/admin/StatusDropdown'
import { RegistrationDetailModal } from '../../../components/activities/admin/RegistrationDetailModal'
import { ImagePreviewModal } from '../../../components/activities/admin/ImagePreviewModal'

export const Route = createFileRoute('/admin/kakaotalk/')({
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

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
    const [saving, setSaving] = useState(false)

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

    // Image Upload State
    const [images, setImages] = useState<UploadImage[]>([])
    const [isDragging, setIsDragging] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [formData, setFormData] = useState<ActivityCreateRequest>({
        type: 'kakao_invite',
        title: '',
        description: '',
        registration_start: '',
        registration_end: '',
        max_capacity: undefined,
        require_membership: false,
        is_active: true,
        thumbnail_url: '',
        form_fields: [],
        config: {}
    })

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
            fetchRegistrations(page)
        } catch (error) {
            console.error('Failed to update registration status', error)
            alert('상태 변경에 실패했습니다.')
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
            fetchRegistrations(page)
        } catch (error) {
            console.error('Failed to bulk update', error)
            alert('일괄 처리에 실패했습니다.')
        } finally {
            setProcessingBulk(false)
        }
    }

    // Modal Helpers
    const adjustScrollToCenter = useCallback(() => {
        if (!textareaRef.current) return;
        const textarea = textareaRef.current;
        const scrollParent = textarea.closest('.overflow-y-auto') as HTMLElement;
        if (scrollParent) {
            const caret = getCaretCoordinates(textarea, textarea.selectionEnd);
            const textareaRect = textarea.getBoundingClientRect();
            const parentRect = scrollParent.getBoundingClientRect();
            const relativeTop = textareaRect.top - parentRect.top + scrollParent.scrollTop;
            const caretAbsoluteTop = relativeTop + caret.top;
            const targetScrollTop = caretAbsoluteTop - (scrollParent.clientHeight / 2);
            scrollParent.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
        }
    }, [])

    useLayoutEffect(() => {
        if (isModalOpen) {
            adjustScrollToCenter()
        }
    }, [formData.description, adjustScrollToCenter, isModalOpen])

    const uploadImages = async (): Promise<string[]> => {
        const uploadedUrls: string[] = []
        for (const img of images) {
            if (img.uploaded && img.url) {
                uploadedUrls.push(img.url)
                continue
            }
            if (img.uploading) continue
            try {
                setImages(prev => prev.map(i => i.id === img.id ? { ...i, uploading: true } : i))
                const { presigned_url, public_url } = await activityAdminApi.getPresignedUrl(img.file.name)
                await activityAdminApi.uploadImage(presigned_url, img.file)
                setImages(prev => prev.map(i => i.id === img.id ? { ...i, uploading: false, uploaded: true, url: public_url } : i))
                uploadedUrls.push(public_url)
            } catch (error) {
                console.error('Image upload error:', error)
                setImages(prev => prev.map(i => i.id === img.id ? { ...i, uploading: false, error: '업로드 실패' } : i))
            }
        }
        return uploadedUrls
    }

    // CRUD Handlers
    const openCreateModal = () => {
        setEditingActivity(null)
        setFormData({
            type: 'kakao_invite',
            title: '',
            description: '',
            registration_start: '',
            registration_end: '',
            max_capacity: undefined,
            require_membership: false,
            is_active: true,
            thumbnail_url: '',
            form_fields: [],
            config: {}
        })
        setImages([])
        setIsModalOpen(true)
    }

    const openEditModal = async () => {
        if (!selectedActivity) return
        try {
            // We need full detail for editing (config, etc)
            const detail = await activityApi.getById(selectedActivity.id)
            setEditingActivity(detail)
            setFormData({
                type: detail.type,
                title: detail.title,
                description: detail.description || '',
                registration_start: toLocalISOString(detail.registration_start),
                registration_end: toLocalISOString(detail.registration_end),
                max_capacity: detail.max_capacity || undefined,
                require_membership: detail.require_membership,
                is_active: detail.is_active,
                thumbnail_url: detail.thumbnail_url || '',
                form_fields: detail.form_fields || [],
                config: detail.config || {}
            })

            const existingImages: UploadImage[] = []
            if (detail.images && detail.images.length > 0) {
                detail.images.forEach((img, idx) => {
                    existingImages.push({
                        id: `existing-${idx}`,
                        file: new File([], 'existing'),
                        preview: img.image_url,
                        uploading: false,
                        uploaded: true,
                        url: img.image_url
                    })
                })
            } else if (detail.thumbnail_url) {
                existingImages.push({
                    id: 'existing-thumbnail',
                    file: new File([], 'existing'),
                    preview: detail.thumbnail_url,
                    uploading: false,
                    uploaded: true,
                    url: detail.thumbnail_url
                })
            }
            setImages(existingImages)
            setIsModalOpen(true)
        } catch (error) {
            console.error('Failed to fetch detail for edit', error)
            toast.error('정보를 불러오는데 실패했습니다.')
        }
    }

    const deleteActivity = async () => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (saving) return

        try {
            setSaving(true)
            const uploadedUrls = await uploadImages()
            const thumbnailUrl = uploadedUrls[0] || formData.thumbnail_url
            const imageUrls = uploadedUrls.map(url => ({ public_url: url }))

            if (editingActivity) {
                await activityAdminApi.update(editingActivity.id, {
                    title: formData.title,
                    description: formData.description,
                    registration_start: formData.registration_start ? new Date(formData.registration_start).toISOString() : undefined,
                    registration_end: formData.registration_end ? new Date(formData.registration_end).toISOString() : undefined,
                    max_capacity: formData.max_capacity,
                    require_membership: formData.require_membership,
                    is_active: formData.is_active,
                    thumbnail_url: thumbnailUrl || undefined,
                    form_fields: formData.form_fields,
                    image_urls: imageUrls.length > 0 ? imageUrls : undefined,
                    config: formData.config
                })
                toast.success('수정되었습니다.')
            } else {
                await activityAdminApi.create({
                    ...formData,
                    type: 'kakao_invite', // Ensure type
                    registration_start: formData.registration_start ? new Date(formData.registration_start).toISOString() : undefined,
                    registration_end: formData.registration_end ? new Date(formData.registration_end).toISOString() : undefined,
                    thumbnail_url: thumbnailUrl,
                    image_urls: imageUrls,
                    config: formData.config
                })
                toast.success('생성되었습니다.')
            }
            setIsModalOpen(false)
            fetchActivities()
        } catch (error) {
            console.error('Failed to save activity', error)
            toast.error('저장에 실패했습니다.')
        } finally {
            setSaving(false)
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
        <div className="p-6 max-w-full mx-auto min-h-screen bg-gray-50/30">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate({ to: '/admin' })}
                        className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-all"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                        <MessageCircle size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">카톡방 초대 관리</h1>
                        <p className="text-sm text-gray-500">카카오톡 오픈채팅방 초대 신청자를 관리합니다</p>
                    </div>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-orange-500/25 font-medium"
                >
                    <Plus size={20} />
                    <span>새 카톡방 초대 만들기</span>
                </button>
            </div>

            {/* Activity Selector & Info */}
            <div className="mb-6 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                {activities.length > 0 ? (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-2">카톡방 선택</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <select
                                            value={selectedActivity?.id || ''}
                                            onChange={(e) => {
                                                const activity = activities.find(a => a.id === Number(e.target.value))
                                                if (activity) setSelectedActivity(activity)
                                            }}
                                            className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer appearance-none"
                                        >
                                            {activities.map(activity => (
                                                <option key={activity.id} value={activity.id}>
                                                    {activity.title}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <ChevronLeft size={16} className="rotate-[-90deg]" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={openEditModal}
                                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-200"
                                        title="수정"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={deleteActivity}
                                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200"
                                        title="삭제"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-gray-500">등록된 카톡방 초대가 없습니다.</p>
                        <p className="text-sm text-gray-400 mt-1">상단의 버튼을 눌러보세요.</p>
                    </div>
                )}
            </div>

            {activities.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <MessageCircle size={32} className="text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-900">시작하기</p>
                    <p className="text-sm text-gray-500 mt-1">새 카톡방 초대를 만들어주세요</p>
                </div>
            ) : (
                <>
                    {/* Stats Bar */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            <div className="flex items-center gap-6 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">총</span>
                                    <span className="text-2xl font-bold text-gray-900">{totalCount}</span>
                                    <span className="text-sm text-gray-500">명 신청</span>
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
                            <div className="flex-1 relative max-w-md w-full">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="이름, 학번, 연락처, 카카오톡 ID 검색..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm"
                                />
                            </div>

                            {/* Bulk Actions */}
                            {selectedIds.length > 0 && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl">
                                    <span className="text-sm font-medium text-gray-600">
                                        <span className="text-purple-600 font-bold">{selectedIds.length}</span>명 선택
                                    </span>
                                    <button
                                        onClick={() => handleBulkStatusChange('approved')}
                                        disabled={processingBulk}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-200 disabled:opacity-50"
                                    >
                                        {processingBulk ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                        일괄 초대 완료
                                    </button>
                                    <button
                                        onClick={() => handleBulkStatusChange('rejected')}
                                        disabled={processingBulk}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 disabled:opacity-50"
                                    >
                                        {processingBulk ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                        일괄 반려
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
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
                            <div className="overflow-x-auto">
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
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">
                                                <div className="flex items-center gap-1.5"><MessageCircle size={14} />카카오톡 ID</div>
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">
                                                <div className="flex items-center gap-1.5"><ImageIcon size={14} />인증자료</div>
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase text-xs tracking-wider">
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
                                                    <td className="px-4 py-3 text-gray-600 font-medium">{reg.kakao_id || '-'}</td>
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
                                                    <td className="px-4 py-3 text-gray-500 text-xs">
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
                    </div>
                </>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingActivity ? '카톡방 초대 수정' : '새 카톡방 초대 만들기'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                <XCircle size={24} className="text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
                            <ImageUploader
                                images={images}
                                onImagesChange={setImages}
                                isDragging={isDragging}
                                onDraggingChange={setIsDragging}
                                maxImages={5}
                            />

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">카톡방 이름</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                    placeholder="예: 24학번 신입생 환영방"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">설명 / 공지사항</label>
                                <TextareaAutosize
                                    ref={textareaRef}
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    minRows={3}
                                    onFocus={adjustScrollToCenter}
                                    onClick={adjustScrollToCenter}
                                    onKeyUp={(e) => {
                                        if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                            adjustScrollToCenter();
                                        }
                                    }}
                                    placeholder="오픈채팅방에 대한 설명이나 규칙을 입력하세요"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                                />
                            </div>

                            <FormFieldsManager
                                fields={formData.form_fields || []}
                                onChange={(fields) => setFormData(prev => ({ ...prev, form_fields: fields }))}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">신청 시작</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.registration_start}
                                        onChange={(e) => setFormData(prev => ({ ...prev, registration_start: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">신청 종료</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.registration_end}
                                        onChange={(e) => setFormData(prev => ({ ...prev, registration_end: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div
                                        onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">활성화 (신청 받기)</span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {saving ? '저장 중...' : (editingActivity ? '수정 완료' : '생성하기')}
                                </button>
                            </div>
                        </form>
                    </div>
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

const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    const { value } = element;
    const properties = [
        'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
        'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
        'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
        'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform',
        'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing',
    ];

    const computed = window.getComputedStyle(element);
    const div = document.createElement('div');
    div.id = 'input-textarea-caret-position-mirror-div';
    document.body.appendChild(div);

    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';

    properties.forEach(prop => {
        div.style.setProperty(prop, computed.getPropertyValue(prop));
    });

    if (element.scrollHeight > parseInt(computed.height)) {
        div.style.overflowY = 'scroll';
    } else {
        div.style.overflow = 'hidden';
    }

    div.textContent = value.substring(0, position);

    const span = document.createElement('span');
    span.textContent = value.substring(position) || '.';
    div.appendChild(span);

    const coordinates = {
        top: span.offsetTop + parseInt(computed.borderTopWidth),
        left: span.offsetLeft + parseInt(computed.borderLeftWidth)
    };

    document.body.removeChild(div);
    return coordinates;
};

const toLocalISOString = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
