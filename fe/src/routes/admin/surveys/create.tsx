import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SurveyForm } from '../../../components/activities/admin/SurveyForm'

export const Route = createFileRoute('/admin/surveys/create')({
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
