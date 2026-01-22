import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Modal } from '../../common/Modal'
import { PhoneInput } from '../../common/PhoneInput'
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

    // 추가 질문 여부 확인 (detailActivity 기준)
    const hasAdditionalFields = detailActivity?.form_fields && detailActivity.form_fields.length > 0
    const isAnonymousType = activity.type === 'demand_survey' || activity.type === 'survey'
    const isNonMember = user?.verification_status !== 'approved' // 비회원 여부 확인

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // [중요] 1단계이고 추가 질문이 있다면, 어떤 이유로든 제출(Submit) 이벤트가 발생하면
        // 서버로 보내지 말고 '다음 단계'로 이동 처리 (엔터키 방지, 버튼 오작동 방지)
        if (step === 1 && hasAdditionalFields) {
            handleNext()
            return
        }

        // 1단계에서 이미 검증이 완료되었으므로 중복 검증 제거
        // (익명 타입은 제외)

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

    // 다음 단계로 이동 전 유효성 검사
    const handleNext = (e?: React.MouseEvent) => {
        // 버튼 클릭 등을 통한 기본 동작 차단
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (isAnonymousType) {
            // 익명 조사: 입력받는게 없으므로 유효성 검사 패스
        } else {
            // 비회원 약관 동의 검증 (익명이 아닌 경우에만)
            if (isNonMember && !nonMemberAgreed) {
                return toast.error('비회원 처리 규정에 동의해주세요.')
            }

            // 일반 행사 유효성 검사
            if (!formData.name) return toast.error('이름을 입력해주세요.')

            // 학번 검증
            if (!formData.student_id) {
                return toast.error('학번을 입력해주세요.')
            }
            if (formData.student_id.length !== 8) {
                return toast.error('학번 8자리를 정확히 입력해주세요.')
            }

            // 전화번호 검증
            if (!formData.phone) {
                return toast.error('연락처를 입력해주세요.')
            }
            if (formData.phone.length !== 11) {
                return toast.error('전화번호를 정확히 입력해주세요.')
            }

            if (activity.type === 'kakao_invite' && !formData.verification_image_url) {
                return toast.error('학적 인증자료를 제출해주세요.')
            }
        }

        setStep(2)
    }

    // 엔터키 처리 로직
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            // textarea에서는 줄바꿈 허용
            if ((e.target as HTMLElement).tagName === 'TEXTAREA') return

            e.preventDefault() // 기본 폼 제출 방지

            // 1단계이고 추가 질문이 있다면 다음 단계로
            if (step === 1 && hasAdditionalFields) {
                handleNext()
            }
            // 2단계(마지막 단계)에서는 엔터키로 제출 안됨 (버튼 클릭 강제)
            if (step === 2) {
                e.stopPropagation()
                e.preventDefault()
            }
        }
    }

    // Footer 버튼 렌더링
    const renderFooter = () => {
        if (fetching || !detailActivity) return null

        return (
            <div className="flex gap-3">
                {step === 1 ? (
                    <>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            취소
                        </button>
                        {hasAdditionalFields ? (
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
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            이전
                        </button>
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
                    </>
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
                    {/* Progress Indicators (Only if there are 2 steps) */}
                    {hasAdditionalFields && (
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`flex-1 h-2 rounded-full transition-colors ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                            <div className={`flex-1 h-2 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
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
                                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800">
                                    <p className="font-bold mb-1">{activity.title}</p>
                                    <p>{isAnonymousType
                                        ? '철저한 익명성이 보장됩니다. 다음 단계로 이동해주세요.'
                                        : '기본 정보를 입력해주세요.'}</p>
                                </div>

                                {!isAnonymousType && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                    placeholder="예: 25101234"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">학과</label>
                                                <input
                                                    type="text"
                                                    name="department"
                                                    value={formData.department}
                                                    onChange={handleChange}
                                                    readOnly
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
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
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">카카오톡 ID (선택사항)</label>
                                                    <input
                                                        type="text"
                                                        name="kakao_id"
                                                        value={formData.kakao_id}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                        placeholder="카카오톡 ID를 입력하세요"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                                        <label className="flex items-start gap-3 cursor-pointer p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={nonMemberAgreed}
                                                onChange={(e) => setNonMemberAgreed(e.target.checked)}
                                                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <div className="flex-1 text-sm">
                                                <p className="font-semibold text-gray-900 mb-1">
                                                    비회원 개인정보 수집 및 처리 규정에 동의합니다. <span className="text-red-500">*</span>
                                                </p>
                                                <p className="text-gray-600 text-xs">
                                                    학생회비 미납부자 및 비회원의 경우, 행사 참가를 위해 개인정보 수집 및 이용에 동의가 필요합니다.{' '}
                                                    <a
                                                        href="/non-member-policy"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 underline hover:text-blue-800 font-medium"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        규정 전문 보기
                                                    </a>
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 2 && hasAdditionalFields && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <div className="bg-purple-50 p-4 rounded-xl text-sm text-purple-800">
                                    <p className="font-bold mb-1">추가 정보</p>
                                    <p>활동에 필요한 추가 정보를 입력해주세요.</p>
                                </div>

                                <div className="space-y-4">
                                    {detailActivity?.form_fields?.map((field) => (
                                        <div key={field.name}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {field.label}
                                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                            </label>

                                            {field.type === 'select' ? (
                                                <div className="space-y-2">
                                                    {field.options?.map((opt) => (
                                                        <label key={opt} className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all">
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
                                                            <span className="text-sm font-medium text-gray-700 peer-checked:text-blue-700">{opt}</span>
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
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                                                />
                                            ) : field.type === 'radio' ? (
                                                <div className="space-y-2">
                                                    {field.options?.map((opt) => (
                                                        <label key={opt} className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all">
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
                                                            <span className="text-sm font-medium text-gray-700 peer-checked:text-blue-700">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : field.type === 'checkbox' ? (
                                                <div className="space-y-2">
                                                    {field.options?.map((opt) => (
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
                                                            <span className="text-sm text-gray-700">{opt}</span>
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
                                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
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
