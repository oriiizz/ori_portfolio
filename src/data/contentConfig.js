/**
 * 星球资源：统一放在 **src/assets**（about、p1…p8 各目录 + `cover.*`、媒体与 `video.mp4`）。
 * 通过 `import.meta.glob` 在构建期收集路径，供 Vite 打包与 InfiniteMenu / 详情页使用。
 *
 * 球面顺序见 orbFaceOrder.js（ORB_FACE_ORDER），勿依赖 portfolioData.projects 数组顺序。
 *
 * **youtubeId**（在 portfolioData.projects[] 与 aboutOrbCard 上预留）：
 * 有合法 id 时详情页优先嵌入 YouTube；否则使用文件夹内 **video.mp4** 作为主视频（若存在），其余媒体照旧。
 */
import fallbackCover from '../assets/projects/placeholder-fallback.svg'
import { ORB_FACE_ORDER } from './orbFaceOrder.js'
import { portfolioData } from './portfolioData.js'

/** @deprecated 使用 ORB_FACE_ORDER；保留别名以免外部引用报错 */
export const ORB_FOLDER_ORDER = ORB_FACE_ORDER

/** glob 第二参须为字面量 */
const COVER_GLOB = import.meta.glob('../assets/**/cover.{jpg,jpeg,png,JPG,JPEG,PNG}', {
  eager: true,
  import: 'default',
  query: '?url',
})

const MEDIA_GLOB = import.meta.glob(
  '../assets/**/*.{jpg,jpeg,png,JPG,JPEG,webp,WEBP,gif,GIF,mp4,MP4,webm,WEBM,mov,MOV}',
  { eager: true, import: 'default', query: '?url' },
)

function pathSortKey(a, b) {
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

/**
 * @param {string} folderKey about | p1 | … | p8
 * @returns {string} Vite 解析后的资源 URL
 */
export function getCoverUrl(folderKey) {
  const hits = Object.entries(COVER_GLOB).filter(([path]) => {
    const n = path.replace(/\\/g, '/')
    const m = n.match(/assets\/([^/]+)\/cover\.(jpe?g|png)$/i)
    return m && m[1] === folderKey
  })
  if (hits.length === 0) return typeof fallbackCover === 'string' ? fallbackCover : String(fallbackCover)
  hits.sort((a, b) => pathSortKey(a[0], b[0]))
  const url = hits[0][1]
  return typeof url === 'string' ? url : String(url)
}

/**
 * 某文件夹内除 cover 以外的媒体（详情页 / About 浮层）。
 * @param {string} folderKey about | p1 | … | p8
 */
export function getFolderMedia(folderKey) {
  return Object.entries(MEDIA_GLOB)
    .filter(([path]) => {
      const n = path.replace(/\\/g, '/')
      if (!n.includes(`/assets/${folderKey}/`)) return false
      const file = n.split('/').pop() || ''
      if (/^cover\.(jpe?g|png)$/i.test(file)) return false
      return true
    })
    .map(([path, url]) => {
      const fileName = path.split(/[/\\]/).pop() || path
      const u = typeof url === 'string' ? url : String(url)
      const kind = /\.(mp4|webm|mov)$/i.test(fileName) ? 'video' : 'image'
      return { url: u, fileName, kind, _path: path }
    })
    .sort((a, b) => pathSortKey(a._path, b._path) || a.fileName.localeCompare(b.fileName, undefined, { numeric: true }))
    .map(({ url, fileName, kind }) => ({ url, fileName, kind }))
}

const YT_MAIN_VIDEO_RE = /^video\.(mp4|webm|mov)$/i

/**
 * 从字符串解析 YouTube 视频 id（11 位），支持裸 id、youtu.be、watch?v=
 * @param {string | undefined} raw
 * @returns {string | undefined}
 */
export function normalizeYoutubeId(raw) {
  if (raw == null || typeof raw !== 'string') return undefined
  const s = raw.trim()
  if (!s) return undefined
  let m = s.match(/(?:youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/)
  if (m) return m[1]
  m = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (m) return m[1]
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
  return undefined
}

/**
 * About 星球浮层若将来需 YouTube，可读此字段（当前 UI 未使用）。
 * @returns {string | undefined}
 */
export function getYoutubeVideoIdForAboutOrb() {
  return normalizeYoutubeId(portfolioData.aboutOrbCard?.youtubeId)
}

/**
 * @param {string} folderKey p1 | … | p8
 * @returns {string | undefined} 用于 /embed/<id> 的 id
 */
export function getYoutubeVideoIdForProject(folderKey) {
  const p = portfolioData.projects.find((x) => x.id === folderKey)
  return normalizeYoutubeId(p?.youtubeId)
}

/**
 * 详情页：含 YouTube 主视频时去掉文件夹内 video.*，避免与嵌入重复。
 * @param {string} folderKey about | p1 | … | p8
 */
export function getFolderMediaForProjectDetail(folderKey) {
  const items = getFolderMedia(folderKey)
  const yt = getYoutubeVideoIdForProject(folderKey)
  if (!yt) return items
  return items.filter((item) => {
    if (item.kind !== 'video') return true
    return !YT_MAIN_VIDEO_RE.test(item.fileName)
  })
}

/**
 * InfiniteMenu / WorksGrid：索引 0 = about，1–8 = p1…p8。
 */
export function buildInfiniteMenuItems() {
  const projectsById = new Map(portfolioData.projects.map((p) => [p.id, p]))

  return ORB_FACE_ORDER.map((faceId) => {
    if (faceId === 'about') {
      return {
        ...portfolioData.aboutOrbCard,
        image: getCoverUrl('about'),
      }
    }
    const p = projectsById.get(faceId)
    if (!p) {
      console.warn(`[contentConfig] portfolioData 缺少与球面格 "${faceId}" 对应的项目，请检查 id。`)
      return {
        image: getCoverUrl(faceId),
        link: `/project/${faceId}`,
        title: faceId,
        description: '',
      }
    }
    return {
      image: getCoverUrl(faceId),
      link: p.to,
      title: p.title,
      description: p.tags?.length ? p.tags.join(' · ') : p.titleEn || '\u00a0',
    }
  })
}
