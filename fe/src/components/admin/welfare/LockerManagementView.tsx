import React from 'react'

import { welfareApi, type LockerPeriod } from '../../../lib/api/welfare'
import { useAuthStore } from '../../../store/useAuthStore.ts'

type LockerFormState = {
    application_form_url: string
    return_extension_form_url: string
    application_start: string
    application_end: string
    return_extension_start: string
    return_extension_end: string
    description: string
}

const LOCKER_DATE_FIELDS: Array<keyof LockerFormState> = [
    'application_start',
    'application_end',
    'return_extension_start',
    'return_extension_end',
]

const padTimeUnit = (value: number): string => value.toString().padStart(2, '0')

const formatDateForInput = (isoValue?: string | null): string => {
    if (!isoValue) return ''
    const date = new Date(isoValue)
    if (Number.isNaN(date.getTime())) return ''
    return `${date.getFullYear()}-${padTimeUnit(date.getMonth() + 1)}-${padTimeUnit(date.getDate())}T${padTimeUnit(date.getHours())}:${padTimeUnit(date.getMinutes())}`
}

const getTimezoneOffsetString = (date: Date): string => {
    const offsetMinutes = -date.getTimezoneOffset()
    const sign = offsetMinutes >= 0 ? '+' : '-'
    const absoluteMinutes = Math.abs(offsetMinutes)
    const hours = padTimeUnit(Math.floor(absoluteMinutes / 60))
    const minutes = padTimeUnit(absoluteMinutes % 60)
    return `${sign}${hours}:${minutes}`
}

const formatInputDateForApi = (inputValue?: string): string | null => {
    if (!inputValue) return null
    const date = new Date(inputValue)
    if (Number.isNaN(date.getTime())) return null
    const offset = getTimezoneOffsetString(date)
    return `${date.getFullYear()}-${padTimeUnit(date.getMonth() + 1)}-${padTimeUnit(date.getDate())}T${padTimeUnit(date.getHours())}:${padTimeUnit(date.getMinutes())}:${padTimeUnit(date.getSeconds())}${offset}`
}

const createLockerFormState = (data?: Partial<LockerPeriod>): LockerFormState => ({
    application_form_url: data?.application_form_url || '',
    return_extension_form_url: data?.return_extension_form_url || '',
    application_start: formatDateForInput(data?.application_start),
    application_end: formatDateForInput(data?.application_end),
    return_extension_start: formatDateForInput(data?.return_extension_start),
    return_extension_end: formatDateForInput(data?.return_extension_end),
    description: data?.description || '',
})

const buildLockerPeriodPayload = (state: LockerFormState): Record<string, string | null> => {
    return Object.entries(state).reduce<Record<string, string | null>>((acc, [key, value]) => {
        const trimmedValue = value?.trim() ?? ''
        if (LOCKER_DATE_FIELDS.includes(key as keyof LockerFormState)) {
            acc[key] = trimmedValue ? formatInputDateForApi(trimmedValue) : null
        } else {
            acc[key] = trimmedValue || null
        }
        return acc
    }, {})
}

export function LockerManagementView() {
    const accessToken = useAuthStore((state) => state.accessToken)

    const [layoutImage, setLayoutImage] = React.useState<string | null>(null)
    const [isUploading, setIsUploading] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // 기간/링크 설정 모달 상태
    const [isModalOpen, setIsModalOpen] = React.useState(false)
    const [formData, setFormData] = React.useState<LockerFormState>(createLockerFormState())
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [timeline, setTimeline] = React.useState([
        { label: '신청기간', value: '', color: 'border-blue-500 bg-blue-50 text-blue-600', buttonLabel: '신청 폼', formUrl: '' },
        { label: '반납기간', value: '', color: 'border-emerald-500 bg-emerald-50 text-emerald-600', buttonLabel: '반납/연장 폼', formUrl: '' },
        { label: '연장기간', value: '', color: 'border-amber-500 bg-amber-50 text-amber-600', buttonLabel: '반납/연장 폼', formUrl: '' },
    ])
    const inputBaseClass = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all'
    const labelClass = 'text-xs font-semibold text-gray-500 tracking-wide uppercase flex items-center gap-2'
    const sectionWrapperClass = 'rounded-2xl border border-gray-100 bg-gray-50/70 p-5 shadow-inner shadow-gray-100'

    // 페이지 로드 시 현재 기간/링크 데이터 조회
    React.useEffect(() => {
        const loadLockerInfo = async () => {
            try {
                const data = await welfareApi.getLockerPeriods()
                if (data) {
                    setFormData(createLockerFormState(data))

                    // 타임라인 업데이트
                    setTimeline([
                        {
                            label: '신청기간',
                            value: formatDateRange(data.application_start, data.application_end),
                            color: 'border-blue-500 bg-blue-50 text-blue-600',
                            buttonLabel: '신청 폼',
                            formUrl: data.application_form_url || '',
                        },
                        {
                            label: '반납기간',
                            value: formatDateRange(data.return_extension_start, data.return_extension_end),
                            color: 'border-emerald-500 bg-emerald-50 text-emerald-600',
                            buttonLabel: '반납/연장 폼',
                            formUrl: data.return_extension_form_url || '',
                        },
                        {
                            label: '연장기간',
                            value: formatDateRange(data.return_extension_start, data.return_extension_end),
                            color: 'border-amber-500 bg-amber-50 text-amber-600',
                            buttonLabel: '반납/연장 폼',
                            formUrl: data.return_extension_form_url || '',
                        },
                    ])
                }
            } catch (error) {
                console.error('사물함 정보 조회 실패:', error)
            }
        }

        loadLockerInfo()
    }, [])

    React.useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isModalOpen])

    const formatDateRange = (start: string | null | undefined, end: string | null | undefined) => {
        if (!start || !end) return '기간 미설정'
        const startDate = new Date(start).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
        const endDate = new Date(end).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
        return `${startDate} ~ ${endDate}`
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        const fieldName = name as keyof LockerFormState
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value,
        }))
    }

    const handleSaveSettings = async () => {
        setIsSubmitting(true)
        try {
            const submitData = buildLockerPeriodPayload(formData)
            const responseData = await welfareApi.updateLockerPeriods(submitData, accessToken)
            setTimeline([
                {
                    label: '신청기간',
                    value: formatDateRange(responseData.application_start, responseData.application_end),
                    color: 'border-blue-500 bg-blue-50 text-blue-600',
                    buttonLabel: '신청 폼',
                    formUrl: responseData.application_form_url || '',
                },
                {
                    label: '반납기간',
                    value: formatDateRange(responseData.return_extension_start, responseData.return_extension_end),
                    color: 'border-emerald-500 bg-emerald-50 text-emerald-600',
                    buttonLabel: '반납/연장 폼',
                    formUrl: responseData.return_extension_form_url || '',
                },
                {
                    label: '연장기간',
                    value: formatDateRange(responseData.return_extension_start, responseData.return_extension_end),
                    color: 'border-amber-500 bg-amber-50 text-amber-600',
                    buttonLabel: '반납/연장 폼',
                    formUrl: responseData.return_extension_form_url || '',
                },
            ])

            setFormData(createLockerFormState(responseData))

            alert('기간 및 링크가 저장되었습니다.')
            setIsModalOpen(false)
        } catch (error: any) {
            let errorMessage = '저장 실패'
            if (error.response?.status === 403) {
                errorMessage = '권한이 없습니다.'
            } else if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail
            }
            alert(`저장 실패: ${errorMessage}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleLayoutUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) {
            return
        }

        setIsUploading(true)
        try {
            const formData = new FormData()
            // API 명세: layout_image 필드에 이미지 파일 전달
            formData.append('layout_image', file)

            // 이미지 업로드 (R2 저장) 및 layout_image_url 반환
            const response = await welfareApi.uploadLockerImage(formData, accessToken)
            
            // API에서 반환된 URL을 사용 (R2의 실제 이미지 URL)
            if (response?.layout_image_url) {
                setLayoutImage(response.layout_image_url)
            } else {
                // 폴백: 로컬 미리보기 생성
                const reader = new FileReader()
                reader.onloadend = () => {
                    setLayoutImage(reader.result as string)
                }
                reader.readAsDataURL(file)
            }

            alert('사물함 배치도가 업로드되었습니다.')
        } catch (error: any) {
            let errorMessage = '배치도 업로드에 실패했습니다.'

            if (error.response?.status === 403) {
                errorMessage = error.response?.data?.detail || '권한이 없습니다. 관리자 권한이 필요합니다.'
            } else if (error.response?.status === 401) {
                errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.'
            } else if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail
            }

            alert(`업로드 실패: ${errorMessage}`)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-10">
            <section className="grid gap-8 lg">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">운영 타임라인</h2>
                                <p className="text-sm text-gray-500">기간을 업데이트하면 사용자 페이지에 바로 반영됩니다.</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-gray-800"
                            >
                                기간 수정
                            </button>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {timeline.map((stage) => (
                                <div key={stage.label} className="flex flex-col items-center gap-3">
                                    <div className={`rounded-2xl border px-4 py-4 text-center w-full ${stage.color}`}>
                                        <p className="text-xs font-semibold uppercase tracking-wide">{stage.label}</p>
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
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">사물함 배치도</h2>
                        <p className="text-sm text-gray-500">사물함 배치도 이미지를 업로드하여 관리하세요.</p>
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? '업로드 중...' : '+ 배치도 업로드'}
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLayoutUpload}
                />

                {layoutImage ? (
                    <div className="space-y-4">
                        <div className="relative rounded-xl overflow-hidden bg-gray-50 border-2 border-gray-100">
                            <img
                                src={layoutImage}
                                alt="사물함 배치도"
                                className="w-full h-auto max-h-96 object-contain"
                            />
                        </div>

                    </div>
                ) : (
                    <label className="block cursor-pointer">
                        <div className="rounded-xl border-2 border-dashed border-gray-300 py-12 px-6 text-center hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center">
                                <svg
                                    className="h-12 w-12 text-gray-400 mb-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0119.5 19.5A4.5 4.5 0 016.75 19.5z"
                                    />
                                </svg>
                                <p className="text-sm font-semibold text-gray-900">이미지를 드래그하거나 클릭하여 업로드</p>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (최대 10MB)</p>
                            </div>
                        </div>
                    </label>
                )}
            </section>

            {/* 기간/링크 설정 모달 */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
                    <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-start justify-between border-b border-gray-100 px-8 py-6">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Locker Timeline</p>
                                <h2 className="mt-1 text-2xl font-bold text-gray-900">기간 및 링크 설정</h2>
                                <p className="mt-2 text-sm text-gray-500">기간이 저장되면 즉시 사용자 페이지와 공유됩니다.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                                aria-label="설정 닫기"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 6l12 12M18 6l-12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-8 py-6">
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
                                            onChange={handleInputChange}
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
                                            onChange={handleInputChange}
                                            placeholder="https://forms.gle/..."
                                            className={inputBaseClass}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={sectionWrapperClass}>
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-xs font-bold tracking-[0.2em] text-gray-900 shadow">TIME</div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">운영 기간</p>
                                        <p className="text-xs text-gray-500">신청, 반납/연장 기간을 각각 입력하세요.</p>
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <p className={labelClass}>신청 시작</p>
                                        <input
                                            type="datetime-local"
                                            name="application_start"
                                            value={formData.application_start}
                                            onChange={handleInputChange}
                                            className={inputBaseClass}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className={labelClass}>신청 종료</p>
                                        <input
                                            type="datetime-local"
                                            name="application_end"
                                            value={formData.application_end}
                                            onChange={handleInputChange}
                                            className={inputBaseClass}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className={labelClass}>반납/연장 시작</p>
                                        <input
                                            type="datetime-local"
                                            name="return_extension_start"
                                            value={formData.return_extension_start}
                                            onChange={handleInputChange}
                                            className={inputBaseClass}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className={labelClass}>반납/연장 종료</p>
                                        <input
                                            type="datetime-local"
                                            name="return_extension_end"
                                            value={formData.return_extension_end}
                                            onChange={handleInputChange}
                                            className={inputBaseClass}
                                        />
                                    </div>
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
                                    onChange={handleInputChange}
                                    placeholder="예: 19, 35번 고장, 2024-1학기"
                                    className={`${inputBaseClass} min-h-[110px] resize-none`}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-8 py-5">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-white"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                disabled={isSubmitting}
                                className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 transition-all hover:bg-gray-800 disabled:opacity-50"
                            >
                                {isSubmitting ? '저장 중...' : '변경사항 저장'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
