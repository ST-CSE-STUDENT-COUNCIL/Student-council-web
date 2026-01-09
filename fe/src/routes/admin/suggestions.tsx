import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/suggestions')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/suggestions"!</div>
}
