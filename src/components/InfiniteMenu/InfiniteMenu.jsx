import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mat4, quat, vec2, vec3 } from 'gl-matrix'
import fallbackCover from '@assets/projects/placeholder-fallback.svg'
import './InfiniteMenu.css'

/** 仅对外链 http(s) 且跨域资源设 crossOrigin；本地 / Vite 资源设 anonymous 会导致加载失败，WebGL 贴图全空 */
function textureImageSrc(src) {
  if (src == null || src === '') return typeof fallbackCover === 'string' ? fallbackCover : String(fallbackCover)
  return typeof src === 'string' ? src : String(src)
}

function shouldSetCrossOrigin(url) {
  if (typeof window === 'undefined' || !/^https?:\/\//i.test(url)) return false
  try {
    return new URL(url, window.location.href).origin !== window.location.origin
  } catch {
    return false
  }
}

function loadImageForAtlas(src) {
  const resolved = textureImageSrc(src)
  return new Promise((resolve) => {
    const img = new Image()
    if (shouldSetCrossOrigin(resolved)) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      const fbSrc = textureImageSrc(fallbackCover)
      const fb = new Image()
      if (shouldSetCrossOrigin(fbSrc)) fb.crossOrigin = 'anonymous'
      fb.onload = () => resolve(fb)
      fb.onerror = () => resolve(img)
      fb.src = fbSrc
    }
    img.src = resolved
  }).then((img) => {
    if (typeof img.decode === 'function') {
      return img.decode().then(() => img).catch(() => img)
    }
    return img
  })
}

const discVertShaderSource = `#version 300 es

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec4 uRotationAxisVelocity;

in vec3 aModelPosition;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;

out vec2 vUvs;
out float vAlpha;
flat out int vInstanceId;

#define PI 3.141593

void main() {
    vec4 worldPosition = uWorldMatrix * aInstanceMatrix * vec4(aModelPosition, 1.);

    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);

    if (gl_VertexID > 0) {
        vec3 rotationAxis = uRotationAxisVelocity.xyz;
        float rotationVelocity = min(.15, uRotationAxisVelocity.w * 15.);
        vec3 stretchDir = normalize(cross(centerPos, rotationAxis));
        vec3 relativeVertexPos = normalize(worldPosition.xyz - centerPos);
        float strength = dot(stretchDir, relativeVertexPos);
        float invAbsStrength = min(0., abs(strength) - 1.);
        strength = rotationVelocity * sign(strength) * abs(invAbsStrength * invAbsStrength * invAbsStrength + 1.);
        worldPosition.xyz += stretchDir * strength;
    }

    worldPosition.xyz = radius * normalize(worldPosition.xyz);

    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

    vAlpha = smoothstep(0.5, 1., normalize(worldPosition.xyz).z) * .9 + .1;
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}
`

const discFragShaderSource = `#version 300 es
precision highp float;

uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;

out vec4 outColor;

in vec2 vUvs;
in float vAlpha;
flat in int vInstanceId;

void main() {
    int ic = int(max(float(uItemCount), 1.0));
    int itemIndex = vInstanceId - (vInstanceId / ic) * ic;

    int cellsPerRow = uAtlasSize;
    int cellX = itemIndex - (itemIndex / cellsPerRow) * cellsPerRow;
    int rowTop = itemIndex / cellsPerRow;
    int cellY = (cellsPerRow - 1) - rowTop;

    vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;

    float scale = 1.0;
    vec2 st = vec2(vUvs.x, 1.0 - vUvs.y);
    st = (st - 0.5) * scale + 0.5;
    st = clamp(st, 0.0, 1.0);
    st = st * cellSize + cellOffset;

    outColor = texture(uTex, st);
    outColor.a *= vAlpha;
}
`

class Face {
  constructor(a, b, c) {
    this.a = a
    this.b = b
    this.c = c
  }
}

class Vertex {
  constructor(x, y, z) {
    this.position = vec3.fromValues(x, y, z)
    this.normal = vec3.create()
    this.uv = vec2.create()
  }
}

class Geometry {
  constructor() {
    this.vertices = []
    this.faces = []
  }

  addVertex(...args) {
    for (let i = 0; i < args.length; i += 3) {
      this.vertices.push(new Vertex(args[i], args[i + 1], args[i + 2]))
    }
    return this
  }

  addFace(...args) {
    for (let i = 0; i < args.length; i += 3) {
      this.faces.push(new Face(args[i], args[i + 1], args[i + 2]))
    }
    return this
  }

  get lastVertex() {
    return this.vertices[this.vertices.length - 1]
  }

  subdivide(divisions = 1) {
    const midPointCache = {}
    let f = this.faces

    for (let div = 0; div < divisions; ++div) {
      const newFaces = new Array(f.length * 4)

      f.forEach((face, ndx) => {
        const mAB = this.getMidPoint(face.a, face.b, midPointCache)
        const mBC = this.getMidPoint(face.b, face.c, midPointCache)
        const mCA = this.getMidPoint(face.c, face.a, midPointCache)

        const i = ndx * 4
        newFaces[i + 0] = new Face(face.a, mAB, mCA)
        newFaces[i + 1] = new Face(face.b, mBC, mAB)
        newFaces[i + 2] = new Face(face.c, mCA, mBC)
        newFaces[i + 3] = new Face(mAB, mBC, mCA)
      })

      f = newFaces
    }

    this.faces = f
    return this
  }

  spherize(radius = 1) {
    this.vertices.forEach((vertex) => {
      vec3.normalize(vertex.normal, vertex.position)
      vec3.scale(vertex.position, vertex.normal, radius)
    })
    return this
  }

  get data() {
    return {
      vertices: this.vertexData,
      indices: this.indexData,
      normals: this.normalData,
      uvs: this.uvData,
    }
  }

  get vertexData() {
    return new Float32Array(this.vertices.flatMap((v) => Array.from(v.position)))
  }

  get normalData() {
    return new Float32Array(this.vertices.flatMap((v) => Array.from(v.normal)))
  }

  get uvData() {
    return new Float32Array(this.vertices.flatMap((v) => Array.from(v.uv)))
  }

  get indexData() {
    return new Uint16Array(this.faces.flatMap((f) => [f.a, f.b, f.c]))
  }

  getMidPoint(ndxA, ndxB, cache) {
    const cacheKey = ndxA < ndxB ? `k_${ndxB}_${ndxA}` : `k_${ndxA}_${ndxB}`
    if (Object.prototype.hasOwnProperty.call(cache, cacheKey)) {
      return cache[cacheKey]
    }
    const a = this.vertices[ndxA].position
    const b = this.vertices[ndxB].position
    const ndx = this.vertices.length
    cache[cacheKey] = ndx
    this.addVertex((a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, (a[2] + b[2]) * 0.5)
    return ndx
  }
}

class IcosahedronGeometry extends Geometry {
  constructor() {
    super()
    const t = Math.sqrt(5) * 0.5 + 0.5
    this.addVertex(
      -1,
      t,
      0,
      1,
      t,
      0,
      -1,
      -t,
      0,
      1,
      -t,
      0,
      0,
      -1,
      t,
      0,
      1,
      t,
      0,
      -1,
      -t,
      0,
      1,
      -t,
      t,
      0,
      -1,
      t,
      0,
      1,
      -t,
      0,
      -1,
      -t,
      0,
      1,
    ).addFace(
      0,
      11,
      5,
      0,
      5,
      1,
      0,
      1,
      7,
      0,
      7,
      10,
      0,
      10,
      11,
      1,
      5,
      9,
      5,
      11,
      4,
      11,
      10,
      2,
      10,
      7,
      6,
      7,
      1,
      8,
      3,
      9,
      4,
      3,
      4,
      2,
      3,
      2,
      6,
      3,
      6,
      8,
      3,
      8,
      9,
      4,
      9,
      5,
      2,
      4,
      11,
      6,
      2,
      10,
      8,
      6,
      7,
      9,
      8,
      1,
    )
  }
}

class DiscGeometry extends Geometry {
  constructor(steps = 4, radius = 1) {
    super()
    steps = Math.max(4, steps)

    const alpha = (2 * Math.PI) / steps

    this.addVertex(0, 0, 0)
    this.lastVertex.uv[0] = 0.5
    this.lastVertex.uv[1] = 0.5

    for (let i = 0; i < steps; ++i) {
      const x = Math.cos(alpha * i)
      const y = Math.sin(alpha * i)
      this.addVertex(radius * x, radius * y, 0)
      this.lastVertex.uv[0] = x * 0.5 + 0.5
      this.lastVertex.uv[1] = y * 0.5 + 0.5

      if (i > 0) {
        this.addFace(0, i, i + 1)
      }
    }
    this.addFace(0, steps, 1)
  }
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

  if (success) {
    return shader
  }

  console.error(gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
  return null
}

function createProgram(gl, shaderSources, transformFeedbackVaryings, attribLocations) {
  const program = gl.createProgram()

  ;[gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, ndx) => {
    const shader = createShader(gl, type, shaderSources[ndx])
    if (shader) gl.attachShader(program, shader)
  })

  if (transformFeedbackVaryings) {
    gl.transformFeedbackVaryings(program, transformFeedbackVaryings, gl.SEPARATE_ATTRIBS)
  }

  if (attribLocations) {
    for (const attrib in attribLocations) {
      gl.bindAttribLocation(program, attribLocations[attrib], attrib)
    }
  }

  gl.linkProgram(program)
  const success = gl.getProgramParameter(program, gl.LINK_STATUS)

  if (success) {
    return program
  }

  console.error(gl.getProgramInfoLog(program))
  gl.deleteProgram(program)
  return null
}

function makeVertexArray(gl, bufLocNumElmPairs, indices) {
  const va = gl.createVertexArray()
  gl.bindVertexArray(va)

  for (const [buffer, loc, numElem] of bufLocNumElmPairs) {
    if (loc === -1) continue
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, numElem, gl.FLOAT, false, 0, 0)
  }

  if (indices) {
    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
  }

  gl.bindVertexArray(null)
  return va
}

function resizeCanvasToDisplaySize(canvas) {
  const dpr = Math.min(2, window.devicePixelRatio)
  const displayWidth = Math.round(canvas.clientWidth * dpr)
  const displayHeight = Math.round(canvas.clientHeight * dpr)
  const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight
  if (needResize) {
    canvas.width = displayWidth
    canvas.height = displayHeight
  }
  return needResize
}

function makeBuffer(gl, sizeOrData, usage) {
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, usage)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  return buf
}

/** 轻点：时间短于该值且位移小于阈值 → Click；否则在判定为 Drag 后才旋转球体 */
const ARCBALL_CLICK_MAX_MS = 200
const ARCBALL_DRAG_THRESHOLD_PX = 8
/** 角速度超过此阈值视为快速旋转，不触发进入（避免甩球惯性时误触） */
const OPEN_MAX_SPIN_VELOCITY = 0.22

class ArcballControl {
  isPointerDown = false
  orientation = quat.create()
  pointerRotation = quat.create()
  rotationVelocity = 0
  rotationAxis = vec3.fromValues(1, 0, 0)
  /** Camera on +Z; must match alignToItemIndex target so the front disc stays centered */
  snapDirection = vec3.fromValues(0, 0, 1)
  snapTargetDirection
  EPSILON = 0.1
  IDENTITY_QUAT = quat.create()

  gestureDragCommitted = false
  pointerDownAt = 0
  pointerStart = vec2.create()

  constructor(canvas, updateCallback, options = {}) {
    this.canvas = canvas
    this.updateCallback = updateCallback || (() => null)
    this.onClick = typeof options.onClick === 'function' ? options.onClick : null

    this.pointerPos = vec2.create()
    this.previousPointerPos = vec2.create()
    this._rotationVelocity = 0
    this._combinedQuat = quat.create()

    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

    const maybeCommitDrag = (clientX, clientY) => {
      const dx = clientX - this.pointerStart[0]
      const dy = clientY - this.pointerStart[1]
      if (dx * dx + dy * dy > ARCBALL_DRAG_THRESHOLD_PX * ARCBALL_DRAG_THRESHOLD_PX || now() - this.pointerDownAt > ARCBALL_CLICK_MAX_MS) {
        this.gestureDragCommitted = true
      }
    }

    const endPointer = (e) => {
      if (!this.isPointerDown) return

      const clientX = e && 'clientX' in e ? e.clientX : this.pointerPos[0]
      const clientY = e && 'clientY' in e ? e.clientY : this.pointerPos[1]
      const dx = clientX - this.pointerStart[0]
      const dy = clientY - this.pointerStart[1]
      const t = now() - this.pointerDownAt
      const distSq = dx * dx + dy * dy
      const isClick =
        !this.gestureDragCommitted &&
        t < ARCBALL_CLICK_MAX_MS &&
        distSq <= ARCBALL_DRAG_THRESHOLD_PX * ARCBALL_DRAG_THRESHOLD_PX

      if (e && 'pointerId' in e) {
        try {
          this.canvas.releasePointerCapture(e.pointerId)
        } catch (_) {
          /* noop */
        }
      }

      this.isPointerDown = false
      this.gestureDragCommitted = false

      if (isClick && this.onClick) {
        this.onClick()
      }
    }

    canvas.addEventListener('pointerdown', (e) => {
      vec2.set(this.pointerPos, e.clientX, e.clientY)
      vec2.copy(this.previousPointerPos, this.pointerPos)
      vec2.set(this.pointerStart, e.clientX, e.clientY)
      this.pointerDownAt = now()
      this.gestureDragCommitted = false
      this.isPointerDown = true
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch (_) {
        /* noop */
      }
    })
    canvas.addEventListener('pointerup', endPointer)
    canvas.addEventListener('pointercancel', endPointer)
    canvas.addEventListener('pointermove', (e) => {
      if (this.isPointerDown) {
        vec2.set(this.pointerPos, e.clientX, e.clientY)
        maybeCommitDrag(e.clientX, e.clientY)
      }
    })

    canvas.addEventListener(
      'click',
      (e) => {
        e.preventDefault()
        e.stopPropagation()
      },
      true,
    )

    canvas.style.touchAction = 'none'
  }

  update(deltaTime, targetFrameDuration = 16) {
    const timeScale = deltaTime / targetFrameDuration + 0.00001
    let angleFactor = timeScale
    let snapRotation = quat.create()

    if (this.isPointerDown && this.gestureDragCommitted) {
      const INTENSITY = 0.3 * timeScale
      const ANGLE_AMPLIFICATION = 5 / timeScale

      const midPointerPos = vec2.sub(vec2.create(), this.pointerPos, this.previousPointerPos)
      vec2.scale(midPointerPos, midPointerPos, INTENSITY)

      if (vec2.sqrLen(midPointerPos) > this.EPSILON) {
        vec2.add(midPointerPos, this.previousPointerPos, midPointerPos)

        const p = this.#project(midPointerPos)
        const q = this.#project(this.previousPointerPos)
        const a = vec3.normalize(vec3.create(), p)
        const b = vec3.normalize(vec3.create(), q)

        vec2.copy(this.previousPointerPos, midPointerPos)

        angleFactor *= ANGLE_AMPLIFICATION

        this.quatFromVectors(a, b, this.pointerRotation, angleFactor)
      } else {
        quat.slerp(this.pointerRotation, this.pointerRotation, this.IDENTITY_QUAT, INTENSITY)
      }
    } else {
      const INTENSITY = 0.1 * timeScale
      quat.slerp(this.pointerRotation, this.pointerRotation, this.IDENTITY_QUAT, INTENSITY)

      if (this.snapTargetDirection) {
        const SNAPPING_INTENSITY = 0.2
        const a = this.snapTargetDirection
        const b = this.snapDirection
        const sqrDist = vec3.squaredDistance(a, b)
        const distanceFactor = Math.max(0.1, 1 - sqrDist * 10)
        angleFactor *= SNAPPING_INTENSITY * distanceFactor
        this.quatFromVectors(a, b, snapRotation, angleFactor)
      }
    }

    const combinedQuat = quat.multiply(quat.create(), snapRotation, this.pointerRotation)
    this.orientation = quat.multiply(quat.create(), combinedQuat, this.orientation)
    quat.normalize(this.orientation, this.orientation)

    const RA_INTENSITY = 0.8 * timeScale
    quat.slerp(this._combinedQuat, this._combinedQuat, combinedQuat, RA_INTENSITY)
    quat.normalize(this._combinedQuat, this._combinedQuat)

    const rad = Math.acos(this._combinedQuat[3]) * 2.0
    const s = Math.sin(rad / 2.0)
    let rv = 0
    if (s > 0.000001) {
      rv = rad / (2 * Math.PI)
      this.rotationAxis[0] = this._combinedQuat[0] / s
      this.rotationAxis[1] = this._combinedQuat[1] / s
      this.rotationAxis[2] = this._combinedQuat[2] / s
    }

    const RV_INTENSITY = 0.5 * timeScale
    this._rotationVelocity += (rv - this._rotationVelocity) * RV_INTENSITY
    this.rotationVelocity = this._rotationVelocity / timeScale

    this.updateCallback(deltaTime)
  }

  quatFromVectors(a, b, out, angleFactor = 1) {
    const axis = vec3.cross(vec3.create(), a, b)
    vec3.normalize(axis, axis)
    const d = Math.max(-1, Math.min(1, vec3.dot(a, b)))
    const angle = Math.acos(d) * angleFactor
    quat.setAxisAngle(out, axis, angle)
    return { q: out, axis, angle }
  }

  #project(pos) {
    const r = 2
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    const s = Math.max(w, h) - 1

    const x = (2 * pos[0] - w - 1) / s
    const y = (2 * pos[1] - h - 1) / s
    let z = 0
    const xySq = x * x + y * y
    const rSq = r * r

    if (xySq <= rSq / 2.0) {
      z = Math.sqrt(rSq - xySq)
    } else {
      z = rSq / Math.sqrt(xySq)
    }
    return vec3.fromValues(-x, y, z)
  }
}

class InfiniteGridMenu {
  TARGET_FRAME_DURATION = 1000 / 60
  SPHERE_RADIUS = 2

  #time = 0
  #deltaTime = 0
  #deltaFrames = 0
  #frames = 0
  #stopped = false
  #rafId = 0

  camera = {
    matrix: mat4.create(),
    near: 0.1,
    far: 40,
    fov: Math.PI / 4,
    aspect: 1,
    position: vec3.fromValues(0, 0, 3),
    up: vec3.fromValues(0, 1, 0),
    matrices: {
      view: mat4.create(),
      projection: mat4.create(),
      inversProjection: mat4.create(),
    },
  }

  nearestVertexIndex = null
  smoothRotationVelocity = 0
  scaleFactor = 1.0
  movementActive = false
  #disposed = false

  constructor(canvas, items, onActiveItemChange, onMovementChange, onInit = null, scale = 1.0, onCanvasTap = null) {
    this.canvas = canvas
    this.items = items || []
    this.onActiveItemChange = onActiveItemChange || (() => {})
    this.onMovementChange = onMovementChange || (() => {})
    this.onCanvasTap = typeof onCanvasTap === 'function' ? onCanvasTap : null
    this.scaleFactor = scale
    this.camera.position[2] = 3 * scale
    this.#init(onInit)
  }

  dispose() {
    this.#disposed = true
    this.#stopped = true
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId)
      this.#rafId = 0
    }
  }

  resize() {
    this.viewportSize = vec2.set(this.viewportSize || vec2.create(), this.canvas.clientWidth, this.canvas.clientHeight)

    const gl = this.gl
    const needsResize = resizeCanvasToDisplaySize(gl.canvas)
    if (needsResize) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    }

    this.#updateProjectionMatrix(gl)
  }

  run(time = 0) {
    if (this.#stopped || this.#disposed) return
    this.#deltaTime = Math.min(32, time - this.#time)
    this.#time = time
    this.#deltaFrames = this.#deltaTime / this.TARGET_FRAME_DURATION
    this.#frames += this.#deltaFrames

    this.#animate(this.#deltaTime)
    this.#render()

    this.#rafId = requestAnimationFrame((t) => this.run(t))
  }

  #init(onInit) {
    this.gl = this.canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false })
    const gl = this.gl
    if (!gl) {
      throw new Error('No WebGL 2 context!')
    }

    this.viewportSize = vec2.fromValues(this.canvas.clientWidth, this.canvas.clientHeight)
    this.drawBufferSize = vec2.clone(this.viewportSize)

    this.discProgram = createProgram(gl, [discVertShaderSource, discFragShaderSource], null, {
      aModelPosition: 0,
      aModelUvs: 1,
      aInstanceMatrix: 2,
    })
    if (!this.discProgram) {
      throw new Error(
        '[InfiniteMenu] WebGL program link failed (disc). Check console for shader compile/link logs.',
      )
    }
    this.discLocations = {
      aModelPosition: gl.getAttribLocation(this.discProgram, 'aModelPosition'),
      aModelUvs: gl.getAttribLocation(this.discProgram, 'aModelUvs'),
      aInstanceMatrix: gl.getAttribLocation(this.discProgram, 'aInstanceMatrix'),
      uWorldMatrix: gl.getUniformLocation(this.discProgram, 'uWorldMatrix'),
      uViewMatrix: gl.getUniformLocation(this.discProgram, 'uViewMatrix'),
      uProjectionMatrix: gl.getUniformLocation(this.discProgram, 'uProjectionMatrix'),
      uCameraPosition: gl.getUniformLocation(this.discProgram, 'uCameraPosition'),
      uScaleFactor: gl.getUniformLocation(this.discProgram, 'uScaleFactor'),
      uRotationAxisVelocity: gl.getUniformLocation(this.discProgram, 'uRotationAxisVelocity'),
      uTex: gl.getUniformLocation(this.discProgram, 'uTex'),
      uFrames: gl.getUniformLocation(this.discProgram, 'uFrames'),
      uItemCount: gl.getUniformLocation(this.discProgram, 'uItemCount'),
      uAtlasSize: gl.getUniformLocation(this.discProgram, 'uAtlasSize'),
    }

    this.discGeo = new DiscGeometry(56, 1)
    this.discBuffers = this.discGeo.data
    this.discVAO = makeVertexArray(
      gl,
      [
        [makeBuffer(gl, this.discBuffers.vertices, gl.STATIC_DRAW), this.discLocations.aModelPosition, 3],
        [makeBuffer(gl, this.discBuffers.uvs, gl.STATIC_DRAW), this.discLocations.aModelUvs, 2],
      ],
      this.discBuffers.indices,
    )

    this.icoGeo = new IcosahedronGeometry()
    this.icoGeo.subdivide(1).spherize(this.SPHERE_RADIUS)
    this.instancePositions = this.icoGeo.vertices.map((v) => v.position)
    this.DISC_INSTANCE_COUNT = this.icoGeo.vertices.length
    this.#initDiscInstances(this.DISC_INSTANCE_COUNT)

    this.worldMatrix = mat4.create()
    this.#initTexture()

    this.control = new ArcballControl(this.canvas, (deltaTime) => this.#onControlUpdate(deltaTime), {
      onClick: () => this.#tryNavigateFromCanvasTap(),
    })

    this.#updateCameraMatrix()
    this.#updateProjectionMatrix(gl)
    this.resize()

    if (onInit) onInit(this)
  }

  #initTexture() {
    const gl = this.gl
    const itemCount = Math.max(1, this.items.length)
    const TW = 512
    const TH = 512
    const atlas = Math.ceil(Math.sqrt(itemCount))
    this.atlasSize = atlas
    const W = atlas * TW
    const H = atlas * TH

    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    this.tex = tex

    const scratch = document.createElement('canvas')
    scratch.width = TW
    scratch.height = TH
    const sctx = scratch.getContext('2d')

    Promise.all(this.items.map((item) => loadImageForAtlas(item.image))).then((images) => {
      if (this.#disposed || !this.gl || !sctx) return
      gl.bindTexture(gl.TEXTURE_2D, this.tex)
      images.forEach((img, i) => {
        sctx.clearRect(0, 0, TW, TH)
        sctx.drawImage(img, 0, 0, TW, TH)
        const col = i % atlas
        const rowTop = Math.floor(i / atlas)
        const xoffset = col * TW
        const yoffset = H - (rowTop + 1) * TH
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
        gl.texSubImage2D(gl.TEXTURE_2D, 0, xoffset, yoffset, TW, TH, gl.RGBA, gl.UNSIGNED_BYTE, scratch)
      })
    })
  }

  #initDiscInstances(count) {
    const gl = this.gl
    this.discInstances = {
      matricesArray: new Float32Array(count * 16),
      matrices: [],
      buffer: gl.createBuffer(),
    }
    for (let i = 0; i < count; ++i) {
      const instanceMatrixArray = new Float32Array(this.discInstances.matricesArray.buffer, i * 16 * 4, 16)
      instanceMatrixArray.set(mat4.create())
      this.discInstances.matrices.push(instanceMatrixArray)
    }
    gl.bindVertexArray(this.discVAO)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.discInstances.matricesArray.byteLength, gl.DYNAMIC_DRAW)
    const mat4AttribSlotCount = 4
    const bytesPerMatrix = 16 * 4
    for (let j = 0; j < mat4AttribSlotCount; ++j) {
      const loc = this.discLocations.aInstanceMatrix + j
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, bytesPerMatrix, j * 4 * 4)
      gl.vertexAttribDivisor(loc, 1)
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.bindVertexArray(null)
  }

  #animate(deltaTime) {
    const gl = this.gl
    this.control.update(deltaTime, this.TARGET_FRAME_DURATION)

    const positions = this.instancePositions.map((p) => vec3.transformQuat(vec3.create(), p, this.control.orientation))
    const scale = 0.25
    const SCALE_INTENSITY = 0.6
    positions.forEach((p, ndx) => {
      const s = (Math.abs(p[2]) / this.SPHERE_RADIUS) * SCALE_INTENSITY + (1 - SCALE_INTENSITY)
      const finalScale = s * scale
      const matrix = mat4.create()
      mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), vec3.negate(vec3.create(), p)))
      mat4.multiply(matrix, matrix, mat4.targetTo(mat4.create(), [0, 0, 0], p, [0, 1, 0]))
      mat4.multiply(matrix, matrix, mat4.fromScaling(mat4.create(), [finalScale, finalScale, finalScale]))
      mat4.multiply(matrix, matrix, mat4.fromTranslation(mat4.create(), [0, 0, -this.SPHERE_RADIUS]))

      mat4.copy(this.discInstances.matrices[ndx], matrix)
    })

    gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.discInstances.matricesArray)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    this.smoothRotationVelocity = this.control.rotationVelocity
  }

  #render() {
    const gl = this.gl
    gl.useProgram(this.discProgram)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.uniformMatrix4fv(this.discLocations.uWorldMatrix, false, this.worldMatrix)
    gl.uniformMatrix4fv(this.discLocations.uViewMatrix, false, this.camera.matrices.view)
    gl.uniformMatrix4fv(this.discLocations.uProjectionMatrix, false, this.camera.matrices.projection)
    gl.uniform3f(
      this.discLocations.uCameraPosition,
      this.camera.position[0],
      this.camera.position[1],
      this.camera.position[2],
    )
    gl.uniform4f(
      this.discLocations.uRotationAxisVelocity,
      this.control.rotationAxis[0],
      this.control.rotationAxis[1],
      this.control.rotationAxis[2],
      this.smoothRotationVelocity * 1.1,
    )

    gl.uniform1i(this.discLocations.uItemCount, this.items.length)
    gl.uniform1i(this.discLocations.uAtlasSize, this.atlasSize)

    if (this.discLocations.uFrames) gl.uniform1f(this.discLocations.uFrames, this.#frames)
    if (this.discLocations.uScaleFactor) gl.uniform1f(this.discLocations.uScaleFactor, this.scaleFactor)
    gl.uniform1i(this.discLocations.uTex, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.tex)

    gl.bindVertexArray(this.discVAO)
    gl.drawElementsInstanced(
      gl.TRIANGLES,
      this.discBuffers.indices.length,
      gl.UNSIGNED_SHORT,
      0,
      this.DISC_INSTANCE_COUNT,
    )
  }

  #updateCameraMatrix() {
    mat4.targetTo(this.camera.matrix, this.camera.position, [0, 0, 0], this.camera.up)
    mat4.invert(this.camera.matrices.view, this.camera.matrix)
  }

  #updateProjectionMatrix(gl) {
    this.camera.aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const height = this.SPHERE_RADIUS * 0.35
    const distance = this.camera.position[2]
    if (this.camera.aspect > 1) {
      this.camera.fov = 2 * Math.atan(height / distance)
    } else {
      this.camera.fov = 2 * Math.atan(height / this.camera.aspect / distance)
    }
    mat4.perspective(this.camera.matrices.projection, this.camera.fov, this.camera.aspect, this.camera.near, this.camera.far)
    mat4.invert(this.camera.matrices.inversProjection, this.camera.matrices.projection)
  }

  /**
   * Canvas 上有效轻点后：用实时角速度判断是否允许进入（不用 React isMoving，避免 pointerup 与 rAF 不同步误拦）
   */
  #tryNavigateFromCanvasTap() {
    const v = Math.abs(this.smoothRotationVelocity)
    if (v > OPEN_MAX_SPIN_VELOCITY) return
    this.onCanvasTap?.()
  }

  /** 供标题层点击：与球体同源的速度判定 */
  getSpinSpeed() {
    return Math.abs(this.smoothRotationVelocity)
  }

  #onControlUpdate(deltaTime) {
    const timeScale = deltaTime / this.TARGET_FRAME_DURATION + 0.0001
    let damping = 5 / timeScale
    let cameraTargetZ = 3 * this.scaleFactor

    const isMoving = this.control.isPointerDown || Math.abs(this.smoothRotationVelocity) > 0.01

    if (isMoving !== this.movementActive) {
      this.movementActive = isMoving
      this.onMovementChange(isMoving)
    }

    if (!this.control.isPointerDown) {
      const nearestVertexIndex = this.#findNearestVertexIndex()
      const itemIndex = nearestVertexIndex % Math.max(1, this.items.length)
      this.onActiveItemChange(itemIndex)
      const snapDirection = vec3.normalize(vec3.create(), this.#getVertexWorldPosition(nearestVertexIndex))
      this.control.snapTargetDirection = snapDirection
    } else {
      cameraTargetZ += this.control.rotationVelocity * 80 + 2.5
      damping = 7 / timeScale
    }

    this.camera.position[2] += (cameraTargetZ - this.camera.position[2]) / damping
    this.#updateCameraMatrix()
  }

  /**
   * 相机在 +Z 朝向原点；贴片中心在世界空间 z 最大者最朝前。
   * 与 #animate 里用于摆盘的几何一致，避免 snapDirection 与真实朝向不同步导致「看见 A、标题却是 B」。
   */
  #findNearestVertexIndex() {
    let maxZ = -Infinity
    let nearestVertexIndex = 0
    for (let i = 0; i < this.instancePositions.length; ++i) {
      const p = vec3.transformQuat(vec3.create(), this.instancePositions[i], this.control.orientation)
      if (p[2] > maxZ) {
        maxZ = p[2]
        nearestVertexIndex = i
      }
    }
    return nearestVertexIndex
  }

  #getVertexWorldPosition(index) {
    const nearestVertexPos = this.instancePositions[index]
    return vec3.transformQuat(vec3.create(), nearestVertexPos, this.control.orientation)
  }

  /**
   * 将指定 items[itemIndex] 对应的球面贴片转到朝向相机（+Z），用于初始态对齐 About（索引 0）。
   */
  alignToItemIndex(itemIndex) {
    const n = this.items.length
    if (n < 1) return
    const idx = ((itemIndex % n) + n) % n
    let vi = -1
    for (let i = 0; i < this.instancePositions.length; i++) {
      if (i % n === idx) {
        vi = i
        break
      }
    }
    if (vi < 0) return

    const from = vec3.normalize(vec3.create(), this.instancePositions[vi])
    const to = vec3.fromValues(0, 0, 1)
    const q = quat.create()
    const c = vec3.dot(from, to)
    const EPS = 1e-5
    if (c > 1 - EPS) {
      quat.identity(q)
    } else if (c < -1 + EPS) {
      const ortho = Math.abs(from[0]) < 0.9 ? vec3.fromValues(1, 0, 0) : vec3.fromValues(0, 1, 0)
      const axis = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), from, ortho))
      quat.setAxisAngle(q, axis, Math.PI)
    } else {
      const axis = vec3.cross(vec3.create(), from, to)
      vec3.normalize(axis, axis)
      const angle = Math.acos(Math.min(1, Math.max(-1, c)))
      quat.setAxisAngle(q, axis, angle)
    }

    quat.copy(this.control.orientation, q)
    quat.identity(this.control.pointerRotation)
    this.onActiveItemChange(idx)
  }
}

const defaultItems = [
  {
    image: 'https://picsum.photos/900/900?grayscale',
    link: 'https://google.com/',
    title: '',
    description: '',
  },
]

export default function InfiniteMenu({ items = [], scale = 1.0, onAboutCardOpen }) {
  const canvasRef = useRef(null)
  const list = items.length ? items : defaultItems
  const [activeItem, setActiveItem] = useState(() => list[0] ?? null)
  const [isMoving, setIsMoving] = useState(false)
  const navigate = useNavigate()

  const activeItemRef = useRef(activeItem)
  const isMovingRef = useRef(isMoving)
  const handleButtonClickRef = useRef(() => {})
  const sketchRef = useRef(null)

  useEffect(() => {
    activeItemRef.current = activeItem
  }, [activeItem])
  useEffect(() => {
    isMovingRef.current = isMoving
  }, [isMoving])

  const handleButtonClick = () => {
    const item = activeItemRef.current
    if (!item?.link) return
    if (item.aboutCard && typeof onAboutCardOpen === 'function') {
      onAboutCardOpen()
      return
    }
    const link = item.link
    if (/^https?:\/\//i.test(link)) {
      window.open(link, '_blank', 'noopener,noreferrer')
      return
    }
    navigate(link)
  }

  handleButtonClickRef.current = handleButtonClick

  /**
   * 标题/描述层点击（事件不在 canvas 上）：用 sketch 实时角速度判定，不用 isMovingRef
   */
  const onCoverClick = () => {
    const v = sketchRef.current?.getSpinSpeed?.() ?? 0
    if (v > OPEN_MAX_SPIN_VELOCITY) return
    if (!activeItemRef.current?.link) return
    handleButtonClickRef.current()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    let sketch

    const handleActiveItem = (index) => {
      const menuList = items.length ? items : defaultItems
      const itemIndex = index % menuList.length
      setActiveItem(menuList[itemIndex])
    }

    const onCanvasTap = () => {
      handleButtonClickRef.current()
    }

    if (canvas) {
      const menuList = items.length ? items : defaultItems
      sketch = new InfiniteGridMenu(
        canvas,
        menuList,
        handleActiveItem,
        setIsMoving,
        (sk) => {
          sk.alignToItemIndex(0)
          sk.run()
        },
        scale,
        onCanvasTap,
      )
      sketchRef.current = sketch
    }

    const handleResize = () => {
      if (sketch) {
        sketch.resize()
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      sketchRef.current = null
      sketch?.dispose?.()
    }
  }, [items, scale])

  return (
    <div
      className={`infinite-menu-root infinite-menu-cover-wrap${isMoving ? ' is-sphere-moving' : ''}`}
      onClick={onCoverClick}
      role="presentation"
    >
      <canvas id="infinite-grid-menu-canvas" ref={canvasRef} />

      {activeItem ? (
        <>
          <h2 className={`face-title font-display ${isMoving ? 'inactive' : 'active'}`}>{activeItem.title}</h2>

          <p className={`face-description font-sans ${isMoving ? 'inactive' : 'active'}`}>{activeItem.description}</p>
        </>
      ) : null}
    </div>
  )
}
