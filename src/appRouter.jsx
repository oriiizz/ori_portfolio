import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootLayout from './layout/RootLayout.jsx'
import RouteErrorFallback from './components/RouteErrorFallback.jsx'
import { HomePageLazy, ProjectDetailPageLazy } from './lazyPages.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, element: <HomePageLazy /> },
      { path: 'home', element: <Navigate to="/" replace /> },
      { path: 'about', element: <Navigate to={{ pathname: '/', hash: 'about' }} replace /> },
      { path: 'project/:projectId', element: <ProjectDetailPageLazy /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
