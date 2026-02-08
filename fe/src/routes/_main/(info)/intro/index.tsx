import { createFileRoute } from '@tanstack/react-router'
import { useIntroductions } from '../../../../hooks/queries/useIntroductions'
import { SEO } from '../../../../components/common/SEO'

export const Route = createFileRoute('/_main/(info)/intro/')({
  component: Intro,
})

function Intro() {
  const { data, isLoading, error } = useIntroductions(true)
  const images = data?.images || []
  const loading = isLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">학생회 소개 정보를 불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error.message || '이미지를 불러오는데 실패했습니다.'}
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-400">등록된 소개 이미지가 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <SEO
        title="학생회 소개"
        description="컴퓨터공학과 학생회를 소개합니다."
        url="/intro"
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">학생회 소개</h1>
          <p className="text-gray-600 dark:text-gray-400">현행 학생회에 대한 소개입니다.</p>
        </div>

        <div className="space-y-6">
          {images.map((image) => (
            <div key={image.id} className="w-full bg-white dark:bg-slate-800 rounded-lg shadow-sm py-5">
              <div className="px-5">
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-auto object-contain rounded-lg"
                />
                {image.title && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">{image.title}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
