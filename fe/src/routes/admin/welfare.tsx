import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/welfare')({
    component: AdminWelfarePage,
})

function AdminWelfarePage() {
    return (
        <div>Hello "/admin/welfare"!</div>
    )
}
