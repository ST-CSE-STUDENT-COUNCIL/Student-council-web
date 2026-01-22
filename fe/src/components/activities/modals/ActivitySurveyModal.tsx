import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Modal } from '../../common/Modal'
import type { Activity, ActivityListItem, SurveySubmitRequest } from '../../../types/activities'
import { activityApi } from '../../../lib/api/activities'
import { toast } from 'sonner'

type ActivitySurveyModalProps = {
    isOpen: boolean
    onClose: () => void
    activity: Activity | ActivityListItem
    onSubmit: (data: any) => Promise<void>
}

export const ActivitySurveyModal = ({ isOpen, onClose, activity, onSubmit }: ActivitySurveyModalProps) => {
    const [surveyResponses, setSurveyResponses] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // 설문 질문 데이터 정규화 (form_fields 또는 config.questions 지원)
    const formFields = useMemo(() => {
        if ('form_fields' in activity && activity.form_fields && activity.form_fields.length > 0) {
            return activity.form_fields
        }

        // Survey 타입의 config.questions 구조 지원
        if ('config' in activity && activity.config?.questions) {
            return activity.config.questions.map((q: any) => ({
                name: String(q.id),
                label: q.question,
                type: q.type === 'multiple_choice' ? 'radio' : 'textarea',
                options: q.options,
                required: q.required,
                placeholder: q.type === 'text' ? '답변을 입력해주세요' : undefined
            }))
        }

        return []
    }, [activity])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (activity.type === 'demand_survey') {
                // 수요조사는 '신청(register)' API 사용 -> form_responses로 전송
                // 완전 익명: 모든 개인정보 필드를 더미 데이터로 채움
                const data = {
                    name: '익명',
                    phone: '010-0000-0000',
                    student_id: '00000000',
                    department: '익명',
                    email: 'anonymous@example.com',
                    form_responses: surveyResponses,
                }
                await activityApi.register(activity.id, data)
                // 상위 컴포넌트에는 통일된 형태로 전달
                await onSubmit({ survey_responses: surveyResponses })
            } else {
                // 설문조사는 '설문(submitSurvey)' API 사용 -> survey_responses로 전송
                // 익명성 보장: 프론트엔드에서 더미 데이터 전송
                const data: SurveySubmitRequest = {
                    name: '익명',
                    student_id: '00000000',
                    department: '익명',
                    phone: '010-0000-0000',
                    email: 'anonymous@example.com',
                    survey_responses: surveyResponses
                }
                await activityApi.submitSurvey(activity.id, data)
                await onSubmit(data)
            }

            onClose()
            toast.success('제출이 완료되었습니다.\n참여해주셔서 감사합니다.')
            setSurveyResponses({})
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || '제출 중 오류가 발생했습니다.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleResponseChange = (questionId: string | number, value: any) => {
        setSurveyResponses(prev => ({
            ...prev,
            [questionId]: value
        }))
    }

    const getTitle = () => {
        switch (activity.type) {
            case 'demand_survey':
                return '수요조사'
            case 'survey':
            default:
                return '설문조사'
        }
    }

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={getTitle()}
            footer={
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        form="survey-form"
                        disabled={loading}
                        className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : '제출하기'}
                    </button>
                </div>
            }
        >
            <form id="survey-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-2">
                    <p className="font-bold mb-1">{activity.title}</p>
                    <p>여러분의 소중한 의견을 들려주세요. (철저한 익명 보장)</p>
                </div>

                {error && (
                    <div className="bg-red-50 p-4 rounded-xl text-sm text-red-800">
                        {error}
                    </div>
                )}

                {/* 질문이 있는 경우 동적 렌더링 */}
                {formFields.length > 0 ? (
                    <div className="space-y-6">
                        {formFields.map((field: any, index: number) => (
                            <motion.div
                                key={field.name || index}
                                className="border-b border-gray-100 pb-4 last:border-0"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + (index * 0.08) }}
                            >
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    {index + 1}. {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {field.help_text && (
                                    <p className="text-xs text-gray-500 mb-2">{field.help_text}</p>
                                )}

                                {field.type === 'radio' ? (
                                    <div className="space-y-2">
                                        {field.options?.map((option: string, optIndex: number) => (
                                            <motion.label
                                                key={option}
                                                className="flex items-center gap-2 cursor-pointer"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.15 + (index * 0.08) + (optIndex * 0.03) }}
                                                whileHover={{ x: 4 }}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`field_${field.name}`}
                                                    value={option}
                                                    checked={surveyResponses[field.name] === option}
                                                    onChange={(e) => handleResponseChange(field.name, e.target.value)}
                                                    required={field.required}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm text-gray-700">{option}</span>
                                            </motion.label>
                                        ))}
                                    </div>
                                ) : field.type === 'checkbox' ? (
                                    <div className="space-y-2">
                                        {field.options?.map((option: string, optIndex: number) => (
                                            <motion.label
                                                key={option}
                                                className="flex items-center gap-2 cursor-pointer"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.15 + (index * 0.08) + (optIndex * 0.03) }}
                                                whileHover={{ x: 4 }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={(surveyResponses[field.name] || []).includes(option)}
                                                    onChange={(e) => {
                                                        const current = surveyResponses[field.name] || []
                                                        if (e.target.checked) {
                                                            handleResponseChange(field.name, [...current, option])
                                                        } else {
                                                            handleResponseChange(field.name, current.filter((v: string) => v !== option))
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                                <span className="text-sm text-gray-700">{option}</span>
                                            </motion.label>
                                        ))}
                                    </div>
                                ) : field.type === 'select' ? (
                                    <motion.select
                                        value={surveyResponses[field.name] || ''}
                                        onChange={(e) => handleResponseChange(field.name, e.target.value)}
                                        required={field.required}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 + (index * 0.08) }}
                                    >
                                        <option value="">선택하세요</option>
                                        {field.options?.map((option: string) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </motion.select>
                                ) : field.type === 'textarea' ? (
                                    <motion.textarea
                                        value={surveyResponses[field.name] || ''}
                                        onChange={(e) => handleResponseChange(field.name, e.target.value)}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 + (index * 0.08) }}
                                    />
                                ) : field.type === 'number' ? (
                                    <motion.input
                                        type="number"
                                        value={surveyResponses[field.name] || ''}
                                        onChange={(e) => handleResponseChange(field.name, e.target.value)}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 + (index * 0.08) }}
                                    />
                                ) : field.type === 'date' ? (
                                    <motion.input
                                        type="date"
                                        value={surveyResponses[field.name] || ''}
                                        onChange={(e) => handleResponseChange(field.name, e.target.value)}
                                        required={field.required}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 + (index * 0.08) }}
                                    />
                                ) : (
                                    <motion.input
                                        type="text"
                                        value={surveyResponses[field.name] || ''}
                                        onChange={(e) => handleResponseChange(field.name, e.target.value)}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 + (index * 0.08) }}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    // 질문이 없는 경우 기본 텍스트 입력
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <label className="block text-sm font-medium text-gray-700 mb-1">의견 / 건의사항</label>
                        <textarea
                            value={surveyResponses['feedback'] || ''}
                            onChange={(e) => handleResponseChange('feedback', e.target.value)}
                            required
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="자유롭게 의견을 작성해주세요."
                        />
                    </motion.div>
                )}
            </form>
        </Modal>
    )
}
