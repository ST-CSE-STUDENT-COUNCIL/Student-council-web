import React from 'react'
import type { WelfareRental } from '../../lib/api/welfare'

type RentalCardProps = {
    item: WelfareRental
    onApply: (url: string) => void
}

export function RentalCard({ item, onApply }: RentalCardProps) {
    const applicationUrl = item.application_sheet_url?.trim() || ''
    const isDisabled = !applicationUrl

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="text-center mb-3">
                <img
                    src={item.image_url}
                    alt={item.item_name}
                    className="w-24 h-24 object-cover rounded mx-auto mb-2"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none'
                    }}
                />
                <h3 className="text-lg font-semibold text-gray-900">{item.item_name}</h3>
            </div>
            <div className="text-sm text-gray-600 mb-3">
                <p className="line-clamp-2">{item.description}</p>
            </div>
            <div className="mb-3">
                <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                    {item.category}
                </span>
            </div>
            <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">보유: {item.quantity}개</span>
                    <span className="font-semibold text-blue-600">가능: {item.available_quantity}개</span>
                </div>
                <p className="text-xs text-gray-500">대여 기간: {item.rental_period_days}일</p>
                <button
                    type="button"
                    onClick={() => onApply(applicationUrl)}
                    disabled={isDisabled}
                    aria-disabled={isDisabled}
                    className={`mt-3 w-full rounded-md px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isDisabled ? 'cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    대여신청
                </button>
            </div>
        </div>
    )
}
