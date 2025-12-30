import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { CategoryFilter } from '../components/welfare'

export const Route = createFileRoute('/welfare')({
  component: Welfare,
})

function Welfare() {
  const [selectedCategory, setSelectedCategory] = React.useState<'대여사업' | '사물함'>('대여사업')

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
            <h2 className="text-2xl font-bold mb-4">대여사업</h2>
            <p className="text-gray-600">대여사업 관련 내용이 들어갑니다.</p>
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
 