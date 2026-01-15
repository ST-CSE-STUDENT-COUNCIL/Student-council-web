import React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuthStore } from '../store/useAuthStore'
import { welfareApi } from '../lib/api/welfare'
import { InfoRow, InfoLine, SummaryCard, Badge, InfoCard, VerifyModal, ChangePasswordModal } from '../components/mypage'
import { Lock, Key } from 'lucide-react'

export const Route = createFileRoute('/mypage')({
  component: MyPage,
})

function MyPage() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [activeTab, setActiveTab] = React.useState<'info' | 'events' | 'welfare'>('info')
  const [showVerifyModal, setShowVerifyModal] = React.useState(false)
  const [showPasswordModal, setShowPasswordModal] = React.useState(false)
  const [borrowedItems, setBorrowedItems] = React.useState<{ name: string; returnDate: string }[]>([])
  const [lockerLocation, setLockerLocation] = React.useState('')
  const [lockerPeriod, setLockerPeriod] = React.useState('')

  React.useEffect(() => {
    if (!user) return
    const userId = user.id

    const controller = new AbortController()

    async function loadWelfare() {
      try {
        const [requests, rentals, lockers, periodData] = await Promise.all([
          welfareApi.getRentalRequests(userId),
          welfareApi.getRentalItems(),
          welfareApi.getLockerRentals(userId),
          welfareApi.getLockerPeriods(),
        ])

        const rentalsMap = new Map<number, { item_name?: string }>()
        rentals.forEach((r: { id: number; item_name?: string }) => rentalsMap.set(r.id, r))

        const borrowed = requests.map((req: { rental_id: number; rental_end_date: string }) => {
          const rental = rentalsMap.get(req.rental_id)
          return {
            name: rental?.item_name || '알 수 없는 물품',
            returnDate: req.rental_end_date,
          }
        })

        setBorrowedItems(borrowed)

        const locker = lockers[0]
        if (locker) {
          setLockerLocation(`미래관 3층 ${locker.locker_number}번`)

          // periodData는 단일 객체 또는 배열일 수 있음
          const periods = Array.isArray(periodData) ? periodData : [periodData]
          const period = periods.find((p: { id: number; usage_start?: string; usage_end?: string }) => p.id === locker.period_id)
          if (period && period.usage_start && period.usage_end) {
            setLockerPeriod(`${formatDate(period.usage_start)} ~ ${formatDate(period.usage_end)}`)
          }
        } else {
          setLockerLocation('')
          setLockerPeriod('')
        }
      } catch (err) {
        if (controller.signal.aborted) return
        console.error('Failed to load welfare data', err)
      }
    }

    loadWelfare()

    return () => controller.abort()
  }, [user])

  // 로그인하지 않은 경우
  if (!isAuthenticated || !user) {
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

  // 하드코딩된 이벤트 데이터 (TODO: 백엔드 API 연동 필요)
  const upcomingEvents = [
    { title: '학생회 MT', date: '2025.01.15', status: '신청 완료' },
    { title: '동아리 박람회', date: '2025.02.02', status: '입금 대기' },
    { title: '신입생 오리엔테이션', date: '2025.03.01', status: '접수 완료' },
  ]

  const completedEvents = [
    { title: '가을 체육대회', date: '2024.10.12' },
    { title: '학과 네트워킹 데이', date: '2024.11.05' },
  ]

  const welfareInfo = {
    returnPeriod:
      borrowedItems.length > 0
        ? `${formatDate(
          borrowedItems.reduce((acc, cur) => (cur.returnDate < acc ? cur.returnDate : acc), borrowedItems[0].returnDate),
        )} ~ ${formatDate(
          borrowedItems.reduce((acc, cur) => (cur.returnDate > acc ? cur.returnDate : acc), borrowedItems[0].returnDate),
        )}`
        : '',
    borrowedItems,
    lockerLocation,
    lockerPeriod,

    verificationStatus:
      user.verification_status === 'pending'
        ? '가입 인증 대기'
        : user.verification_status === 'approved'
          ? '가입 인증 완료'
          : '미인증',
  }

  const sidebarItems = [
    { id: 'info', label: '내 정보' },
    { id: 'events', label: '행사' },
    { id: 'welfare', label: '복지사업' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">마이페이지</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 왼쪽 사이드바 */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          {/* 프로필 카드 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl mb-3">
                🧑‍🎓
              </div>
              <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500 mb-4">{user.student_id}</p>
            </div>
          </div>

          {/* 정보 요약 */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6 space-y-3 text-sm">
            <InfoRow label="학생회비" value={getMembershipStatus(user)} />
            {getVerificationStatus(user) === '미인증' ? (
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
              <InfoRow label="가입 인증" value={getVerificationStatus(user)} />
            )}
          </div>

          {/* 요약 카드 */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <SummaryCard
              title="예정 행사"
              value={upcomingEvents.length}
              tone="blue"
            />
            <SummaryCard
              title="완료 행사"
              value={completedEvents.length}
              tone="gray"
            />
          </div>

          {/* 메뉴 */}
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

          {/* 액션 버튼 */}
          <div className="mt-6 space-y-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium text-sm flex items-center justify-center gap-2"
            >
              <Key size={16} />
              비밀번호 변경
            </button>
            <button
              onClick={logout}
              className="w-full py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition font-medium text-sm"
            >
              로그아웃
            </button>
          </div>
        </aside>

        {/* 오른쪽 콘텐츠 */}
        <main className="flex-1 space-y-6">
          {/* 내 정보 */}
          {activeTab === 'info' && (
            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                내 정보
              </h2>

              <div className="space-y-4">
                <InfoLine label="이름" value={user.name} />
                <InfoLine label="학번" value={user.student_id} />
                <InfoLine label="이메일" value={user.email} />
                <InfoLine label="학과" value={user.department || '미등록'} />

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">학생회비</span>
                  <Badge tone={getMembershipStatus(user)} />
                </div>
              </div>

              {/* 비밀번호 변경 섹션 */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock size={18} />
                  보안
                </h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">비밀번호</p>
                    <p className="text-sm text-gray-500">정기적으로 비밀번호를 변경하세요</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    변경하기
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* 행사 */}
          {activeTab === 'events' && (
            <>
              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    신청한 행사
                  </h2>
                  <Link to="/activities" className="text-sm text-blue-600 hover:underline">
                    행사 보기
                  </Link>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.title}
                      className="border border-gray-100 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-500">{event.date}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.status === '신청 완료' ? 'bg-green-100 text-green-700' :
                            event.status === '입금 대기' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                          }`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {event.title}
                      </p>
                    </div>
                  ))}

                  {upcomingEvents.length === 0 && (
                    <p className="text-gray-400 text-center py-4 md:col-span-2">
                      신청한 예정 행사가 없습니다.
                    </p>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    참여 완료 행사
                  </h2>
                  <Link to="/activities" className="text-sm text-blue-600 hover:underline">
                    지난 행사 보기
                  </Link>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {completedEvents.map((event) => (
                    <div
                      key={event.title}
                      className="border border-gray-100 rounded-lg p-4"
                    >
                      <p className="text-sm text-gray-500 mb-1">
                        {event.date}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {event.title}
                      </p>
                    </div>
                  ))}

                  {completedEvents.length === 0 && (
                    <p className="text-gray-400 text-center py-4 md:col-span-2">
                      참여 완료한 행사가 없습니다.
                    </p>
                  )}
                </div>
              </section>
            </>
          )}

          {/* 복지사업 */}
          {activeTab === 'welfare' && (
            <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  복지사업
                </h2>
                <Link to="/welfare" className="text-sm text-blue-600 hover:underline">
                  복지사업 보기
                </Link>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <InfoCard
                    title="내 사물함 위치"
                    value={welfareInfo.lockerLocation || '현재 대여 중인 사물함이 없습니다'}
                    sub={welfareInfo.lockerLocation ? welfareInfo.lockerPeriod : undefined}
                  />
                  {user.verification_status === 'rejected' ? (
                    <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">학생 가입 인증</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowVerifyModal(true)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      >
                        인증하기
                      </button>
                    </div>
                  ) : (
                    <InfoCard
                      title="학생 가입 인증"
                      value={welfareInfo.verificationStatus}
                    />
                  )}
                </div>
              </div>
            </section>
          )}
        </main>

        {/* 모달들 */}
        {showVerifyModal && (
          <VerifyModal onClose={() => setShowVerifyModal(false)} />
        )}
        {showPasswordModal && (
          <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
        )}
      </div>
    </div>
  )
}

/* ---------- 상태 계산 ---------- */

function getMembershipStatus(user: {
  membership_paid: boolean
  verification_status: string
}) {
  if (user.verification_status === 'pending') return '확인중'
  if (user.membership_paid) return '납부'
  return '미납부'
}

function getVerificationStatus(user: { verification_status: string }) {
  if (user.verification_status === 'approved') return '인증 완료'
  if (user.verification_status === 'pending') return '인증 대기'
  return '미인증'
}

function formatDate(dateStr: string) {
  const parts = dateStr?.split('-')
  if (parts.length === 3) return `${parts[0]}.${parts[1]}.${parts[2]}`
  return dateStr
}
