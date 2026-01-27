import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { NoticeFormPage } from '../../../../components/notices/admin/NoticeFormPage'
import { postApi } from '../../../../lib/api/notices'
import { useEffect, useState } from 'react'
import type { NoticeDetailResponse } from '../../../../types/posts'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/notices/$noticeId/edit')({
  component: EditNoticePage,
})

function EditNoticePage() {
  const { noticeId } = Route.useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState<NoticeDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await postApi.getById(Number(noticeId))
        setPost(data)
      } catch (e) {
        console.error(e)
        toast.error('공지사항을 불러오지 못했습니다.')
        navigate({ to: '/admin/notices' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [noticeId, navigate])

  if (loading) return <div className="min-h-screen bg-white" />

  return (
    <NoticeFormPage
      editingPost={post as any}
      onSuccess={() => navigate({ to: '/admin/notices' })}
      onCancel={() => navigate({ to: '/admin/notices' })}
    />
  )
}
