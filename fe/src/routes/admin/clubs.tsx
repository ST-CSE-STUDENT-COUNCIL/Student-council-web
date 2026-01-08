import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/clubs')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/clubs"!</div>
}
