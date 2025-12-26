import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/clubs')({
  component: Clubs,
})

function Clubs() {
  return <div className="p-4 text-xl">/clubs</div>
}
