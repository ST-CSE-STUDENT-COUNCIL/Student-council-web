import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { EventForm } from '../../../components/activities/admin/EventForm'

export const Route = createFileRoute('/admin/events/create')({
    component: CreateEventPage,
})

function CreateEventPage() {
    const navigate = useNavigate()

    return (
        <EventForm
            onSuccess={() => navigate({ to: '/admin/events' })}
            onCancel={() => navigate({ to: '/admin/events' })}
        />
    )
}
