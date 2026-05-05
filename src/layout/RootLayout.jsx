import { Suspense } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import Crosshair from '../components/Crosshair.jsx'
import Galaxy from '../components/Galaxy/Galaxy.jsx'

function RouteFallback() {
  return <div className="min-h-dvh bg-transparent" aria-hidden />
}

export default function RootLayout() {
  const location = useLocation()

  return (
    <div className="relative isolate min-h-dvh bg-transparent">
      <Galaxy
        transparent
        mouseInteraction={false}
        density={0.8}
        saturation={0}
        hueShift={0}
        glowIntensity={0.38}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />
      <ScrollRestoration />
      <Crosshair color="rgba(244, 240, 232, 0.38)" />
      <div className="relative z-10 min-h-dvh bg-transparent">
        <Suspense fallback={<RouteFallback />}>
          <div key={location.pathname} className="route-page-enter min-h-dvh">
            <Outlet />
          </div>
        </Suspense>
      </div>
    </div>
  )
}
