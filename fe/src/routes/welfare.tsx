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
          <div>
            <h2 className="text-2xl font-bold mb-4">사물함</h2>
            <p className="text-gray-600">사물함 관련 내용이 들어갑니다.</p>
          </div>
        )}
      </div>

    </div>
  )
}
 