type AttendanceCheckCardProps = {
    studentId: string
    isSubmitted: boolean
    canSubmit: boolean
    isSearching: boolean
    isSubmitting: boolean
    errorMessage: string | null
    submittedMessage: string | null
    isConfirmOpen: boolean
    confirmUserName: string | null
    confirmStudentId: string | null
    onStudentIdChange: (value: string) => void
    onSubmit: () => void
    onConfirm: () => void
    onCancelConfirm: () => void
}

export function AttendanceCheckCard({
    studentId,
    isSubmitted,
    canSubmit,
    isSearching,
    isSubmitting,
    errorMessage,
    submittedMessage,
    isConfirmOpen,
    confirmUserName,
    confirmStudentId,
    onStudentIdChange,
    onSubmit,
    onConfirm,
    onCancelConfirm,
}: AttendanceCheckCardProps) {
    return (
        <section className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-lg">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">출석 체크</h1>
                <p className="text-sm text-slate-600">학번만 입력하면 출석 등록이 완료됩니다.</p>
            </div>

            <div className="mt-6 space-y-3">
                <label className="block text-sm font-semibold text-slate-700">학번</label>
                <input
                    value={studentId}
                    onChange={(event) => onStudentIdChange(event.target.value)}
                    disabled={isSubmitted}
                    placeholder="예) 20201234"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 disabled:bg-slate-100 disabled:text-slate-400"
                />
                <p className="text-xs text-slate-400">띄어쓰기 없이 숫자만 입력해주세요.</p>
            </div>

            <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit || isSearching || isSubmitting}
                className="mt-6 w-full rounded-2xl bg-emerald-600 text-white py-3 font-semibold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitted
                    ? '출석 완료'
                    : isSearching
                        ? '확인 중...'
                        : isSubmitting
                            ? '처리 중...'
                            : '출석 등록'}
            </button>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-4 text-sm">
                {errorMessage ? (
                    <div className="text-rose-600 font-semibold">
                        {errorMessage}
                    </div>
                ) : submittedMessage ? (
                    <div className="text-emerald-700 font-semibold">
                        {submittedMessage}
                    </div>
                ) : (
                    <div className="text-slate-500">
                        출석 등록 결과가 여기에 표시됩니다.
                    </div>
                )}
            </div>
            {isConfirmOpen && (
                <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm">
                    <p className="font-semibold text-slate-900">입력한 학번 정보가 맞는지 확인해주세요.</p>
                    <div className="mt-3 rounded-2xl border border-emerald-100 bg-white p-4">
                        <p className="text-xs text-slate-500">이름</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{confirmUserName || '-'}</p>
                        <p className="mt-3 text-xs text-slate-500">학번</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{confirmStudentId || '-'}</p>
                    </div>
                    <p className="mt-3 text-slate-600">이 사용자가 맞나요?</p>
                    <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onCancelConfirm}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-emerald-100/70 transition"
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </section>
    )
}
