import { Link, Navigate, useParams } from 'react-router-dom'
import { portfolioData } from '../data/portfolioData.js'
import { getFolderMediaForProjectDetail, getYoutubeVideoIdForProject } from '../data/contentConfig.js'

const VALID_IDS = new Set(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'])

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  if (!projectId || !VALID_IDS.has(projectId)) {
    return <Navigate to="/" replace />
  }

  const project = portfolioData.projects.find((p) => p.id === projectId)
  if (!project) return <Navigate to="/" replace />

  const youtubeId = getYoutubeVideoIdForProject(projectId)
  const mediaAll = getFolderMediaForProjectDetail(projectId)
  /** 无 YouTube 时：主视频为同目录 video.mp4（若存在），避免与其它片段重复列出 */
  const primaryLocalVideo =
    !youtubeId && mediaAll.find((m) => m.kind === 'video' && /^video\.mp4$/i.test(m.fileName))
  const galleryMedia = primaryLocalVideo ? mediaAll.filter((m) => m !== primaryLocalVideo) : mediaAll
  const tagline = project.tags?.length ? project.tags.join(' · ') : project.titleEn || ''

  /** playlist= 与视频 id 相同才能让 loop=1 在单曲 embed 下生效 */
  const youtubeEmbedSrc = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3`
    : null

  const openingParagraphs = project.openingParagraphs ?? []
  const closingParagraphs = project.closingParagraphs ?? []
  const footerCredit = project.footerCredit ?? '© Portfolio'

  return (
    <>
      <header
        className="relative z-[10050] border-b border-sage/40 bg-[rgba(10,9,8,0.72)] backdrop-blur-md"
        role="banner"
      >
        <div className="mx-auto max-w-6xl px-6 py-6 md:px-10 md:py-8">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 font-sans text-2xl font-semibold tracking-wide text-stone-300 underline decoration-transparent underline-offset-[5px] transition hover:text-stone-50 hover:decoration-sage/50 sm:text-3xl"
          >
            <span aria-hidden="true" className="text-stone-500 transition group-hover:text-stone-300">
              ←
            </span>
            Back to Home
          </Link>
        </div>
      </header>

      <main className="bg-transparent">
        <section className="px-6 pb-10 pt-10 md:px-10 md:pb-12 md:pt-14" aria-labelledby="project-title">
          <div className="mx-auto max-w-5xl text-center">
            <h1
              id="project-title"
              className="font-display text-4xl font-bold leading-[1.12] text-stone-50 sm:text-5xl md:text-6xl lg:text-7xl"
            >
              {project.title}
            </h1>
            {tagline ? (
              <p className="mx-auto mt-5 font-sans text-2xl font-semibold tracking-wide text-stone-400 md:mt-6 md:text-3xl lg:text-4xl">
                {tagline}
              </p>
            ) : null}
          </div>
        </section>

        <section className="pb-20 md:pb-28" aria-label="Project content">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 md:gap-14 md:px-10">
            {openingParagraphs.length > 0 ? (
              <div className="prose-long mx-auto w-full max-w-[800px] font-sans text-xl font-normal leading-[1.7] text-stone-300 md:text-2xl">
                {openingParagraphs.map((text, i) => (
                  <p key={i} className={i === 0 ? 'text-justify' : 'mt-6 text-justify md:mt-7'}>
                    {text}
                  </p>
                ))}
              </div>
            ) : null}

            {youtubeEmbedSrc ? (
              <figure className="m-0 w-full overflow-hidden bg-black shadow-sm ring-1 ring-sage/20">
                <div className="relative aspect-video w-full">
                  <iframe
                    title={`${project.title} — video`}
                    className="absolute inset-0 h-full w-full border-0"
                    src={youtubeEmbedSrc}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
                <figcaption className="sr-only">YouTube video</figcaption>
              </figure>
            ) : null}

            {!youtubeEmbedSrc && primaryLocalVideo ? (
              <figure className="m-0 overflow-hidden shadow-sm ring-1 ring-sage/20">
                <div className="relative aspect-video w-full bg-black">
                  <video
                    className="absolute inset-0 h-full w-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                    src={primaryLocalVideo.url}
                  />
                </div>
                <figcaption className="sr-only">{primaryLocalVideo.fileName}</figcaption>
              </figure>
            ) : null}

            {galleryMedia.map((item) =>
              item.kind === 'video' ? (
                <figure key={item.url} className="m-0 overflow-hidden rounded-none shadow-sm">
                  <video
                    className="block h-auto w-full rounded-none object-cover"
                    controls
                    playsInline
                    preload="metadata"
                    src={item.url}
                  />
                  <figcaption className="sr-only">{item.fileName}</figcaption>
                </figure>
              ) : (
                <figure key={item.url} className="m-0 overflow-hidden rounded-none shadow-sm">
                  <img
                    src={item.url}
                    alt={item.fileName}
                    className="block h-auto w-full rounded-none object-cover"
                    loading="lazy"
                  />
                </figure>
              ),
            )}

            {closingParagraphs.length > 0 ? (
              <div
                className="prose-long w-full font-sans text-xl font-normal leading-[1.7] text-stone-300 md:text-2xl"
                role="region"
                aria-label="Additional statement"
              >
                {closingParagraphs.map((text, i) => (
                  <p key={i} className={i === 0 ? 'text-justify' : 'mt-6 text-justify md:mt-7'}>
                    {text}
                  </p>
                ))}
              </div>
            ) : null}

            {galleryMedia.length === 0 &&
            !youtubeEmbedSrc &&
            !primaryLocalVideo &&
            openingParagraphs.length === 0 &&
            closingParagraphs.length === 0 ? (
              <p className="text-center font-sans text-lg text-stone-500">
                将图片或视频放入 <code className="text-stone-400">src/assets/{projectId}/</code> 后刷新即可显示。
              </p>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="border-t border-sage/40 bg-transparent py-10 md:py-12">
        <div className="mx-auto max-w-6xl px-6 text-center md:px-10">
          <p className="font-sans text-xl font-normal tracking-wide text-stone-500 md:text-2xl">{footerCredit}</p>
        </div>
      </footer>
    </>
  )
}
