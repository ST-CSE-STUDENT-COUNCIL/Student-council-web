import { useState } from 'react'
import { Card } from '@tremor/react'
import { BarChart3 } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { SurveyQuestionStat } from './surveyStatsTypes'

const OBJECTIVE_TYPES = new Set(['multiple_choice', 'radio', 'checkbox'])
const QUESTION_TYPE_LABELS: Record<string, string> = {
    multiple_choice: '객관식',
    radio: '단일 선택',
    checkbox: '다중 선택',
    text: '주관식',
    textarea: '장문형',
    number: '숫자형',
    date: '날짜형'
}
const STATS_CHART_COLORS = [
    '#3b82f6',
    '#06b6d4',
    '#6366f1',
    '#8b5cf6',
    '#d946ef',
    '#10b981',
    '#f43f5e',
    '#f59e0b',
    '#84cc16',
    '#14b8a6',
    '#0ea5e9',
    '#a855f7'
]

type SubjectiveSummaryItem = {
    answer: string
    count: number
}

type SurveyStatsPanelProps = {
    loading: boolean
    surveyStats: { total_responses: number } | null
    questionStats: SurveyQuestionStat[]
}

export const SurveyStatsPanel = ({ loading, surveyStats, questionStats }: SurveyStatsPanelProps) => {
    const [statsFilter, setStatsFilter] = useState<'all' | 'objective' | 'subjective'>('all')
    const [expandedSubjective, setExpandedSubjective] = useState<Record<string, boolean>>({})

    const objectiveQuestionCount = questionStats.filter(stat => OBJECTIVE_TYPES.has(stat.type)).length
    const subjectiveQuestionCount = questionStats.length - objectiveQuestionCount
    const filteredQuestionStats = questionStats.filter(stat => {
        if (statsFilter === 'objective') return OBJECTIVE_TYPES.has(stat.type)
        if (statsFilter === 'subjective') return !OBJECTIVE_TYPES.has(stat.type)
        return true
    })

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
                        <BarChart3 size={28} className="text-indigo-600" />
                    </div>
                    <p className="text-gray-500">통계 데이터를 불러오는 중...</p>
                </div>
            ) : surveyStats ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <button
                            type="button"
                            onClick={() => setStatsFilter('all')}
                            className={`p-4 rounded-2xl border flex flex-col gap-1 text-left transition-all ${statsFilter === 'all'
                                ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100'
                                : 'bg-white border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            <p className="text-xs uppercase text-gray-500 tracking-wide">총 응답자</p>
                            <p className="text-3xl font-semibold text-gray-900">{surveyStats.total_responses}</p>
                            <p className="text-xs text-gray-400">제출된 응답자 수</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatsFilter('objective')}
                            className={`p-4 rounded-2xl border flex flex-col gap-1 text-left transition-all ${statsFilter === 'objective'
                                ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100'
                                : 'bg-white border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            <p className="text-xs uppercase text-gray-500 tracking-wide">객관식 문항</p>
                            <p className="text-2xl font-semibold text-gray-900">{objectiveQuestionCount}</p>
                            <p className="text-xs text-gray-400">선택형 문항 수</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatsFilter('subjective')}
                            className={`p-4 rounded-2xl border flex flex-col gap-1 text-left transition-all ${statsFilter === 'subjective'
                                ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100'
                                : 'bg-white border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            <p className="text-xs uppercase text-gray-500 tracking-wide">주관식 문항</p>
                            <p className="text-2xl font-semibold text-gray-900">{subjectiveQuestionCount}</p>
                            <p className="text-xs text-gray-400">텍스트형 문항 수</p>
                        </button>
                    </div>

                    {filteredQuestionStats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <BarChart3 size={48} className="text-gray-300 mb-4" />
                            <p className="text-lg font-semibold text-gray-900 mb-1">분석 중입니다</p>
                            <p className="text-xs text-gray-400 text-center max-w-xs">
                                아직 문항 정보가 준비되지 않았거나 응답 정리 중입니다. 총 {surveyStats.total_responses}명 응답이 접수되었습니다.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredQuestionStats.map((stat, index) => {
                                const isChoice = OBJECTIVE_TYPES.has(stat.type)
                                const chartData = Object.entries(stat.responses || {})
                                    .map(([name, value], idx) => ({
                                        name,
                                        value: Number(value),
                                        color: STATS_CHART_COLORS[idx % STATS_CHART_COLORS.length]
                                    }))

                                const totalForQuestion = chartData.reduce((sum, entry) => sum + entry.value, 0)
                                const maxItem = chartData.reduce(
                                    (max, item) => (item.value > max.value ? item : max),
                                    { name: '', value: 0, color: STATS_CHART_COLORS[0] }
                                )
                                const subjectiveAnswers = Array.isArray(stat.responses) ? stat.responses : []
                                const subjectiveSummary: SubjectiveSummaryItem[] = Object.entries(
                                    subjectiveAnswers.reduce((acc: Record<string, number>, answer: unknown) => {
                                        const key = String(answer).trim()
                                        if (!key) return acc
                                        acc[key] = (acc[key] || 0) + 1
                                        return acc
                                    }, {} as Record<string, number>)
                                )
                                    .map(([answer, count]) => ({ answer, count: Number(count) }))
                                    .sort((a, b) => {
                                        if (stat.type === 'number') {
                                            const aNum = Number(a.answer)
                                            const bNum = Number(b.answer)
                                            if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum
                                        }
                                        if (stat.type === 'date') {
                                            const aTime = Date.parse(a.answer)
                                            const bTime = Date.parse(b.answer)
                                            if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return aTime - bTime
                                        }
                                        return b.count - a.count
                                    })
                                const questionKey = String(stat.question_id)
                                const isExpanded = expandedSubjective[questionKey]
                                const visibleSubjective = isExpanded ? subjectiveSummary : subjectiveSummary.slice(0, 5)

                                return (
                                    <Card key={stat.question_id ?? index} className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-full px-2 py-1">Q{index + 1}</span>
                                            <span className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-500">
                                                {QUESTION_TYPE_LABELS[stat.type] || '응답'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                응답 {isChoice ? totalForQuestion : subjectiveAnswers.length}건
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-semibold text-gray-900">{stat.question}</h4>

                                        {isChoice ? (
                                            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                                                <div className="flex items-center justify-center">
                                                    {chartData.length > 0 ? (
                                                        <div className="relative w-full h-40">
                                                            <ResponsiveContainer>
                                                                <PieChart>
                                                                    <Pie
                                                                        data={chartData}
                                                                        dataKey="value"
                                                                        nameKey="name"
                                                                        innerRadius="75%"
                                                                        outerRadius="100%"
                                                                        startAngle={90}
                                                                        endAngle={-270}
                                                                        stroke="#ffffff"
                                                                        strokeWidth={2}
                                                                    >
                                                                        {chartData.map(item => (
                                                                            <Cell key={item.name} fill={item.color} />
                                                                        ))}
                                                                    </Pie>
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                            <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-gray-900 pointer-events-none">
                                                                {totalForQuestion}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-400">응답이 없습니다.</p>
                                                    )}
                                                </div>
                                                <div className="space-y-3">
                                                    {chartData.length > 0 ? (
                                                        <>
                                                            <div className="text-sm text-gray-500 flex justify-between">
                                                                <span>가장 많은 응답</span>
                                                                <span className="font-semibold text-gray-900">{maxItem.name} ({maxItem.value}명)</span>
                                                            </div>
                                                            <div className="mt-2 space-y-3">
                                                                {chartData.map(item => {
                                                                    const maxValue = maxItem.value ?? 0
                                                                    const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
                                                                    return (
                                                                        <div key={item.name} className="space-y-1">
                                                                            <div className="flex items-center justify-between text-sm text-gray-600">
                                                                                <span className="font-medium text-gray-900">{item.name}</span>
                                                                                <span>{item.value}명</span>
                                                                            </div>
                                                                            <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                                                                                <div
                                                                                    className="h-full rounded-full"
                                                                                    style={{ width: `${percentage}%`, backgroundColor: item.color }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-gray-400">옵션 응답이 없습니다.</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 bg-gray-50/60 p-4 rounded-2xl">
                                                <p className="text-sm text-gray-500">{`주관식 응답 ${subjectiveAnswers.length}건`}</p>
                                                {subjectiveSummary.length > 0 ? (
                                                    <div className="space-y-3">
                                                        <ul className="space-y-2 text-sm text-gray-700">
                                                            {visibleSubjective.map((item, idx) => (
                                                                <li key={idx} className="flex items-center justify-between gap-3">
                                                                    <span className="truncate">{item.answer}</span>
                                                                    <span className="text-indigo-600 font-semibold text-xs">{item.count}회</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        {subjectiveSummary.length > 5 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedSubjective(prev => ({
                                                                    ...prev,
                                                                    [questionKey]: !isExpanded
                                                                }))}
                                                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                                                            >
                                                                {isExpanded ? '접기' : `더 보기 (+${subjectiveSummary.length - 5})`}
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-400">응답이 아직 없습니다.</p>
                                                )}
                                                <p className="text-xs text-gray-400">
                                                    추가 답변은 신청자 상세 정보를 확인하세요.
                                                </p>
                                            </div>
                                        )}
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <BarChart3 size={48} className="text-gray-300 mb-4" />
                    <p>표시할 통계 데이터가 없습니다.</p>
                </div>
            )}
        </div>
    )
}
