import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CalendarClock, CheckCircle2, ClipboardList, Search, Users, XCircle } from 'lucide-react'
import { SEO } from '../../components/common/SEO'
import { activityAdminApi, activityApi } from '../../lib/api/activities'
import { adminApi } from '../../lib/api/admin'
import type { ActivityListItem, ActivityRegistrationResponse } from '../../types/activities'
import QRCode from 'qrcode'

type AttendanceStatus = 'attended' | 'absent'

type Registration = {
    registration_id: number
    user_name: string
    student_id: string
    phone: string
    registered_at: string
    attended: AttendanceStatus
    attended_at?: string
}

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

export const Route = createFileRoute('/admin/attendance')({
    component: AdminAttendancePage,
})

function AdminAttendancePage() {
    const [activities, setActivities] = useState<ActivityListItem[]>([])
    const [activityId, setActivityId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all')
    const [selectedRegistrationId, setSelectedRegistrationId] = useState<number | null>(null)
    const [registrations, setRegistrations] = useState<Registration[]>([])
    const [summary, setSummary] = useState({ total: 0, attended: 0, absent: 0, rate: 0 })
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

            if (registrationsResult.status === 'fulfilled') {
                console.log('Attendance registrations payload:', registrationsResult.value.registrations)
            }

            const mapped: Registration[] = attendanceData.registrations.map((item) => {
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="총 신청" value={stats.total} icon={<Users size={18} />} accent="from-slate-600 to-slate-700" />
                <StatCard label="출석" value={stats.attended} icon={<CheckCircle2 size={18} />} accent="from-emerald-500 to-emerald-600" />
                <StatCard label="미출석" value={stats.absent} icon={<XCircle size={18} />} accent="from-rose-500 to-rose-600" />
                <StatCard label="출석률" value={`${stats.rate}%`} icon={<ClipboardList size={18} />} accent="from-indigo-500 to-indigo-600" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,0.9fr)] gap-6">
                <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="학번, 이름, 연락처 검색"
                                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            {['all', 'attended', 'absent'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status as 'all' | AttendanceStatus)}
                                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${statusFilter === status
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {status === 'all' ? '전체' : status === 'attended' ? '출석' : '미출석'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">이름</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">학번</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">연락처</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">신청 시각</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">출석</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">출석 시각</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingAttendance ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                            출석 현황을 불러오는 중입니다...
                                        </td>
                                    </tr>
                                ) : filteredRegistrations.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                                            조건에 맞는 신청자가 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRegistrations.map((item) => (
                                        <tr
                                            key={item.registration_id}
                                            className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedRegistration?.registration_id === item.registration_id ? 'bg-emerald-50' : ''}`}
                                            onClick={() => setSelectedRegistrationId(item.registration_id)}
                                        >
                                            <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{item.user_name}</td>
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap tabular-nums">{item.student_id}</td>
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap tabular-nums">{item.phone}</td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap tabular-nums">{item.registered_at}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${item.attended === 'attended'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                    {item.attended === 'attended' ? '출석' : '미출석'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap tabular-nums">{item.attended_at ?? '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {item.attended === 'attended' ? (
                                                    <button
                                                        type="button"
                                                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 whitespace-nowrap"
                                                        disabled={cancellingId === item.registration_id}
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            handleCancelAttendance(item.registration_id)
                                                        }}
                                                    >
                                                        {cancellingId === item.registration_id ? '취소 중...' : '출석 취소'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 whitespace-nowrap"
                                                        disabled={markingId === item.registration_id}
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            handleMarkAttendance(item.registration_id)
                                                        }}
                                                    >
                                                        {markingId === item.registration_id ? '처리 중...' : '출석 처리'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <aside className="space-y-4 xl:max-w-[360px]">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">출석 체크 QR</p>
                                <p className="text-xs text-gray-500">학생이 QR을 스캔하면 출석 페이지로 이동합니다.</p>
                            </div>
                            <div className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">공개</div>
                        </div>
                        <div className="mt-4 flex flex-col items-center gap-3">
                            {qrDataUrl ? (
                                <img
                                    src={qrDataUrl}
                                    alt="출석 체크 QR"
                                    className="w-44 h-44 border border-gray-100 rounded-xl"
                                />
                            ) : (
                                <div className="w-44 h-44 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-400">
                                    {qrError ?? 'QR 생성 대기'}
                                </div>
                            )}
                            <div className="w-full rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600 break-all text-center">
                                {qrUrl || '행사를 선택해주세요'}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                        <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                            <CheckCircle2 size={18} />
                            선택한 신청자
                        </div>
                        {selectedRegistration ? (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500">이름</p>
                                    <p className="text-lg font-semibold text-gray-900">{selectedRegistration.user_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">학번</p>
                                    <p className="font-semibold text-gray-700">{selectedRegistration.student_id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">연락처</p>
                                    <p className="font-semibold text-gray-700">{selectedRegistration.phone}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">신청 시각</p>
                                    <p className="font-semibold text-gray-700">{selectedRegistration.registered_at}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">출석 상태</p>
                                    <p className="font-semibold text-gray-700">
                                        {selectedRegistration.attended === 'attended' ? '출석 완료' : '미출석'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">출석 시각</p>
                                    <p className="font-semibold text-gray-700">{selectedRegistration.attended_at ?? '-'}</p>
                                </div>
                                {selectedRegistration.attended === 'attended' ? (
                                    <button
                                        type="button"
                                        className="w-full mt-2 rounded-xl bg-rose-500 text-white py-2.5 font-semibold shadow-md shadow-rose-200 disabled:opacity-40"
                                        disabled={cancellingId === selectedRegistration.registration_id}
                                        onClick={() => handleCancelAttendance(selectedRegistration.registration_id)}
                                    >
                                        {cancellingId === selectedRegistration.registration_id ? '취소 중...' : '출석 취소'}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="w-full mt-2 rounded-xl bg-emerald-600 text-white py-2.5 font-semibold shadow-md shadow-emerald-200 disabled:opacity-40"
                                        disabled={markingId === selectedRegistration.registration_id}
                                        onClick={() => handleMarkAttendance(selectedRegistration.registration_id)}
                                    >
                                        {markingId === selectedRegistration.registration_id ? '처리 중...' : '출석 처리'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-gray-400">선택된 신청자가 없습니다.</p>
                        )}
                    </div>
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

function StatCard({
    label,
    value,
    icon,
    accent,
}: {
    label: string
    value: number | string
    icon: ReactNode
    accent: string
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500 font-semibold">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center`}
                >
                    {icon}
                </div>
            </div>
        </div>
    )
}
