

type LockerActionsProps = {
    rentalPeriodLabel: string
    returnPeriodLabel: string
    isRentalActive: boolean
    isExtendActive: boolean
    isReturnActive: boolean
    disabledClass: string
    onRentalClick: () => void
    onExtendClick: () => void
    onReturnClick: () => void
}

export function LockerActions({
    rentalPeriodLabel,
    returnPeriodLabel,
    isRentalActive,
    isExtendActive,
    isReturnActive,
    disabledClass,
    onRentalClick,
    onExtendClick,
    onReturnClick,
}: LockerActionsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <button
                className={`flex w-full items-start gap-3 rounded-lg border bg-white dark:bg-slate-800 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow ${isRentalActive ? 'border-blue-100 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-700' : disabledClass + ' dark:border-slate-700'}`}
                disabled={!isRentalActive}
                aria-disabled={!isRentalActive}
                onClick={onRentalClick}
            >
                <div className={`mt-1 h-8 w-1.5 rounded-full ${isRentalActive ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'}`} aria-hidden />
                <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">사물함 대여 신청</div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">{rentalPeriodLabel}</div>
                </div>
            </button>
            <button
                className={`flex w-full items-start gap-3 rounded-lg border bg-white dark:bg-slate-800 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow ${isExtendActive ? 'border-amber-100 hover:border-amber-300 dark:border-amber-900/50 dark:hover:border-amber-700' : disabledClass + ' dark:border-slate-700'}`}
                disabled={!isExtendActive}
                aria-disabled={!isExtendActive}
                onClick={onExtendClick}
            >
                <div className={`mt-1 h-8 w-1.5 rounded-full ${isExtendActive ? 'bg-amber-500' : 'bg-gray-300 dark:bg-slate-600'}`} aria-hidden />
                <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">사물함 연장 신청</div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">{returnPeriodLabel}</div>
                </div>
            </button>
            <button
                className={`flex w-full items-start gap-3 rounded-lg border bg-white dark:bg-slate-800 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow ${isReturnActive ? 'border-red-100 hover:border-red-300 dark:border-red-900/50 dark:hover:border-red-700' : disabledClass + ' dark:border-slate-700'}`}
                disabled={!isReturnActive}
                aria-disabled={!isReturnActive}
                onClick={onReturnClick}
            >
                <div className={`mt-1 h-8 w-1.5 rounded-full ${isReturnActive ? 'bg-red-500' : 'bg-gray-300 dark:bg-slate-600'}`} aria-hidden />
                <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">사물함 반납 신청</div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">{returnPeriodLabel}</div>
                </div>
            </button>
        </div>
    )
}
