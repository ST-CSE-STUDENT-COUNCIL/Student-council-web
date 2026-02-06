import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
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
  updates: Array<{ field: UpdateField; newValue: string; currentValue: string }>
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
  verificationImageUrl: string
}

type RawProfileUpdateItem = {
  id?: string | number
  user_id?: string
  name?: string
  user_name?: string
  user?: {
    name?: string
    student_id?: string
  }
  users?: {
    name?: string
    student_id?: string
  }
  student_id?: string
  field_name?: string
  new_value?: string
  current_value?: string
  status?: string
  created_at?: string
  requested_at?: string
  verification_image_url?: string
}

function AdminProfileUpdatesPage() {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [requests, setRequests] = useState<ProfileUpdateRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState<number | null>(null)
  const [pageSize, setPageSize] = useState(20)

  const buildRequests = (items: RawProfileUpdateItem[]) => {
    const groups = new Map<string, ProfileUpdateRequest>()

    items.forEach((item, index) => {
      const field: UpdateField = item.field_name === 'student_id' ? 'student_id' : 'name'
      const createdAt = item.created_at || item.requested_at || ''
      const groupKey = `${item.user_id ?? 'unknown'}-${normalizeDateKey(createdAt)}`

      const existing = groups.get(groupKey)
      const base = existing ?? {
        id: String(item.id ?? item.user_id ?? index),
        requestIds: [],
        name: item.users?.name
          ?? item.user?.name
          ?? item.name
          ?? item.user_name
          ?? (field === 'name' ? item.current_value : undefined)
          ?? '이름 미등록',
        studentId: item.users?.student_id
          ?? item.user?.student_id
          ?? item.student_id
          ?? '-',
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
        ? base.updates.map((u) => (
          u.field === field
            ? { field, newValue: item.new_value ?? '- ', currentValue: item.current_value ?? '-' }
            : u
        ))
        : [...base.updates, { field, newValue: item.new_value ?? '- ', currentValue: item.current_value ?? '-' }]

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
    setPage(1)
    setRequests([])
    setTotal(null)
  }, [statusFilter, pageSize])

  useEffect(() => {
    let cancelled = false

    async function fetchRequests() {
      if (statusFilter === 'all') {
        setRequests([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = statusFilter === 'approved'
          ? await adminApi.getApprovedProfileUpdates({ page, page_size: pageSize })
          : statusFilter === 'rejected'
            ? await adminApi.getRejectedProfileUpdates({ page, page_size: pageSize })
            : await adminApi.getProfileUpdates({
              status_filter: 'pending',
              page,
              page_size: pageSize,
            })

        if (cancelled) return

        const payload =
          Array.isArray(data) ? data :
          Array.isArray((data as { items?: unknown })?.items) ? (data as { items: unknown[] }).items :
          Array.isArray((data as { requests?: unknown })?.requests) ? (data as { requests: unknown[] }).requests :
          []

        const rawTotal = (data as { total?: number | string })?.total
        const nextTotal = typeof rawTotal === 'string' ? Number.parseInt(rawTotal, 10) : rawTotal
        const allRawItems = payload as RawProfileUpdateItem[]
        const mapped = buildRequests(allRawItems)

        setTotal(Number.isFinite(nextTotal) ? (nextTotal as number) : null)
        setRequests(mapped)
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
  }, [statusFilter, page, pageSize])

  async function handlePreviewImage(verificationImageUrl: string) {
    if (!verificationImageUrl || previewLoading) return
    setPreviewLoading(true)
    try {
      const { signed_url } = await adminApi.getStorageSignedUrl(verificationImageUrl)
      setPreviewImageUrl(signed_url || verificationImageUrl)
    } catch (err) {
      console.error('학적인증 이미지 조회 실패:', err)
      setPreviewImageUrl(verificationImageUrl)
    } finally {
      setPreviewLoading(false)
    }
  }

  async function handleApprove(requestId: string, requestIds: Array<string>) {
    if (actionLoadingId) return
    setActionLoadingId(requestId)

    try {
      const targets = requestIds.length > 0 ? requestIds : [requestId]
      await Promise.all(targets.map((id) => adminApi.approveProfileUpdate(id)))
      setRequests((prev) => prev.map((req) =>
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
    } catch (err) {
      console.error('프로필 변경 반려 실패:', err)
      setError('반려 처리에 실패했습니다.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const totalPages = total !== null ? Math.max(1, Math.ceil(total / pageSize)) : null

  function handlePageChange(nextPage: number) {
    if (loading) return
    if (totalPages !== null && (nextPage < 1 || nextPage > totalPages)) return
    setPage(nextPage)
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
              <div
                key={req.id}
                className={`px-6 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${getRequestCardClass(req.status)}`}
              >
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
                          변경 요청: <span className="font-medium text-gray-900">{update.field === 'name' ? '이름' : '학번'}</span>{' '}
                          <span className="font-medium text-gray-500">{update.currentValue}</span> →{' '}
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
                    onClick={() => handlePreviewImage(req.verificationImageUrl)}
                    disabled={!req.verificationImageUrl || previewLoading}
                  >
                    {previewLoading ? '불러오는 중...' : '인증 이미지 보기'}
                  </button>
                  {statusFilter === 'pending' && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {statusFilter !== 'all' && !error && (
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-500">
                표시 {requests.length}건{total !== null ? ` · 전체 ${total}건` : ''}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-600"
                >
                  {[10, 20, 50].map((size) => (
                    <option key={size} value={size}>{size}개씩</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={loading || page <= 1}
                  className={`px-3 py-2 border rounded-lg ${page <= 1 || loading
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  이전
                </button>
                <span className="text-gray-500">
                  {totalPages ? `${page} / ${totalPages}` : '-'}
                </span>
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={loading || (totalPages !== null && page >= totalPages)}
                  className={`px-3 py-2 border rounded-lg ${loading || (totalPages !== null && page >= totalPages)
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  다음
                </button>
              </div>
            </div>
          )}
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

function getRequestCardClass(status: 'pending' | 'approved' | 'rejected') {
  if (status === 'approved') {
    return 'bg-emerald-50/40'
  }
  if (status === 'rejected') {
    return 'bg-rose-50/50 border-l-4 border-rose-200'
  }
  return 'bg-white'
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
