/**
 * 이벤트 통계 요약 컴포넌트
 * - 총 응답자 수 표시
 * - 상태별 인원 수 표시 (전체 데이터 기준)
 * - 학번별 (입학년도별) 인원 분포 표시
 */

const YEAR_COLORS: Record<string, string> = {
    '20': '#6366f1',
    '21': '#3b82f6',
    '22': '#06b6d4',
    '23': '#10b981',
    '24': '#f59e0b',
    '25': '#f43f5e',
    '26': '#a855f7',
}

type StatusCounts = {
    pending?: number
    approved?: number
    rejected?: number
}

type YearCounts = Record<string, number>

type EventStatsSummaryProps = {
    totalResponses: number
    /** 전체 데이터 기준 상태별 카운트 (선택) */
    statusCounts?: StatusCounts
    /** 학번 앞 2자리 기준 년도별 카운트 (선택) */
    yearCounts?: YearCounts
}

export const EventStatsSummary = ({ totalResponses, statusCounts, yearCounts }: EventStatsSummaryProps) => {
    const hasStatusCounts = statusCounts && Object.values(statusCounts).some(v => v && v > 0)
    const hasYearCounts = yearCounts && Object.keys(yearCounts).length > 0

    // 입학 년도 정렬 — 오래된 순
    const sortedYears = hasYearCounts
        ? Object.entries(yearCounts!).sort(([a], [b]) => a.localeCompare(b))
        : []

    return (
        <div className="space-y-6 mb-8">
            {/* 총 응답자 + 상태별 */}
            <div className="bg-linear-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                    <div className="text-center">
                        <p className="text-gray-500 mb-1 text-sm">총 신청자 수</p>
                        <p className="text-4xl font-bold text-gray-900">{totalResponses}<span className="text-lg font-normal text-gray-500 ml-1">명</span></p>
                    </div>
                    {hasStatusCounts && (
                        <>
                            <div className="hidden md:block h-16 w-px bg-indigo-200" />
                            <div className="flex gap-6">
                                {statusCounts?.pending !== undefined && (
                                    <div className="text-center">
                                        <p className="text-amber-600 text-xs font-semibold mb-1">대기</p>
                                        <p className="text-2xl font-bold text-amber-700">{statusCounts.pending}<span className="text-sm font-normal text-amber-500 ml-0.5">명</span></p>
                                    </div>
                                )}
                                {statusCounts?.approved !== undefined && (
                                    <div className="text-center">
                                        <p className="text-emerald-600 text-xs font-semibold mb-1">승인</p>
                                        <p className="text-2xl font-bold text-emerald-700">{statusCounts.approved}<span className="text-sm font-normal text-emerald-500 ml-0.5">명</span></p>
                                    </div>
                                )}
                                {statusCounts?.rejected !== undefined && (
                                    <div className="text-center">
                                        <p className="text-red-600 text-xs font-semibold mb-1">거절</p>
                                        <p className="text-2xl font-bold text-red-700">{statusCounts.rejected}<span className="text-sm font-normal text-red-500 ml-0.5">명</span></p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 학번별 분포 */}
            {hasYearCounts && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                        입학 년도별 신청 분포
                    </h3>
                    <div className="space-y-3">
                        {sortedYears.map(([year, count]) => {
                            const percent = totalResponses > 0 ? (count / totalResponses) * 100 : 0
                            const color = YEAR_COLORS[year] || '#94a3b8'
                            return (
                                <div key={year} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-600 w-10 shrink-0">{year}학번</span>
                                    <div className="flex-1 h-5 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${percent}%`, backgroundColor: color }}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 w-20 shrink-0 text-right">
                                        {count}명 ({percent % 1 === 0 ? percent.toFixed(0) : percent.toFixed(1)}%)
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
