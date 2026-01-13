import { useState } from 'react'
import { motion } from 'framer-motion'
import { Modal } from '../../common/Modal'
import type { Activity, ActivityListItem, SurveySubmitRequest } from '../../../types/activities'
import { activityApi } from '../../../lib/api/activities'

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

    // 설문 질문 가져오기 - form_fields 사용 (관리자 페이지와 일관성)
    const formFields = 'form_fields' in activity && activity.form_fields
        ? activity.form_fields
        : []

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const data: SurveySubmitRequest = {
                survey_responses: surveyResponses
            }
            await activityApi.submitSurvey(activity.id, data)
            await onSubmit(data)
            onClose()
            alert('설문 제출이 완료되었습니다.\n참여해주셔서 감사합니다.')
            setSurveyResponses({})
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || '설문 제출 중 오류가 발생했습니다.'
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
        <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-2">
                    <p className="font-bold mb-1">{activity.title}</p>
                    <p>여러분의 소중한 의견을 들려주세요.</p>
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
                        ) : '제출하기'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
