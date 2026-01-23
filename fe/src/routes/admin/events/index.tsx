import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { activityApi, activityAdminApi } from '../../../lib/api/activities'
import type { ActivityListItem, Activity, ActivityCreateRequest, ActivityType } from '../../../types/activities'
import { activityTypeLabels, getActivityStatus } from '../../../types/activities'
import { FormFieldsManager, ImageUploader, type UploadImage } from '../../../components/activities/admin'
import { toast } from 'sonner'
import Swal from 'sweetalert2'
import {
    Plus, Search, Filter, LayoutGrid, List, Calendar, Users, Clock, Edit2, Trash2, Eye,
    CheckCircle, XCircle, Pause, ChevronLeft, ChevronRight, ClipboardList, Image as ImageIcon,
    X, ChevronDown
} from 'lucide-react'

export const Route = createFileRoute('/admin/events/')({
    component: AdminEventsPage,
})

type ViewMode = 'table' | 'card'
type StatusFilter = 'all' | 'active' | 'scheduled' | 'closed'
type SortOption = 'newest' | 'oldest' | 'title' | 'registrations'

// ========== Skeleton Components ==========
function SkeletonCard() {
    return (
        <div className="animate-pulse bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start gap-4 mb-4">
                <div className="w-20 h-20 bg-gray-200 rounded-xl" />
                <div className="flex-1">
                    <div className="h-5 w-20 bg-gray-200 rounded-full mb-2" />
                    <div className="h-6 w-3/4 bg-gray-200 rounded mb-1" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded" />
                </div>
            </div>
            <div className="flex gap-2 mt-4">
                <div className="h-8 flex-1 bg-gray-200 rounded-lg" />
                <div className="h-8 flex-1 bg-gray-200 rounded-lg" />
            </div>
        </div>
    )
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-6 py-4"><div className="h-5 w-16 bg-gray-200 rounded-full" /></td>
            <td className="px-6 py-4"><div className="h-5 w-48 bg-gray-200 rounded" /></td>
            <td className="px-6 py-4"><div className="h-5 w-16 bg-gray-200 rounded-full" /></td>
            <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-200 rounded" /></td>
            <td className="px-6 py-4"><div className="h-5 w-32 bg-gray-200 rounded" /></td>
            <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-200 rounded" /></td>
        </tr>
    )
}

// ========== Stats Card ==========
function StatsCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    const colorStyles: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        gray: 'bg-gray-50 text-gray-600 border-gray-100',
    }
    return (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${colorStyles[color]}`}>
            <div className="p-2 rounded-lg bg-white shadow-sm">{icon}</div>
            <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs opacity-80">{label}</p>
            </div>
        </div>
    )
}

function AdminEventsPage() {
    const navigate = useNavigate()
    const [activities, setActivities] = useState<ActivityListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null)

    const [saving, setSaving] = useState(false)

    // View & Filter State
    const [viewMode, setViewMode] = useState<ViewMode>('table')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<SortOption>('newest')
    const [showSortDropdown, setShowSortDropdown] = useState(false)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = viewMode === 'card' ? 9 : 10

    // Image State
    const [images, setImages] = useState<UploadImage[]>([])
    const [isDragging, setIsDragging] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [formData, setFormData] = useState<ActivityCreateRequest>({
        type: 'event',
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

    const fetchActivities = async () => {
        try {
            setLoading(true)
            const response = await activityApi.getAll({ is_active_only: false })
            // Filter only event and notice types
            const filtered = response.activities.filter(a => a.type === 'event' || a.type === 'notice')
            setActivities(filtered)
        } catch (error) {
            console.error('Failed to fetch activities', error)
            toast.error('신청 목록을 불러오는데 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchActivities()
    }, [])

    // Scroll to center logic
    const adjustScrollToCenter = useCallback(() => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        // Find the closest parent with overflow-y-auto. 
        // In the modal form, the direct parent form usually has overflow-y-auto (see line 774 in view_file output: <form ... className="p-6 overflow-y-auto ...">)
        const scrollParent = textarea.closest('.overflow-y-auto') as HTMLElement;

        if (scrollParent) {
            const caret = getCaretCoordinates(textarea, textarea.selectionEnd);
            // Calculate absolute top of caret relative to the scroll parent
            const textareaRect = textarea.getBoundingClientRect();
            const parentRect = scrollParent.getBoundingClientRect();
            const relativeTop = textareaRect.top - parentRect.top + scrollParent.scrollTop;

            const caretAbsoluteTop = relativeTop + caret.top;

            // We want caretAbsoluteTop to be in the middle of scrollParent visible height
            const targetScrollTop = caretAbsoluteTop - (scrollParent.clientHeight / 2);

            scrollParent.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        }
    }, [])

    // Ensure scroll to center happens when content changes
    useLayoutEffect(() => {
        if (isModalOpen) {
            adjustScrollToCenter()
        }
    }, [formData.description, adjustScrollToCenter, isModalOpen])

    // Filtered and sorted activities
    const filteredActivities = useMemo(() => {
        let result = [...activities]

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(a => getActivityStatus(a) === statusFilter)
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(a => a.title.toLowerCase().includes(query))
        }

        // Sort
        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                break
            case 'oldest':
                result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
                break
            case 'title':
                result.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
                break
            case 'registrations':
                result.sort((a, b) => (b.current_count || 0) - (a.current_count || 0))
                break
        }

        return result
    }, [activities, statusFilter, searchQuery, sortBy])

    // Pagination
    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)
    const paginatedActivities = filteredActivities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Stats
    const stats = useMemo(() => {
        const activeCount = activities.filter(a => getActivityStatus(a) === 'active').length
        const scheduledCount = activities.filter(a => getActivityStatus(a) === 'scheduled').length
        const closedCount = activities.filter(a => getActivityStatus(a) === 'closed').length
        const totalRegistrations = activities.reduce((sum, a) => sum + (a.current_count || 0), 0)
        return { activeCount, scheduledCount, closedCount, totalRegistrations }
    }, [activities])

    // Image upload
    const uploadImages = async (): Promise<string[]> => {
        const uploadedUrls: string[] = []
        for (const img of images) {
            // 이미 업로드된 이미지는 URL만 추가
            if (img.uploaded && img.url) {
                uploadedUrls.push(img.url)
                continue
            }
            // 현재 업로드 중인 이미지는 건너뛰기
            if (img.uploading) {
                continue
            }
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

    const handleCreate = () => {
        setEditingActivity(null)
        setFormData({
            type: 'event',
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

    const handleEdit = async (activity: ActivityListItem) => {
        try {
            const detail = await activityApi.getById(activity.id)
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
            console.error('Failed to fetch activity detail', error)
            toast.error('상세 정보를 불러오는데 실패했습니다.')
        }
    }

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '정말 삭제하시겠습니까?',
            text: "삭제하면 되돌릴 수 없습니다!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '삭제',
            cancelButtonText: '취소'
        })

        if (!result.isConfirmed) return

        try {
            await activityAdminApi.delete(id)
            fetchActivities()
            toast.success('삭제되었습니다.')
        } catch (error) {
            console.error('Failed to delete activity', error)
            toast.error('삭제에 실패했습니다.')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // 중복 제출 방지
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
                    image_urls: imageUrls.length > 0 ? imageUrls : undefined
                })
                toast.success('수정되었습니다.')
            } else {
                await activityAdminApi.create({
                    ...formData,
                    registration_start: formData.registration_start ? new Date(formData.registration_start).toISOString() : undefined,
                    registration_end: formData.registration_end ? new Date(formData.registration_end).toISOString() : undefined,
                    thumbnail_url: thumbnailUrl,
                    image_urls: imageUrls
                })
                toast.success('새 신청이 생성되었습니다.')
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

    const toLocalISOString = (dateStr?: string) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        const offset = date.getTimezoneOffset() * 60000
        return new Date(date.getTime() - offset).toISOString().slice(0, 16)
    }

    const getStatusInfo = (activity: ActivityListItem) => {
        const status = getActivityStatus(activity)
        const styles = {
            active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '진행중', icon: <CheckCircle size={12} /> },
            scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: '예정됨', icon: <Clock size={12} /> },
            closed: { bg: 'bg-gray-100', text: 'text-gray-600', label: '마감됨', icon: <XCircle size={12} /> }
        }
        return styles[status]
    }

    const clearFilters = () => {
        setStatusFilter('all')
        setSearchQuery('')
    }

    const hasActiveFilters = statusFilter !== 'all' || searchQuery

    return (
        <div className="p-6 max-w-7xl mx-auto text-gray-900 font-sans">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <ClipboardList size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">행사·공지 신청 관리</h1>
                        <p className="text-gray-500 mt-0.5">행사 신청과 공지를 관리합니다</p>
                    </div>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                >
                    <Plus size={20} />
                    <span>새 행사·공지 만들기</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatsCard icon={<CheckCircle size={20} className="text-emerald-600" />} label="진행중" value={stats.activeCount} color="green" />
                <StatsCard icon={<Clock size={20} className="text-blue-600" />} label="예정됨" value={stats.scheduledCount} color="blue" />
                <StatsCard icon={<Pause size={20} className="text-gray-600" />} label="마감됨" value={stats.closedCount} color="gray" />
            </div>

            {/* Search & Filters */}
            <div className="space-y-4 mb-6">
                {/* Search Bar */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="신청 검색..."
                            className="w-full pl-12 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            className={`flex items-center gap-2 px-4 py-3.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 min-w-[140px] ${showSortDropdown ? 'ring-2 ring-purple-500/20 border-purple-500' : ''}`}
                        >
                            <span className="text-sm font-medium text-gray-700">
                                {sortBy === 'newest' ? '최신순' : sortBy === 'oldest' ? '오래된순' : sortBy === 'title' ? '제목순' : '신청자순'}
                            </span>
                            <ChevronDown size={16} className={`ml-auto text-gray-400 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showSortDropdown && (
                            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl py-1 min-w-[160px] z-10">
                                {([['newest', '최신순'], ['oldest', '오래된순'], ['title', '제목순'], ['registrations', '신청자순']] as [SortOption, string][]).map(([value, label]) => (
                                    <button
                                        key={value}
                                        onClick={() => { setSortBy(value); setShowSortDropdown(false) }}
                                        className={`w-full text-left px-4 py-2.5 text-sm ${sortBy === value ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                        {/* Status Filter */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Filter size={16} />
                                <span className="text-xs font-semibold uppercase tracking-wider">상태</span>
                            </div>
                            <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg">
                                {([['all', '전체'], ['active', '진행중'], ['scheduled', '예정됨'], ['closed', '마감됨']] as [StatusFilter, string][]).map(([value, label]) => (
                                    <button
                                        key={value}
                                        onClick={() => setStatusFilter(value)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${statusFilter === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100">
                                <X size={14} />
                                초기화
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'card' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
                <div className="text-sm text-gray-500">
                    총 <span className="font-semibold text-gray-900">{filteredActivities.length}</span>개 신청
                </div>
            </div>

            {/* Content */}
            {loading ? (
                viewMode === 'card' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">타입</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">제목</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">상태</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">신청현황</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">기간</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">관리</th>
                                </tr>
                            </thead>
                            <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
                        </table>
                    </div>
                )
            ) : filteredActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <ClipboardList className="text-gray-400" size={32} />
                    </div>
                    <p className="font-medium text-gray-900">등록된 신청이 없습니다</p>
                    <p className="text-sm text-gray-500 mt-1">새 신청을 만들어보세요</p>
                </div>
            ) : (
                <>
                    {/* Card View */}
                    {viewMode === 'card' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedActivities.map(activity => {
                                const statusInfo = getStatusInfo(activity)
                                return (
                                    <div key={activity.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all group">
                                        <div className="flex items-start gap-4 mb-4">
                                            {activity.thumbnail_url ? (
                                                <img src={activity.thumbnail_url} alt="" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                                            ) : (
                                                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                    <ImageIcon size={24} className="text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-gray-100 text-gray-600">
                                                        {activityTypeLabels[activity.type]}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full flex items-center gap-1 ${statusInfo.bg} ${statusInfo.text}`}>
                                                        {statusInfo.icon}
                                                        {statusInfo.label}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-gray-900 truncate">{activity.title}</h3>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                                    <Users size={12} />
                                                    <span>{activity.current_count}{activity.max_capacity ? `/${activity.max_capacity}` : ''}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Period */}
                                        <div className="text-xs text-gray-500 mb-4 space-y-1">
                                            {activity.registration_start && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={12} />
                                                    <span>{new Date(activity.registration_start).toLocaleDateString('ko-KR')} ~ {activity.registration_end ? new Date(activity.registration_end).toLocaleDateString('ko-KR') : ''}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-4 border-t border-gray-100">
                                            {activity.type !== 'notice' && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate({ to: `/admin/events/${activity.id}` })}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all"
                                                >
                                                    <Eye size={14} />
                                                    신청자 보기
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(activity)}
                                                className="p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-all"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(activity.id)}
                                                className="p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Table View */}
                    {viewMode === 'table' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-br from-gray-50 to-gray-100/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">타입</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase w-1/3">제목</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">상태</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">신청현황</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">기간</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {paginatedActivities.map(activity => {
                                            const statusInfo = getStatusInfo(activity)
                                            return (
                                                <tr key={activity.id} className="hover:bg-gray-50/80 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-gray-100 text-gray-700">
                                                            {activityTypeLabels[activity.type]}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {activity.thumbnail_url && (
                                                                <img src={activity.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                                            )}
                                                            <span className="font-medium text-gray-900 truncate max-w-xs">{activity.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit ${statusInfo.bg} ${statusInfo.text}`}>
                                                            {statusInfo.icon}
                                                            {statusInfo.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 text-sm">
                                                            <Users size={14} className="text-gray-400" />
                                                            <span className="font-medium text-gray-900">{activity.current_count}</span>
                                                            {activity.max_capacity && <span className="text-gray-400">/ {activity.max_capacity}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {activity.registration_start && (
                                                            <div className="flex items-center gap-1.5 text-xs">
                                                                <Calendar size={12} className="text-gray-400" />
                                                                {new Date(activity.registration_start).toLocaleDateString('ko-KR')}
                                                                {activity.registration_end && ` ~ ${new Date(activity.registration_end).toLocaleDateString('ko-KR')}`}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {activity.type !== 'notice' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => navigate({ to: `/admin/events/${activity.id}` })}
                                                                    className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all"
                                                                >
                                                                    신청자
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEdit(activity)}
                                                                className="p-1.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-all"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(activity.id)}
                                                                className="p-1.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                                    .map((page, idx, arr) => {
                                        const showEllipsis = idx > 0 && arr[idx - 1] !== page - 1
                                        return (
                                            <div key={page} className="flex items-center">
                                                {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                                                <button
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-10 h-10 rounded-lg font-medium transition-all ${currentPage === page ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'text-gray-600 hover:bg-gray-100'}`}
                                                >
                                                    {page}
                                                </button>
                                            </div>
                                        )
                                    })}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingActivity ? '신청 수정' : '새 신청 만들기'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Image Upload */}
                            <ImageUploader
                                images={images}
                                onImagesChange={setImages}
                                isDragging={isDragging}
                                onDraggingChange={setIsDragging}
                                maxImages={10}
                            />

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">신청 타입</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ActivityType }))}
                                        disabled={!!editingActivity}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:bg-gray-100"
                                    >
                                        {Object.entries(activityTypeLabels).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">최대 정원</label>
                                    <input
                                        type="number"
                                        value={formData.max_capacity || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        min={1}
                                        placeholder="무제한"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">제목</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                    placeholder="신청 제목을 입력하세요"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">설명</label>
                                <TextareaAutosize
                                    ref={textareaRef}
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    minRows={4}
                                    onFocus={adjustScrollToCenter}
                                    onClick={adjustScrollToCenter}
                                    onKeyUp={(e) => {
                                        if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                            adjustScrollToCenter();
                                        }
                                    }}
                                    placeholder="신청에 대한 설명을 입력하세요"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                                />
                            </div>

                            {formData.type === 'notice' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">외부 링크</label>
                                    <input
                                        type="text"
                                        value={formData.config?.external_link || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            config: { ...prev.config, external_link: e.target.value }
                                        }))}
                                        placeholder="https://example.com"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">배너 클릭 시 이동할 외부 링크를 입력하세요.</p>
                                </div>
                            )}

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
                                        onClick={() => setFormData(prev => ({ ...prev, require_membership: !prev.require_membership }))}
                                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${formData.require_membership ? 'bg-purple-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${formData.require_membership ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">회비 납부자만</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div
                                        onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">활성화</span>
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
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {saving ? '저장 중...' : (editingActivity ? '수정 완료' : '생성하기')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
