import { useState, useEffect, useCallback } from 'react'
import { activityAdminApi } from '../../../lib/api/activities'
import type { ActivityListItem, ActivityRegistrationResponse } from '../../../types/activities'

type RegistrationsModalProps = {
    activity: ActivityListItem
    onClose: () => void
}

/**
 * 활동 신청자 목록을 보여주는 관리자 모달
 */
export const RegistrationsModal = ({ activity, onClose }: RegistrationsModalProps) => {
    const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [totalCount, setTotalCount] = useState(0)

    const fetchRegistrations = useCallback(async (pageNum: number) => {
        try {
            setLoading(true)
            const data = await activityAdminApi.getRegistrations(activity.id, { page: pageNum, page_size: 10 })
            setRegistrations(data.registrations)
            setTotalPages(data.pagination.total_pages)
            setTotalCount(data.pagination.total)
        } catch (error) {
            console.error('Failed to fetch registrations', error)
            alert('신청자 목록을 불러오는데 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }, [activity.id])

    useEffect(() => {
        fetchRegistrations(page)
    }, [page, fetchRegistrations])

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">신청자 목록</h2>
                        <p className="text-sm text-gray-500 mt-1">{activity.title} (총 {totalCount}명)</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : registrations.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">신청자가 없습니다.</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">이름</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">학번/학과</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">연락처</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">신청일시</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">상태</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {registrations.map(reg => (
                                    <tr key={reg.id}>
                                        <td className="px-4 py-2 font-medium">{reg.name || '-'}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {reg.student_id ? `${reg.student_id} / ` : ''}{reg.department || '-'}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {reg.phone}<br />{reg.email}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {new Date(reg.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${reg.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {reg.status === 'approved' ? '승인됨' :
                                                    reg.status === 'rejected' ? '거절됨' :
                                                        reg.status === 'cancelled' ? '취소됨' : '대기중'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >이전</button>
                        <span className="px-3 py-1">Page {page} of {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >다음</button>
                    </div>
                )}
            </div>
        </div>
    )
}
