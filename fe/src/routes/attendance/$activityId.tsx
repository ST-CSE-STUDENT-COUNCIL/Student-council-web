import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { SEO } from '../../components/common/SEO'

export const Route = createFileRoute('/attendance/$activityId')({
    component: AttendancePage,
})

function AttendancePage() {
    const { activityId } = Route.useParams()
    const [studentId, setStudentId] = useState('')
    const [submitted, setSubmitted] = useState(false)

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
            <div className="min-h-screen flex items-center justify-center px-4">
                <section className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-lg">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900">출석 체크</h1>
                        <p className="text-sm text-slate-600">학번만 입력하면 출석 등록이 완료됩니다.</p>
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
                        출석 등록
                    </button>

                    <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-4 text-sm">
                        {submitted ? (
                            <div className="text-emerald-700 font-semibold">
                                출석이 등록되었습니다.
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
    )
}
