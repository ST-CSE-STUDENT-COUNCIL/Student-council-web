import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, BarChart3 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QuestionJumpNav } from './QuestionJumpNav'

type SurveyStatsModalProps = {
    surveyStats: {
        total_responses: number
        question_stats: {
            question: string
            type: string
            responses: Record<string, number>
        }[]
    }
    onClose: () => void
}

export function SurveyStatsModal({ surveyStats, onClose }: SurveyStatsModalProps) {
    const [highlightedId, setHighlightedId] = useState<string | null>(null)
    const highlightTimeoutRef = useRef<number | null>(null)

    const questionsForJump = useMemo(() => {
        return (surveyStats.question_stats || []).map((stat, index) => {
            const typeLabel = stat.type === 'multiple_choice' || stat.type === 'radio' || stat.type === 'checkbox'
                ? '객관식'
                : '주관식'
            return { id: String(index), label: `${index + 1}. ${stat.question} (${typeLabel})` }
        })
    }, [surveyStats.question_stats])

    const getQuestionElementId = useCallback((id: string) => `survey-stats-modal-question-${id}`, [])

    const scrollToQuestion = useCallback((id: string) => {
        const el = document.getElementById(getQuestionElementId(id))
        if (!el) return false
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setHighlightedId(id)
        if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current)
        highlightTimeoutRef.current = window.setTimeout(() => setHighlightedId(null), 1800)
        return true
    }, [getQuestionElementId])

    useEffect(() => {
        return () => {
            if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current)
        }
    }, [])

    return (
        <Transition appear show={true} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col transform transition-all">
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                            <BarChart3 size={20} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <Dialog.Title as="h3" className="text-lg font-bold text-gray-900">설문조사 통계</Dialog.Title>
                                            <p className="text-sm text-gray-500">총 응답: {surveyStats.total_responses}명</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 focus:outline-none">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                                    {surveyStats.question_stats && surveyStats.question_stats.length > 0 ? (
                                        <div className="space-y-6">
                                            {surveyStats.question_stats.map((stat, index) => (
                                                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                                                    <h4 className="font-semibold text-gray-900 mb-4">{index + 1}. {stat.question}</h4>
                                                    {stat.type === 'multiple_choice' || stat.type === 'radio' || stat.type === 'checkbox' ? (
                                                        <div className="space-y-3">
                                                            {Object.entries(stat.responses || {}).map(([option, count]) => {
                                                                const percentage = surveyStats.total_responses > 0
                                                                    ? ((count / surveyStats.total_responses) * 100).toFixed(1)
                                                                    : '0.0'
                                                                return (
                                                                    <div key={option}>
                                                                        <div className="flex justify-between text-sm mb-1.5">
                                                                            <span className="text-gray-700">{option}</span>
                                                                            <span className="font-semibold text-gray-900">{count}명 ({percentage}%)</span>
                                                                        </div>
                                                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                                            <div
                                                                                style={{ width: `${percentage}%` }}
                                                                                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500 bg-white p-3 rounded-lg">
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
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
