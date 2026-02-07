import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { CategoryFilter, LockerActions, RentalCard } from '../components/welfare'
import { SEO } from '../components/common/SEO'
import { welfareApi, type WelfareRental, type LockerInfo, type PrinterInfo, type GuidebookInfo } from '../lib/api/welfare'

export const Route = createFileRoute('/welfare')({
  component: Welfare,
})

function Welfare() {
  const [selectedCategory, setSelectedCategory] = React.useState<'대여사업' | '사물함' | '프린터' | '신입생 가이드북'>('대여사업')
  const [rentalItems, setRentalItems] = React.useState<WelfareRental[]>([])
  const [rentalCategoryFilter, setRentalCategoryFilter] = React.useState<string>('전체')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lockerLoading, setLockerLoading] = React.useState(true)
  const [lockerError, setLockerError] = React.useState<string | null>(null)
  const [lockerInfo, setLockerInfo] = React.useState<LockerInfo | null>(null)
  const [printerLoading, setPrinterLoading] = React.useState(true)
  const [printerError, setPrinterError] = React.useState<string | null>(null)
  const [printerInfo, setPrinterInfo] = React.useState<PrinterInfo | null>(null)
  const [guidebookLoading, setGuidebookLoading] = React.useState(true)
  const [guidebookInfo, setGuidebookInfo] = React.useState<GuidebookInfo | null>(null)
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), [])
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
    : ''
  const returnPeriodLabel = lockerReturnStart && lockerReturnEnd
    ? `${lockerReturnStart.slice(0, 10)} ~ ${lockerReturnEnd.slice(0, 10)}`
    : ''

  const fetchRentals = React.useCallback(async () => {
    try {
      setLoading(true)
      setLockerLoading(true)
      setPrinterLoading(true)
      setGuidebookLoading(true)
      setError(null)
      setLockerError(null)
      setPrinterError(null)
      const [rentalsResult, lockerResult, printerResult, guidebookResult] = await Promise.allSettled([
        welfareApi.getRentals(),
        welfareApi.getLockerInfo(),
        welfareApi.getPrinterInfo(),
        welfareApi.getGuidebookInfo()
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

      if (printerResult.status === 'fulfilled') {
        setPrinterInfo(printerResult.value)
      } else {
        console.error('프린터 정보 로드 실패:', printerResult.reason)
        setPrinterError('프린터 정보를 불러올 수 없습니다.')
      }

      if (guidebookResult.status === 'fulfilled') {
        setGuidebookInfo(guidebookResult.value)
      } else {
        console.error('가이드북 정보 로드 실패:', guidebookResult.reason)
      }
    } catch (err) {
      console.error('복지사업 데이터 로드 실패:', err)
      setError('데이터를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
      setLockerLoading(false)
      setPrinterLoading(false)
      setGuidebookLoading(false)
    }
  }, [today])

  React.useEffect(() => {
    fetchRentals()
  }, [fetchRentals])

  const groupedRentalSections = React.useMemo(() => {
    const groups = new Map<string, WelfareRental[]>()
    for (const item of rentalItems) {
      const categoryKey = item.category?.trim() || '기타'
      const existing = groups.get(categoryKey)
      if (existing) {
        existing.push(item)
      } else {
        groups.set(categoryKey, [item])
      }
    }

    for (const items of groups.values()) {
      items.sort((a, b) => a.item_name.localeCompare(b.item_name, 'ko'))
    }

    const preferredCategoryOrder = ['케이블', '어댑터', '보조배터리']
    const categoryNames = Array.from(groups.keys()).sort((a, b) => {
      const aIndex = preferredCategoryOrder.indexOf(a)
      const bIndex = preferredCategoryOrder.indexOf(b)
      const aRank = aIndex === -1 ? Number.POSITIVE_INFINITY : aIndex
      const bRank = bIndex === -1 ? Number.POSITIVE_INFINITY : bIndex

      if (aRank !== bRank) return aRank - bRank
      if (a === '기타') return 1
      if (b === '기타') return -1
      return a.localeCompare(b, 'ko')
    })

    return categoryNames.map((name) => ({
      name,
      items: groups.get(name) || [],
    }))
  }, [rentalItems])

  const rentalCategoryOptions = React.useMemo(() => groupedRentalSections.map((section) => section.name), [groupedRentalSections])

  React.useEffect(() => {
    if (rentalCategoryFilter !== '전체' && !rentalCategoryOptions.includes(rentalCategoryFilter)) {
      setRentalCategoryFilter('전체')
    }
  }, [rentalCategoryFilter, rentalCategoryOptions])

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


  const filteredRentalSections = React.useMemo(() => {
    if (rentalCategoryFilter === '전체') return groupedRentalSections
    return groupedRentalSections.filter((section) => section.name === rentalCategoryFilter)
  }, [groupedRentalSections, rentalCategoryFilter])

  return (
    <div className="w-full px-4 sm:px-6 lg:px-[10%] py-8 sm:py-12">
      <SEO
        title="복지사업"
        description="학생회의 복지사업(물품 대여, 사물함, 프린터, 가이드북)을 확인하세요."
        url="/welfare"
      />
      {/* Page Title */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 sm:mb-4">복지사업</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">학생회의 복지사업을 확인하세요.</p>
      </div>

      <CategoryFilter selectedCategory={selectedCategory} onSelect={setSelectedCategory} />

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 transition-colors">
        {selectedCategory === '대여사업' ? (
          <div>
            <div className="flex items-start justify-between gap-4 mb-6 flex-col sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">대여사업</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  * 재고 정보는 최대 5분 간격으로 갱신됩니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="rental-category-filter" className="text-sm text-gray-500 dark:text-gray-400">
                  카테고리
                </label>
                <select
                  id="rental-category-filter"
                  value={rentalCategoryFilter}
                  onChange={(e) => setRentalCategoryFilter(e.target.value)}
                  disabled={loading || rentalCategoryOptions.length === 0}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100"
                >
                  <option value="전체">전체</option>
                  {rentalCategoryOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
              <div className="space-y-10">
                {filteredRentalSections.map((section) => (
                  <section key={section.name} className="space-y-4">
                    <div className="flex items-end justify-between gap-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{section.name}</h3>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{section.items.length}개</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {section.items.map((item) => (
                        <RentalCard key={item.id} item={item} onApply={handleRentalRedirect} />
                      ))}
                    </div>
                  </section>
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
        ) : selectedCategory === '프린터' ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">프린터</h2>
              <p className="text-gray-600 dark:text-gray-400">프린터 사용 안내를 확인하세요.</p>
            </div>

            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-800 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">프린터 사용 안내</h3>
              {printerLoading ? (
                <div className="aspect-[16/9] w-full rounded-md border border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  안내 이미지 불러오는 중...
                </div>
              ) : printerError ? (
                <div className="aspect-[16/9] w-full rounded-md border border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center text-red-500 text-sm">
                  {printerError}
                </div>
              ) : printerInfo?.image_url ? (
                <div className="space-y-3">
                  <img
                    src={printerInfo.image_url}
                    alt="프린터 사용 안내"
                    className="w-full rounded-md border border-gray-200 dark:border-slate-700"
                  />
                  {printerInfo.description ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                      {printerInfo.description}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="aspect-[16/9] w-full rounded-md border border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                  안내 이미지가 없습니다.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-[600px] sm:h-[800px] bg-white dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
            {
              guidebookLoading ? (
                <p className="text-gray-500 dark:text-gray-400" > 가이드북 정보를 불러오는 중입니다...</p>
              ) : guidebookInfo?.notion_url ? (
                <iframe
                  src={guidebookInfo.notion_url}
                  width="100%"
                  height="100%"
                  className="border-0 w-full h-full"
                  title={guidebookInfo.title || "신입생 가이드북"}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">등록된 가이드북 정보가 없습니다.</p>
              )}
          </div>
        )
        }
      </div >

    </div >
  )
}
