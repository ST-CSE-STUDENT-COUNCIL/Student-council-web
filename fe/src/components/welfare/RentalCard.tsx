
import type { WelfareRental } from '../../lib/api/welfare'

type RentalCardProps = {
    item: WelfareRental
    onApply: (url: string) => void
}

export function RentalCard({ item, onApply }: RentalCardProps) {
    const applicationUrl = item.application_sheet_url?.trim() || ''
    const isDisabled = !applicationUrl || item.is_active === false
    const availableQuantity = Number.isFinite(Number(item.available_quantity))
        ? Number(item.available_quantity)
        : null
    const hasImage = !!item.image_url

    return (
        <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 shadow-sm transition-colors">
            <div className="text-center mb-3">
                {hasImage ? (
                    <img
                        src={item.image_url as string}
                        alt={item.item_name}
                        className="w-24 h-24 object-cover rounded mx-auto mb-2"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'
                        }}
                    />
                ) : (
                    <div className="w-24 h-24 rounded mx-auto mb-2 bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                        이미지 없음
                    </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.item_name}</h3>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-3">
                <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-[11px] text-gray-600 dark:text-gray-300">
                    {item.category}
                </span>
                <span className="text-gray-400 dark:text-gray-500">
                    {item.updated_at ? item.updated_at.slice(0, 10) : ''}
                </span>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">실시간 가능 수량</span>
                    <span className={`font-semibold ${availableQuantity !== null && availableQuantity <= 0 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                        {availableQuantity !== null ? `${availableQuantity}개` : '확인 중'}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => onApply(applicationUrl)}
                    disabled={isDisabled}
                    aria-disabled={isDisabled}
                    className={`mt-3 w-full rounded-md px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isDisabled ? 'cursor-not-allowed bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    대여신청
                </button>
            </div>
        </div>
    )
}
