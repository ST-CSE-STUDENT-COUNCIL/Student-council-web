import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { clubApi } from '../../../../lib/api/clubs'
import { ClubsHeader, ClubCard, ClubDetailModal } from '../../../../components/clubs'
import type { Club } from '../../../../types/clubs'
import { SEO } from '../../../../components/common/SEO'

export const Route = createFileRoute('/_main/(info)/clubs/')({
  component: Clubs,
})

function Clubs() {
  const [clubs, setClubs] = React.useState<Club[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedClub, setSelectedClub] = React.useState<Club | null>(null)

  React.useEffect(() => {
    async function loadClubs() {
      try {
        const data = await clubApi.getAll()
        setClubs(data)
      } catch (error) {
        console.error('Failed to load clubs', error)
      } finally {
        setLoading(false)
      }
    }

    loadClubs()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">동아리 정보를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SEO
        title="동아리"
        description="컴퓨터공학과 동아리를 소개합니다."
        url="/clubs"
      />
      <ClubsHeader />

      {clubs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} onDetail={() => setSelectedClub(club)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-gray-500">등록된 동아리가 없습니다.</p>
        </div>
      )}

      {selectedClub && (
        <ClubDetailModal club={selectedClub} onClose={() => setSelectedClub(null)} />
      )}
    </div>
  )
}
