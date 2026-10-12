import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeVertices, mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { ViewKey } from '../types'
import './landing.css'

const MODEL_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260929_212926_92423081-b0e4-4f5a-b650-14af6c05c058.glb'

export interface HeroSlide {
  lines: string[]
  line1: string
  line2Prefix: string
  line2Accent: string
  subtext: string
  count: string
  targetView: ViewKey
  ctaText: string
}

const SLIDES: HeroSlide[] = [
  {
    lines: ['EVERY', 'SIGNAL', 'DIRECTION'],
    line1: 'Every Signal.',
    line2Prefix: 'One Clear',
    line2Accent: 'Direction.',
    subtext: 'Autonomous customer intelligence & predictive signal operations.',
    count: '01',
    targetView: 'overview',
    ctaText: 'Launch Workspace',
  },
  {
    lines: ['DECISION', 'RADAR', 'SIMULATOR'],
    line1: 'Predict Impact.',
    line2Prefix: 'Before Writing',
    line2Accent: 'Code.',
    subtext: 'Deterministic issue radar with counterfactual what-if simulation.',
    count: '02',
    targetView: 'simulator',
    ctaText: 'Open Simulator',
  },
  {
    lines: ['ADAPT', 'EXECUTE', 'SCALE'],
    line1: 'Closed Loop.',
    line2Prefix: 'From Signal to',
    line2Accent: 'Action.',
    subtext: 'Automated adaptation playbooks connected to measurable customer baselines.',
    count: '03',
    targetView: 'adaptation',
    ctaText: 'Explore Lab',
  },
]

export function LandingPage({ onLaunchApp }: { onLaunchApp: (view?: ViewKey) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [activeDot, setActiveDot] = useState(0)

  const activeSlideRef = useRef(0)
  const redrawHeadlineRef = useRef<(() => void) | null>(null)
  const arrowTurnRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false

    // 1. Renderer & Camera
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    })
    renderer.setClearColor(0x000000, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NoToneMapping

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
    camera.position.set(0, 0, 10)
    camera.lookAt(0, 0, 0)

    // 2. Background Scene & Offscreen Headline Canvas
    const bgScene = new THREE.Scene()
    const scene = new THREE.Scene()

    const headlineCanvas = document.createElement('canvas')
    const headlineCtx = headlineCanvas.getContext('2d')!
    const bgTexture = new THREE.CanvasTexture(headlineCanvas)
    bgTexture.colorSpace = THREE.SRGBColorSpace
    bgTexture.minFilter = THREE.LinearFilter
    bgTexture.magFilter = THREE.LinearFilter
    bgTexture.generateMipmaps = false

    const bgQuadGeom = new THREE.PlaneGeometry(2, 2)
    const bgQuadMat = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: bgTexture },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        varying vec2 vUv;
        void main() {
          gl_FragColor = texture2D(uTex, vUv);
          #include <colorspace_fragment>
        }
      `,
      depthTest: false,
      depthWrite: false,
    })
    const bgQuad = new THREE.Mesh(bgQuadGeom, bgQuadMat)
    bgQuad.frustumCulled = false
    bgScene.add(bgQuad)

    // 3. Render Targets for 2-Pass Refraction
    let rtBack: THREE.WebGLRenderTarget | null = null
    let rtFront: THREE.WebGLRenderTarget | null = null

    // 4. Glass Shaders
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vEye;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vec4 mvPos = viewMatrix * worldPos;
        gl_Position = projectionMatrix * mvPos;
        vNormal = normalize(normalMatrix * normal);
        vEye = normalize(mvPos.xyz);
      }
    `

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform vec2 uResolution;
      uniform float uIorR;
      uniform float uIorY;
      uniform float uIorG;
      uniform float uIorC;
      uniform float uIorB;
      uniform float uIorP;
      uniform float uRefractPower;
      uniform float uChromatic;
      uniform float uSaturation;
      uniform float uShininess;
      uniform float uDiffuseness;
      uniform float uFresnelPower;
      uniform vec3 uLight;
      uniform float uBackside;

      varying vec3 vNormal;
      varying vec3 vEye;

      float specular(vec3 lightDir, vec3 n, vec3 eye, float shininess, float diffuseness) {
        vec3 lightVec = normalize(-lightDir);
        vec3 viewVec = -eye;
        vec3 halfVec = normalize(lightVec + viewVec);
        return pow(max(dot(n, halfVec), 0.0), shininess) + max(0.0, dot(n, lightVec)) * diffuseness;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution;
        vec3 n = normalize(vNormal);
        if (uBackside > 0.5) n = -n;
        vec3 eye = normalize(vEye);

        const int LOOP = 16;
        vec3 color = vec3(0.0);

        for (int i = 0; i < LOOP; i++) {
          float slide = float(i) / float(LOOP) * 0.045;

          vec3 refrR = refract(eye, n, 1.0 / uIorR);
          vec3 refrY = refract(eye, n, 1.0 / uIorY);
          vec3 refrG = refract(eye, n, 1.0 / uIorG);
          vec3 refrC = refract(eye, n, 1.0 / uIorC);
          vec3 refrB = refract(eye, n, 1.0 / uIorB);
          vec3 refrP = refract(eye, n, 1.0 / uIorP);

          vec2 offsetR = refrR.xy * (uRefractPower + slide * 1.0) * uChromatic;
          vec2 offsetY = refrY.xy * (uRefractPower + slide * 1.0) * uChromatic;
          vec2 offsetG = refrG.xy * (uRefractPower + slide * 2.0) * uChromatic;
          vec2 offsetC = refrC.xy * (uRefractPower + slide * 2.5) * uChromatic;
          vec2 offsetB = refrB.xy * (uRefractPower + slide * 3.0) * uChromatic;
          vec2 offsetP = refrP.xy * (uRefractPower + slide * 1.0) * uChromatic;

          vec4 texR = texture2D(uTexture, uv + offsetR);
          vec4 texY = texture2D(uTexture, uv + offsetY);
          vec4 texG = texture2D(uTexture, uv + offsetG);
          vec4 texC = texture2D(uTexture, uv + offsetC);
          vec4 texB = texture2D(uTexture, uv + offsetB);
          vec4 texP = texture2D(uTexture, uv + offsetP);

          float r = texR.r * 0.5;
          float y = (texY.r * 2.0 + texY.g * 2.0 - texY.b) / 6.0;
          float g = texG.g * 0.5;
          float c = (texC.g * 2.0 + texC.b * 2.0 - texC.r) / 6.0;
          float b = texB.b * 0.5;
          float p = (texP.b * 2.0 + texP.r * 2.0 - texP.g) / 6.0;

          float R = r + (2.0 * p + 2.0 * y - c) / 3.0;
          float G = g + (2.0 * y + 2.0 * c - p) / 3.0;
          float B = b + (2.0 * c + 2.0 * p - y) / 3.0;

          color += vec3(R, G, B);
        }

        color /= float(LOOP);

        // Saturation adjust
        vec3 lumaWeights = vec3(0.2125, 0.7154, 0.0721);
        float luma = dot(color, lumaWeights);
        color = mix(vec3(luma), color, uSaturation);

        // Specular (Blinn-Phong)
        float spec = specular(uLight, n, eye, uShininess, uDiffuseness) +
                     0.6 * specular(vec3(1.0, 1.0, -1.0), n, eye, uShininess * 0.6, uDiffuseness * 0.5);
        color += spec * (uBackside > 0.5 ? 0.35 : 1.0);

        // Fresnel
        float f = pow(clamp(1.0 + dot(eye, n), 0.0, 1.0), uFresnelPower);
        color = mix(color, vec3(1.0), f * (uBackside > 0.5 ? 0.25 : 0.55));

        color += vec3(0.004, 0.005, 0.007);
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `

    const commonUniforms = {
      uResolution: { value: new THREE.Vector2() },
      uIorR: { value: 1.15 },
      uIorY: { value: 1.16 },
      uIorG: { value: 1.18 },
      uIorC: { value: 1.22 },
      uIorB: { value: 1.22 },
      uIorP: { value: 1.22 },
      uChromatic: { value: 0.5 },
      uSaturation: { value: 1.08 },
      uShininess: { value: 90.0 },
      uDiffuseness: { value: 0.02 },
      uFresnelPower: { value: 5.0 },
      uLight: { value: new THREE.Vector3(-1.0, 1.0, 1.0) },
    }

    const backMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      uniforms: {
        ...THREE.UniformsUtils.clone(commonUniforms),
        uTexture: { value: null },
        uRefractPower: { value: 0.22 },
        uBackside: { value: 1.0 },
      },
    })

    const frontMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.FrontSide,
      uniforms: {
        ...THREE.UniformsUtils.clone(commonUniforms),
        uTexture: { value: null },
        uRefractPower: { value: 0.30 },
        uBackside: { value: 0.0 },
      },
    })

    // 5. Scene Graph: scene -> pivot -> spinner -> cubeMesh
    const pivot = new THREE.Group()
    const spinner = new THREE.Group()
    pivot.add(spinner)
    scene.add(pivot)

    spinner.rotation.set(-0.42, 0.62, 0.18)

    let cubeMesh: THREE.Mesh | null = null

    function setupMesh(geom: THREE.BufferGeometry) {
      if (disposed) return
      cubeMesh = new THREE.Mesh(geom, frontMat)
      spinner.add(cubeMesh)
      setModelLoaded(true)
      layout()
    }

    function createFallbackBox() {
      const fallbackGeom = new RoundedBoxGeometry(1, 1, 1, 8, 0.12)
      fallbackGeom.center()
      fallbackGeom.computeVertexNormals()
      setupMesh(fallbackGeom)
    }

    // Load Model
    const gltfLoader = new GLTFLoader()
    gltfLoader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return
        try {
          const geoms: THREE.BufferGeometry[] = []
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).geometry) {
              const g = (child as THREE.Mesh).geometry.clone()
              g.deleteAttribute('uv')
              g.deleteAttribute('color')
              g.deleteAttribute('tangent')
              const merged = mergeVertices(g, 1e-4)
              merged.computeVertexNormals()
              child.updateMatrixWorld(true)
              merged.applyMatrix4(child.matrixWorld)
              geoms.push(merged)
            }
          })

          let finalGeom: THREE.BufferGeometry
          if (geoms.length > 1) {
            finalGeom = mergeGeometries(geoms, false)
          } else if (geoms.length === 1) {
            finalGeom = geoms[0]
          } else {
            createFallbackBox()
            return
          }

          finalGeom.center()
          finalGeom.computeBoundingBox()
          const bbox = finalGeom.boundingBox!
          const maxDim = Math.max(
            bbox.max.x - bbox.min.x,
            bbox.max.y - bbox.min.y,
            bbox.max.z - bbox.min.z,
          )
          if (maxDim > 0) {
            finalGeom.scale(1 / maxDim, 1 / maxDim, 1 / maxDim)
          }
          setupMesh(finalGeom)
        } catch (e) {
          console.warn('Geometry processing fallback:', e)
          createFallbackBox()
        }
      },
      undefined,
      (err) => {
        console.warn('GLTF loading fallback:', err)
        createFallbackBox()
      },
    )

    // 6. Layout & Background Drawing
    function redrawHeadline(W: number, H: number, dpr: number) {
      headlineCanvas.width = Math.floor(W * dpr)
      headlineCanvas.height = Math.floor(H * dpr)

      headlineCtx.fillStyle = '#000'
      headlineCtx.fillRect(0, 0, headlineCanvas.width, headlineCanvas.height)

      const mobile = W < 768 || W / H < 1
      let fs = Math.min(H * 0.21, W * (mobile ? 0.21 : 0.118))

      headlineCtx.font = `800 ${fs * dpr}px Poppins`
      const currentSlide = SLIDES[activeSlideRef.current] || SLIDES[0]
      const lines = currentSlide.lines
      const maxW = Math.max(...lines.map((l) => headlineCtx.measureText(l).width)) / dpr
      const targetMaxW = W * (mobile ? 0.9 : 0.5)
      if (maxW > targetMaxW && maxW > 0) {
        fs *= targetMaxW / maxW
      }

      headlineCtx.font = `800 ${fs * dpr}px Poppins`
      headlineCtx.fillStyle = '#e9e9e9'
      headlineCtx.textAlign = 'center'
      headlineCtx.textBaseline = 'alphabetic'

      const cx = W * (mobile ? 0.5 : 0.505) * dpr
      const cy = H * (mobile ? 0.45 : 0.468) * dpr
      const gap = fs * 1.07 * dpr
      const cap = fs * 0.7 * dpr

      for (let i = 0; i < lines.length; i++) {
        const baselineY = cy + cap / 2 + (i - 1) * gap
        headlineCtx.fillText(lines[i], cx, baselineY)
      }

      bgTexture.needsUpdate = true
    }

    redrawHeadlineRef.current = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      redrawHeadline(W, H, dpr)
    }

    function layout() {
      if (disposed) return
      const W = window.innerWidth
      const H = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      renderer.setPixelRatio(dpr)
      renderer.setSize(W, H)

      const bufferW = Math.floor(W * dpr)
      const bufferH = Math.floor(H * dpr)

      commonUniforms.uResolution.value.set(bufferW, bufferH)
      frontMat.uniforms.uResolution.value.set(bufferW, bufferH)
      backMat.uniforms.uResolution.value.set(bufferW, bufferH)

      if (!rtBack || rtBack.width !== bufferW || rtBack.height !== bufferH) {
        if (rtBack) rtBack.dispose()
        if (rtFront) rtFront.dispose()

        rtBack = new THREE.WebGLRenderTarget(bufferW, bufferH, {
          type: THREE.HalfFloatType,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          depthBuffer: true,
        })

        rtFront = new THREE.WebGLRenderTarget(bufferW, bufferH, {
          type: THREE.HalfFloatType,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          depthBuffer: true,
        })
      }

      camera.aspect = W / H
      camera.updateProjectionMatrix()

      redrawHeadline(W, H, dpr)

      const mobile = W < 768 || W / H < 1
      const fovRad = THREE.MathUtils.degToRad(camera.fov)
      const visH = 2 * Math.tan(fovRad / 2) * 10
      const visW = visH * camera.aspect

      const sx = mobile ? 0.5 : 0.517
      const sy = mobile ? 0.45 : 0.488
      pivot.position.set((sx - 0.5) * visW, (0.5 - sy) * visH, 0)

      const px = Math.min(H * 0.44, W * (mobile ? 0.45 : 0.29))
      const scale = (px / H) * visH
      pivot.scale.set(scale, scale, scale)
    }

    window.addEventListener('resize', layout)
    if (document.fonts) {
      document.fonts.addEventListener('loadingdone', layout)
    }

    // 7. Interaction: Drag, Inertia, Idle Drift
    let isDragging = false
    let lastX = 0
    let lastY = 0
    let velX = 0
    let velY = 0
    let lastDragEndTime = -10000

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId)
      canvas.classList.add('dragging')
      isDragging = true
      lastX = e.clientX
      lastY = e.clientY
      velX = 0
      velY = 0
      arrowTurnRef.current = 0
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      const deltaX = e.clientX - lastX
      const deltaY = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY

      const dx = deltaX * 0.008
      const dy = deltaY * 0.008
      velX = dx
      velY = dy

      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx)
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy)
      spinner.quaternion.premultiply(qY).premultiply(qX)
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return
      isDragging = false
      canvas.classList.remove('dragging')
      lastDragEndTime = performance.now()
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch (_) {}
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)

    // 8. Animation Loop
    let lastTime = performance.now()
    let animId = 0

    function animate(now: number) {
      if (disposed) return
      animId = requestAnimationFrame(animate)

      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now

      // Smooth arrow turn
      if (Math.abs(arrowTurnRef.current) > 0.0005) {
        const step = arrowTurnRef.current * Math.min(1.0, 0.09 * dt * 60)
        arrowTurnRef.current -= step
        const qTurn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), step)
        spinner.quaternion.premultiply(qTurn)
      } else {
        arrowTurnRef.current = 0
      }

      // Inertia & Idle Drift
      if (!isDragging && arrowTurnRef.current === 0) {
        const damp = Math.pow(0.94, dt * 60)
        velX *= damp
        velY *= damp

        if (Math.abs(velX) > 1e-5 || Math.abs(velY) > 1e-5) {
          const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), velX)
          const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), velY)
          spinner.quaternion.premultiply(qY).premultiply(qX)
        }

        const timeSinceDrag = (now - lastDragEndTime) / 1000
        if (timeSinceDrag > 0.6) {
          const blend = Math.min(1.0, (timeSinceDrag - 0.6) / 1.0)
          const driftY = 0.0035 * blend * (dt * 60)
          const driftX = 0.0012 * blend * (dt * 60)
          const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), driftY)
          const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), driftX)
          spinner.quaternion.premultiply(qY).premultiply(qX)
        }
      }

      // 9. Two-Pass Render Pipeline
      if (cubeMesh && rtBack && rtFront) {
        backMat.uniforms.uTexture.value = rtBack.texture
        frontMat.uniforms.uTexture.value = rtFront.texture

        // 1) Render bgScene -> rtBack
        renderer.setRenderTarget(rtBack)
        renderer.clear()
        renderer.render(bgScene, camera)

        // 2) Render bgScene -> rtFront, then back faces of cube
        renderer.setRenderTarget(rtFront)
        renderer.clear()
        renderer.render(bgScene, camera)

        renderer.autoClear = false
        cubeMesh.material = backMat
        renderer.render(scene, camera)

        // 3) Render bgScene -> Screen, then front faces of cube
        renderer.setRenderTarget(null)
        renderer.autoClear = true
        renderer.render(bgScene, camera)

        renderer.autoClear = false
        renderer.clearDepth()
        cubeMesh.material = frontMat
        renderer.render(scene, camera)
        renderer.autoClear = true
      } else {
        renderer.setRenderTarget(null)
        renderer.render(bgScene, camera)
      }
    }

    Promise.race([
      Promise.all([
        document.fonts ? document.fonts.load('800 100px Poppins') : Promise.resolve(),
        document.fonts ? document.fonts.ready : Promise.resolve(),
      ]),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]).then(() => {
      if (disposed) return
      layout()
      animId = requestAnimationFrame(animate)
    })

    return () => {
      disposed = true
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', layout)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      renderer.dispose()
      if (rtBack) rtBack.dispose()
      if (rtFront) rtFront.dispose()
      bgQuadGeom.dispose()
      bgQuadMat.dispose()
      bgTexture.dispose()
      frontMat.dispose()
      backMat.dispose()
      redrawHeadlineRef.current = null
    }
  }, [])

  const handlePrev = () => {
    arrowTurnRef.current -= Math.PI / 2
    const next = (activeSlideRef.current - 1 + SLIDES.length) % SLIDES.length
    activeSlideRef.current = next
    setActiveDot(next)
    redrawHeadlineRef.current?.()
  }

  const handleNext = () => {
    arrowTurnRef.current += Math.PI / 2
    const next = (activeSlideRef.current + 1) % SLIDES.length
    activeSlideRef.current = next
    setActiveDot(next)
    redrawHeadlineRef.current?.()
  }

  const handleSelectSlide = (idx: number) => {
    if (idx === activeSlideRef.current) return
    const diff = idx - activeSlideRef.current
    arrowTurnRef.current += (diff > 0 ? 1 : -1) * (Math.PI / 2)
    activeSlideRef.current = idx
    setActiveDot(idx)
    redrawHeadlineRef.current?.()
  }

  const currentSlide = SLIDES[activeDot] || SLIDES[0]

  return (
    <section className="hero" id="hero">
      <canvas
        ref={canvasRef}
        id="scene"
        aria-label="Rotatable glass cube refracting Vanta customer intelligence signals. Drag to rotate."
      />
      <div className="ui">
        <h1 className="sr-only">VANTA — Autonomous Customer Intelligence & Decision Analytics</h1>
        
        {/* NAV HEADER */}
        <header className="nav">
          <div className="brand-lockup">
            <a
              href="#hero"
              className="logo"
              onClick={(e) => {
                e.preventDefault()
                handleSelectSlide(0)
              }}
              title="VANTA · Customer Intelligence"
            >
              <img src="/vanta-brand.png" alt="VANTA" className="logo-img" />
            </a>
            <span className="logo-badge">SIGNAL OS</span>
          </div>

          <ul className="nav-links">
            <li>
              <a
                href="#overview"
                onClick={(e) => {
                  e.preventDefault()
                  onLaunchApp('overview')
                }}
              >
                Overview
              </a>
            </li>
            <li>
              <a
                href="#radar"
                onClick={(e) => {
                  e.preventDefault()
                  onLaunchApp('radar')
                }}
              >
                Issue Radar
              </a>
            </li>
            <li>
              <a
                href="#simulator"
                onClick={(e) => {
                  e.preventDefault()
                  onLaunchApp('simulator')
                }}
              >
                Simulator
              </a>
            </li>
            <li>
              <a
                href="#adaptation"
                onClick={(e) => {
                  e.preventDefault()
                  onLaunchApp('adaptation')
                }}
              >
                Adaption Lab
              </a>
            </li>
            <li>
              <a
                href="#admin"
                onClick={(e) => {
                  e.preventDefault()
                  onLaunchApp('admin')
                }}
              >
                Admin
              </a>
            </li>
          </ul>

          <div className="nav-actions">
            <button
              type="button"
              className="nav-cta-btn"
              onClick={() => onLaunchApp('overview')}
            >
              <span>Launch Workspace</span>
              <span className="nav-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </header>

        {/* 3D ARROW CONTROLS */}
        <div className="arrows">
          <button className="arrow" id="prev" onClick={handlePrev} aria-label="Previous Slide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
          <button className="arrow" id="next" onClick={handleNext} aria-label="Next Slide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        {/* PAGINATION DOTS */}
        <nav className="dots" aria-label="Signal pillars">
          {SLIDES.map((slide, idx) => (
            <button
              key={slide.count}
              type="button"
              className={`dot ${activeDot === idx ? 'active' : ''}`}
              onClick={() => handleSelectSlide(idx)}
              aria-label={`Slide ${idx + 1}: ${slide.lines.join(' ')}`}
            />
          ))}
        </nav>

        {/* TAGLINE & SUBTITLE */}
        <div className="tagline-wrap">
          <p className="tagline">
            {currentSlide.line1}<br />
            {currentSlide.line2Prefix} <strong>{currentSlide.line2Accent}</strong>
          </p>
          <p className="tagline-sub">{currentSlide.subtext}</p>
        </div>

        {/* BOTTOM CTA & LARGE STROKE COUNT */}
        <div className="cta-row">
          <button
            type="button"
            className="cta"
            onClick={() => onLaunchApp(currentSlide.targetView)}
          >
            <span>{currentSlide.ctaText}</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </button>
          <span className="cta-line" />
          <span className="count" aria-hidden="true">{currentSlide.count}</span>
        </div>

        {/* LOADING INDICATOR */}
        <div className={`loader ${modelLoaded ? 'done' : ''}`} id="loader">
          Initializing Signal Engine
        </div>
      </div>
    </section>
  )
}
