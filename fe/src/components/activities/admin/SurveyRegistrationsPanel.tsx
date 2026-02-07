import { flexRender, type Table } from '@tanstack/react-table'
import { CheckCircle, Clock, LayoutGrid, List, Search, Users, XCircle, Check, Eye, Image as ImageIcon, FileText, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ActivityRegistrationResponse, Activity } from '../../../types/activities'
import { StatusDropdown } from './StatusDropdown'
import type { StatusFilterType } from './surveyTypes'

const STATUS_CONFIG: Record<StatusFilterType, { label: string; icon: React.ReactNode; bgClass: string; textClass: string }> = {
    all: { label: '전체', icon: <Users size={14} />, bgClass: 'bg-gray-100', textClass: 'text-gray-700' },
    pending: { label: '대기', icon: <Clock size={14} />, bgClass: 'bg-amber-100', textClass: 'text-amber-700' },
    approved: { label: '승인', icon: <CheckCircle size={14} />, bgClass: 'bg-emerald-100', textClass: 'text-emerald-700' },
    rejected: { label: '거절', icon: <XCircle size={14} />, bgClass: 'bg-red-100', textClass: 'text-red-700' },
}

type SurveyRegistrationsPanelProps = {
    activityDetail: Activity
    loading: boolean
    filteredRegistrations: ActivityRegistrationResponse[]
    totalCount: number
    statusCounts: Record<string, number>
    statusFilter: StatusFilterType
    onStatusFilterChange: (status: StatusFilterType) => void
    searchQuery: string
    onSearchQueryChange: (value: string) => void
    viewMode: 'table' | 'card'
    onViewModeChange: (mode: 'table' | 'card') => void
    selectedIds: number[]
    processingBulk: boolean
    onBulkStatusChange: (status: 'approved' | 'rejected') => void
    onSelectOne: (id: number) => void
    onSelectRegistration: (registration: ActivityRegistrationResponse) => void
    onPreviewImage: (url: string) => void
    table: Table<ActivityRegistrationResponse>
    page: number
    totalPages: number
    onPageChange: (page: number) => void
    onStatusChange: (registrationId: number, status: 'pending' | 'approved' | 'rejected') => void
}

export const SurveyRegistrationsPanel = ({
    activityDetail,
    loading,
    filteredRegistrations,
    totalCount,
    statusCounts,
    statusFilter,
    onStatusFilterChange,
    searchQuery,
    onSearchQueryChange,
    viewMode,
    onViewModeChange,
    selectedIds,
    processingBulk,
    onBulkStatusChange,
    onSelectOne,
    onSelectRegistration,
    onPreviewImage,
    table,
    page,
    totalPages,
    onPageChange,
    onStatusChange
}: SurveyRegistrationsPanelProps) => {
    const isAnonymous = ['survey', 'demand_survey'].includes(activityDetail?.type) && (activityDetail?.config?.is_anonymous ?? true)

    return (
        <>
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
                                    onClick={() => onStatusFilterChange(key as StatusFilterType)}
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

            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {!isAnonymous ? (
                        <div className="flex-1 relative max-w-md w-full">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onSearchQueryChange(e.target.value)}
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
                        <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                            <button
                                onClick={() => onViewModeChange('table')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="리스트 보기"
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => onViewModeChange('card')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="카드 보기"
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl ml-2">
                                <span className="text-sm font-medium text-gray-600">
                                    <span className="text-indigo-600 font-bold">{selectedIds.length}</span>명 선택
                                </span>
                                <button
                                    onClick={() => onBulkStatusChange('approved')}
                                    disabled={processingBulk}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-200 disabled:opacity-50"
                                >
                                    {processingBulk ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                    일괄 승인
                                </button>
                                <button
                                    onClick={() => onBulkStatusChange('rejected')}
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
                                    onClick={() => isPending && onSelectOne(reg.id)}
                                    className={`relative flex flex-col bg-white border rounded-xl overflow-hidden transition-all hover:shadow-md cursor-pointer
                                        ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/10' : 'border-gray-200'}
                                        ${isPending ? '' : 'opacity-80 hover:opacity-100'}
                                    `}
                                >
                                    {isPending && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSelectOne(reg.id) }}
                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                                    : 'bg-white border-gray-300 hover:border-gray-400'
                                                    }`}
                                            >
                                                {isSelected && <Check size={14} strokeWidth={3} />}
                                            </button>
                                        </div>
                                    )}

                                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                                        <span className="font-mono text-sm font-bold text-indigo-600">#{seqNum}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(reg.created_at).toLocaleString('ko-KR', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    <div className="p-5 flex-1 space-y-4">
                                        {!isAnonymous && (
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

                                                if (value === undefined || value === null || value === '') return null

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
                                                                                            onPreviewImage(url)
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

                                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/30">
                                        <div onClick={e => e.stopPropagation()} className="flex-1">
                                            <StatusDropdown
                                                registrationId={reg.id}
                                                currentStatus={reg.status}
                                                onStatusChange={onStatusChange}
                                            />
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onSelectRegistration(reg); }}
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

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-center gap-2 bg-gray-50/50 mt-auto">
                        <button
                            disabled={page === 1}
                            onClick={() => onPageChange(page - 1)}
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
                                                onClick={() => onPageChange(p)}
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
                            onClick={() => onPageChange(page + 1)}
                            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}
