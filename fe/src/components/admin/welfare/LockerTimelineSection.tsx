import React from 'react'

import type { LockerTimelineStage } from './LockerTypes'

type LockerTimelineSectionProps = {
    timeline: LockerTimelineStage[]
    specialNote: string
    onEditClick: () => void
}

export function LockerTimelineSection({ timeline, specialNote, onEditClick }: LockerTimelineSectionProps) {
    const note = specialNote.trim() ? specialNote : '등록된 특이사항이 없습니다.'

    return (
        <section className="grid gap-8 lg">
            <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-gray-100 bg-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">운영 타임라인</h2>
                            <p className="text-sm text-gray-500">기간을 업데이트하면 사용자 페이지에 바로 반영됩니다.</p>
                        </div>
                        <button
                            onClick={onEditClick}
                            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-gray-800"
                        >
                            타임라인 수정
                        </button>
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {timeline.map((stage) => (
                            <div key={stage.label} className="flex flex-col items-center gap-3">
                                <div className={`rounded-2xl border px-4 py-4 text-center w-full ${stage.colorClass}`}>
                                    <p className="text-m font-semibold uppercase tracking-wide">{stage.label}</p>
                                    <p className="mt-2 text-lg font-bold">{stage.value}</p>
                                </div>
                                {stage.formUrl ? (
                                    <a
                                        href={stage.formUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors text-center"
                                    >
                                        {stage.buttonLabel}
                                    </a>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full rounded-lg bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-500 cursor-not-allowed"
                                    >
                                        {stage.buttonLabel}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">특이사항</p>
                                <p className="text-lg font-bold text-gray-900">추가 안내</p>
                            </div>
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm text-gray-600">{note}</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
