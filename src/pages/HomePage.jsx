import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import SiteHeader from '../components/SiteHeader.jsx'
import WorksGrid from '../components/WorksGrid.jsx'
import WorkQuickNav from '../components/WorkQuickNav.jsx'
import { getFolderMedia } from '../data/contentConfig.js'
import { portfolioData } from '../data/portfolioData.js'

/** @typedef {'gallery' | 'about'} UiPhase */

function parseHashPhase() {
  if (typeof window === 'undefined') return 'gallery'
  const h = window.location.hash.slice(1)
  if (h === 'about' || h === 'contact') return 'about'
  return 'gallery'
}

function replaceHash(phase) {
  const hash = phase === 'gallery' ? '' : '#about'
  window.history.replaceState(null, '', `${window.location.pathname}${hash}`)
}

/** About / Education / Contact 并列标题（字号、字重、颜色一致） */
const SECTION_TITLE =
  'font-display text-3xl font-semibold tracking-wide text-stone-50 md:text-4xl'

export default function HomePage() {
  const { aboutDetail, contact } = portfolioData
  const aboutFolderMedia = useMemo(() => getFolderMedia('about'), [])
  const [phase, setPhase] = useState(/** @type {UiPhase} */ () => parseHashPhase())
  const [galleryKey, setGalleryKey] = useState(0)
  const phaseRef = useRef(phase)

  const sphereShellRef = useRef(null)
  const overlayRef = useRef(null)
  const didInitGsap = useRef(false)

  const navigatePhase = useCallback((/** @type {UiPhase} */ next) => {
    setPhase(next)
    replaceHash(next)
  }, [])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const handleOriClick = useCallback(() => {
    if (phaseRef.current === 'about') {
      setGalleryKey((k) => k + 1)
    }
    setPhase('gallery')
    replaceHash('gallery')
  }, [])

  useEffect(() => {
    const sync = () => setPhase(parseHashPhase())
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  useEffect(() => {
    const sphere = sphereShellRef.current
    const overlay = overlayRef.current
    if (!sphere || !overlay) return

    if (!didInitGsap.current) {
      didInitGsap.current = true
      if (phase === 'gallery') {
        gsap.set(sphere, { opacity: 1 })
        gsap.set(overlay, { opacity: 0, pointerEvents: 'none' })
      } else {
        gsap.set(sphere, { opacity: 0 })
        gsap.set(overlay, { opacity: 1, pointerEvents: 'auto' })
      }
      return
    }

    if (phase === 'gallery') {
      gsap
        .timeline()
        .to(overlay, { opacity: 0, duration: 0.58, ease: 'power2.inOut' })
        .set(overlay, { pointerEvents: 'none' })
        .to(sphere, { opacity: 1, duration: 0.56, ease: 'power2.out' }, '-=0.22')
    } else {
      gsap
        .timeline()
        .to(sphere, { opacity: 0, duration: 0.52, ease: 'power2.in' })
        .set(overlay, { pointerEvents: 'auto' })
        .to(overlay, { opacity: 1, duration: 0.48, ease: 'power2.out' }, '-=0.08')
    }
  }, [phase])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && phase !== 'gallery') navigatePhase('gallery')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, navigatePhase])

  const openAboutFromOrb = useCallback(() => {
    navigatePhase('about')
  }, [navigatePhase])

  return (
    <div className="fixed inset-0 h-[100dvh] w-[100vw] overflow-hidden bg-transparent">
      <SiteHeader onOriClick={handleOriClick} oriMuted={phase !== 'gallery'} />

      <main className="absolute inset-x-0 bottom-0 top-14 overflow-hidden md:top-16">
        <div className="relative flex h-full min-h-0 w-full flex-col px-4 pb-4 pt-1 md:px-8 md:pb-6">
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-stretch lg:gap-6">
            <div
              ref={sphereShellRef}
              className="relative order-2 flex min-h-0 min-w-0 flex-1 items-center justify-center lg:order-1"
            >
              <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[min(92vw,960px)] flex-1 items-center justify-center">
                <WorksGrid
                  key={galleryKey}
                  immersive
                  menuScale={0.76}
                  onAboutCardOpen={openAboutFromOrb}
                />
              </div>
            </div>
            <WorkQuickNav
              onAboutClick={openAboutFromOrb}
              dimmed={phase !== 'gallery'}
              className="order-1 w-full shrink-0 lg:order-2 lg:w-[min(100%,15.5rem)] xl:w-60"
            />
          </div>
        </div>

        <div
          ref={overlayRef}
          className="absolute inset-0 z-[20] overflow-y-auto overscroll-contain bg-[rgba(10,9,8,0.72)] px-5 py-8 backdrop-blur-md md:px-12 md:py-12"
          style={{ opacity: 0, pointerEvents: 'none' }}
          aria-hidden={phase === 'gallery'}
        >
          <div className="mx-auto flex max-w-3xl flex-col">
            {phase === 'about' ? (
              <>
                <section aria-labelledby="about-heading">
                  <h2 id="about-heading" className={SECTION_TITLE}>
                    About
                  </h2>
                  <div className="mt-6 space-y-5 font-sans text-lg leading-relaxed text-stone-300 md:text-xl">
                    {aboutDetail.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  {aboutFolderMedia.length > 0 ? (
                    <div
                      className="mt-10 flex flex-col gap-10 md:mt-12 md:gap-12"
                      aria-label="Additional media from assets/about"
                    >
                      {aboutFolderMedia.map((item) =>
                        item.kind === 'video' ? (
                          <figure key={item.url} className="m-0 overflow-hidden shadow-sm ring-1 ring-sage/20">
                            <video
                              className="block h-auto w-full object-cover"
                              controls
                              playsInline
                              preload="metadata"
                              src={item.url}
                            />
                            <figcaption className="sr-only">{item.fileName}</figcaption>
                          </figure>
                        ) : (
                          <figure key={item.url} className="m-0 overflow-hidden shadow-sm ring-1 ring-sage/20">
                            <img
                              src={item.url}
                              alt={item.fileName}
                              className="block h-auto w-full object-cover"
                              loading="lazy"
                            />
                          </figure>
                        ),
                      )}
                    </div>
                  ) : null}
                </section>

                <section className="mt-14 md:mt-20" aria-labelledby="education-heading">
                  <h2 id="education-heading" className={SECTION_TITLE}>
                    Education
                  </h2>
                  <ul className="mt-6 space-y-10 md:space-y-12">
                    {aboutDetail.education.map((block) => (
                      <li key={block.school}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                          <span className="font-semibold text-stone-200">{block.school}</span>
                          <span className="shrink-0 tabular-nums text-stone-500">{block.range}</span>
                        </div>
                        {block.lines.map((line) => (
                          <p key={line} className="mt-3 text-stone-300">
                            {line}
                          </p>
                        ))}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-14 md:mt-20 pb-8" aria-labelledby="contact-heading">
                  <h2 id="contact-heading" className={SECTION_TITLE}>
                    Contact
                  </h2>
                  <p className="mt-6 font-sans text-lg text-stone-200 md:text-xl">
                    <a
                      href={`mailto:${contact.email}`}
                      className="target-link break-all underline decoration-sage/40 underline-offset-[6px] transition hover:text-stone-50 hover:decoration-sage"
                    >
                      {contact.email}
                    </a>
                  </p>
                  {contact.social?.length ? (
                    <ul className="mt-6 flex flex-col gap-3 font-sans text-lg text-stone-300 md:text-xl">
                      {contact.social.map((s) => (
                        <li key={s.href}>
                          <a
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="target-link underline decoration-sage/35 underline-offset-[5px] transition hover:text-stone-100"
                          >
                            {s.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              </>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
