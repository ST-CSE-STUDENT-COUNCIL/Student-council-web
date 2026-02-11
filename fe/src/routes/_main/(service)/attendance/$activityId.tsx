import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { SEO } from '../../../../components/common/SEO'
import { AttendanceCheckCard } from '../../../../components/activities/AttendanceCheckCard'
import { activityApi } from '../../../../lib/api/activities'

export const Route = createFileRoute('/_main/(service)/attendance/$activityId')({
    component: AttendancePage,
})

const NOT_REGISTERED_MESSAGE = '신청 확인이 되지 않습니다. 학생회에게 문의 바랍니다.'

function AttendancePage() {
    const { activityId } = Route.useParams()
    const [studentId, setStudentId] = useState('')
    const [submittedMessage, setSubmittedMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [confirmUserName, setConfirmUserName] = useState<string | null>(null)
    const [confirmStudentId, setConfirmStudentId] = useState<string | null>(null)

    const activityIdNumber = useMemo(() => Number(activityId), [activityId])

    const isSubmitted = Boolean(submittedMessage)
    const canSubmit = studentId.trim().length > 0 && !Number.isNaN(activityIdNumber) && !isSubmitted

    const handleSubmit = async () => {
        if (!canSubmit || isSearching || isSubmitting) return
        try {
            setIsSearching(true)
            setErrorMessage(null)
            setSubmittedMessage(null)
            setIsConfirmOpen(false)
            setConfirmUserName(null)
            setConfirmStudentId(null)
            const response = await activityApi.searchAttendanceByStudentId(
                activityIdNumber,
                studentId.trim()
            )

            if (response.already_attended) {
                setSubmittedMessage('이미 출석했습니다.')
                return
            }

            setConfirmUserName(response.user_name)
            setConfirmStudentId(response.student_id)
            setIsConfirmOpen(true)
        } catch (error) {
            console.error('Attendance search failed', error)
            if (isAxiosError(error)) {
                const status = error.response?.status
                if (status === 404 || (typeof status === 'number' && status >= 500)) {
                    setErrorMessage(NOT_REGISTERED_MESSAGE)
                    return
                }
            }
            setErrorMessage('출석 확인에 실패했습니다. 잠시 후 다시 시도해주세요.')
        } finally {
            setIsSearching(false)
        }
    }

    const handleConfirm = async () => {
        if (!canSubmit || isSubmitting) return
        try {
            setIsSubmitting(true)
            setErrorMessage(null)
            setSubmittedMessage(null)
            const response = await activityApi.attendByStudentId(activityIdNumber, {
                student_id: studentId.trim(),
            })
            setSubmittedMessage(response.message || '출석이 등록되었습니다.')
            setIsConfirmOpen(false)
            setConfirmUserName(null)
            setConfirmStudentId(null)
        } catch (error) {
            console.error('Attendance check failed', error)
            if (isAxiosError(error) && error.response?.status === 409) {
                setSubmittedMessage('이미 출석했습니다.')
                return
            }
            if (isAxiosError(error)) {
                const status = error.response?.status
                if (status === 404 || (typeof status === 'number' && status >= 500)) {
                    setErrorMessage(NOT_REGISTERED_MESSAGE)
                    return
                }
            }
            setErrorMessage('출석 등록에 실패했습니다. 학번을 확인해주세요.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancelConfirm = () => {
        if (isSubmitting) return
        setIsConfirmOpen(false)
        setConfirmUserName(null)
        setConfirmStudentId(null)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
            <SEO
                title="행사 출석 체크"
                description="학생회 행사 출석체크. 학번을 입력하여 행사 출석을 등록하세요."
                url={`/attendance/${activityId}`}
                keywords="출석체크, 행사출석, 학생회행사, 참석인증"
                noindex={true}
            />
            <div className="min-h-screen flex items-center justify-center px-4">
                <AttendanceCheckCard
                    studentId={studentId}
                    isSubmitted={isSubmitted}
                    canSubmit={canSubmit}
                    isSearching={isSearching}
                    isSubmitting={isSubmitting}
                    errorMessage={errorMessage}
                    submittedMessage={submittedMessage}
                    isConfirmOpen={isConfirmOpen}
                    confirmUserName={confirmUserName}
                    confirmStudentId={confirmStudentId}
                    onStudentIdChange={(value: string) => {
                        setStudentId(value)
                        setSubmittedMessage(null)
                        setErrorMessage(null)
                        setIsConfirmOpen(false)
                        setConfirmUserName(null)
                        setConfirmStudentId(null)
                    }}
                    onSubmit={handleSubmit}
                    onConfirm={handleConfirm}
                    onCancelConfirm={handleCancelConfirm}
                />
            </div>
        </div>
    )
}
