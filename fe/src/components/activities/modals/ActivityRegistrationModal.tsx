import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Modal } from '../../common/Modal'
import { PhoneInput } from '../../common/PhoneInput'
import { Turnstile } from '../../common/Turnstile'
import type { Activity, ActivityListItem, ActivityRegistrationRequest } from '../../../types/activities'
import { activityApi } from '../../../lib/api/activities'
import { useAuthStore } from '../../../store/useAuthStore'
import { LoadingSpinnerSmall } from '../../common/LoadingSpinner'

type ActivityRegistrationModalProps = {
    isOpen: boolean
    onClose: () => void
    activity: Activity | ActivityListItem
    onSubmit: (data: any) => Promise<void>
}

export const ActivityRegistrationModal = ({ isOpen, onClose, activity, onSubmit }: ActivityRegistrationModalProps) => {
    const { user } = useAuthStore()
    const [step, setStep] = useState(1)
    const [detailActivity, setDetailActivity] = useState<Activity | null>(null)
    const [fetching, setFetching] = useState(false)

    const [formData, setFormData] = useState<ActivityRegistrationRequest>({
        name: '',
        student_id: '',
        department: '컴퓨터공학과',
        phone: '',
        kakao_id: '',
        form_responses: {}
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [nonMemberAgreed, setNonMemberAgreed] = useState(false)
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

    // 모달이 열릴 때마다 초기화 및 상세 정보 가져오기
    useEffect(() => {
        if (isOpen) {
            // 1. 상태 초기화 (로그인된 사용자 정보로 자동 채우기 - 인증된 사용자만)
            const isVerified = user?.verification_status === 'approved'
            setStep(1)
            setFormData({
                name: isVerified ? (user?.name || '') : '',
                student_id: isVerified ? (user?.student_id || '') : '',
                department: user?.department || '컴퓨터공학과',
                phone: isVerified ? (user?.phone?.replace(/-/g, '') || '') : '',
                kakao_id: '',
                verification_image_url: '',
                form_responses: {}
            })
            setDetailActivity(null) // 로딩 상태 유도
            setError(null)
            setNonMemberAgreed(false) // 비회원 약관 동의 초기화
            setTurnstileToken(null) // Turnstile 토큰 초기화

            // 2. 상세 정보 가져오기 (무조건 새로고침)
            const fetchDetail = async () => {
                try {
                    setFetching(true)
                    const detail = await activityApi.getById(activity.id)

                    // Survey 타입의 경우 config.questions를 form_fields로 변환
                    if (activity.type === 'survey' && (!detail.form_fields || detail.form_fields.length === 0) && detail.config?.questions) {
                        detail.form_fields = detail.config.questions.map((q: any) => ({
                            name: String(q.id),
                            label: q.question,
                            type: q.type === 'multiple_choice' ? 'radio' : 'textarea',
                            options: q.options,
                            required: q.required,
                            placeholder: q.type === 'text' ? '답변을 입력해주세요' : undefined
                        }))
                    }

                    setDetailActivity(detail)
                } catch (err) {
                    console.error('Failed to fetch activity detail', err)
                    setError('활동 정보를 불러오는데 실패했습니다.')
                } finally {
                    setFetching(false)
                }
            }
            fetchDetail()
        }
    }, [isOpen, activity.id, user])

    // 추가 질문 여부 확인 (detailActivity 기준) - Removed
    // const hasAdditionalFields = detailActivity?.form_fields && detailActivity.form_fields.length > 0 --> logic moved below as sections check
    const isAnonymousType = activity.type === 'demand_survey' || activity.type === 'survey'
    const isNonMember = user?.verification_status !== 'approved' // 비회원 여부 확인

    // 섹션별로 필드 그룹화 (섹션 기능 복구됨)
    const sections = useMemo(() => {
        if (!detailActivity?.form_fields) return []

        const result: { title: string; fields: import('../../../types/activities').FormField[]; condition?: { target: string; value: string } }[] = []
        let currentSection: { title: string; fields: import('../../../types/activities').FormField[]; condition?: { target: string; value: string } } = {
            title: '추가 정보',
            fields: []
        }

        // 섹터가 하나도 없으면 기본 섹션 하나에 다 넣음
        const hasSectionBreak = detailActivity.form_fields.some(f => f.type === 'section')

        if (!hasSectionBreak) {
            if (detailActivity.form_fields.length > 0) {
                return [{ title: '추가 정보', fields: detailActivity.form_fields }]
            }
            return []
        }

        detailActivity.form_fields.forEach(field => {
            if (field.type === 'section') {
                // 이전 섹션이 있고 필드가 있거나, 첫 섹션이 아니면 저장
                if (currentSection.fields.length > 0 || result.length > 0) {
                    result.push(currentSection)
                }
                currentSection = { title: field.label, fields: [], condition: field.condition }
            } else {
                currentSection.fields.push(field)
            }
        })
        // 마지막 섹션 저장 (필드가 있거나 빈 섹션이라도)
        result.push(currentSection)

        return result
    }, [detailActivity?.form_fields])

    // 조건에 따라 보여줄 섹션 필터링
    const visibleSections = useMemo(() => {
        return sections.filter(section => {
            if (!section.condition) return true

            // target 필드의 응답값 확인
            const targetValue = formData.form_responses?.[section.condition.target]
            return targetValue === section.condition.value
        })
    }, [sections, formData.form_responses])

    const totalSteps = 1 + (visibleSections.length > 0 ? visibleSections.length : 0)
    const hasAdditionalFields = visibleSections.length > 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // 마지막 단계가 아니면 다음 단계로
        if (step < totalSteps) {
            handleNext()
            return
        }

        // 제출 전 유효성 검사 (현재 단계)
        if (!validateStep()) return

        setLoading(true)
        setError(null)

        try {
            // 수요조사일 경우 익명성을 위해 더미 데이터 사용
            const submissionData = isAnonymousType ? {
                ...formData,
                name: '익명',
                phone: '010-0000-0000',
                student_id: '00000000',
                department: '익명',
                email: 'anonymous@example.com', // API 필수값 충족용
            } : formData

            await activityApi.register(activity.id, submissionData)
            await onSubmit(submissionData)
            onClose()
            toast.success('신청이 완료되었습니다!')
            // Reset form
            setFormData({
                name: '',
                student_id: '',
                department: '컴퓨터공학과',
                phone: '',
                kakao_id: '',
                form_responses: {}
            })
            setStep(1)
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || '신청 처리 중 오류가 발생했습니다.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target

        // 학번 입력 필드: 숫자만 허용, 최대 8자리
        if (name === 'student_id') {
            const numbers = value.replace(/\D/g, '') // 숫자만 추출
            const limited = numbers.slice(0, 8) // 최대 8자리
            setFormData(prev => ({ ...prev, [name]: limited }))
            return
        }

        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const getTitle = () => {
        switch (activity.type) {
            case 'kakao_invite':
                return '카톡방 초대 신청'
            case 'demand_survey':
            case 'survey':
                return '설문/수요조사 참여'
            case 'event':
            default:
                return '행사 참여 신청'
        }
    }

    // 1단계 유효성 검사
    const validateStep1 = () => {
        // 비회원 Turnstile 검증 (모든 타입에서 비회원이면 검증)
        if (isNonMember && !turnstileToken) {
            toast.error('보안 검증을 완료해주세요.')
            return false
        }

        if (isAnonymousType) return true

        // 비회원 약관 동의 검증
        if (isNonMember && !nonMemberAgreed) {
            toast.error('비회원 처리 규정에 동의해주세요.')
            return false
        }

        if (!formData.name) {
            toast.error('이름을 입력해주세요.')
            return false
        }

        if (!formData.student_id) {
            toast.error('학번을 입력해주세요.')
            return false
        }
        if (formData.student_id.length !== 8) {
            toast.error('학번 8자리를 정확히 입력해주세요.')
            return false
        }

        if (!formData.phone) {
            toast.error('연락처를 입력해주세요.')
            return false
        }
        if (formData.phone.length !== 11) {
            toast.error('전화번호를 정확히 입력해주세요.')
            return false
        }

        if (activity.type === 'kakao_invite' && !formData.verification_image_url) {
            toast.error('학적 인증자료를 제출해주세요.')
            return false
        }

        return true
    }

    // 현재 단계 유효성 검사
    const validateStep = () => {
        if (step === 1) {
            return validateStep1()
        }

        const currentSectionInfo = visibleSections[step - 2]
        if (!currentSectionInfo) return true

        for (const field of currentSectionInfo.fields) {
            if (field.required) {
                const value = formData.form_responses?.[field.name]
                if (!value || (Array.isArray(value) && value.length === 0)) {
                    toast.error(`${field.label} 항목을 입력해주세요.`)
                    return false
                }
            }
        }
        return true
    }

    // 다음 단계로 이동
    const handleNext = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (!validateStep()) return

        if (step < totalSteps) {
            setStep(prev => prev + 1)
        }
    }

    // 이전 단계로 이동
    const handlePrev = () => {
        if (step > 1) {
            setStep(prev => prev - 1)
        }
    }

    // 엔터키 처리 로직
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            // textarea에서는 줄바꿈 허용
            if ((e.target as HTMLElement).tagName === 'TEXTAREA') return

            e.preventDefault() // 기본 폼 제출 방지

            // 마지막 단계가 아니면 다음 단계로
            if (step < totalSteps) {
                handleNext()
            }
        }
    }

    // Footer 버튼 렌더링
    const renderFooter = () => {
        if (fetching || !detailActivity) return null

        return (
            <div className="flex gap-3">
                {step === 1 ? (
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                    >
                        취소
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handlePrev}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                    >
                        이전
                    </button>
                )}

                {step < totalSteps ? (
                    <button
                        type="button"
                        onClick={handleNext}
                        className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        다음
                    </button>
                ) : (
                    <button
                        type="submit"
                        form="activity-registration-form"
                        disabled={loading}
                        className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : '신청하기'}
                    </button>
                )}
            </div>
        )
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} footer={renderFooter()}>
            {fetching || !detailActivity ? (
                <LoadingSpinnerSmall />
            ) : (
                <form id="activity-registration-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-4">
                    {/* Progress Indicators (Dynamic) */}
                    {hasAdditionalFields && (
                        <div className="flex items-center gap-2 mb-4">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div key={i} className={`flex-1 h-2 rounded-full transition-colors ${step >= i + 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 p-4 rounded-xl text-sm text-red-800">
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                {/* 신청 기간 정보 제거됨 */}

                                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-200">
                                    <p className="font-bold mb-1">{activity.title}</p>
                                    <p>{isAnonymousType
                                        ? '철저한 익명성이 보장됩니다. 다음 단계로 이동해주세요.'
                                        : '기본 정보를 입력해주세요.'}</p>
                                </div>

                                {!isAnonymousType && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이름</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                placeholder="이름을 입력하세요"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    {activity.type === 'kakao_invite' ? '학번 (없다면 생년월일)' : '학번'}
                                                </label>
                                                <input
                                                    type="text"
                                                    name="student_id"
                                                    value={formData.student_id}
                                                    onChange={handleChange}
                                                    maxLength={8}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-gray-500"
                                                    placeholder="예: 25101234"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">학과</label>
                                                <input
                                                    type="text"
                                                    name="department"
                                                    value={formData.department}
                                                    onChange={handleChange}
                                                    readOnly
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">연락처</label>
                                            <div className="pb-6">
                                                <PhoneInput
                                                    value={formData.phone || ''}
                                                    onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                                                    showValidation={true}
                                                />
                                            </div>
                                        </div>

                                        {activity.type === 'kakao_invite' && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">카카오톡 ID (선택사항)</label>
                                                    <input
                                                        type="text"
                                                        name="kakao_id"
                                                        value={formData.kakao_id}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-gray-500"
                                                        placeholder="카카오톡 ID를 입력하세요"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        학적 인증자료 제출 <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0]
                                                            if (!file) return
                                                            try {
                                                                const { presigned_url, public_url } = await activityApi.getPresignedUrl(activity.id, file.name)
                                                                await activityApi.uploadFile(presigned_url, file)
                                                                setFormData(prev => ({ ...prev, verification_image_url: public_url }))
                                                            } catch (err) {
                                                                console.error(err)
                                                                toast.error('파일 업로드에 실패했습니다.')
                                                            }
                                                        }}
                                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-900/50"
                                                    />
                                                    {formData.verification_image_url && (
                                                        <p className="text-xs text-green-600 mt-1 font-medium">✓ 인증 자료가 업로드되었습니다.</p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">학생증, 합격증 등 학적을 증명할 수 있는 자료를 첨부해주세요.</p>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}

                                {/* 비회원 약관 동의 (익명이 아니고, 비회원인 경우) */}
                                {!isAnonymousType && isNonMember && (
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <label className="flex items-start gap-3 cursor-pointer p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={nonMemberAgreed}
                                                onChange={(e) => setNonMemberAgreed(e.target.checked)}
                                                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500 dark:text-blue-500 dark:focus:ring-blue-400 dark:bg-slate-700 dark:border-slate-600"
                                            />
                                            <div className="flex-1 text-sm">
                                                <p className="font-semibold text-gray-900 mb-1 dark:text-gray-200">
                                                    비회원 개인정보 수집 및 처리 규정에 동의합니다. <span className="text-red-500">*</span>
                                                </p>
                                                <p className="text-gray-600 text-xs dark:text-gray-400">
                                                    학생회비 미납부자 및 비회원의 경우, 행사 참가를 위해 개인정보 수집 및 이용에 동의가 필요합니다.{' '}
                                                    <a
                                                        href="/non-member-policy"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 underline hover:text-blue-800 font-medium dark:text-blue-400 dark:hover:text-blue-300"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        규정 전문 보기
                                                    </a>
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {/* 비회원 Turnstile (비회원인 경우 항상 표시) */}
                                {isNonMember && (
                                    <div className="flex justify-center mt-4">
                                        <Turnstile
                                            onVerify={(token) => setTurnstileToken(token)}
                                            onExpire={() => setTurnstileToken(null)}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step > 1 && hasAdditionalFields && (
                            <motion.div
                                key={`step${step}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <div className="bg-purple-50 p-4 rounded-xl text-sm text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                                    <p className="font-bold mb-1">{visibleSections[step - 2]?.title || '추가 정보'}</p>
                                    <p>활동에 필요한 추가 정보를 입력해주세요.</p>
                                </div>

                                <div className="space-y-4">
                                    {visibleSections[step - 2]?.fields?.map((field: import('../../../types/activities').FormField) => (
                                        <div key={field.name}>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                {field.label}
                                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                            </label>

                                            {field.type === 'select' ? (
                                                <div className="space-y-2">
                                                    {field.options?.map((opt: string) => (
                                                        <label key={opt} className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-blue-500/50">
                                                            <div className="relative flex items-center justify-center w-5 h-5">
                                                                <input
                                                                    type="radio"
                                                                    name={`field_${field.name}`}
                                                                    value={opt}
                                                                    checked={formData.form_responses?.[field.name] === opt}
                                                                    onChange={(e) => setFormData(prev => ({
                                                                        ...prev,
                                                                        form_responses: { ...prev.form_responses, [field.name]: e.target.value }
                                                                    }))}
                                                                    required={field.required}
                                                                    className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-blue-500 checked:border-4 transition-all"
                                                                />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700 peer-checked:text-blue-700 dark:text-gray-300 dark:peer-checked:text-blue-400">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : field.type === 'textarea' ? (
                                                <textarea
                                                    value={formData.form_responses?.[field.name] || ''}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        form_responses: { ...prev.form_responses, [field.name]: e.target.value }
                                                    }))}
                                                    required={field.required}
                                                    placeholder={field.placeholder}
                                                    rows={3}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-gray-500"
                                                />
                                            ) : field.type === 'radio' ? (
                                                <div className="space-y-2">
                                                    {field.options?.map((opt: string) => (
                                                        <label key={opt} className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-blue-500/50">
                                                            <div className="relative flex items-center justify-center w-5 h-5">
                                                                <input
                                                                    type="radio"
                                                                    name={`field_${field.name}`}
                                                                    value={opt}
                                                                    checked={formData.form_responses?.[field.name] === opt}
                                                                    onChange={(e) => setFormData(prev => ({
                                                                        ...prev,
                                                                        form_responses: { ...prev.form_responses, [field.name]: e.target.value }
                                                                    }))}
                                                                    required={field.required}
                                                                    className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-blue-500 checked:border-4 transition-all"
                                                                />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700 peer-checked:text-blue-700 dark:text-gray-300 dark:peer-checked:text-blue-400">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : field.type === 'checkbox' ? (
                                                <div className="space-y-2">
                                                    {field.options?.map((opt: string) => (
                                                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={(formData.form_responses?.[field.name] || []).includes(opt)}
                                                                onChange={(e) => {
                                                                    const current = formData.form_responses?.[field.name] || []
                                                                    let updated;
                                                                    if (e.target.checked) {
                                                                        updated = [...current, opt]
                                                                    } else {
                                                                        updated = current.filter((v: string) => v !== opt)
                                                                    }
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        form_responses: { ...prev.form_responses, [field.name]: updated }
                                                                    }))
                                                                }}
                                                                className="text-blue-600 rounded focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : field.type === 'file' ? (
                                                <div className="space-y-2">
                                                    <input
                                                        type="file"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0]
                                                            if (!file) return

                                                            try {
                                                                // 간단한 로딩 표시를 위해 alert 사용 대신 UI 개선 가능하나 우선 기능 구현
                                                                const { presigned_url, public_url } = await activityApi.getPresignedUrl(activity.id, file.name)
                                                                await activityApi.uploadFile(presigned_url, file)

                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    form_responses: { ...prev.form_responses, [field.name]: public_url }
                                                                }))
                                                            } catch (err) {
                                                                console.error(err)
                                                                toast.error('파일 업로드에 실패했습니다.')
                                                            }
                                                        }}
                                                        required={field.required && !formData.form_responses?.[field.name]}
                                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-900/50"
                                                    />
                                                    {formData.form_responses?.[field.name] && (
                                                        <p className="text-xs text-green-600 font-medium">
                                                            ✓ 파일이 첨부되었습니다
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <input
                                                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                                    value={formData.form_responses?.[field.name] || ''}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        form_responses: { ...prev.form_responses, [field.name]: e.target.value }
                                                    }))}
                                                    required={field.required}
                                                    placeholder={field.placeholder}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder-gray-500"
                                                />
                                            )
                                            }
                                            {field.help_text && (
                                                <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            )}
        </Modal>
    )
}
