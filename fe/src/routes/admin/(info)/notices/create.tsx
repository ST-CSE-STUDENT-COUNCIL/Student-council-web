import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { NoticeFormPage } from '../../../../components/notices/admin/NoticeFormPage'

export const Route = createFileRoute('/admin/(info)/notices/create')({
    component: CreateNoticePage,
})

function CreateNoticePage() {
    const navigate = useNavigate()
    return (
        <NoticeFormPage
            onSuccess={() => navigate({ to: '/admin/notices' })}
            onCancel={() => navigate({ to: '/admin/notices' })}
        />
    )
}
