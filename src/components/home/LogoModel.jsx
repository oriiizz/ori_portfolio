import { Suspense, useRef, useEffect, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Center, Environment, Html, useGLTF } from '@react-three/drei'

const lerp = (a, b, t) => (1 - t) * a + t * b

const MODEL_URL = `${import.meta.env.BASE_URL}models/face1.glb`

/** 略放寬粗糙度下限，讓環境光與主光在表面上有更多層次，不會整塊發灰 */
function tuneMaterialsForLighting(scene) {
  scene.traverse((obj) => {
    if (!obj.isMesh) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const mat of mats) {
      if (mat?.isMeshStandardMaterial) {
        mat.roughness = Math.min(Math.max(mat.roughness ?? 0.5, 0.42), 0.85)
        mat.metalness = Math.min(mat.metalness ?? 0, 0.12)
        mat.envMapIntensity = Math.max(mat.envMapIntensity ?? 1, 1.15)
      }
    }
  })
}

const MODEL_SCALE = 1.42

function FaceMesh() {
  const { scene } = useGLTF(MODEL_URL)

  useLayoutEffect(() => {
    tuneMaterialsForLighting(scene)
  }, [scene])

  const tiltRef = useRef(null)
  const targetRef = useRef({ x: 0, y: 0 })
  const smoothRef = useRef({ x: 0, y: 0 })
  const scrollRef = useRef(0)
  const reduceMotionRef = useRef(false)

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    const onMove = (e) => {
      targetRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      }
    }
    const onScroll = () => {
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      scrollRef.current = max > 1 ? el.scrollTop / max : 0
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useFrame(() => {
    const rm = reduceMotionRef.current
    const amt = 0.12
    smoothRef.current.x = lerp(smoothRef.current.x, targetRef.current.y, amt)
    smoothRef.current.y = lerp(smoothRef.current.y, targetRef.current.x, amt)

    const tilt = tiltRef.current
    if (!tilt) return

    const scrollPitch = (scrollRef.current - 0.5) * 0.32
    if (rm) {
      tilt.rotation.x = scrollPitch
      tilt.rotation.y = 0
      return
    }

    tilt.rotation.x = smoothRef.current.x * 0.2 + scrollPitch
    tilt.rotation.y = smoothRef.current.y * 0.18
  })

  return (
    <group ref={tiltRef}>
      <Center>
        <group scale={MODEL_SCALE}>
          <primitive object={scene} />
        </group>
      </Center>
    </group>
  )
}

function LoadingFallback() {
  return (
    <Html center>
      <span className="select-none font-sans text-sm tracking-wide text-stone-500/90">Loading</span>
    </Html>
  )
}

/**
 * 首頁 Hero：face1.glb，環境 HDR + 多燈、滑鼠與捲動聯動（無自轉）。
 */
export default function LogoModel() {
  return (
    <>
      <hemisphereLight args={['#f5f0e8', '#1c1917', 0.62]} position={[0, 1, 0]} />
      <ambientLight intensity={0.52} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} color="#fffaf5" />
      <directionalLight position={[-4, 2, 3]} intensity={0.45} color="#e7e2db" />
      <spotLight
        position={[4.5, 7.5, 5]}
        angle={0.42}
        penumbra={0.55}
        intensity={2.05}
        color="#fff8f0"
      />
      <spotLight position={[-3.5, 3.2, 4]} intensity={0.95} color="#d6d0c8" />

      <Suspense fallback={<LoadingFallback />}>
        <Environment preset="studio" environmentIntensity={0.95} />
        <FaceMesh />
      </Suspense>
    </>
  )
}

useGLTF.preload(MODEL_URL)
