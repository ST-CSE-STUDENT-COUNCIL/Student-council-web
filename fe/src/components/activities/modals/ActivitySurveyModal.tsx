import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Modal } from '../../common/Modal'
import type { Activity, ActivityListItem, SurveySubmitRequest } from '../../../types/activities'
import { activityApi } from '../../../lib/api/activities'
import { toast } from 'sonner'
import { Turnstile } from '../../common/Turnstile'
import { useAuthStore } from '../../../store/useAuthStore'

type ActivitySurveyModalProps = {
    isOpen: boolean
    onClose: () => void
    activity: Activity | ActivityListItem
    onSubmit: (data: any) => Promise<void>
}

export const ActivitySurveyModal = ({ isOpen, onClose, activity, onSubmit }: ActivitySurveyModalProps) => {
    const [surveyResponses, setSurveyResponses] = useState<Record<string, any>>({})
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuthStore()
    const isNonMember = user?.verification_status !== 'approved'
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

    const [userInfo, setUserInfo] = useState({
        name: user?.name || '',
        student_id: user?.student_id || '',
        department: user?.department || '',
        phone: user?.phone || '',
        email: user?.email || ''
    })

    // 모달이 열릴 때 초기화
    useState(() => {
        if (isOpen) {
            setStep(1)
            // user 정보가 늦게 로드될 경우를 대비
            if (user) {
                setUserInfo({
                    name: user.name || '',
                    student_id: user.student_id || '',
                    department: user.department || '',
                    phone: user.phone || '',
                    email: user.email || ''
                })
            }
        }
    })

    // 설문 질문 데이터 정규화 (form_fields 또는 config.questions 지원)
    const formFields = useMemo(() => {
        if ('form_fields' in activity && activity.form_fields && activity.form_fields.length > 0) {
            return activity.form_fields
        }

        // Survey 타입의 config.questions 구조 지원
        if ('config' in activity && activity.config?.questions) {
            return activity.config.questions.map((q: any) => ({
                name: String(q.id),
                label: q.question,
                type: q.type === 'multiple_choice' ? 'radio' : 'textarea',
                options: q.options,
                required: q.required,
                placeholder: q.type === 'text' ? '답변을 입력해주세요' : undefined
            }))
        }

        return []
    }, [activity])

    // 섹션별로 필드 그룹화
    const sections = useMemo(() => {
        if (!formFields || formFields.length === 0) return []

        const result: { title: string; fields: any[] }[] = []
        let currentSection: { title: string; fields: any[] } = {
            title: '설문조사',
            fields: []
        }

        // 섹터가 하나도 없으면 기본 섹션 하나에 다 넣음
        const hasSectionBreak = formFields.some((f: any) => f.type === 'section')
        if (!hasSectionBreak) {
            return [{ title: '설문조사', fields: formFields }]
        }

        formFields.forEach((field: any) => {
            if (field.type === 'section') {
                if (currentSection.fields.length > 0 || result.length > 0) {
                    result.push(currentSection)
                }
                currentSection = { title: field.label, fields: [] }
            } else {
                currentSection.fields.push(field)
            }
        })
        result.push(currentSection)
        return result
    }, [formFields])

    const totalSteps = sections.length > 0 ? sections.length : 1
    const currentSection = sections.length > 0 ? sections[step - 1] : { title: '', fields: [] }

    // 익명 여부 확인
    const isAnonymous = useMemo(() => {
        const config = (activity as any).config
        return config?.is_anonymous ?? true
    }, [activity])

    const validateStep = () => {
        // 기명 설문이고 비로그인 상태일 때 인적사항 체크 (첫 단계에서)
        if (step === 1 && !isAnonymous && !user) {
            if (!userInfo.name || !userInfo.student_id || !userInfo.department || !userInfo.phone) {
                toast.error('참여자 정보를 모두 입력해주세요.')
                return false
            }
        }

        // 필드가 없는 경우 (기본 텍스트 입력)
        if (formFields.length === 0) {
            return !!surveyResponses['feedback']
        }

        // 현재 섹션 필드 검사
        if (!currentSection) return true

        for (const field of currentSection.fields) {
            if (field.required) {
                const value = surveyResponses[field.name]
                if (!value || (Array.isArray(value) && value.length === 0)) {
                    toast.error(`${field.label} 항목을 입력해주세요.`)
                    return false
                }
            }
        }
        return true
    }

    const handleNext = () => {
        if (validateStep()) {
            setStep(prev => prev + 1)
        }
    }

    const handlePrev = () => {
        setStep(prev => prev - 1)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (step < totalSteps) {
            handleNext()
            return
        }

        if (!validateStep()) return

        // 캡차 검증 추가
        if (isNonMember && !user && !turnstileToken) {
            // 비로그인 상태일 때만 캡차 필수 (준회원은 캡차 생략 가능할 수 있으나 안전을 위해 isNonMember 체크 유지)
            if (isNonMember && !turnstileToken) {
                toast.error('보안 검증을 완료해주세요.')
                return
            }
        }

        setLoading(true)
        setError(null)

        try {
            // 제출 데이터 준비 (기명/익명 분기)
            // 기명이면 userInfo state 사용 (회원이면 readonly 값이, 비회원이면 입력값이 들어있음)
            const submitName = !isAnonymous ? userInfo.name : '익명'
            const submitStudentId = !isAnonymous ? userInfo.student_id : '00000000'
            const submitDepartment = !isAnonymous ? userInfo.department : '익명'
            const submitPhone = !isAnonymous ? userInfo.phone : '010-0000-0000'
            const submitEmail = !isAnonymous ? userInfo.email : 'anonymous@example.com'

            if (activity.type === 'demand_survey') {
                // 수요조사는 '신청(register)' API 사용 -> form_responses로 전송
                const data = {
                    name: submitName,
                    phone: submitPhone,
                    student_id: submitStudentId,
                    department: submitDepartment,
                    email: submitEmail,
                    form_responses: surveyResponses,
                    turnstile_token: turnstileToken || undefined
                }
                await activityApi.register(activity.id, data)
                // 상위 컴포넌트에는 통일된 형태로 전달
                await onSubmit({ survey_responses: surveyResponses })
            } else {
                // 설문조사는 '설문(submitSurvey)' API 사용 -> survey_responses로 전송
                const data: SurveySubmitRequest = {
                    name: submitName,
                    student_id: submitStudentId,
                    department: submitDepartment,
                    phone: submitPhone,
                    email: submitEmail,
                    survey_responses: surveyResponses,
                    turnstile_token: turnstileToken || undefined
                }
                await activityApi.submitSurvey(activity.id, data)
                await onSubmit(data)
            }

            onClose()
            toast.success('제출이 완료되었습니다.\n참여해주셔서 감사합니다.')
            setSurveyResponses({})
            setStep(1)
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || '제출 중 오류가 발생했습니다.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleResponseChange = (questionId: string | number, value: any) => {
        setSurveyResponses(prev => ({
            ...prev,
            [questionId]: value
        }))
    }

    const getTitle = () => {
        switch (activity.type) {
            case 'demand_survey':
                return '수요조사'
            case 'survey':
            default:
                return '설문조사'
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={getTitle()}
            footer={
                <div className="flex gap-3">
                    {step === 1 ? (
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            취소
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handlePrev}
                            className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
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
                            form="survey-form"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : '제출하기'}
                        </button>
                    )}
                </div>
            }
        >
            <form id="survey-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                {totalSteps > 1 && (
                    <div className="flex items-center gap-2 mb-2">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div key={i} className={`flex-1 h-2 rounded-full transition-colors ${step >= i + 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                )}

                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-2">
                    <p className="font-bold mb-1">{currentSection?.title || activity.title}</p>
                    <p>
                        여러분의 소중한 의견을 들려주세요.
                        <span className="block mt-1 font-semibold text-blue-900 opacity-80">
                            {isAnonymous
                                ? '(* 본 설문은 철저한 익명으로 진행됩니다)'
                                : '(* 본 설문은 기명으로 진행되며, 이름과 학번이 수집됩니다)'}
                        </span>
                    </p>
                </div>

                {/* 기명 설문일 경우 참여자 정보 표시/입력 (첫 단계) */}
                {!isAnonymous && step === 1 && (
                    <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50/50">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            참여자 정보
                            {user && <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">회원 정보 자동 입력됨</span>}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">이름</label>
                                <input
                                    type="text"
                                    value={userInfo.name}
                                    onChange={e => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                                    disabled={!!user}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                                    placeholder="이름"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">학번</label>
                                <input
                                    type="text"
                                    value={userInfo.student_id}
                                    onChange={e => setUserInfo(prev => ({ ...prev, student_id: e.target.value }))}
                                    disabled={!!user}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                                    placeholder="학번 (예: 20240001)"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">학과</label>
                                <input
                                    type="text"
                                    value={userInfo.department}
                                    onChange={e => setUserInfo(prev => ({ ...prev, department: e.target.value }))}
                                    disabled={!!user}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                                    placeholder="학과"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">전화번호</label>
                                <input
                                    type="tel"
                                    value={userInfo.phone}
                                    onChange={e => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                                    disabled={!!user}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all"
                                    placeholder="010-0000-0000"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 p-4 rounded-xl text-sm text-red-800">
                        {error}
                    </div>
                )}

                {/* 질문이 있는 경우 동적 렌더링 */}
                {formFields.length > 0 ? (
                    <div className="space-y-6">
                        {currentSection?.fields?.map((field: any, index: number) => (
                            <motion.div
                                key={field.name || index}
                                className="border-b border-gray-100 pb-4 last:border-0"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + (index * 0.08) }}
                            >
                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                    {/* 섹션 내 순서로 표시 */}
                                    {index + 1}. {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {field.help_text && (
                                    <p className="text-xs text-gray-500 mb-2">{field.help_text}</p>
                                )}

                                {field.type === 'radio' ? (
                                    <div className="space-y-2">
                                        {field.options?.map((option: string, optIndex: number) => (
                                            <motion.label
                                                key={option}
                                                className="flex items-center gap-2 cursor-pointer"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.15 + (index * 0.08) + (optIndex * 0.03) }}
                                                whileHover={{ x: 4 }}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`field_${field.name}`}
                                                    value={option}
                                                    checked={surveyResponses[field.name] === option}
                                                    onChange={(e) => handleResponseChange(field.name, e.target.value)}
                                                    required={field.required}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-sm text-gray-700">{option}</span>
                                            </motion.label>
                                        ))}
                                    </div>
                                ) : field.type === 'checkbox' ? (
                                    <div className="space-y-2">
                                        {field.options?.map((option: string, optIndex: number) => (
                                            <motion.label
                                                key={option}
                                                className="flex items-center gap-2 cursor-pointer"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.15 + (index * 0.08) + (optIndex * 0.03) }}
                                                whileHover={{ x: 4 }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={(surveyResponses[field.name] || []).includes(option)}
                                                    onChange={(e) => {
                                                        const current = surveyResponses[field.name] || []
                                                        if (e.target.checked) {
                                                            handleResponseChange(field.name, [...current, option])
                                                        } else {
                                                            handleResponseChange(field.name, current.filter((v: string) => v !== option))
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                                <span className="text-sm text-gray-700">{option}</span>
                                            </motion.label>
                                        ))}
                                    </div>
                                ) : field.type === 'select' ? (
                                    <motion.select
                                        value={surveyResponses[field.name] || ''}
                                        onChange={(e) => handleResponseChange(field.name, e.target.value)}
                                        required={field.required}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 + (index * 0.08) }}
                                    >
                                        <option value="">선택하세요</option>
                                        {field.options?.map((option: string) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </motion.select>
                                ) : field.type === 'textarea' ? (
                                    <motion.textarea
                                        value={surveyResponses[field.name] || ''}
                                        onChange={(e) => handleResponseChange(field.name, e.target.value)}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 + (index * 0.08) }}
                                    />
                                ) : field.type === 'number' ? (
                                    <motion.input
                                        type="number"
                                        value={surveyResponses[field.name] || ''}
                                        onChange={(e) => handleResponseChange(field.name, e.target.value)}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 + (index * 0.08) }}
                                    />
                                ) : field.type === 'date' ? (
                                    <motion.input
                                        type="date"
                                        value={surveyResponses[field.name] || ''}
                                        onChange={(e) => handleResponseChange(field.name, e.target.value)}
                                        required={field.required}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 + (index * 0.08) }}
                                    />
                                ) : (
                                    <motion.input
                                        type="text"
                                        value={surveyResponses[field.name] || ''}
                                        onChange={(e) => handleResponseChange(field.name, e.target.value)}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 + (index * 0.08) }}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    // 질문이 없는 경우 기본 텍스트 입력
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <label className="block text-sm font-medium text-gray-700 mb-1">의견 / 건의사항</label>
                        <textarea
                            value={surveyResponses['feedback'] || ''}
                            onChange={(e) => handleResponseChange('feedback', e.target.value)}
                            required
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="자유롭게 의견을 작성해주세요."
                        />
                    </motion.div>
                )}

                {/* 캡차 렌더링: 마지막 단계이고 비회원인 경우 */}
                {step === totalSteps && isNonMember && (
                    <div className="flex justify-center py-4">
                        <Turnstile
                            onVerify={(token) => setTurnstileToken(token)}
                            onExpire={() => setTurnstileToken(null)}
                        />
                    </div>
                )}
            </form>
        </Modal>
    )
}
