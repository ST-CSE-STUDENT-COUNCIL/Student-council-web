import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { CategoryFilter, LockerActions, RentalCard } from '../components/welfare'
import { welfareApi, type WelfareRental, type LockerInfo } from '../lib/api/welfare'

export const Route = createFileRoute('/welfare')({
  component: Welfare,
})

function Welfare() {
  const [selectedCategory, setSelectedCategory] = React.useState<'대여사업' | '사물함' | '프린터'>('대여사업')
  const [rentalItems, setRentalItems] = React.useState<WelfareRental[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lockerLoading, setLockerLoading] = React.useState(true)
  const [lockerError, setLockerError] = React.useState<string | null>(null)
  const [lockerInfo, setLockerInfo] = React.useState<LockerInfo | null>(null)
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
    const start = lockerInfo?.application_start || null
    const end = lockerInfo?.application_end || null
    const returnStart = lockerInfo?.return_extension_start || null
    const returnEnd = lockerInfo?.return_extension_end || null
    return { lockerStart: start, lockerEnd: end, lockerReturnStart: returnStart, lockerReturnEnd: returnEnd }
  }, [lockerInfo])

  const isWithinRange = (date: string, start?: string | null, end?: string | null) => {
    if (!start || !end) return false
    return date >= start.slice(0, 10) && date <= end.slice(0, 10)
  }

  const lockerRentalUrl = lockerInfo?.application_form_url?.trim() || ''
  const lockerExtendUrl = lockerInfo?.return_extension_form_url?.trim() || ''
  const lockerReturnUrl = lockerExtendUrl
  const isLockerPeriodActive = isWithinRange(today, lockerStart, lockerEnd)
  const isReturnWindow = isWithinRange(today, lockerReturnStart, lockerReturnEnd)
  const isRentalActive = isLockerPeriodActive && !!lockerRentalUrl
  const isExtendActive = isReturnWindow && !!lockerExtendUrl
  const isReturnActive = isReturnWindow && !!lockerReturnUrl

  const rentalPeriodLabel = lockerStart && lockerEnd
    ? `${lockerStart.slice(0, 10)} ~ ${lockerEnd.slice(0, 10)}`
    : periodLabel
  const returnPeriodLabel = lockerReturnStart && lockerReturnEnd
    ? `${lockerReturnStart.slice(0, 10)} ~ ${lockerReturnEnd.slice(0, 10)}`
    : periodLabel

  const fetchRentals = React.useCallback(async () => {
    try {
      setLoading(true)
      setLockerLoading(true)
      setError(null)
      setLockerError(null)
      const [rentalsResult, lockerResult] = await Promise.allSettled([
        welfareApi.getRentals(),
        welfareApi.getLockerInfo()
      ])

      if (rentalsResult.status === 'fulfilled') {
        const rentals = Array.isArray(rentalsResult.value) ? rentalsResult.value : []
        const activeRentals = rentals.filter((item) => item.is_active)
        setRentalItems(activeRentals)
      } else {
        console.error('복지사업 데이터 로드 실패:', rentalsResult.reason)
        setError('데이터를 불러올 수 없습니다.')
      }

      if (lockerResult.status === 'fulfilled') {
        setLockerInfo(lockerResult.value)
      } else {
        console.error('사물함 정보 로드 실패:', lockerResult.reason)
        setLockerError('사물함 정보를 불러올 수 없습니다.')
      }
    } catch (err) {
      console.error('복지사업 데이터 로드 실패:', err)
      setError('데이터를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
      setLockerLoading(false)
    }
  }, [today])

  React.useEffect(() => {
    fetchRentals()
  }, [fetchRentals])

  const navigateIfActive = React.useCallback((active: boolean, url: string) => {
    if (!active || !url) return
    window.location.href = url
  }, [])

  const handleRentalRedirect = React.useCallback((url: string) => {
    if (!url) return
    window.location.href = url
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
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">복지사업</h1>
        <p className="text-gray-500 dark:text-gray-400">학생회의 복지사업을 확인하세요.</p>
      </div>

      <CategoryFilter selectedCategory={selectedCategory} onSelect={setSelectedCategory} />

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 transition-colors">
        {selectedCategory === '대여사업' ? (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">대여사업</h2>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">로딩 중...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
              </div>
            ) : rentalItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">대여 가능한 물품이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {rentalItems.map((item) => (
                  <RentalCard key={item.id} item={item} onApply={handleRentalRedirect} />
                ))}
              </div>
            )}
          </div>
        ) : selectedCategory === '사물함' ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-6 flex-col lg:flex-row lg:items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">사물함</h2>
                <p className="text-gray-600 dark:text-gray-400">사물함 대여/연장/반납을 신청하세요.</p>
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

            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-800 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">사물함 배치도</h3>
              {lockerLoading ? (
                <div className="aspect-[16/9] w-full rounded-md border border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  배치도 불러오는 중...
                </div>
              ) : lockerError ? (
                <div className="aspect-[16/9] w-full rounded-md border border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center text-red-500 text-sm">
                  {lockerError}
                </div>
              ) : lockerInfo?.layout_image_url ? (
                <div className="space-y-3">
                  <img
                    src={lockerInfo.layout_image_url}
                    alt="사물함 배치도"
                    className="w-full rounded-md border border-gray-200 dark:border-slate-700"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] w-full rounded-md border border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  배치도 정보가 없습니다.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">프린터</h2>
              <p className="text-gray-600 dark:text-gray-400">프린터 사용 안내를 확인하세요.</p>
            </div>

            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-800 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">프린터 사용 안내</h3>
              <div className="aspect-[16/9] w-full rounded-md border border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                프린터 사용 안내 이미지 영역
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
