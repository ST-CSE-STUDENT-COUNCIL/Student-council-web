import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, UserRoundPen } from 'lucide-react'
import { adminApi } from '../../lib/api/admin'

export const Route = createFileRoute('/admin/profile-updates')({
  component: AdminProfileUpdatesPage,
})

type UpdateField = 'name' | 'student_id'

type ProfileUpdateRequest = {
  id: string
  requestIds: Array<string>
  name: string
  studentId: string
  updates: Array<{ field: UpdateField; newValue: string }>
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
  verificationImageUrl: string
}

type RawProfileUpdateItem = {
  id?: string | number
  user_id?: string
  name?: string
  student_id?: string
  field_name?: string
  new_value?: string
  status?: string
  created_at?: string
  requested_at?: string
  verification_image_url?: string
}

function AdminProfileUpdatesPage() {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [requests, setRequests] = useState<ProfileUpdateRequest[]>([])
  const [allRequests, setAllRequests] = useState<ProfileUpdateRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const userLookupRef = useRef<Map<string, { name: string; student_id: string }> | null>(null)

  const buildRequests = (
    items: RawProfileUpdateItem[],
    userLookup: Map<string, { name: string; student_id: string }> = new Map()
  ) => {
    const groups = new Map<string, ProfileUpdateRequest>()

    items.forEach((item, index) => {
      const field: UpdateField = item.field_name === 'student_id' ? 'student_id' : 'name'
      const createdAt = item.created_at || item.requested_at || ''
      const fallbackUser = item.user_id ? userLookup.get(item.user_id) : undefined
      const groupKey = `${item.user_id ?? 'unknown'}-${normalizeDateKey(createdAt)}`

      const existing = groups.get(groupKey)
      const base = existing ?? {
        id: String(item.id ?? item.user_id ?? index),
        requestIds: [],
        name: item.name ?? fallbackUser?.name ?? '이름 미등록',
        studentId: item.student_id ?? fallbackUser?.student_id ?? '-',
        updates: [],
        requestedAt: createdAt ? formatDateTime(createdAt) : '-',
        status: normalizeStatus(item.status),
        verificationImageUrl: item.verification_image_url ?? '',
      }

      const requestId = item.id ? String(item.id) : undefined
      const nextRequestIds = requestId && !base.requestIds.includes(requestId)
        ? [...base.requestIds, requestId]
        : base.requestIds

      const updates = base.updates.some((u) => u.field === field)
        ? base.updates.map((u) => (u.field === field ? { field, newValue: item.new_value ?? '- ' } : u))
        : [...base.updates, { field, newValue: item.new_value ?? '- ' }]

      const nextStatus = mergeStatus(base.status, normalizeStatus(item.status))
      const nextRequestedAt = createdAt && base.requestedAt === '-'
        ? formatDateTime(createdAt)
        : base.requestedAt

      groups.set(groupKey, {
        ...base,
        requestIds: nextRequestIds,
        updates,
        status: nextStatus,
        requestedAt: nextRequestedAt,
        verificationImageUrl: base.verificationImageUrl || item.verification_image_url || '',
      })
    })

    return Array.from(groups.values())
  }

  useEffect(() => {
    let cancelled = false

    async function fetchRequests() {
      setLoading(true)
      setError(null)

      try {
        const data = await adminApi.getProfileUpdates({
          status_filter: statusFilter === 'all' ? null : statusFilter,
        })

        if (cancelled) return

        const payload =
          Array.isArray(data) ? data :
          Array.isArray((data as { items?: unknown })?.items) ? (data as { items: unknown[] }).items :
          Array.isArray((data as { requests?: unknown })?.requests) ? (data as { requests: unknown[] }).requests :
          []

        const allRawItems = payload as RawProfileUpdateItem[]

        const needsUserLookup = allRawItems.some((item) =>
          Boolean(item.user_id) && (!item.name || !item.student_id)
        )

        let userLookup = userLookupRef.current ?? new Map<string, { name: string; student_id: string }>()

        if (needsUserLookup && userLookupRef.current === null) {
          const usersData = await adminApi.getUsers()
          if (cancelled) return

          userLookup = new Map(
            (usersData.users || []).map((user) => [
              user.id,
              { name: user.name, student_id: user.student_id },
            ])
          )
          userLookupRef.current = userLookup
        }

        const mapped = buildRequests(allRawItems, userLookup)
        const filtered = statusFilter === 'all'
          ? mapped
          : mapped.filter((item) => item.status === statusFilter)

        setAllRequests((prev) => (
          statusFilter === 'all' || prev.length === 0 ? mapped : prev
        ))
        setRequests(filtered)
      } catch (err) {
        console.error('프로필 변경 요청 조회 실패:', err)
        if (!cancelled) {
          setError('요청 목록을 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRequests()

    return () => {
      cancelled = true
    }
  }, [statusFilter])

  async function handleApprove(requestId: string, requestIds: Array<string>) {
    if (actionLoadingId) return
    setActionLoadingId(requestId)

    try {
      const targets = requestIds.length > 0 ? requestIds : [requestId]
      await Promise.all(targets.map((id) => adminApi.approveProfileUpdate(id)))
      setRequests((prev) => prev.map((req) =>
        req.id === requestId ? { ...req, status: 'approved' } : req
      ))
      setAllRequests((prev) => prev.map((req) =>
        req.id === requestId ? { ...req, status: 'approved' } : req
      ))
    } catch (err) {
      console.error('프로필 변경 승인 실패:', err)
      setError('승인 처리에 실패했습니다.')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleReject(requestId: string, requestIds: Array<string>) {
    if (actionLoadingId) return
    const reason = window.prompt('반려 사유를 입력해주세요.')
    if (!reason || reason.trim().length === 0) return

    setActionLoadingId(requestId)

    try {
      const targets = requestIds.length > 0 ? requestIds : [requestId]
      await Promise.all(targets.map((id) => adminApi.rejectProfileUpdate(id, reason.trim())))
      setRequests((prev) => prev.map((req) =>
        req.id === requestId ? { ...req, status: 'rejected' } : req
      ))
      setAllRequests((prev) => prev.map((req) =>
        req.id === requestId ? { ...req, status: 'rejected' } : req
      ))
    } catch (err) {
      console.error('프로필 변경 반려 실패:', err)
      setError('반려 처리에 실패했습니다.')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-900 font-sans">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <UserRoundPen size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">프로필 변경 요청</h1>
              <p className="text-gray-500 mt-1">이름/학번 변경 요청을 검토하고 처리합니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
            <ShieldCheck size={16} className="text-blue-500" />
            학적인증 이미지 확인 필수
          </div>
        </header>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 px-6 py-4 border-b border-gray-100 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">요청 목록</h2>
              <p className="text-sm text-gray-500">최근 요청부터 표시됩니다.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${statusFilter === status
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {status === 'all' ? '전체' : status === 'pending' ? '대기' : status === 'approved' ? '승인' : '반려'}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {loading && (
              <div className="px-6 py-10 text-center text-sm text-gray-500">요청 목록을 불러오는 중입니다...</div>
            )}
            {error && !loading && (
              <div className="px-6 py-10 text-center text-sm text-rose-500">{error}</div>
            )}
            {!loading && !error && requests.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500">표시할 요청이 없습니다.</div>
            )}
            {!loading && !error && requests.map((req) => (
              <div key={req.id} className="px-6 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-lg">🧑‍🎓</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{req.name}</h3>
                      <StatusPill status={req.status} />
                    </div>
                    <p className="text-sm text-gray-500">학번: {req.studentId}</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      {req.updates.map((update) => (
                        <p key={update.field}>
                          변경 요청: <span className="font-medium text-gray-900">{update.field === 'name' ? '이름' : '학번'}</span> →{' '}
                          <span className="font-medium text-blue-600">{update.newValue}</span>
                        </p>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">요청일: {req.requestedAt}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                    onClick={() => setPreviewImageUrl(req.verificationImageUrl)}
                    disabled={!req.verificationImageUrl}
                  >
                    인증 이미지 보기
                  </button>
                  <button
                    type="button"
                    disabled={req.status !== 'pending' || actionLoadingId === req.id}
                          onClick={() => handleApprove(req.id, req.requestIds)}
                    className={`px-3 py-2 text-sm font-medium text-white rounded-lg ${req.status !== 'pending' || actionLoadingId === req.id
                      ? 'bg-emerald-500/60 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                      }`}
                  >
                    {actionLoadingId === req.id ? '처리 중...' : '승인'}
                  </button>
                  <button
                    type="button"
                    disabled={req.status !== 'pending' || actionLoadingId === req.id}
                          onClick={() => handleReject(req.id, req.requestIds)}
                    className={`px-3 py-2 text-sm font-medium text-white rounded-lg ${req.status !== 'pending' || actionLoadingId === req.id
                      ? 'bg-rose-500/60 cursor-not-allowed'
                      : 'bg-rose-500 hover:bg-rose-600'
                      }`}
                  >
                    {actionLoadingId === req.id ? '처리 중...' : '반려'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPreviewImageUrl(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">학적인증 이미지</h3>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                닫기
              </button>
            </div>
            <div className="bg-gray-50 p-6">
              <img src={previewImageUrl} alt="학적인증 이미지" className="w-full max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type StatusPillProps = {
  status: 'pending' | 'approved' | 'rejected'
}

function StatusPill({ status }: StatusPillProps) {
  const config = {
    pending: { label: '대기', bg: 'bg-amber-100', text: 'text-amber-700' },
    approved: { label: '승인', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    rejected: { label: '반려', bg: 'bg-rose-100', text: 'text-rose-700' },
  }

  const { label, bg, text } = config[status]

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      {label}
    </span>
  )
}

function normalizeStatus(status?: string | null): 'pending' | 'approved' | 'rejected' {
  const normalized = (status ?? '').toLowerCase().trim()
  if (normalized === 'approved' || normalized === 'approve') return 'approved'
  if (normalized === 'rejected' || normalized === 'reject' || normalized === 'denied') return 'rejected'
  if (normalized === 'pending' || normalized === 'submitted') return 'pending'
  return 'pending'
}

function mergeStatus(
  current: 'pending' | 'approved' | 'rejected',
  incoming: 'pending' | 'approved' | 'rejected'
): 'pending' | 'approved' | 'rejected' {
  if (current === 'rejected' || incoming === 'rejected') return 'rejected'
  if (current === 'pending' || incoming === 'pending') return 'pending'
  return 'approved'
}

function normalizeDateKey(date: string) {
  if (!date) return 'no-date'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  const hour = String(parsed.getHours()).padStart(2, '0')
  const minute = String(parsed.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function formatDateTime(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}
