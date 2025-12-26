import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/welfare')({
  component: Welfare,
})

function Welfare() {
  return <div className="p-4 text-xl">/welfare</div>
}
