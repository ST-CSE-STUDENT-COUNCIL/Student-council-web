import { useState } from 'react'
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

    // 설문 질문 가져오기
    const questions = 'config' in activity && activity.config?.questions
        ? activity.config.questions
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
                {questions.length > 0 ? (
                    <div className="space-y-6">
                        {questions.map((question: any, index: number) => (
                            <div key={question.id || index} className="border-b border-gray-100 pb-4 last:border-0">
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    {index + 1}. {question.question}
                                    {question.required && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {question.type === 'multiple_choice' || question.type === 'radio' ? (
                                    <div className="space-y-2">
                                        {question.options?.map((option: string) => (
                                            <label key={option} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`question_${question.id}`}
                                                    value={option}
                                                    checked={surveyResponses[question.id] === option}
                                                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                                                    required={question.required}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm text-gray-700">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : question.type === 'checkbox' ? (
                                    <div className="space-y-2">
                                        {question.options?.map((option: string) => (
                                            <label key={option} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={(surveyResponses[question.id] || []).includes(option)}
                                                    onChange={(e) => {
                                                        const current = surveyResponses[question.id] || []
                                                        if (e.target.checked) {
                                                            handleResponseChange(question.id, [...current, option])
                                                        } else {
                                                            handleResponseChange(question.id, current.filter((v: string) => v !== option))
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                                <span className="text-sm text-gray-700">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <textarea
                                        value={surveyResponses[question.id] || ''}
                                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                                        required={question.required}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        placeholder="답변을 입력해주세요."
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    // 질문이 없는 경우 기본 텍스트 입력
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">의견 / 건의사항</label>
                        <textarea
                            value={surveyResponses['feedback'] || ''}
                            onChange={(e) => handleResponseChange('feedback', e.target.value)}
                            required
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="자유롭게 의견을 작성해주세요."
                        />
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
                        ) : '제출하기'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
