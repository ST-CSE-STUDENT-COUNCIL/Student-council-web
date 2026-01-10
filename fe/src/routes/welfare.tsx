import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { CategoryFilter, LockerActions, RentalCard } from '../components/welfare'
import { welfareApi, type WelfareRental, type LockerPeriod } from '../lib/api/welfare'

export const Route = createFileRoute('/welfare')({
  component: Welfare,
})

function Welfare() {
  const [selectedCategory, setSelectedCategory] = React.useState<'대여사업' | '사물함'>('대여사업')
  const [rentalItems, setRentalItems] = React.useState<WelfareRental[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lockerPeriod, setLockerPeriod] = React.useState<LockerPeriod | null>(null)
  const rentalRedirectUrl = 'https://www.google.com/?hl=ko'//이곳에 링크를 넣으면 됩니다
  const lockerRentalUrl = 'https://example.com/locker/rental' // 사물함 대여 신청 링크
  const lockerExtendUrl = 'https://example.com/locker/extend' // 사물함 연장 신청 링크
  const lockerReturnUrl = 'https://example.com/locker/return' // 사물함 반납 신청 링크
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), [])
  const lockerDeadline = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  }, [])
  const displayToday = today.slice(5)
  const displayDeadline = lockerDeadline.slice(5)
  const periodLabel = `${displayToday} ~ ${displayDeadline}`
  const disabledClass = 'border-gray-200 opacity-60 cursor-not-allowed hover:-translate-y-0 hover:shadow-none'

  const { lockerStart, lockerEnd, lockerReturnStart, lockerReturnEnd } = React.useMemo(() => {
    const start = lockerPeriod?.rental_start || lockerPeriod?.application_start || lockerPeriod?.usage_start || null
    const end = lockerPeriod?.rental_end || lockerPeriod?.application_end || lockerPeriod?.usage_end || null
    const returnStart = lockerPeriod?.return_start || start
    const returnEnd = lockerPeriod?.return_end || end
    return { lockerStart: start, lockerEnd: end, lockerReturnStart: returnStart, lockerReturnEnd: returnEnd }
  }, [lockerPeriod])

  const isWithinRange = (date: string, start?: string | null, end?: string | null) => {
    if (!start || !end) return false
    return date >= start.slice(0, 10) && date <= end.slice(0, 10)
  }

  const isLockerPeriodActive = isWithinRange(today, lockerStart, lockerEnd)
  const isReturnWindow = isWithinRange(today, lockerReturnStart, lockerReturnEnd)
  const isRentalActive = isLockerPeriodActive
  const isExtendActive = isReturnWindow
  const isReturnActive = isReturnWindow

  const rentalPeriodLabel = lockerStart && lockerEnd
    ? `${lockerStart.slice(5)} ~ ${lockerEnd.slice(5)}`
    : periodLabel
  const returnPeriodLabel = lockerReturnStart && lockerReturnEnd
    ? `${lockerReturnStart.slice(5)} ~ ${lockerReturnEnd.slice(5)}`
    : periodLabel

  const fetchRentals = React.useCallback(async () => {
    try {
      setLoading(true)
      const [rentals, lockerPeriods] = await Promise.all([
        welfareApi.getRentals(),
        welfareApi.getLockerPeriods()
      ])

      const current = today
      const currentPeriod = lockerPeriods.find(period => {
        const start = (period.rental_start || period.application_start || period.usage_start || '').slice(0, 10)
        const end = (period.rental_end || period.application_end || period.usage_end || '').slice(0, 10)
        if (!start || !end) return false
        return current >= start && current <= end
      }) || null

      setRentalItems(rentals)
      setLockerPeriod(currentPeriod)
    } catch (err) {
      console.error('복지사업 데이터 로드 실패:', err)
      setError('데이터를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }, [today])

  React.useEffect(() => {
    fetchRentals()
  }, [fetchRentals])

  const navigateIfActive = React.useCallback((active: boolean, url: string) => {
    if (!active) return
    window.location.href = url
  }, [])

  const handleRentalRedirect = React.useCallback(() => {
    window.location.href = rentalRedirectUrl
  }, [])

  const handleLockerRentalRedirect = React.useCallback(() => {
    navigateIfActive(isRentalActive, lockerRentalUrl)
  }, [navigateIfActive, isRentalActive, lockerRentalUrl])

  const handleLockerExtendRedirect = React.useCallback(() => {
    navigateIfActive(isExtendActive, lockerExtendUrl)
  }, [navigateIfActive, isExtendActive, lockerExtendUrl])

  const handleLockerReturnRedirect = React.useCallback(() => {
    navigateIfActive(isReturnActive, lockerReturnUrl)
  }, [navigateIfActive, isReturnActive, lockerReturnUrl])

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
                <p className="text-gray-600">사물함 대여/연장/반납을 신청하세요.</p>
              </div>
              <LockerActions
                rentalPeriodLabel={rentalPeriodLabel}
                returnPeriodLabel={returnPeriodLabel}
                isRentalActive={isRentalActive}
                isExtendActive={isExtendActive}
                isReturnActive={isReturnActive}
                disabledClass={disabledClass}
                onRentalClick={handleLockerRentalRedirect}
                onExtendClick={handleLockerExtendRedirect}
                onReturnClick={handleLockerReturnRedirect}
              />
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
 