import { useEffect, useRef, useId } from 'react'
import { gsap } from 'gsap'

const lerp = (a, b, n) => (1 - n) * a + n * b

const getMousePos = (e, containerEl) => {
  if (containerEl) {
    const bounds = containerEl.getBoundingClientRect()
    return {
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    }
  }
  return { x: e.clientX, y: e.clientY }
}

/** 鼠标下方命中任一选择器即触发噪点（elementFromPoint + closest） */
export const CROSSHAIR_NOISE_TARGET_SELECTOR =
  'a, button, .target-link, img, canvas, h1, h2, h3, p, .project-card'

const DISPLACEMENT_SCALE = 120
const LINE_THIN = { h: 1, w: 1 }
const LINE_THICK = { h: 2.75, w: 2.75 }

/**
 * 全屏十字准星：lerp 跟手；pointer-events: none 不挡点击。
 * containerRef 不传时使用 window 坐标（全站跟随）。
 */
export default function Crosshair({
  color = 'rgba(28, 25, 23, 0.42)',
  containerRef = null,
  smoothAmt = 0.12,
}) {
  const uid = useId().replace(/:/g, '')
  const filterXId = `crosshair-noise-x-${uid}`
  const filterYId = `crosshair-noise-y-${uid}`

  const lineHorizontalRef = useRef(null)
  const lineVerticalRef = useRef(null)
  const filterXSvgRef = useRef(null)
  const filterYSvgRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const noiseActiveRef = useRef(false)

  useEffect(() => {
    const containerEl = containerRef?.current ?? null
    const moveTarget = containerEl ?? window

    const init = () => {
      if (containerEl) {
        const b = containerEl.getBoundingClientRect()
        return { x: b.width / 2, y: b.height / 2 }
      }
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    }

    const p0 = init()
    mouseRef.current = { ...p0 }

    const renderedStyles = {
      tx: { previous: p0.x, current: p0.x, amt: smoothAmt },
      ty: { previous: p0.y, current: p0.y, amt: smoothAmt },
    }

    const primitiveValues = { turbulence: 0 }

    const tl = gsap
      .timeline({
        paused: true,
        onStart: () => {
          const h = lineHorizontalRef.current
          const v = lineVerticalRef.current
          if (h) h.style.filter = `url(#${filterXId})`
          if (v) v.style.filter = `url(#${filterYId})`
        },
        onUpdate: () => {
          const bx = filterXSvgRef.current
          const by = filterYSvgRef.current
          const t = Math.max(0, primitiveValues.turbulence)
          if (bx) bx.setAttribute('baseFrequency', String(t))
          if (by) by.setAttribute('baseFrequency', String(t))
        },
        onComplete: () => {
          const h = lineHorizontalRef.current
          const v = lineVerticalRef.current
          if (h) h.style.filter = 'none'
          if (v) v.style.filter = 'none'
        },
      })
      .to(primitiveValues, {
        duration: 0.8,
        ease: 'elastic.out(1, 0.3)',
        startAt: { turbulence: 2.75 },
        turbulence: 0,
      })

    const enter = () => {
      tl.restart()
      const h = lineHorizontalRef.current
      const v = lineVerticalRef.current
      if (h) gsap.to(h, { height: LINE_THICK.h, duration: 0.18, ease: 'power2.out' })
      if (v) gsap.to(v, { width: LINE_THICK.w, duration: 0.18, ease: 'power2.out' })
    }
    const leave = () => {
      tl.progress(1)
      tl.pause()
      const h = lineHorizontalRef.current
      const v = lineVerticalRef.current
      if (h) gsap.to(h, { height: LINE_THIN.h, duration: 0.22, ease: 'power2.inOut' })
      if (v) gsap.to(v, { width: LINE_THIN.w, duration: 0.22, ease: 'power2.inOut' })
    }

    const handleMouseMove = (ev) => {
      mouseRef.current = getMousePos(ev, containerEl)

      const top = document.elementFromPoint(ev.clientX, ev.clientY)
      const hit = top?.closest?.(CROSSHAIR_NOISE_TARGET_SELECTOR)
      const onNoiseTarget = !!hit
      if (onNoiseTarget && !noiseActiveRef.current) {
        noiseActiveRef.current = true
        enter()
      } else if (!onNoiseTarget && noiseActiveRef.current) {
        noiseActiveRef.current = false
        leave()
      }

      if (containerEl) {
        const bounds = containerEl.getBoundingClientRect()
        const inside =
          ev.clientX >= bounds.left &&
          ev.clientX <= bounds.right &&
          ev.clientY >= bounds.top &&
          ev.clientY <= bounds.bottom
        gsap.to([lineHorizontalRef.current, lineVerticalRef.current], {
          opacity: inside ? 1 : 0,
          duration: 0.12,
          overwrite: 'auto',
        })
      } else {
        gsap.to([lineHorizontalRef.current, lineVerticalRef.current], {
          opacity: 1,
          duration: 0.2,
          overwrite: 'auto',
        })
      }
    }

    moveTarget.addEventListener('mousemove', handleMouseMove, { passive: true })

    gsap.set([lineHorizontalRef.current, lineVerticalRef.current], { opacity: 0 })
    gsap.to([lineHorizontalRef.current, lineVerticalRef.current], {
      opacity: 1,
      duration: 0.55,
      ease: 'power2.out',
      delay: 0.05,
    })

    let rafId = 0
    const tick = () => {
      const mouse = mouseRef.current
      renderedStyles.tx.current = mouse.x
      renderedStyles.ty.current = mouse.y

      renderedStyles.tx.previous = lerp(
        renderedStyles.tx.previous,
        renderedStyles.tx.current,
        renderedStyles.tx.amt,
      )
      renderedStyles.ty.previous = lerp(
        renderedStyles.ty.previous,
        renderedStyles.ty.current,
        renderedStyles.ty.amt,
      )

      const vLine = lineVerticalRef.current
      const hLine = lineHorizontalRef.current
      if (vLine) gsap.set(vLine, { x: renderedStyles.tx.previous })
      if (hLine) gsap.set(hLine, { y: renderedStyles.ty.previous })

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      moveTarget.removeEventListener('mousemove', handleMouseMove)
      noiseActiveRef.current = false
      tl.kill()
    }
  }, [containerRef, smoothAmt, filterXId, filterYId])

  const positionMode = containerRef ? 'absolute' : 'fixed'

  return (
    <div
      className="pointer-events-none"
      style={{
        position: positionMode,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 20000,
      }}
      aria-hidden="true"
    >
      <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }} aria-hidden="true">
        <defs>
          <filter id={filterXId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.000001"
              numOctaves="1"
              ref={filterXSvgRef}
            />
            <feDisplacementMap in="SourceGraphic" scale={DISPLACEMENT_SCALE} />
          </filter>
          <filter id={filterYId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.000001"
              numOctaves="1"
              ref={filterYSvgRef}
            />
            <feDisplacementMap in="SourceGraphic" scale={DISPLACEMENT_SCALE} />
          </filter>
        </defs>
      </svg>
      <div
        ref={lineHorizontalRef}
        style={{
          position: 'absolute',
          width: '100%',
          height: '1px',
          background: color,
          pointerEvents: 'none',
          transform: 'translateY(50%)',
          opacity: 0,
          willChange: 'transform, opacity, height',
          borderRadius: 1,
        }}
      />
      <div
        ref={lineVerticalRef}
        style={{
          position: 'absolute',
          height: '100%',
          width: '1px',
          background: color,
          pointerEvents: 'none',
          transform: 'translateX(50%)',
          opacity: 0,
          willChange: 'transform, opacity, width',
          borderRadius: 1,
        }}
      />
    </div>
  )
}
