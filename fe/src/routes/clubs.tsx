import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { api } from '../lib/axios'
import { ClubsHeader, CategoryFilter, ClubCard } from '../components/clubs'
import type { Club } from '../components/clubs/ClubCard'

export const Route = createFileRoute('/clubs')({
  component: Clubs,
})

function Clubs() {
  const [clubs, setClubs] = React.useState<Club[]>([])
  const [selectedCategory, setSelectedCategory] = React.useState<string>('전체')
  const [loading, setLoading] = React.useState(true)
  const [selectedClub, setSelectedClub] = React.useState<Club | null>(null)

  React.useEffect(() => {
    async function loadClubs() {
      try {
        const res = await api.get('/api/clubs', {
          baseURL: 'http://localhost:4000',
        })
        setClubs(res.data)
      } catch (error) {
        console.error('Failed to load clubs', error)
      } finally {
        setLoading(false)
      }
    }

    loadClubs()
  }, [])

  const categories = ['전체', ...Array.from(new Set(clubs.map(club => club.category)))]
  const filteredClubs = selectedCategory === '전체'
    ? clubs
    : clubs.filter(club => club.category === selectedCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">동아리 정보를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ClubsHeader />

      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {filteredClubs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClubs.map((club) => (
            <ClubCard key={club.id} club={club} onDetail={() => setSelectedClub(club)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">해당 카테고리의 동아리가 없습니다.</p>
        </div>
      )}

      {selectedClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedClub(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-[90vw] overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-500">{selectedClub.category}</p>
                <h3 className="text-xl font-bold text-gray-900">{selectedClub.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClub(null)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="bg-gray-50 p-4">
              {selectedClub.detail_image_url ? (
                <img
                  src={selectedClub.detail_image_url}
                  alt={selectedClub.name}
                  className="w-full max-h-[70vh] object-contain bg-white"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-gray-400 bg-white rounded-lg">
                  <span className="text-sm">상세 이미지가 없습니다.</span>
                </div>
              )}
            </div>
            <div className="px-4 py-3 text-sm text-gray-700 border-t border-gray-200">
              <p className="mb-4">{selectedClub.description}</p>
              <a 
                href="https://www.naver.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
              >
                이 부분에 링크를 집어넣을 수 있게 함 →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
