import React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Key, UserX } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { mypageApi } from '../lib/api/mypage'
import { InfoRow, InfoLine, SummaryCard, StatusPill, Badge, VerifyModal, ChangePasswordModal, WithdrawModal } from '../components/mypage'
import type { User } from '../types/users'
import type { MyRegistration } from '../lib/api/mypage'

export const Route = createFileRoute('/mypage')({
  component: MyPage,
})

function MyPage() {
  const { user, isAuthenticated, setUser } = useAuthStore()
  const [profile, setProfile] = React.useState<User | null>(user)
  const [activeTab, setActiveTab] = React.useState<'info' | 'events'>('info')
  const [showVerifyModal, setShowVerifyModal] = React.useState(false)
  const [showPasswordModal, setShowPasswordModal] = React.useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false)
  const [myRegistrations, setMyRegistrations] = React.useState<MyRegistration[]>([])
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
      try {
        const [profileData, registrationsData] = await Promise.all([
          mypageApi.getProfile(),
          mypageApi.getMyRegistrations()
        ])

        if (cancelled) return

        setProfile(profileData)
        setUser(profileData)
        setMyRegistrations(registrationsData.items)
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load profile or registrations', err)
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
        if (reg.status === 'cancelled') return false
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
        if (reg.status === 'cancelled') return false

        const endDate = reg.activity.registration_end
        if (!endDate) return false // 종료일 없으면 완료되지 않음 (상시)

        return endDate < now
      })
      .map(reg => ({
        title: reg.activity!.title,
        date: formatDate(reg.activity!.registration_end || reg.registered_at),
      }))
  }, [myRegistrations])

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="flex min-h-[calc(100vh-300px)] items-center justify-center px-4 py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            로그인이 필요한 페이지입니다
          </h2>
          <p className="text-gray-600 mb-6">
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">마이페이지</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl mb-3">
                🧑‍🎓
              </div>
              <h2 className="text-lg font-bold text-gray-900">{currentUser.name}</h2>
              <p className="text-sm text-gray-500 mb-4">{currentUser.student_id}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6 space-y-3 text-sm">
            <InfoRow label="학생회비" value={getMembershipStatus(currentUser)} />
            {shouldShowVerificationButton ? (
              <div className="flex justify-between items-center text-sm bg-white border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-gray-600">가입 인증</span>
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
                >
                  인증하기
                </button>
              </div>
            ) : (
              <InfoRow label="가입 인증" value={verificationStatusLabel} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <SummaryCard title="예정 행사" value={upcomingEvents.length} tone="blue" />
            <SummaryCard title="완료 행사" value={completedEvents.length} tone="gray" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`w-full px-4 py-3 text-left font-medium text-sm transition ${activeTab === item.id
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium text-sm flex items-center justify-center gap-2"
            >
              <Key size={16} />
              비밀번호 변경
            </button>
            <button
              onClick={handleWithdraw}
              className="w-full py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition font-medium text-sm flex items-center justify-center gap-2"
            >
              <UserX size={16} />
              회원 탈퇴
            </button>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          {activeTab === 'info' && (
            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">내 정보</h2>
              <div className="space-y-4">
                <InfoLine label="이름" value={currentUser.name} />
                <InfoLine label="학번" value={currentUser.student_id} />
                <InfoLine label="이메일" value={currentUser.email} />
                <InfoLine label="학과" value={currentUser.department || '미등록'} />
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">학생회비</span>
                  <Badge tone={getMembershipStatus(currentUser)} />
                </div>
              </div>
            </section>
          )}

          {activeTab === 'events' && (
            <>
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">신청한 행사</h2>
                  <Link to="/activities" className="text-sm text-blue-600 hover:underline">행사 보기</Link>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.title} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-500">{event.date}</p>
                        <StatusPill status={event.status} />
                      </div>
                      <p className="font-semibold text-gray-900">{event.title}</p>
                    </div>
                  ))}
                  {upcomingEvents.length === 0 && (
                    <p className="text-gray-400 text-center py-4 md:col-span-2">신청한 예정 행사가 없습니다.</p>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">참여 완료 행사</h2>
                  <Link to="/activities" className="text-sm text-blue-600 hover:underline">지난 행사 보기</Link>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {completedEvents.map((event) => (
                    <div key={event.title} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-500">{event.date}</p>
                        <StatusPill status="마감" />
                      </div>
                      <p className="font-semibold text-gray-900">{event.title}</p>
                    </div>
                  ))}
                  {completedEvents.length === 0 && (
                    <p className="text-gray-400 text-center py-4 md:col-span-2">참여 완료한 행사가 없습니다.</p>
                  )}
                </div>
              </section>
            </>
          )}
        </main>

        {showVerifyModal && <VerifyModal onClose={() => setShowVerifyModal(false)} onUploaded={handleVerificationUploaded} />}
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

function getStatusLabel(status: string) {
  switch (status) {
    case 'pending': return '신청 대기'
    case 'approved': return '신청 승인'
    case 'rejected': return '반려됨'
    case 'cancelled': return '취소됨'
    default: return status
  }
}
