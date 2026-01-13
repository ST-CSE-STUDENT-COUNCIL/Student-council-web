import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { activityAdminApi, activityApi } from '../../../lib/api/activities'
import type { ActivityListItem, ActivityRegistrationResponse, Activity } from '../../../types/activities'

type RegistrationsModalProps = {
    activity: ActivityListItem
    onClose: () => void
}

/**
 * 활동 신청자 목록을 보여주는 관리자 모달
 * 개별 신청자의 추가 정보, 상태 변경, 설문조사 통계 지원
 * 동적 테이블 컬럼으로 추가 정보를 한눈에 볼 수 있음
 */
export const RegistrationsModal = ({ activity, onClose }: RegistrationsModalProps) => {
    const [registrations, setRegistrations] = useState<ActivityRegistrationResponse[]>([])
    const [activityDetail, setActivityDetail] = useState<Activity | null>(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [totalCount, setTotalCount] = useState(0)

    // 상세보기 모달
    const [selectedRegistration, setSelectedRegistration] = useState<ActivityRegistrationResponse | null>(null)

    // 설문조사 통계
    const [showSurveyStats, setShowSurveyStats] = useState(false)
    const [surveyStats, setSurveyStats] = useState<any>(null)
    const [loadingSurveyStats, setLoadingSurveyStats] = useState(false)

    const fetchActivityDetail = useCallback(async () => {
        try {
            const detail = await activityApi.getById(activity.id)
            setActivityDetail(detail)
        } catch (error) {
            console.error('Failed to fetch activity detail', error)
        }
    }, [activity.id])

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

    const fetchSurveyStats = async () => {
        try {
            setLoadingSurveyStats(true)
            const stats = await activityAdminApi.getSurveyStats(activity.id)
            setSurveyStats(stats)
            setShowSurveyStats(true)
        } catch (error) {
            console.error('Failed to fetch survey stats', error)
            alert('설문조사 통계를 불러오는데 실패했습니다.')
        } finally {
            setLoadingSurveyStats(false)
        }
    }

    const handleStatusChange = async (registrationId: number, status: 'approved' | 'rejected') => {
        const confirmMessage = status === 'approved' ? '승인하시겠습니까?' : '거절하시겠습니까?'
        if (!confirm(confirmMessage)) return

        const adminNote = prompt('관리자 메모 (선택사항):')

        try {
            await activityAdminApi.updateRegistrationStatus(activity.id, registrationId, status, adminNote || undefined)
            alert(`${status === 'approved' ? '승인' : '거절'}되었습니다.`)
            fetchRegistrations(page)
        } catch (error) {
            console.error('Failed to update registration status', error)
            alert('상태 변경에 실패했습니다.')
        }
    }

    useEffect(() => {
        fetchRegistrations(page)
    }, [page, fetchRegistrations])

    useEffect(() => {
        fetchActivityDetail()
    }, [fetchActivityDetail])

    const isSurvey = activity.type === 'survey' || activity.type === 'demand_survey'

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-[95vw] h-[90vh] overflow-hidden shadow-xl flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">신청자 목록</h2>
                        <p className="text-sm text-gray-500 mt-1">{activity.title} (총 {totalCount}명)</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        {isSurvey && (
                            <button
                                onClick={fetchSurveyStats}
                                disabled={loadingSurveyStats}
                                className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                            >
                                {loadingSurveyStats ? '로딩중...' : '📊 설문 통계'}
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl px-2">✕</button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6 relative">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : registrations.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">신청자가 없습니다.</div>
                    ) : (
                        <div className="overflow-x-auto border rounded-lg shadow-sm">
                            <table className="w-full whitespace-nowrap text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">이름</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">학번/학과</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">연락처</th>

                                        {/* 동적 질문 컬럼 헤더 */}
                                        {activityDetail?.form_fields?.map((field) => (
                                            <th key={field.name} className="px-4 py-3 text-left font-medium text-gray-900 uppercase tracking-wider bg-blue-50/50 min-w-[150px] border-l border-blue-100">
                                                {field.label}
                                            </th>
                                        ))}

                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider border-l border-gray-100">신청일시</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">상태</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {registrations.map(reg => (
                                        <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                {reg.name || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {reg.student_id ? `${reg.student_id}` : ''}
                                                {reg.student_id && reg.department ? ' / ' : ''}
                                                {reg.department || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                <div>{reg.phone || '-'}</div>
                                            </td>

                                            {/* 동적 질문 응답 데이터 */}
                                            {activityDetail?.form_fields?.map((field) => {
                                                // form_responses 또는 survey_responses에서 값 찾기
                                                const formValue = reg.form_responses?.[field.name];
                                                const surveyValue = (reg as any).survey_responses?.[field.name];
                                                const value = formValue ?? surveyValue;

                                                return (
                                                    <td key={field.name} className="px-4 py-3 text-gray-700 max-w-[300px] truncate bg-blue-50/5 border-l border-blue-50" title={Array.isArray(value) ? value.join(', ') : String(value || '')}>
                                                        {value === undefined || value === null || value === ''
                                                            ? <span className="text-gray-300">-</span>
                                                            : (Array.isArray(value) ? value.join(', ') : String(value))
                                                        }
                                                    </td>
                                                );
                                            })}

                                            <td className="px-4 py-3 text-gray-600 border-l border-gray-100">
                                                {new Date(reg.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${reg.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        reg.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {reg.status === 'approved' ? '승인' :
                                                        reg.status === 'rejected' ? '거절' :
                                                            reg.status === 'cancelled' ? '취소' : '대기'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-gray-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                <div className="flex gap-1 justify-center">
                                                    <button
                                                        onClick={() => setSelectedRegistration(reg)}
                                                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                    >
                                                        상세
                                                    </button>
                                                    {reg.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusChange(reg.id, 'approved')}
                                                                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                            >
                                                                승인
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(reg.id, 'rejected')}
                                                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                            >
                                                                거절
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                        >이전</button>
                        <span className="px-3 py-1">Page {page} of {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                        >다음</button>
                    </div>
                )}
            </div>

            {/* 신청자 상세 정보 모달 */}
            <AnimatePresence>
                {selectedRegistration && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
                        onClick={() => setSelectedRegistration(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                <h3 className="text-lg font-bold text-gray-900">신청 상세 정보</h3>
                                <button onClick={() => setSelectedRegistration(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">이름</label>
                                            <p className="text-sm font-medium mt-1">{selectedRegistration.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">학번</label>
                                            <p className="text-sm font-medium mt-1">{selectedRegistration.student_id || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">학과</label>
                                            <p className="text-sm font-medium mt-1">{selectedRegistration.department || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500">연락처</label>
                                            <p className="text-sm font-medium mt-1">{selectedRegistration.phone}</p>
                                        </div>
                                        {selectedRegistration.kakao_id && (
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">카카오톡 ID</label>
                                                <p className="text-sm font-medium mt-1">{selectedRegistration.kakao_id}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* 추가 정보 (form_responses) */}
                                    {selectedRegistration.form_responses && Object.keys(selectedRegistration.form_responses).length > 0 && (
                                        <div className="border-t pt-4 mt-4">
                                            <h4 className="text-sm font-bold text-gray-900 mb-3">추가 정보</h4>
                                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                                {activityDetail?.form_fields && activityDetail.form_fields.length > 0 ? (
                                                    // form_fields가 있으면 정의된 순서대로 표시
                                                    activityDetail.form_fields.map((field) => {
                                                        const value = selectedRegistration.form_responses[field.name]
                                                        if (value === undefined || value === null || value === '') return null

                                                        return (
                                                            <div key={field.name}>
                                                                <label className="text-xs font-medium text-gray-600">{field.label}</label>
                                                                <p className="text-sm mt-1 text-gray-900">
                                                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                                                </p>
                                                            </div>
                                                        )
                                                    })
                                                ) : (
                                                    // form_fields가 없으면 모든 응답을 키-값으로 표시
                                                    Object.entries(selectedRegistration.form_responses).map(([key, value]) => {
                                                        if (value === undefined || value === null || value === '') return null

                                                        return (
                                                            <div key={key}>
                                                                <label className="text-xs font-medium text-gray-600">{key}</label>
                                                                <p className="text-sm mt-1 text-gray-900">
                                                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                                                </p>
                                                            </div>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* 설문조사 응답 (survey_responses) - 설문조사 타입인 경우 */}
                                    {(selectedRegistration as any).survey_responses && Object.keys((selectedRegistration as any).survey_responses).length > 0 && (
                                        <div className="border-t pt-4 mt-4">
                                            <h4 className="text-sm font-bold text-gray-900 mb-3">설문조사 응답</h4>
                                            <div className="space-y-3 bg-purple-50 p-4 rounded-lg">
                                                {activityDetail?.form_fields && activityDetail.form_fields.length > 0 ? (
                                                    // form_fields가 있으면 정의된 순서대로 표시
                                                    activityDetail.form_fields.map((field) => {
                                                        const value = (selectedRegistration as any).survey_responses[field.name]
                                                        if (value === undefined || value === null || value === '') return null

                                                        return (
                                                            <div key={field.name}>
                                                                <label className="text-xs font-medium text-purple-700">{field.label}</label>
                                                                <p className="text-sm mt-1 text-gray-900">
                                                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                                                </p>
                                                            </div>
                                                        )
                                                    })
                                                ) : (
                                                    // form_fields가 없으면 모든 응답을 키-값으로 표시
                                                    Object.entries((selectedRegistration as any).survey_responses).map(([key, value]) => {
                                                        if (value === undefined || value === null || value === '') return null

                                                        return (
                                                            <div key={key}>
                                                                <label className="text-xs font-medium text-purple-700">{key}</label>
                                                                <p className="text-sm mt-1 text-gray-900">
                                                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                                                </p>
                                                            </div>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {selectedRegistration.verification_image_url && (
                                        <div className="border-t pt-4 mt-4">
                                            <h4 className="text-sm font-bold text-gray-900 mb-2">인증 이미지</h4>
                                            <img
                                                src={selectedRegistration.verification_image_url}
                                                alt="인증 이미지"
                                                className="w-full max-w-md rounded border"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 설문조사 통계 모달 */}
            <AnimatePresence>
                {showSurveyStats && surveyStats && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
                        onClick={() => setShowSurveyStats(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-purple-50">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">📊 설문조사 통계</h3>
                                    <p className="text-sm text-gray-500 mt-1">총 응답: {surveyStats.total_responses}명</p>
                                </div>
                                <button onClick={() => setShowSurveyStats(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                                {surveyStats.question_stats && surveyStats.question_stats.length > 0 ? (
                                    <div className="space-y-6">
                                        {surveyStats.question_stats.map((stat: any, index: number) => (
                                            <div key={index} className="border-b pb-4 last:border-0">
                                                <h4 className="font-semibold text-gray-900 mb-3">{index + 1}. {stat.question}</h4>

                                                {stat.type === 'multiple_choice' || stat.type === 'radio' || stat.type === 'checkbox' ? (
                                                    <div className="space-y-2">
                                                        {Object.entries(stat.responses || {}).map(([option, count]: [string, any]) => {
                                                            const percentage = surveyStats.total_responses > 0
                                                                ? ((count / surveyStats.total_responses) * 100).toFixed(1)
                                                                : '0.0'
                                                            return (
                                                                <div key={option} className="flex items-center gap-3">
                                                                    <div className="flex-1">
                                                                        <div className="flex justify-between text-sm mb-1">
                                                                            <span className="text-gray-700">{option}</span>
                                                                            <span className="font-medium text-gray-900">{count}명 ({percentage}%)</span>
                                                                        </div>
                                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                                            <div
                                                                                className="bg-purple-600 h-2 rounded-full transition-all"
                                                                                style={{ width: `${percentage}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                                        주관식 응답은 개별 신청자의 상세 정보에서 확인하실 수 있습니다.
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-gray-500">통계 데이터가 없습니다.</div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
