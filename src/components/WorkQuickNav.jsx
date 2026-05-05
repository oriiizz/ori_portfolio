import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { buildInfiniteMenuItems } from '../data/contentConfig.js'

const itemBase =
  'block w-full rounded-md px-2.5 py-2 text-left font-sans text-sm leading-snug text-stone-200 outline-none transition md:px-3 md:text-[0.9375rem] ' +
  'hover:bg-stone-100/8 hover:text-stone-50 focus-visible:bg-stone-100/10 focus-visible:ring-2 focus-visible:ring-sage/40'

/**
 * 球体旁的快速目录：与 ORB_FACE_ORDER 顺序一致，便于不转球直接进入 About 或项目页。
 *
 * @param {object} props
 * @param {() => void} props.onAboutClick
 * @param {boolean} [props.dimmed] 浮层打开时略暗
 * @param {string} [props.className]
 */
export default function WorkQuickNav({ onAboutClick, dimmed = false, className = '' }) {
  const items = useMemo(() => buildInfiniteMenuItems(), [])

  return (
    <aside
      className={`flex flex-col ${dimmed ? 'opacity-45' : 'opacity-100'} transition-opacity duration-300 ${className}`.trim()}
      aria-label="作品快速目录"
    >
      <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-stone-500 md:text-xs">
        快速进入
      </p>
      <p className="mt-0.5 hidden font-sans text-[0.7rem] leading-tight text-stone-600 md:block">
        点击标题跳转；也可拖动球体浏览。
      </p>

      <ul className="mt-2 flex flex-row gap-1.5 overflow-x-auto overflow-y-hidden pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 md:mt-3 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <li key={`${item.aboutCard ? 'about' : item.link}`} className="shrink-0 md:w-full md:shrink">
            {item.aboutCard ? (
              <button type="button" onClick={onAboutClick} className={`${itemBase} md:border md:border-transparent md:hover:border-sage/25`}>
                <span className="line-clamp-2 md:line-clamp-3">{item.title}</span>
              </button>
            ) : (
              <Link
                to={item.link}
                className={`${itemBase} md:border md:border-transparent md:hover:border-sage/25 no-underline`}
              >
                <span className="line-clamp-2 max-w-[42vw] sm:max-w-[min(52vw,14rem)] md:max-w-none md:line-clamp-4">
                  {item.title}
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </aside>
  )
}
