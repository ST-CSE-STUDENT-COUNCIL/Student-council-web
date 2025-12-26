import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/notice')({
  component: Notice,
})

function Notice() {
  return <div className="p-4 text-xl">/notice</div>
}
