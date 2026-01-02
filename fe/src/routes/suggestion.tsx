import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/suggestion')({
  component: Suggestion,
})

function Suggestion() {
  return <div className="p-4 text-xl">/suggestion</div>
}
