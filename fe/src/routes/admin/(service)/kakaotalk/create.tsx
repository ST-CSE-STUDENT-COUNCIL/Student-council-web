import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { KakaoTalkForm } from '../../../../components/activities/admin/KakaoTalkForm'

export const Route = createFileRoute('/admin/(service)/kakaotalk/create')({
  component: CreateKakaoTalkPage,
})

function CreateKakaoTalkPage() {
  const navigate = useNavigate()

  return (
    <KakaoTalkForm
      onSuccess={() => navigate({ to: '/admin/kakaotalk' })}
      onCancel={() => navigate({ to: '/admin/kakaotalk' })}
    />
  )
}
