import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/intro')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/intro"!</div>
}
