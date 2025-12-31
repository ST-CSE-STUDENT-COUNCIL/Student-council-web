import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { CategoryFilter } from '../components/welfare'
import { RentalRequestModal, type RentalRequestData } from '../components/welfare/RentalRequestModal'
import { welfareApi, type WelfareRental } from '../lib/api/welfare'
import { useAuthStore } from '../store/useAuthStore'

export const Route = createFileRoute('/welfare')({
  component: Welfare,
})

function Welfare() {
  const [selectedCategory, setSelectedCategory] = React.useState<'대여사업' | '사물함'>('대여사업')
  const [rentalItems, setRentalItems] = React.useState<WelfareRental[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedItem, setSelectedItem] = React.useState<WelfareRental | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const { accessToken, user } = useAuthStore()

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

  const handleOpenModal = (item: WelfareRental) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
  }

  const handleSubmitRentalRequest = async (data: RentalRequestData) => {
    try {
      const now = new Date().toISOString()

      if (!user || !accessToken) {
        alert('로그인이 필요합니다.')
        return
      }

      await welfareApi.createRentalRequest({
        rental_id: data.rental_id,
        user_id: user.id,
        status: 'pending',
        rental_start_date: data.rental_start_date,
        rental_end_date: data.rental_end_date,
        actual_return_date: null,
        notes: null,
        created_at: now,
        updated_at: now,
      }, accessToken)

      alert('대여신청이 완료되었습니다.')
      fetchRentals()
    } catch (err) {
      console.error('대여신청 실패:', err)
      alert('대여신청에 실패했습니다. 다시 시도해주세요.')
    }
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
                  <div
                    key={item.id}
                    onClick={() => handleOpenModal(item)}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow duration-300 hover:border-blue-300 cursor-pointer hover:bg-blue-50"
                  >
                    <div className="text-center mb-3">
                      <img
                        src={item.image_url}
                        alt={item.item_name}
                        className="w-24 h-24 object-cover rounded mx-auto mb-2"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <h3 className="text-lg font-semibold text-gray-900">{item.item_name}</h3>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      <p className="line-clamp-2">{item.description}</p>
                    </div>
                    <div className="mb-3">
                      <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                        {item.category}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">보유: {item.quantity}개</span>
                        <span className="font-semibold text-blue-600">가능: {item.available_quantity}개</span>
                      </div>
                      <p className="text-xs text-gray-500">대여 기간: {item.rental_period_days}일</p>
                    </div>
                  </div>
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

      <RentalRequestModal
        isOpen={isModalOpen}
        item={selectedItem}
        onClose={handleCloseModal}
        onSubmit={handleSubmitRentalRequest}
      />
    </div>
  )
}
 