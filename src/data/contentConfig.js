/**
 * 星球资源：
 * 1) personal/assets（仓库上一级）：推荐把 about/（About 星球）、p1/…p8/ 与 cover 放在这里
 * 2) src/assets：占位图、本地兜底
 *
 * 目录约定：about/cover.*、p1/cover.* … p8/cover.*
 * 球面贴图顺序见 orbFaceOrder.js（ORB_FACE_ORDER），勿依赖 portfolioData.projects 数组顺序。
 */
import fallbackCover from '../assets/projects/placeholder-fallback.svg'
import { ORB_FACE_ORDER } from './orbFaceOrder.js'
import { portfolioData } from './portfolioData.js'

/** @deprecated 使用 ORB_FACE_ORDER；保留别名以免外部引用报错 */
export const ORB_FOLDER_ORDER = ORB_FACE_ORDER

/** 项目内 src/assets（占位、fallback 等） — glob 第二参须为字面量，不能是变量 */
const COVER_GLOB_SRC = import.meta.glob('../assets/**/cover.{jpg,jpeg,png,JPG,JPEG,PNG}', {
  eager: true,
  import: 'default',
  query: '?url',
})
/** 仓库上一级 personal/assets */
const COVER_GLOB_WORKSPACE = import.meta.glob('../../../assets/**/cover.{jpg,jpeg,png,JPG,JPEG,PNG}', {
  eager: true,
  import: 'default',
  query: '?url',
})

const MEDIA_GLOB_SRC = import.meta.glob(
  '../assets/**/*.{jpg,jpeg,png,JPG,JPEG,webp,WEBP,gif,GIF,mp4,MP4,webm,WEBM,mov,MOV}',
  { eager: true, import: 'default', query: '?url' },
)
const MEDIA_GLOB_WORKSPACE = import.meta.glob(
  '../../../assets/**/*.{jpg,jpeg,png,JPG,JPEG,webp,WEBP,gif,GIF,mp4,MP4,webm,WEBM,mov,MOV}',
  { eager: true, import: 'default', query: '?url' },
)

function mergeGlobs(primaryWorkspace, secondarySrc) {
  const out = { ...secondarySrc, ...primaryWorkspace }
  return out
}

/** workspace 后展开，同名 key 以 personal/assets 为准 */
const COVER_GLOB = mergeGlobs(COVER_GLOB_WORKSPACE, COVER_GLOB_SRC)
const MEDIA_GLOB = mergeGlobs(MEDIA_GLOB_WORKSPACE, MEDIA_GLOB_SRC)

/** 排序：优先 ../../../assets（personal），再 src/assets */
function prefersWorkspacePath(key) {
  const n = key.replace(/\\/g, '/')
  if (n.includes('../../../assets')) return 2
  if (n.includes('../assets')) return 1
  return 0
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
  hits.sort((a, b) => prefersWorkspacePath(b[0]) - prefersWorkspacePath(a[0]) || a[0].localeCompare(b[0]))
  const url = hits[0][1]
  return typeof url === 'string' ? url : String(url)
}

/**
 * 某星球文件夹内除 cover 以外的媒体（详情页画廊 / About 浮层展示 assets/about 等）。
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
    .sort((a, b) => prefersWorkspacePath(b._path) - prefersWorkspacePath(a._path) || a.fileName.localeCompare(b.fileName, undefined, { numeric: true }))
    .map(({ url, fileName, kind }) => ({ url, fileName, kind }))
}

/**
 * InfiniteMenu / WorksGrid 的 items：索引 0 = about 文件夹（About 星球），1–8 = p1…p8。
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
