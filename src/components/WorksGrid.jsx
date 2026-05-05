import { useMemo } from 'react'
import InfiniteMenu from './InfiniteMenu/InfiniteMenu.jsx'
import { buildInfiniteMenuItems } from '../data/contentConfig.js'

/**
 * @param {object} [props]
 * @param {boolean} [props.immersive]
 * @param {number} [props.menuScale]
 * @param {() => void} [props.onAboutCardOpen] 点击「About」球面卡片按钮时回调（不跳转）
 */
export default function WorksGrid({ immersive = false, menuScale = 1, onAboutCardOpen }) {
  const items = useMemo(() => buildInfiniteMenuItems(), [])

  const sizeClass = immersive
    ? 'h-full min-h-0 w-full flex-1'
    : 'min-h-[min(100dvh,920px)] h-[min(100dvh,920px)] md:min-h-[800px] md:h-[800px]'

  return (
    <div className={`works-infinite-menu relative ${sizeClass}`} aria-label="Works sphere menu">
      <InfiniteMenu items={items} scale={menuScale} onAboutCardOpen={onAboutCardOpen} />
    </div>
  )
}
