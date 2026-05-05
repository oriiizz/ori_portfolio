import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import './spa-overrides.css'
import RootErrorBoundary from './components/RootErrorBoundary.jsx'
import { router } from './appRouter.jsx'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('[main.jsx] Missing #root — check pixel-welcome/index.html')
}

createRoot(rootEl).render(
  <StrictMode>
    <RootErrorBoundary>
      <RouterProvider router={router} />
    </RootErrorBoundary>
  </StrictMode>,
)
