import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { SEO } from '../../../../components/common/SEO'
import { AttendanceCheckCard } from '../../../../components/activities/AttendanceCheckCard'
import { activityApi } from '../../../../lib/api/activities'

export const Route = createFileRoute('/_main/(service)/attendance/$activityId')({
    component: AttendancePage,
})

function AttendancePage() {
    const { activityId } = Route.useParams()
    const [studentId, setStudentId] = useState('')
    const [submittedMessage, setSubmittedMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const activityIdNumber = useMemo(() => Number(activityId), [activityId])

    const isSubmitted = Boolean(submittedMessage)
    const canSubmit = studentId.trim().length > 0 && !Number.isNaN(activityIdNumber) && !isSubmitted

    const handleSubmit = async () => {
        if (!canSubmit || isSubmitting) return
        try {
            setIsSubmitting(true)
            setErrorMessage(null)
            setSubmittedMessage(null)
            const response = await activityApi.attendByStudentId(activityIdNumber, {
                student_id: studentId.trim(),
            })
            setSubmittedMessage(response.message || '출석이 등록되었습니다.')
        } catch (error) {
            console.error('Attendance check failed', error)
            if (isAxiosError(error) && error.response?.status === 409) {
                setSubmittedMessage('이미 출석했습니다.')
                return
            }
            setErrorMessage('출석 등록에 실패했습니다. 학번을 확인해주세요.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
            <SEO
                title="행사 출석 체크"
                description="학생회 행사 출석 체크"
                url={`/attendance/${activityId}`}
            />
            <div className="min-h-screen flex items-center justify-center px-4">
                <AttendanceCheckCard
                    studentId={studentId}
                    isSubmitted={isSubmitted}
                    canSubmit={canSubmit}
                    isSubmitting={isSubmitting}
                    errorMessage={errorMessage}
                    submittedMessage={submittedMessage}
                    onStudentIdChange={(value: string) => {
                        setStudentId(value)
                        setSubmittedMessage(null)
                        setErrorMessage(null)
                    }}
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    )
}
