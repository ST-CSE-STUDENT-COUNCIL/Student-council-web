import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SurveyForm } from '../../../../components/activities/admin/SurveyForm'

export const Route = createFileRoute('/admin/(service)/surveys/create')({
    component: CreateSurveyPage,
})

function CreateSurveyPage() {
    const navigate = useNavigate()

    return (
        <SurveyForm
            onSuccess={() => navigate({ to: '/admin/surveys' })}
            onCancel={() => navigate({ to: '/admin/surveys' })}
        />
    )
}
