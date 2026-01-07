import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/suggestion')({
    component: Suggestion,
})

function Suggestion() {
    return <div>Hello "/suggestion"!</div>
}