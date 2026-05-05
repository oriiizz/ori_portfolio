import { Link } from 'react-router-dom'

/**
 * 左上角「ori」+ 站点状态文案。首頁可傳 onOriClick：關閉覆蓋層並重置畫廊。
 * @param {object} [props]
 * @param {() => void} [props.onOriClick] 首頁專用：點擊回畫廊並重置球體
 * @param {boolean} [props.oriMuted] 覆蓋層打開時略暗
 */
export default function SiteHeader({ onOriClick = null, oriMuted = false }) {
  const isHome = typeof onOriClick === 'function'

  return (
    <header
      className="fixed inset-x-0 top-0 z-[10050] border-0 bg-transparent shadow-none"
      role="banner"
    >
      <div className="flex items-center px-4 py-3 md:px-6 md:py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          {isHome ? (
            <button
              type="button"
              onClick={onOriClick}
              className={`shrink-0 font-display border-0 bg-transparent p-0 text-left text-3xl font-bold leading-none tracking-wide transition md:text-4xl ${
                oriMuted ? 'text-stone-400 hover:text-stone-200' : 'text-stone-50 hover:text-stone-100'
              }`}
            >
              ori
            </button>
          ) : (
            <Link
              to="/"
              className="shrink-0 font-display text-3xl font-bold leading-none tracking-wide text-stone-100 no-underline transition hover:text-stone-50 md:text-4xl"
            >
              ori
            </Link>
          )}
          <div
            className={`max-w-[min(100%,22rem)] rounded-lg border px-3.5 py-2 shadow-md backdrop-blur-md md:max-w-lg md:px-4 md:py-2.5 ${
              oriMuted
                ? 'border-stone-600/60 bg-stone-950/55 ring-1 ring-stone-700/40'
                : 'border-amber-400/60 bg-stone-950/80 ring-2 ring-amber-400/25 shadow-amber-950/30'
            }`}
            role="status"
          >
            <p
              className={`font-sans text-sm font-semibold leading-snug tracking-wide md:text-base ${
                oriMuted ? 'text-stone-300' : 'text-amber-100'
              }`}
            >
              装修维护中...敬请期待1/6/2026开服
            </p>
            <p
              className={`mt-1.5 font-sans text-xs font-semibold leading-snug md:text-sm ${
                oriMuted ? 'text-stone-500' : 'text-stone-100'
              }`}
            >
              <span
                className={`rounded px-1.5 py-0.5 ring-1 ${
                  oriMuted
                    ? 'bg-stone-800/90 text-stone-400 ring-stone-600/60'
                    : 'bg-amber-500/25 text-amber-100 ring-amber-400/40'
                }`}
              >
                提示
              </span>
              <span className="ml-2">拖动选择球体</span>
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
