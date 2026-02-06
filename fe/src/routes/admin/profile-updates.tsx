import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ShieldCheck, UserRoundPen } from 'lucide-react'
import { adminApi } from '../../lib/api/admin'
import { ProfileUpdateCard } from '../../components/admin/profile-updates/ProfileUpdateCard'
import { ProfileUpdatesFilter } from '../../components/admin/profile-updates/ProfileUpdatesFilter'
import type { ProfileUpdateRequest, StatusFilter, UpdateField } from '../../components/admin/profile-updates/types'

export const Route = createFileRoute('/admin/profile-updates')({
  component: AdminProfileUpdatesPage,
})

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
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

    const sortedItems = [...items].sort((a, b) => {
      const aTime = new Date(a.created_at || a.requested_at || 0).getTime()
      const bTime = new Date(b.created_at || b.requested_at || 0).getTime()
      return aTime - bTime
    })

    sortedItems.forEach((item, index) => {
      const field: UpdateField = item.field_name === 'student_id' ? 'student_id' : 'name'
      const requestedName = field === 'name' ? item.new_value : undefined
      const approvedCurrentName =
        field === 'name' && item.status === 'approved' ? item.current_value : undefined
      const createdAt = item.created_at || item.requested_at || ''
      const groupKey = `${item.user_id ?? 'unknown'}-${normalizeDateKey(createdAt)}`

      const existing = groups.get(groupKey)
      const base = existing ?? {
        id: String(item.id ?? item.user_id ?? index),
        requestIds: [],
        name: approvedCurrentName
          ?? item.users?.name
          ?? item.user?.name
          ?? item.name
          ?? item.user_name
          ?? (field === 'name' ? item.current_value : undefined)
          ?? requestedName
          ?? '이름 미등록',
        studentId: item.users?.student_id
          ?? item.user?.student_id
          ?? item.student_id
          ?? '-',
        updates: [],
        requestedAt: createdAt ? formatDateTime(createdAt) : '-',
        requestedAtRaw: createdAt,
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
      const nextRequestedAtRaw = createdAt && !base.requestedAtRaw
        ? createdAt
        : base.requestedAtRaw

      groups.set(groupKey, {
        ...base,
        requestIds: nextRequestIds,
        updates,
        status: nextStatus,
        requestedAt: nextRequestedAt,
        requestedAtRaw: nextRequestedAtRaw,
        verificationImageUrl: base.verificationImageUrl || item.verification_image_url || '',
      })
    })

    return Array.from(groups.values()).sort((a, b) => {
      const aTime = new Date(a.requestedAtRaw || 0).getTime()
      const bTime = new Date(b.requestedAtRaw || 0).getTime()
      return bTime - aTime
    })
  }

  useEffect(() => {
    setPage(1)
    setRequests([])
    setTotal(null)
  }, [statusFilter, pageSize])

  useEffect(() => {
    let cancelled = false

    async function fetchRequests() {
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
        if (statusFilter === 'approved') {
          console.log('승인 목록 응답:', data)
        }

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
            <ProfileUpdatesFilter
              statusFilter={statusFilter}
              onChange={setStatusFilter}
            />
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
              <ProfileUpdateCard
                key={req.id}
                request={req}
                statusFilter={statusFilter}
                actionLoadingId={actionLoadingId}
                previewLoading={previewLoading}
                onPreviewImage={handlePreviewImage}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
          {!error && (
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
  // Bucket requests within 2 minutes so multi-field updates show together.
  const bucketMs = 2 * 60 * 1000
  const bucketed = new Date(Math.floor(parsed.getTime() / bucketMs) * bucketMs)
  const year = bucketed.getFullYear()
  const month = String(bucketed.getMonth() + 1).padStart(2, '0')
  const day = String(bucketed.getDate()).padStart(2, '0')
  const hour = String(bucketed.getHours()).padStart(2, '0')
  const minute = String(bucketed.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function formatDateTime(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}
