import React from 'react'

import { Modal } from '../../common/Modal'
import type { LockerFormState } from './LockerTypes'

const inputBaseClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all'
const dateInputClass = `${inputBaseClass} appearance-none pr-12`
const labelClass = 'text-xs font-semibold text-gray-500 tracking-wide uppercase flex items-center gap-2'
const sectionWrapperClass = 'rounded-2xl border border-gray-100 bg-gray-50/70 p-5 shadow-inner shadow-gray-100'
const LOCKER_DATE_FIELD_CONFIG: Array<{ name: keyof LockerFormState; label: string; helper: string }> = [
    { name: 'application_start', label: '신청 시작일', helper: '신청을 받기 시작하는 날짜' },
    { name: 'application_end', label: '신청 마감일', helper: '신청을 마감하는 날짜' },
    { name: 'return_extension_start', label: '반납/연장 시작일', helper: '반납 또는 연장을 열어두는 날짜' },
    { name: 'return_extension_end', label: '반납/연장 마감일', helper: '반납 또는 연장을 종료하는 날짜' },
]

type LockerSettingsModalProps = {
    isOpen: boolean
    formData: LockerFormState
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    onClose: () => void
    onSave: () => void
    isSubmitting: boolean
}

export function LockerSettingsModal({ isOpen, formData, onChange, onClose, onSave, isSubmitting }: LockerSettingsModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="기간 및 링크 설정"
            maxWidth="max-w-3xl"
            footer={
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-white"
                    >
                        취소
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isSubmitting}
                        className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition-all hover:bg-gray-800 disabled:opacity-50"
                    >
                        {isSubmitting ? '저장 중...' : '변경사항 저장'}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="mb-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Locker Timeline</p>
                    <p className="mt-2 text-sm text-gray-500">기간이 저장되면 즉시 사용자 페이지와 공유됩니다.</p>
                </div>
                <div className={sectionWrapperClass}>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-900 text-sm font-semibold tracking-tight text-white">URL</div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">폼 링크</p>
                                <p className="text-xs text-gray-500">학생들이 보게 될 신청/반납 폼 링크를 입력하세요.</p>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <p className={labelClass}>신청 폼 URL</p>
                                <input
                                    type="url"
                                    name="application_form_url"
                                    value={formData.application_form_url}
                                    onChange={onChange}
                                    placeholder="https://forms.gle/..."
                                    className={inputBaseClass}
                                />
                            </div>
                            <div className="space-y-2">
                                <p className={labelClass}>반납/연장 폼 URL</p>
                                <input
                                    type="url"
                                    name="return_extension_form_url"
                                    value={formData.return_extension_form_url}
                                    onChange={onChange}
                                    placeholder="https://forms.gle/..."
                                    className={inputBaseClass}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={sectionWrapperClass}>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-xs font-bold tracking-[0.2em] text-gray-900 shadow">DATE</div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">운영 날짜</p>
                                <p className="text-xs text-gray-500">시간 없이 날짜만 선택하면 됩니다.</p>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {LOCKER_DATE_FIELD_CONFIG.map((field) => (
                                <label key={field.name} className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <span className="rounded-full bg-gray-900/10 px-3 py-0.5 text-[11px] font-bold tracking-[0.08em] text-gray-700">{field.label}</span>
                                    </div>
                                    <p className="text-xs font-medium text-gray-500">{field.helper}</p>
                                    <div className="group relative">
                                        <input type="date" name={field.name} value={formData[field.name]} onChange={onChange} className={dateInputClass} />
                                        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400 group-focus-within:text-gray-900">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h8M7 11h10M9 15h6" />
                                                <rect width={18} height={16} x={3} y={5} rx={2} strokeWidth={1.5} />
                                            </svg>
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className={sectionWrapperClass}>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-xs font-bold tracking-[0.2em] text-gray-900 shadow">MEMO</div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">추가 안내</p>
                                <p className="text-xs text-gray-500">점검 일정이나 특이사항을 자유롭게 기록하세요.</p>
                            </div>
                        </div>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={onChange}
                            placeholder="예: 19, 35번 고장, 2024-1학기"
                            className={`${inputBaseClass} min-h-[110px] resize-none`}
                        />
                    </div>
            </div>
        </Modal>
    )
}
