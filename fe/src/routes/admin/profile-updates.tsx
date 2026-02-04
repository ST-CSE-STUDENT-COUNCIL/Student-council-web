import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { FileCheck2, Image as ImageIcon, ShieldCheck, UserRoundPen } from 'lucide-react'
import { adminApi } from '../../lib/api/admin'

export const Route = createFileRoute('/admin/profile-updates')({
  component: AdminProfileUpdatesPage,
})

type UpdateField = 'name' | 'student_id'

type ProfileUpdateRequest = {
  id: string
  name: string
  studentId: string
  field: UpdateField
  newValue: string
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

        const mapped = (payload as RawProfileUpdateItem[]).map((item, index) => {
          const field: UpdateField = item.field_name === 'student_id' ? 'student_id' : 'name'
          const createdAt = item.created_at || item.requested_at || ''

          return {
            id: String(item.id ?? item.user_id ?? index),
            name: item.name ?? '이름 미등록',
            studentId: item.student_id ?? '-',
            field,
            newValue: item.new_value ?? '- ',
            requestedAt: createdAt ? formatDateTime(createdAt) : '-',
            status: normalizeStatus(item.status),
            verificationImageUrl: item.verification_image_url ?? '',
          }
        })

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
  }, [statusFilter])

  const pendingCount = requests.filter((req) => req.status === 'pending').length
  const approvedCount = requests.filter((req) => req.status === 'approved').length
  const rejectedCount = requests.filter((req) => req.status === 'rejected').length

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

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="승인 대기" value={pendingCount} tone="blue" icon={FileCheck2} />
          <StatCard title="승인 완료" value={approvedCount} tone="emerald" icon={ShieldCheck} />
          <StatCard title="반려됨" value={rejectedCount} tone="rose" icon={ImageIcon} />
        </section>

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
                    <p className="text-sm text-gray-600">
                      변경 요청: <span className="font-medium text-gray-900">{req.field === 'name' ? '이름' : '학번'}</span> →{' '}
                      <span className="font-medium text-blue-600">{req.newValue}</span>
                    </p>
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
                    disabled
                    className="px-3 py-2 text-sm font-medium text-white bg-emerald-500/60 rounded-lg cursor-not-allowed"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    disabled
                    className="px-3 py-2 text-sm font-medium text-white bg-rose-500/60 rounded-lg cursor-not-allowed"
                  >
                    반려
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

type StatCardProps = {
  title: string
  value: number
  tone: 'blue' | 'emerald' | 'rose'
  icon: React.ComponentType<{ size?: number; className?: string }>
}

function StatCard({ title, value, tone, icon: Icon }: StatCardProps) {
  const toneStyles: Record<StatCardProps['tone'], { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
  }

  const { bg, text } = toneStyles[tone]

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
        <Icon size={22} className={text} />
      </div>
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
  if (status === 'approved' || status === 'rejected') return status
  return 'pending'
}

function formatDateTime(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}
