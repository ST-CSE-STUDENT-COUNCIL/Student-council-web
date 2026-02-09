import { CheckCircle2 } from 'lucide-react'

import type { AttendanceRegistration } from '../../../../types/attendance'

type SelectedRegistrationCardProps = {
    selectedRegistration: AttendanceRegistration | null
    cancellingId: number | null
    markingId: number | null
    onCancelAttendance: (id: number) => void
    onMarkAttendance: (id: number) => void
}

export function SelectedRegistrationCard({
    selectedRegistration,
    cancellingId,
    markingId,
    onCancelAttendance,
    onMarkAttendance,
}: SelectedRegistrationCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle2 size={18} />
                선택한 신청자
            </div>
            {selectedRegistration ? (
                <div className="mt-4 space-y-4">
                    <div>
                        <p className="text-xs text-gray-500">이름</p>
                        <p className="text-lg font-semibold text-gray-900">{selectedRegistration.user_name}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">학번</p>
                        <p className="font-semibold text-gray-700">{selectedRegistration.student_id}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">연락처</p>
                        <p className="font-semibold text-gray-700">{selectedRegistration.phone}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">신청 시각</p>
                        <p className="font-semibold text-gray-700">{selectedRegistration.registered_at}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">출석 상태</p>
                        <p className="font-semibold text-gray-700">
                            {selectedRegistration.attended === 'attended' ? '출석 완료' : '미출석'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">출석 시각</p>
                        <p className="font-semibold text-gray-700">{selectedRegistration.attended_at ?? '-'}</p>
                    </div>
                    {selectedRegistration.attended === 'attended' ? (
                        <button
                            type="button"
                            className="w-full mt-2 rounded-xl bg-rose-500 text-white py-2.5 font-semibold shadow-md shadow-rose-200 disabled:opacity-40"
                            disabled={cancellingId === selectedRegistration.registration_id}
                            onClick={() => onCancelAttendance(selectedRegistration.registration_id)}
                        >
                            {cancellingId === selectedRegistration.registration_id ? '취소 중...' : '출석 취소'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="w-full mt-2 rounded-xl bg-emerald-600 text-white py-2.5 font-semibold shadow-md shadow-emerald-200 disabled:opacity-40"
                            disabled={markingId === selectedRegistration.registration_id}
                            onClick={() => onMarkAttendance(selectedRegistration.registration_id)}
                        >
                            {markingId === selectedRegistration.registration_id ? '처리 중...' : '출석 처리'}
                        </button>
                    )}
                </div>
            ) : (
                <p className="mt-4 text-sm text-gray-400">선택된 신청자가 없습니다.</p>
            )}
        </div>
    )
}
