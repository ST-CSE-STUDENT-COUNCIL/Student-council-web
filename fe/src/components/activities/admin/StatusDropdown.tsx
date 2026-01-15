import { useState } from 'react'
import { CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react'

type StatusType = 'pending' | 'approved' | 'rejected' | 'cancelled'

type StatusDropdownProps = {
    registrationId: number
    currentStatus: StatusType
    onStatusChange: (registrationId: number, status: 'pending' | 'approved' | 'rejected') => void
}

const STATUS_STYLES = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'hover:ring-amber-300' },
    approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'hover:ring-emerald-300' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', ring: 'hover:ring-red-300' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', ring: 'hover:ring-gray-300' }
}

const STATUS_LABELS: Record<StatusType, string> = {
    pending: '대기',
    approved: '승인',
    rejected: '거절',
    cancelled: '취소'
}

export function StatusDropdown({ registrationId, currentStatus, onStatusChange }: StatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const style = STATUS_STYLES[currentStatus]
    const isCancelled = currentStatus === 'cancelled'

    const handleStatusSelect = (newStatus: 'pending' | 'approved' | 'rejected') => {
        setIsOpen(false)
        onStatusChange(registrationId, newStatus)
    }

    const StatusIcon = () => {
        if (currentStatus === 'approved') return <CheckCircle size={12} />
        if (currentStatus === 'rejected' || currentStatus === 'cancelled') return <XCircle size={12} />
        return <Clock size={12} />
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => !isCancelled && setIsOpen(!isOpen)}
                disabled={isCancelled}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${style.bg} ${style.text} ${!isCancelled ? `cursor-pointer hover:ring-2 hover:ring-offset-1 ${style.ring}` : 'cursor-not-allowed'}`}
            >
                <StatusIcon />
                {STATUS_LABELS[currentStatus]}
                {!isCancelled && (
                    <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </button>

            {isOpen && !isCancelled && (
                <>
                    {/* Backdrop to close dropdown */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20 min-w-[120px]">
                        {currentStatus !== 'pending' && (
                            <button
                                type="button"
                                onClick={() => handleStatusSelect('pending')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
                            >
                                <Clock size={12} />
                                대기로 변경
                            </button>
                        )}
                        {currentStatus !== 'approved' && (
                            <button
                                type="button"
                                onClick={() => handleStatusSelect('approved')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                                <CheckCircle size={12} />
                                승인으로 변경
                            </button>
                        )}
                        {currentStatus !== 'rejected' && (
                            <button
                                type="button"
                                onClick={() => handleStatusSelect('rejected')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-700 hover:bg-red-50 transition-colors"
                            >
                                <XCircle size={12} />
                                거절로 변경
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
