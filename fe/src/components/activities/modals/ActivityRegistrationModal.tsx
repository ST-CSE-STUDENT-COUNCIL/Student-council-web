import { useState } from 'react'
import { Modal } from '../../common/Modal'
import type { Activity, ActivityListItem, ActivityRegistrationRequest } from '../../../types/activities'
import { activityApi } from '../../../lib/api/activities'

type ActivityRegistrationModalProps = {
    isOpen: boolean
    onClose: () => void
    activity: Activity | ActivityListItem
    onSubmit: (data: any) => Promise<void>
}

export const ActivityRegistrationModal = ({ isOpen, onClose, activity, onSubmit }: ActivityRegistrationModalProps) => {
    const [formData, setFormData] = useState<ActivityRegistrationRequest>({
        name: '',
        student_id: '',
        department: '컴퓨터공학과',
        phone: '',
        email: '',
        kakao_id: '',
        form_responses: {}
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await activityApi.register(activity.id, formData)
            await onSubmit(formData)
            onClose()
            alert('신청이 완료되었습니다!')
            // Reset form
            setFormData({
                name: '',
                student_id: '',
                department: '컴퓨터공학과',
                phone: '',
                email: '',
                kakao_id: '',
                form_responses: {}
            })
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || '신청 처리 중 오류가 발생했습니다.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const getTitle = () => {
        switch (activity.type) {
            case 'kakao_invite':
                return '카톡방 초대 신청'
            case 'event':
            default:
                return '행사 참여 신청'
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-2">
                    <p className="font-bold mb-1">{activity.title}</p>
                    <p>신청 정보를 정확히 입력해주세요.</p>
                </div>

                {error && (
                    <div className="bg-red-50 p-4 rounded-xl text-sm text-red-800">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="이름을 입력하세요"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">학번</label>
                        <input
                            type="text"
                            name="student_id"
                            value={formData.student_id}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="예: 25101234"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">학과</label>
                        <input
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            required
                            readOnly
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="010-0000-0000"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                    />
                </div>

                {/* 카톡방 초대 전용 필드 */}
                {activity.type === 'kakao_invite' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">카카오톡 ID</label>
                        <input
                            type="text"
                            name="kakao_id"
                            value={formData.kakao_id}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="카카오톡 ID를 입력하세요"
                        />
                    </div>
                )}

                {/* 동적 폼 필드 (form_fields) */}
                {'form_fields' in activity && activity.form_fields && activity.form_fields.length > 0 && (
                    <div className="border-t border-gray-100 my-2 pt-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">추가 정보</h4>
                        <div className="space-y-4">
                            {activity.form_fields.map((field) => (
                                <div key={field.name}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    {field.type === 'select' ? (
                                        <select
                                            value={formData.form_responses?.[field.name] || ''}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                form_responses: { ...prev.form_responses, [field.name]: e.target.value }
                                            }))}
                                            required={field.required}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">선택하세요</option>
                                            {field.options?.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : field.type === 'textarea' ? (
                                        <textarea
                                            value={formData.form_responses?.[field.name] || ''}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                form_responses: { ...prev.form_responses, [field.name]: e.target.value }
                                            }))}
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                    ) : (
                                        <input
                                            type={field.type === 'number' ? 'number' : 'text'}
                                            value={formData.form_responses?.[field.name] || ''}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                form_responses: { ...prev.form_responses, [field.name]: e.target.value }
                                            }))}
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    )}
                                    {field.help_text && (
                                        <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : '신청하기'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
