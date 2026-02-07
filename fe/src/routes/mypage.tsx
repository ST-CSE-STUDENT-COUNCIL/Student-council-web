import React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Key, UserX } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { mypageApi } from '../lib/api/mypage'
import { InfoRow, InfoLine, SummaryCard, StatusPill, Badge, VerifyModal, EditProfileModal, ChangePasswordModal, WithdrawModal, ProfileInfoHeader, ProfileUpdateSection } from '../components/mypage'
import type { User } from '../types/users'
import type { MyRegistration, ProfileUpdateRequest } from '../lib/api/mypage'

export const Route = createFileRoute('/mypage')({
  component: MyPage,
})

function MyPage() {
  const { user, isAuthenticated, setUser } = useAuthStore()
  const [profile, setProfile] = React.useState<User | null>(user)
  const [activeTab, setActiveTab] = React.useState<'info' | 'events'>('info')
  const [showVerifyModal, setShowVerifyModal] = React.useState(false)
  const [showEditProfileModal, setShowEditProfileModal] = React.useState(false)
  const [showPasswordModal, setShowPasswordModal] = React.useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false)
  const [myRegistrations, setMyRegistrations] = React.useState<MyRegistration[]>([])
  const [profileUpdateRequests, setProfileUpdateRequests] = React.useState<ProfileUpdateRequest[]>([])
  const [profileUpdateError, setProfileUpdateError] = React.useState<string | null>(null)
  const currentUser = profile ?? user

  const handleWithdraw = React.useCallback(() => {
    setShowWithdrawModal(true)
  }, [])

  const handleVerificationUploaded = React.useCallback(async () => {
    try {
      const profileData = await mypageApi.getProfile()
      setProfile(profileData)
      setUser(profileData)
    } catch (err) {
      console.error('Failed to refresh profile after verification upload', err)
    }
  }, [setUser])

  React.useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false

    async function loadData() {
      const results = await Promise.allSettled([
        mypageApi.getProfile(),
        mypageApi.getMyRegistrations(),
        mypageApi.getProfileUpdateRequests(),
      ])

      if (cancelled) return

      const [profileResult, registrationsResult, updatesResult] = results

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value)
        setUser(profileResult.value)
      } else {
        console.error('Failed to load profile', profileResult.reason)
      }

      if (registrationsResult.status === 'fulfilled') {
        setMyRegistrations(registrationsResult.value.items)
      } else {
        console.error('Failed to load registrations', registrationsResult.reason)
      }

      if (updatesResult.status === 'fulfilled') {
        const data = updatesResult.value
        const payload =
          Array.isArray(data) ? data :
          Array.isArray((data as { items?: unknown })?.items) ? (data as { items: unknown[] }).items :
          Array.isArray((data as { requests?: unknown })?.requests) ? (data as { requests: unknown[] }).requests :
          []

        setProfileUpdateRequests(payload as ProfileUpdateRequest[])
        setProfileUpdateError(null)
      } else {
        console.error('Failed to load profile update requests', updatesResult.reason)
        setProfileUpdateError('프로필 변경 요청 내역을 불러오지 못했습니다.')
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, setUser])

  const upcomingEvents = React.useMemo(() => {
    const now = new Date().toISOString()

    return myRegistrations
      .filter(reg => {
        if (!reg.activity) return false

        const endDate = reg.activity.registration_end
          ? reg.activity.registration_end
          : '9999-12-31' // 종료일 없으면 계속 예정으로 취급

        return endDate >= now
      })
      .map(reg => ({
        title: reg.activity!.title,
        date: formatDate(reg.registered_at),
        status: getStatusLabel(reg.status),
        rawStatus: reg.status
      }))
  }, [myRegistrations])

  const completedEvents = React.useMemo(() => {
    const now = new Date().toISOString()

    return myRegistrations
      .filter(reg => {
        if (!reg.activity) return false

        const endDate = reg.activity.registration_end
        if (!endDate) return false // 종료일 없으면 완료되지 않음 (상시)

        return endDate < now
      })
      .map(reg => ({
        title: reg.activity!.title,
        date: formatDate(reg.activity!.registration_end || reg.registered_at),
        status: reg.status === 'rejected' || reg.status === 'cancelled'
          ? getStatusLabel(reg.status)
          : '마감',
        rawStatus: reg.status,
      }))
  }, [myRegistrations])

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="flex min-h-[calc(100vh-300px)] items-center justify-center px-4 py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            로그인이 필요한 페이지입니다
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            마이페이지를 이용하려면 로그인해주세요.
          </p>
          <Link
            to="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            로그인하러 가기
          </Link>
        </div>
      </div>
    )
  }

  const verificationStatusLabel = getVerificationStatus(currentUser)
  const shouldShowVerificationButton =
    currentUser.verification_status === 'pending' || currentUser.verification_status === 'rejected'

  const sidebarItems = [
    { id: 'info', label: '내 정보' },
    { id: 'events', label: '행사' },
  ]

  const mappedProfileUpdates = React.useMemo(() => {
    const groups = new Map<string, {
      id: string
      updates: Array<{ field: 'name' | 'student_id'; newValue: string }>
      statusLabel: string
      requestedAt: string
      rejectionReason: string
    }>()

    profileUpdateRequests.forEach((item, index) => {
      const field: 'name' | 'student_id' = item.field_name === 'student_id' ? 'student_id' : 'name'
      const createdAt = item.created_at || item.requested_at || ''
      const rejectionReason = item.rejection_reason || item.reason || ''
      const groupKey = normalizeDateKey(createdAt)

      const existing = groups.get(groupKey)
      const base = existing ?? {
        id: String(item.id ?? index),
        updates: [],
        statusLabel: getProfileUpdateStatusLabel(item.status),
        requestedAt: createdAt ? formatDateTime(createdAt) : '-',
        rejectionReason,
      }

      const updates = base.updates.some((u) => u.field === field)
        ? base.updates.map((u) => (u.field === field ? { field, newValue: item.new_value ?? '-' } : u))
        : [...base.updates, { field, newValue: item.new_value ?? '-' }]

      const nextStatus = mergeStatusLabel(base.statusLabel, getProfileUpdateStatusLabel(item.status))
      const nextReason = base.rejectionReason || rejectionReason

      groups.set(groupKey, {
        ...base,
        updates,
        statusLabel: nextStatus,
        rejectionReason: nextReason,
      })
    })

    return Array.from(groups.values())
  }, [profileUpdateRequests])

  const hasPendingProfileUpdate = React.useMemo(() => {
    return profileUpdateRequests.some(
      (item) => item.status === 'pending' || item.status === 'submitted'
    )
  }, [profileUpdateRequests])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">마이페이지</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-3xl mb-3">
                🧑‍🎓
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{currentUser.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{currentUser.student_id}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-700 mb-6 space-y-3 text-sm">
            <InfoRow label="학생회비" value={getMembershipStatus(currentUser)} />
            {shouldShowVerificationButton ? (
              <div className="flex justify-between items-center text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2">
                <span className="text-gray-600 dark:text-gray-400">학적 인증</span>
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
                >
                  인증하기
                </button>
              </div>
            ) : (
              <InfoRow label="학적 인증" value={verificationStatusLabel} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <SummaryCard title="예정 행사" value={upcomingEvents.length} tone="blue" />
            <SummaryCard title="완료 행사" value={completedEvents.length} tone="gray" />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 divide-y divide-gray-200 dark:divide-slate-700">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`w-full px-4 py-3 text-left font-medium text-sm transition ${activeTab === item.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium text-sm flex items-center justify-center gap-2"
            >
              <Key size={16} />
              비밀번호 변경
            </button>
            <button
              onClick={handleWithdraw}
              className="w-full py-2 border border-red-300 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium text-sm flex items-center justify-center gap-2"
            >
              <UserX size={16} />
              회원 탈퇴
            </button>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          {activeTab === 'info' && (
            <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <ProfileInfoHeader
                hasPendingProfileUpdate={hasPendingProfileUpdate}
                onEditProfile={() => setShowEditProfileModal(true)}
              />

              <div className="space-y-4">
                <InfoLine label="이름" value={currentUser.name} />
                <InfoLine label="학번" value={currentUser.student_id} />
                <InfoLine label="이메일" value={currentUser.email} />
                <InfoLine label="전화번호" value={formatPhoneNumber(currentUser.phone)} />
                <InfoLine label="학과" value={currentUser.department || '미등록'} />
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">학생회비</span>
                  <Badge tone={getMembershipStatus(currentUser)} />
                </div>
              </div>

              <ProfileUpdateSection
                error={profileUpdateError}
                items={mappedProfileUpdates}
              />
            </section>
          )}

          {activeTab === 'events' && (
            <>
              <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">신청한 행사</h2>
                  <Link to="/activities" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">행사 보기</Link>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.title} className="border border-gray-100 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{event.date}</p>
                        <StatusPill status={event.status} />
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">{event.title}</p>
                    </div>
                  ))}
                  {upcomingEvents.length === 0 && (
                    <p className="text-gray-400 dark:text-gray-500 text-center py-4 md:col-span-2">신청한 예정 행사가 없습니다.</p>
                  )}
                </div>
              </section>

              <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">참여 완료 행사</h2>
                  <Link to="/activities" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">지난 행사 보기</Link>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {completedEvents.map((event) => (
                    <div key={event.title} className="border border-gray-100 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{event.date}</p>
                        <StatusPill status={event.status} />
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">{event.title}</p>
                    </div>
                  ))}
                  {completedEvents.length === 0 && (
                    <p className="text-gray-400 dark:text-gray-500 text-center py-4 md:col-span-2">참여 완료한 행사가 없습니다.</p>
                  )}
                </div>
              </section>
            </>
          )}
        </main>

        {showVerifyModal && <VerifyModal onClose={() => setShowVerifyModal(false)} onUploaded={handleVerificationUploaded} />}
        {showEditProfileModal && (
          <EditProfileModal
            onClose={() => setShowEditProfileModal(false)}
            initialName={currentUser.name}
            initialStudentId={currentUser.student_id}
            verificationStatus={currentUser.verification_status}
          />
        )}
        {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
        {showWithdrawModal && <WithdrawModal onClose={() => setShowWithdrawModal(false)} />}
      </div>
    </div>
  )
}

function getMembershipStatus(user: { membership_paid: boolean }) {
  return user.membership_paid ? '납부' : '미납부'
}

function getVerificationStatus(user: { verification_status: string }) {
  if (user.verification_status === 'approved') return '인증 완료'
  if (user.verification_status === 'pending') return '인증 대기'
  if (user.verification_status === 'submitted') return '확인 중'
  return '미인증'
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
  } catch (e) {
    return dateStr
  }
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '-'
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

function getProfileUpdateStatusLabel(status?: string | null) {
  const normalized = (status ?? '').toLowerCase().trim()
  if (normalized === 'approved' || normalized === 'approve') return '승인'
  if (normalized === 'rejected' || normalized === 'reject' || normalized === 'denied') return '반려'
  if (normalized === 'pending' || normalized === 'submitted') return '대기'
  return status || '대기'
}

function mergeStatusLabel(current: string, incoming: string) {
  if (current === '반려' || incoming === '반려') return '반려'
  if (current === '대기' || incoming === '대기') return '대기'
  return '승인'
}

function normalizeDateKey(dateStr: string) {
  if (!dateStr) return 'no-date'
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return dateStr
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  const hour = String(parsed.getHours()).padStart(2, '0')
  const minute = String(parsed.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'pending': return '신청 대기'
    case 'approved': return '신청 승인'
    case 'rejected': return '신청 거절'
    case 'cancelled': return '취소됨'
    default: return status
  }
}

function formatPhoneNumber(phone: string) {
  if (!phone) return '-'
  // 숫자만 추출
  const numbers = phone.replace(/\D/g, '')
  // 010-1234-5678 형식으로 변환
  if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  }
  return phone
}
