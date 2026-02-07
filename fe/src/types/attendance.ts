export type AttendanceStatus = 'attended' | 'absent'

export type AttendanceRegistration = {
    registration_id: number
    user_name: string
    student_id: string
    phone: string
    registered_at: string
    attended: AttendanceStatus
    attended_at?: string
}

export type AttendanceSummary = {
    total: number
    attended: number
    absent: number
    rate: number
}
