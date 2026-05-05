import { lazy } from 'react'

/** 欢迎页同步打包进首包，避免多一次 chunk 请求；主页与项目页按需加载 */
export const HomePageLazy = lazy(() => import('./pages/HomePage.jsx'))
export const ProjectDetailPageLazy = lazy(() => import('./pages/ProjectDetailPage.jsx'))
