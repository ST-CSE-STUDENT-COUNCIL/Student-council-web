import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { CategoryFilter, RentalCard } from '../components/welfare'
import { welfareApi, type WelfareRental } from '../lib/api/welfare'

export const Route = createFileRoute('/welfare')({
  component: Welfare,
})

function Welfare() {
  const [selectedCategory, setSelectedCategory] = React.useState<'대여사업' | '사물함'>('대여사업')
  const [rentalItems, setRentalItems] = React.useState<WelfareRental[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const rentalRedirectUrl = 'https://www.google.com/?hl=ko'//이곳에 링크를 넣으면 됩니다
  const today = new Date().toISOString().split('T')[0]
  const lockerDeadline = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })()
  const displayToday = today.slice(5)
  const displayDeadline = lockerDeadline.slice(5)
  const periodLabel = `${displayToday} ~ ${displayDeadline}`
  const isLockerPeriodActive = (() => {
    const current = new Date().toISOString().split('T')[0]
    return current >= today && current <= lockerDeadline
  })()
  const isRentalActive = isLockerPeriodActive
  const isExtendActive = isLockerPeriodActive
  const isReturnActive = isLockerPeriodActive
  const disabledClass = 'border-gray-200 opacity-60 cursor-not-allowed hover:-translate-y-0 hover:shadow-none'

  const fetchRentals = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await welfareApi.getRentals()
      setRentalItems(data)
    } catch (err) {
      console.error('대여사업 데이터 로드 실패:', err)
      setError('데이터를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchRentals()
  }, [fetchRentals])

  const handleRentalRedirect = () => {
    window.location.href = rentalRedirectUrl
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Title */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">복지사업</h1>
        <p className="text-gray-500">학생회의 복지사업을 확인하세요.</p>
      </div>

      <CategoryFilter selectedCategory={selectedCategory} onSelect={setSelectedCategory} />

      {/* Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {selectedCategory === '대여사업' ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">대여사업</h2>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">로딩 중...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
              </div>
            ) : rentalItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">대여 가능한 물품이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {rentalItems.map((item) => (
                  <RentalCard key={item.id} item={item} onApply={handleRentalRedirect} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-6 flex-col lg:flex-row lg:items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">사물함</h2>
                <p className="text-gray-600">사물함 대여/연장/반납을 선택하세요.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                <button
                  className={`flex w-full items-start gap-3 rounded-lg border bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow ${isRentalActive ? 'border-blue-100 hover:border-blue-300' : disabledClass}`}
                  disabled={!isRentalActive}
                  aria-disabled={!isRentalActive}
                >
                  <div className={`mt-1 h-8 w-1.5 rounded-full ${isRentalActive ? 'bg-blue-500' : 'bg-gray-300'}`} aria-hidden />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">사물함 대여 신청</div>
                    <div className="text-[11px] text-gray-400">{periodLabel}</div>
                  </div>
                </button>
                <button
                  className={`flex w-full items-start gap-3 rounded-lg border bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow ${isExtendActive ? 'border-amber-100 hover:border-amber-300' : disabledClass}`}
                  disabled={!isExtendActive}
                  aria-disabled={!isExtendActive}
                >
                  <div className={`mt-1 h-8 w-1.5 rounded-full ${isExtendActive ? 'bg-amber-500' : 'bg-gray-300'}`} aria-hidden />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">사물함 연장 신청</div>
                    <div className="text-[11px] text-gray-400">{periodLabel}</div>
                  </div>
                </button>
                <button
                  className={`flex w-full items-start gap-3 rounded-lg border bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow ${isReturnActive ? 'border-red-100 hover:border-red-300' : disabledClass}`}
                  disabled={!isReturnActive}
                  aria-disabled={!isReturnActive}
                >
                  <div className={`mt-1 h-8 w-1.5 rounded-full ${isReturnActive ? 'bg-red-500' : 'bg-gray-300'}`} aria-hidden />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">사물함 반납 신청</div>
                    <div className="text-[11px] text-gray-400">{periodLabel}</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">사물함 배치도</h3>
              <div className="aspect-[16/9] w-full rounded-md border border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-400 text-sm">
                배치도 이미지를 여기 넣어주세요
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
 