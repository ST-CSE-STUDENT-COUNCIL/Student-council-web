import React from 'react'
import type { WelfareRental } from '../../lib/api/welfare'

interface RentalRequestModalProps {
    isOpen: boolean
    item: WelfareRental | null
    onClose: () => void
    onSubmit: (data: RentalRequestData) => Promise<void>
}

export interface RentalRequestData {
    rental_id: number
    quantity: number
    rental_start_date: string
    rental_end_date: string
}

export function RentalRequestModal({ isOpen, item, onClose, onSubmit }: RentalRequestModalProps) {
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
    const getTodayDate = () => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    }

    // 반납일 계산 (시작일 + rental_period_days)
    const calculateEndDate = () => {
        if (!item) return ''
        const startDate = new Date(getTodayDate())
        startDate.setDate(startDate.getDate() + item.rental_period_days)
        return startDate.toISOString().split('T')[0]
    }

    const startDate = getTodayDate()
    const endDate = calculateEndDate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!item) return

        try {
            setLoading(true)
            await onSubmit({
                rental_id: item.id,
                quantity: 1,
                rental_start_date: startDate,
                rental_end_date: endDate,
            })
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : '대여신청에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen || !item) return null

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">대여신청</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Item Info */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{item.item_name}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <p className="text-sm text-gray-500 mt-2">
                            대여 수량: <span className="font-semibold text-blue-600">1개</span>
                        </p>
                        <p className="text-sm text-gray-500">
                            대여 기간: <span className="font-semibold">{item.rental_period_days}일</span>
                        </p>
                    </div>

                    {/* Start Date (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            대여 시작일
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                        />
                    </div>

                    {/* End Date (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            반납일
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                        />
                    </div>

                    {/* Rental Duration Info */}
                    <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded text-sm text-blue-700">
                        총 대여 기간: <span className="font-semibold">{item.rental_period_days}일</span>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                            {error}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                        >
                            {loading ? '신청 중...' : '대여신청'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
