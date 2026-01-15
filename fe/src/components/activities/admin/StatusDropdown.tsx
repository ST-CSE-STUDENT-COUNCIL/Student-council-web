import { CheckCircle, XCircle, Clock } from 'lucide-react'

type StatusType = 'pending' | 'approved' | 'rejected' | 'cancelled'

type StatusDropdownProps = {
    registrationId: number
    currentStatus: StatusType
    onStatusChange: (registrationId: number, status: 'pending' | 'approved' | 'rejected') => void
}

export function StatusDropdown({ registrationId, currentStatus, onStatusChange }: StatusDropdownProps) {
    const isCancelled = currentStatus === 'cancelled'

    if (isCancelled) {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-500 cursor-not-allowed">
                <XCircle size={12} />
                취소됨
            </span>
        )
    }

    return (
        <div className="inline-flex bg-gray-100 p-0.5 rounded-lg">
            <button
                type="button"
                onClick={() => onStatusChange(registrationId, 'pending')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${currentStatus === 'pending'
                    ? 'bg-white text-amber-600 shadow-sm ring-1 ring-black/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
            >
                <Clock size={12} />
                대기
            </button>
            <button
                type="button"
                onClick={() => onStatusChange(registrationId, 'approved')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${currentStatus === 'approved'
                    ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
            >
                <CheckCircle size={12} />
                승인
            </button>
            <button
                type="button"
                onClick={() => onStatusChange(registrationId, 'rejected')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${currentStatus === 'rejected'
                    ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
            >
                <XCircle size={12} />
                거절
            </button>
        </div>
    )
}
