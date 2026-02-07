import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarClock, ClipboardList } from 'lucide-react'
import { SEO } from '../../../../components/common/SEO'
import { AttendanceStats } from '../../../../components/admin/attendance/AttendanceStats'
import { AttendanceTable } from '../../../../components/admin/attendance/AttendanceTable'
import { AttendanceQrCard } from '../../../../components/admin/attendance/AttendanceQrCard'
import { SelectedRegistrationCard } from '../../../../components/admin/attendance/SelectedRegistrationCard'
import { activityAdminApi, activityApi } from '../../../../lib/api/activities'
import { adminApi } from '../../../../lib/api/admin'
import type { ActivityListItem, ActivityRegistrationResponse } from '../../../../types/activities'
import type { AttendanceRegistration, AttendanceStatus, AttendanceSummary } from '../../../../types/attendance'
import QRCode from 'qrcode'

type ActivitySummary = {
    id: number
    title: string
    date: string
}

type AttendanceRegistrationResponse = {
    registration_id: number
    user_id?: string
    user_name?: string
    student_id?: string
    phone?: string
    registered_at?: string
    attended?: boolean
    attended_at?: string | null
}

type AttendanceResponse = {
    activity_id: number
    activity_title: string
    total_registrations: number
    attended_count: number
    attendance_rate: number
    registrations: AttendanceRegistrationResponse[]
}

type RegistrationMeta = {
    name?: string
    student_id?: string
    phone?: string
}

export const Route = createFileRoute('/admin/(service)/attendance/')({
    component: AdminAttendancePage,
})

function AdminAttendancePage() {
    const [activities, setActivities] = useState<ActivityListItem[]>([])
    const [activityId, setActivityId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all')
    const [selectedRegistrationId, setSelectedRegistrationId] = useState<number | null>(null)
    const [registrations, setRegistrations] = useState<AttendanceRegistration[]>([])
    const [summary, setSummary] = useState<AttendanceSummary>({ total: 0, attended: 0, absent: 0, rate: 0 })
    const [loadingActivities, setLoadingActivities] = useState(false)
    const [loadingAttendance, setLoadingAttendance] = useState(false)
    const [activityError, setActivityError] = useState<string | null>(null)
    const [attendanceError, setAttendanceError] = useState<string | null>(null)
    const [cancellingId, setCancellingId] = useState<number | null>(null)
    const [markingId, setMarkingId] = useState<number | null>(null)
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const [qrError, setQrError] = useState<string | null>(null)

    const activityOptions = useMemo<ActivitySummary[]>(() => {
        return activities.map((item) => ({
            id: item.id,
            title: item.title,
            date: formatDateTime(item.registration_start ?? item.registration_end),
        }))
    }, [activities])

    const filteredRegistrations = useMemo(() => {
        const term = searchQuery.trim().toLowerCase()
        return registrations.filter((item) => {
            const matchesTerm = !term || [item.user_name, item.student_id, item.phone]
                .some((value) => value.toLowerCase().includes(term))
            const matchesStatus = statusFilter === 'all' || item.attended === statusFilter
            return matchesTerm && matchesStatus
        })
    }, [registrations, searchQuery, statusFilter])

    const selectedRegistration = useMemo(() => {
        if (!selectedRegistrationId && filteredRegistrations.length > 0) {
            return filteredRegistrations[0]
        }
        return filteredRegistrations.find((item) => item.registration_id === selectedRegistrationId) ?? null
    }, [filteredRegistrations, selectedRegistrationId])

    const stats = useMemo(() => summary, [summary])

    const activity = activityOptions.find((item) => item.id === activityId)

    const qrUrl = useMemo(() => {
        if (!activityId) return ''
        if (typeof window === 'undefined') return ''
        return `${window.location.origin}/attendance/${activityId}`
    }, [activityId])

    useEffect(() => {
        const buildQr = async () => {
            if (!qrUrl) {
                setQrDataUrl(null)
                return
            }
            try {
                setQrError(null)
                const dataUrl = await QRCode.toDataURL(qrUrl, { width: 220, margin: 1 })
                setQrDataUrl(dataUrl)
            } catch (error) {
                console.error('Failed to generate QR code', error)
                setQrError('QR 코드 생성에 실패했습니다.')
                setQrDataUrl(null)
            }
        }

        buildQr()
    }, [qrUrl])

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                setLoadingActivities(true)
                setActivityError(null)
                const response = await activityApi.getAll({ is_active_only: false, page: 1, page_size: 100 })
                const eventActivities = response.activities.filter((activity) => activity.type === 'event')
                setActivities(eventActivities)
                if (eventActivities.length > 0) {
                    setActivityId((prev) => prev ?? eventActivities[0].id)
                } else {
                    setActivityId(null)
                }
            } catch (error) {
                console.error('Failed to fetch activities for attendance', error)
                setActivityError('행사 목록을 불러오지 못했습니다.')
            } finally {
                setLoadingActivities(false)
            }
        }

        fetchActivities()
    }, [])

    const buildRegistrationMeta = useCallback((items: ActivityRegistrationResponse[]) => {
        return items.reduce<Record<number, RegistrationMeta>>((acc, item) => {
            acc[item.id] = {
                name: item.name ?? undefined,
                student_id: item.student_id ?? undefined,
                phone: item.phone ?? undefined,
            }
            return acc
        }, {})
    }, [])

    const loadAttendance = useCallback(async (targetId: number) => {
        try {
            setLoadingAttendance(true)
            setAttendanceError(null)

            const [attendanceResult, registrationsResult] = await Promise.allSettled([
                adminApi.getActivityAttendance(targetId) as Promise<AttendanceResponse>,
                activityAdminApi.getRegistrations(targetId, { page: 1, page_size: 200 }),
            ])

            if (attendanceResult.status !== 'fulfilled') {
                throw attendanceResult.reason
            }

            const attendanceData = attendanceResult.value
            const registrationMeta = registrationsResult.status === 'fulfilled'
                ? buildRegistrationMeta(registrationsResult.value.registrations)
                : {}

            const mapped: AttendanceRegistration[] = attendanceData.registrations.map((item) => {
                const meta = registrationMeta[item.registration_id]
                return {
                    registration_id: item.registration_id,
                    user_name: pickValue(item.user_name, meta?.name),
                    student_id: pickValue(item.student_id, meta?.student_id),
                    phone: formatPhoneNumber(pickValue(item.phone, meta?.phone)),
                    registered_at: formatDateTime(item.registered_at),
                    attended: item.attended ? 'attended' : 'absent',
                    attended_at: item.attended_at ? formatDateTime(item.attended_at) : undefined,
                }
            })

            setRegistrations(mapped)
            const total = Number(attendanceData.total_registrations) || 0
            const attended = Number(attendanceData.attended_count) || 0
            const absent = Math.max(total - attended, 0)
            const rate = Number.isFinite(Number(attendanceData.attendance_rate))
                ? Number(attendanceData.attendance_rate)
                : total > 0 ? Math.round((attended / total) * 100) : 0
            setSummary({ total, attended, absent, rate })
            setSelectedRegistrationId((prev) => {
                if (!prev) return mapped[0]?.registration_id ?? null
                return mapped.some((item) => item.registration_id === prev) ? prev : mapped[0]?.registration_id ?? null
            })
        } catch (error) {
            console.error('Failed to fetch attendance summary', error)
            setAttendanceError('출석 현황을 불러오지 못했습니다.')
            setRegistrations([])
            setSummary({ total: 0, attended: 0, absent: 0, rate: 0 })
        } finally {
            setLoadingAttendance(false)
        }
    }, [buildRegistrationMeta])

    useEffect(() => {
        if (activityId) {
            loadAttendance(activityId)
        } else {
            setRegistrations([])
            setSummary({ total: 0, attended: 0, absent: 0, rate: 0 })
        }
    }, [activityId, loadAttendance])

    const handleCancelAttendance = async (registrationId: number) => {
        if (!activityId) return
        try {
            setCancellingId(registrationId)
            await adminApi.cancelActivityAttendance(activityId, registrationId)
            await loadAttendance(activityId)
        } catch (error) {
            console.error('Failed to cancel attendance', error)
            setAttendanceError('출석 취소에 실패했습니다.')
        } finally {
            setCancellingId(null)
        }
    }

    const handleMarkAttendance = async (registrationId: number) => {
        if (!activityId) return
        try {
            setMarkingId(registrationId)
            await adminApi.markActivityAttendance(activityId, registrationId)
            await loadAttendance(activityId)
        } catch (error) {
            console.error('Failed to mark attendance', error)
            setAttendanceError('출석 처리에 실패했습니다.')
        } finally {
            setMarkingId(null)
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto text-gray-900">
            <SEO
                title="출석 관리"
                description="행사 출석을 확인하고 취소합니다"
                url="/admin/attendance"
            />

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <ClipboardList size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">출석 관리</h1>
                        <p className="text-gray-500 mt-0.5">행사 출석 현황을 확인하고 관리합니다</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <select
                        value={activityId ?? ''}
                        onChange={(event) => {
                            const nextValue = event.target.value
                            setActivityId(nextValue ? Number(nextValue) : null)
                            setSelectedRegistrationId(null)
                        }}
                        disabled={loadingActivities}
                        className="min-w-[220px] rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60"
                    >
                        {activityOptions.length === 0 ? (
                            <option value="">
                                {loadingActivities ? '행사 불러오는 중...' : '행사를 선택해주세요'}
                            </option>
                        ) : (
                            activityOptions.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title}
                                </option>
                            ))
                        )}
                    </select>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 shadow-sm">
                        <CalendarClock size={16} />
                        {activity?.date ?? '-'}
                    </div>
                </div>
            </div>

            {activityError && (
                <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {activityError}
                </div>
            )}

            {attendanceError && (
                <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {attendanceError}
                </div>
            )}

            <AttendanceStats stats={stats} />

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,0.9fr)] gap-6">
                <AttendanceTable
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                    rows={filteredRegistrations}
                    loading={loadingAttendance}
                    selectedRegistrationId={selectedRegistration?.registration_id ?? null}
                    markingId={markingId}
                    cancellingId={cancellingId}
                    onSearchQueryChange={setSearchQuery}
                    onStatusFilterChange={setStatusFilter}
                    onSelectRegistration={setSelectedRegistrationId}
                    onMarkAttendance={handleMarkAttendance}
                    onCancelAttendance={handleCancelAttendance}
                />

                <aside className="space-y-4 xl:max-w-[360px]">
                    <AttendanceQrCard qrDataUrl={qrDataUrl} qrError={qrError} qrUrl={qrUrl} />
                    <SelectedRegistrationCard
                        selectedRegistration={selectedRegistration}
                        cancellingId={cancellingId}
                        markingId={markingId}
                        onCancelAttendance={handleCancelAttendance}
                        onMarkAttendance={handleMarkAttendance}
                    />
                </aside>
            </div>
        </div>
    )
}

const formatDateTime = (value?: string | null) => {
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

const formatPhoneNumber = (value: string) => {
    if (!value || value === '-') return '-'
    const digits = value.replace(/\D/g, '')
    if (digits.length === 11) {
        return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
    }
    if (digits.length === 10) {
        return digits.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3')
    }
    return value
}

const normalizeText = (value?: string | null) => {
    if (!value) return undefined
    const trimmed = value.trim()
    if (!trimmed || trimmed === '-' || trimmed === '익명') return undefined
    if (trimmed.toLowerCase() === 'anonymous') return undefined
    return trimmed
}

const pickValue = (primary?: string | null, fallback?: string | null) => {
    return normalizeText(primary) ?? normalizeText(fallback) ?? '-'
}

