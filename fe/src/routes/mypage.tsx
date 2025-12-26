import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/mypage')({
  component: MyPage,
})

function MyPage() {
  return <div className="p-4 text-xl">/mypage</div>
}
