import { Search } from 'lucide-react'

import type { AttendanceRegistration, AttendanceStatus } from '../../../../types/attendance'

type AttendanceTableProps = {
    searchQuery: string
    statusFilter: 'all' | AttendanceStatus
    rows: AttendanceRegistration[]
    loading: boolean
    selectedRegistrationId: number | null
    markingId: number | null
    cancellingId: number | null
    onSearchQueryChange: (value: string) => void
    onStatusFilterChange: (value: 'all' | AttendanceStatus) => void
    onSelectRegistration: (id: number) => void
    onMarkAttendance: (id: number) => void
    onCancelAttendance: (id: number) => void
}

export function AttendanceTable({
    searchQuery,
    statusFilter,
    rows,
    loading,
    selectedRegistrationId,
    markingId,
    cancellingId,
    onSearchQueryChange,
    onStatusFilterChange,
    onSelectRegistration,
    onMarkAttendance,
    onCancelAttendance,
}: AttendanceTableProps) {
    return (
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        value={searchQuery}
                        onChange={(event) => onSearchQueryChange(event.target.value)}
                        placeholder="학번, 이름, 연락처 검색"
                        className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'attended', 'absent'].map((status) => (
                        <button
                            key={status}
                            onClick={() => onStatusFilterChange(status as 'all' | AttendanceStatus)}
                            className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${statusFilter === status
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {status === 'all' ? '전체' : status === 'attended' ? '출석' : '미출석'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">이름</th>
                            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">학번</th>
                            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">연락처</th>
                            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">신청 시각</th>
                            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">출석</th>
                            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">출석 시각</th>
                            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                    출석 현황을 불러오는 중입니다...
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                                    조건에 맞는 신청자가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            rows.map((item) => (
                                <tr
                                    key={item.registration_id}
                                    className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedRegistrationId === item.registration_id ? 'bg-emerald-50' : ''}`}
                                    onClick={() => onSelectRegistration(item.registration_id)}
                                >
                                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{item.user_name}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap tabular-nums">{item.student_id}</td>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap tabular-nums">{item.phone}</td>
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap tabular-nums">{item.registered_at}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${item.attended === 'attended'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {item.attended === 'attended' ? '출석' : '미출석'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap tabular-nums">{item.attended_at ?? '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {item.attended === 'attended' ? (
                                            <button
                                                type="button"
                                                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 whitespace-nowrap"
                                                disabled={cancellingId === item.registration_id}
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    onCancelAttendance(item.registration_id)
                                                }}
                                            >
                                                {cancellingId === item.registration_id ? '취소 중...' : '출석 취소'}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 whitespace-nowrap"
                                                disabled={markingId === item.registration_id}
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    onMarkAttendance(item.registration_id)
                                                }}
                                            >
                                                {markingId === item.registration_id ? '처리 중...' : '출석 처리'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
