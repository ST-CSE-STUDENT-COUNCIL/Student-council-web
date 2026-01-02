import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

//폰트 적용
import 'pretendard/dist/web/static/pretendard.css'
import './styles/index.css'

const router = createRouter({ routeTree })

// 타입스크립트를 위한 등록
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// 앱 렌더
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}
