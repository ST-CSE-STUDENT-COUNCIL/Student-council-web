import { motion } from 'framer-motion'
import { X, BarChart3 } from 'lucide-react'

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
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <BarChart3 size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">설문조사 통계</h3>
                            <p className="text-sm text-gray-500">총 응답: {surveyStats.total_responses}명</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
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
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${percentage}%` }}
                                                                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
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
            </motion.div>
        </motion.div>
    )
}
