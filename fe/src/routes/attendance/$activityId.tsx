import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { BadgeCheck, Calendar, IdCard, MapPin, ScanLine } from 'lucide-react'
import { SEO } from '../../components/common/SEO'

export const Route = createFileRoute('/attendance/$activityId')({
    component: AttendancePage,
})

function AttendancePage() {
    const { activityId } = Route.useParams()
    const [studentId, setStudentId] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const activity = {
        id: activityId,
        title: '행사 출석 체크',
        date: '-',
        location: '-',
        note: '행사 정보를 불러오는 중입니다.'
    }

    const canSubmit = studentId.trim().length > 0

    const handleSubmit = () => {
        if (!canSubmit) return
        setSubmitted(true)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
            <SEO
                title="행사 출석 체크"
                description="학생회 행사 출석 체크"
                url={`/attendance/${activityId}`}
            />
            <div className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <section className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">
                            <BadgeCheck size={16} />
                            출석 등록
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{activity.title}</h1>
                            <p className="text-slate-600">학번만 입력하면 출석 등록이 완료됩니다.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <Calendar size={16} />
                                    일시
                                </div>
                                <p className="mt-2 font-semibold text-slate-900">{activity.date}</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <MapPin size={16} />
                                    장소
                                </div>
                                <p className="mt-2 font-semibold text-slate-900">{activity.location}</p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
                            {activity.note}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { icon: <ScanLine size={18} />, title: '학번 입력', desc: '학번만 입력하면 됩니다.' },
                                { icon: <IdCard size={18} />, title: '즉시 확인', desc: '등록 상태를 바로 확인합니다.' },
                                { icon: <BadgeCheck size={18} />, title: '출석 완료', desc: '완료 메시지가 표시됩니다.' },
                            ].map((item) => (
                                <div key={item.title} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                    <div className="flex items-center gap-2 text-slate-600 text-sm font-semibold">
                                        {item.icon}
                                        {item.title}
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">활동 ID</p>
                                <p className="text-lg font-semibold text-slate-900">#{activity.id}</p>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold">학생 전용</div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <label className="block text-sm font-semibold text-slate-700">학번</label>
                            <input
                                value={studentId}
                                onChange={(event) => {
                                    setStudentId(event.target.value)
                                    setSubmitted(false)
                                }}
                                placeholder="예) 20201234"
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                            />
                            <p className="text-xs text-slate-400">띄어쓰기 없이 숫자만 입력해주세요.</p>
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className="mt-6 w-full rounded-2xl bg-emerald-600 text-white py-3 font-semibold shadow-md shadow-emerald-200 hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            출석 등록하기
                        </button>

                        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-4 text-sm">
                            {submitted ? (
                                <div className="text-emerald-700 font-semibold">
                                    출석이 등록되었습니다. 안내 데스크에서 확인을 기다려주세요.
                                </div>
                            ) : (
                                <div className="text-slate-500">
                                    출석 등록 결과가 여기에 표시됩니다.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
