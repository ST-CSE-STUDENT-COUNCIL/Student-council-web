import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { ClubsHeader, ClubCard, ClubDetailModal } from '../../../../components/clubs'
import type { Club } from '../../../../types/clubs'
import { SEO } from '../../../../components/common/SEO'
import { useClubs } from '../../../../hooks/queries/useClubs'

export const Route = createFileRoute('/_main/(info)/clubs/')({
  component: Clubs,
})

function Clubs() {
  const { data: clubsData, isLoading: loading } = useClubs()
  const [selectedClub, setSelectedClub] = React.useState<Club | null>(null)

  const clubs = clubsData || []

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
        description="컴퓨터공학과 동아리 소개. 프로그래밍, 보안, 게임개발, 네트워크 등 다양한 분야의 동아리를 확인하세요."
        url="/clubs"
        keywords="동아리, 프로그래밍, 보안, 게임개발, 컴퓨터공학과, 학생회"
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
