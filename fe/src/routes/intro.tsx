import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/intro')({
  component: Intro,
})

function Intro() {
  return <div className="p-4 text-xl">/intro</div>
}
