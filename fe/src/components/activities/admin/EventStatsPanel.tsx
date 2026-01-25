import { useMemo, useState } from 'react'
import { Card, Title } from '@tremor/react'
import { BarChart3, Loader2 } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { EventStatsSummary } from './EventStatsSummary'
import { StatAnswerItem } from './StatAnswerItem'

const CHART_COLORS = [
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

type EventStatsPanelProps = {
    loading: boolean
    stats: {
        total_responses: number
        question_stats: any[]
    } | null
    onPreviewImage: (url: string) => void
}

export const EventStatsPanel = ({ loading, stats, onPreviewImage }: EventStatsPanelProps) => {
    const [expandedSubjective, setExpandedSubjective] = useState<Record<string, boolean>>({})

    const questionStats = useMemo(() => stats?.question_stats ?? [], [stats])

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
                <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 size={32} className="text-purple-600 animate-spin mb-4" />
                    <p className="text-gray-500">통계 데이터를 불러오는 중...</p>
                </div>
            </div>
        )
    }

    if (!stats || questionStats.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <BarChart3 size={48} className="text-gray-300 mb-4" />
                    <p>표시할 통계 데이터가 없습니다.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
            <div className="max-w-4xl mx-auto space-y-8">
                <EventStatsSummary totalResponses={stats.total_responses} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {questionStats.map((stat: any, index: number) => {
                        const data = Object.entries(stat.responses || {}).map(([name, value]) => ({
                            name,
                            value: Number(value)
                        }))
                            .map((item, idx) => ({
                                ...item,
                                color: CHART_COLORS[idx % CHART_COLORS.length]
                            }))
                            .sort((a, b) => b.value - a.value)

                        const isChoice = stat.type === 'multiple_choice' || stat.type === 'radio' || stat.type === 'checkbox'
                        const totalResponses = data.reduce((sum, item) => sum + item.value, 0)
                        const subjectiveAnswers = Array.isArray(stat.responses) ? stat.responses : []
                        const subjectiveSummary = Object.entries(
                            subjectiveAnswers.reduce((acc: Record<string, number>, answer: unknown) => {
                                const key = String(answer).trim()
                                if (!key) return acc
                                acc[key] = (acc[key] || 0) + 1
                                return acc
                            }, {} as Record<string, number>)
                        )
                            .map(([answer, count]) => ({ answer, count: Number(count) }))
                            .sort((a, b) => b.count - a.count)
                        const questionKey = String(stat.question_id ?? index)
                        const isExpanded = expandedSubjective[questionKey]
                        const visibleSubjective = isExpanded ? subjectiveSummary : subjectiveSummary.slice(0, 5)

                        return (
                            <Card key={index} className="h-full">
                                <div className="flex items-start gap-2 mb-4">
                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-sm font-bold">Q{index + 1}</span>
                                    <Title>{stat.question}</Title>
                                </div>

                                {isChoice ? (
                                    <div className="mt-4 space-y-6">
                                        <div className="flex justify-center">
                                            <div className="relative w-full max-w-[220px] h-40">
                                                <ResponsiveContainer>
                                                    <PieChart>
                                                        <Pie
                                                            data={data}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            innerRadius="70%"
                                                            outerRadius="100%"
                                                            startAngle={90}
                                                            endAngle={-270}
                                                            stroke="#ffffff"
                                                            strokeWidth={2}
                                                        >
                                                            {data.map(item => (
                                                                <Cell key={item.name} fill={item.color} />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-gray-900 pointer-events-none">
                                                    {totalResponses}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {data.map(item => {
                                                const percentValue = totalResponses > 0 ? (item.value / totalResponses) * 100 : 0
                                                const percentLabel = percentValue % 1 === 0 ? `${percentValue.toFixed(0)}%` : `${percentValue.toFixed(1)}%`

                                                return (
                                                    <div key={item.name} className="space-y-1">
                                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                                            <span className="font-medium text-gray-900">{item.name}</span>
                                                            <span>{item.value}명 · {percentLabel}</span>
                                                        </div>
                                                        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{ width: `${percentValue}%`, backgroundColor: item.color }}
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-4 rounded-lg text-gray-600 text-sm space-y-3">
                                        {subjectiveSummary.length === 0 ? (
                                            <p className="text-center text-gray-400">응답이 없습니다.</p>
                                        ) : (
                                            <>
                                                <ul className="space-y-2">
                                                    {visibleSubjective.map((item, idx) => (
                                                        <StatAnswerItem
                                                            key={idx}
                                                            answer={item.answer}
                                                            count={item.count}
                                                            onPreviewImage={onPreviewImage}
                                                        />
                                                    ))}
                                                </ul>
                                                {subjectiveSummary.length > 5 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedSubjective(prev => ({
                                                            ...prev,
                                                            [questionKey]: !isExpanded
                                                        }))}
                                                        className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                                                    >
                                                        {isExpanded ? '접기' : `더 보기 (+${subjectiveSummary.length - 5})`}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
