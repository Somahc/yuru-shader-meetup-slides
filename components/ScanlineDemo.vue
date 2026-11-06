<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { Pane } from 'tweakpane'
import fragmentShader from '../shaders/scanlines.frag?raw'
import { drawPM5544 } from './pm5544'

const viewport = ref<HTMLDivElement>()
const controls = ref<HTMLDivElement>()
const error = ref('')
const defaults = { density: 100, strength: 0.65, speed: 0.8, vertical: false, enabled: true, paused: false }
const params = { ...defaults }
let dispose = () => {}

onMounted(() => {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false })
  } catch {
    error.value = 'WebGLを初期化できませんでした。ブラウザーの設定を確認してください。'
    return
  }
  viewport.value!.appendChild(renderer.domElement)
  // 入力画像。PM5544 のテストパターンを表示領域と同じ 16:9 に広げて描く。
  const source = document.createElement('canvas')
  // 全画面表示でも引き伸ばされないよう、表示サイズより大きめに描く（SVGなので劣化しない）。
  source.width = 2560
  source.height = 1440
  const texture = new THREE.CanvasTexture(source)
  // ミップマップを使うと細い線や縞がにじむので、元の解像度から直接補間する。
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  drawPM5544(source.getContext('2d')!, source.width, source.height)
    .then(() => { texture.needsUpdate = true })
    .catch((e: Error) => { error.value = e.message })
  const uniforms = {
    uSource: { value: texture }, uTime: { value: 0 },
    uDensity: { value: params.density }, uStrength: { value: params.strength },
    uSpeed: { value: params.speed }, uVertical: { value: params.vertical },
    uEnabled: { value: params.enabled },
  }
  const material = new THREE.ShaderMaterial({
    uniforms, fragmentShader,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    depthTest: false, depthWrite: false,
  })
  const geometry = new THREE.PlaneGeometry(2, 2)
  const scene = new THREE.Scene()
  scene.add(new THREE.Mesh(geometry, material))
  const camera = new THREE.Camera()
  const pane = new Pane({ container: controls.value!, title: 'Parameters' })
  pane.addBinding(params, 'density', { label: 'Density', min: 4, max: 240, step: 1 })
  pane.addBinding(params, 'strength', { label: 'Strength', min: 0, max: 1, step: 0.01 })
  pane.addBinding(params, 'speed', { label: 'Speed', min: -5, max: 5, step: 0.1 })
  pane.addBinding(params, 'vertical', { label: 'Direction', options: { Horizontal: false, Vertical: true } })
  pane.addBinding(params, 'enabled', { label: 'Enabled' })
  pane.addBinding(params, 'paused', { label: 'Paused' })
  pane.addButton({ title: 'Reset' }).on('click', () => {
    Object.assign(params, defaults)
    uniforms.uTime.value = 0
    pane.refresh()
  })
  // Slidevはスライド全体をCSSのtransformで拡大縮小するので、clientWidthではなく
  // 実際に画面に表示されているサイズに合わせて描画解像度を決める。
  // transformの変化はResizeObserverでは検知できないため、毎フレーム確認する。
  const syncSize = () => {
    const rect = viewport.value!.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio, 2)
    const w = Math.max(1, Math.round(rect.width * dpr))
    const h = Math.max(1, Math.round(rect.height * dpr))
    const canvas = renderer.domElement
    if (canvas.width !== w || canvas.height !== h) renderer.setSize(w, h, false)
  }
  let visible = true
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
  observer.observe(viewport.value!)
  let previous = performance.now()
  renderer.setAnimationLoop((now) => {
    const dt = Math.min((now - previous) / 1000, 0.1)
    previous = now
    if (!visible || document.hidden) return
    syncSize()
    if (!params.paused) uniforms.uTime.value += dt
    uniforms.uDensity.value = params.density
    uniforms.uStrength.value = params.strength
    uniforms.uSpeed.value = params.speed
    uniforms.uVertical.value = params.vertical
    uniforms.uEnabled.value = params.enabled
    renderer.render(scene, camera)
  })
  dispose = () => {
    renderer.setAnimationLoop(null)
    observer.disconnect(); pane.dispose()
    geometry.dispose(); material.dispose(); texture.dispose(); renderer.dispose()
    renderer.domElement.remove()
  }
})
onUnmounted(() => dispose())
</script>

<template>
  <div class="demo-grid">
    <div class="preview-column">
      <slot name="intro" />
      <div class="preview">
        <div ref="viewport" class="viewport"><p v-if="error" role="alert">{{ error }}</p></div>
        <div ref="controls" class="controls" @keydown.stop @pointerdown.stop @click.stop />
        <p class="credit">Test card: "Philips PM5544" by ebnz, CC BY 2.5, via Wikimedia Commons</p>
      </div>
    </div>
    <div class="code-column">
      <div class="shader-code"><slot name="code" /></div>
    </div>
  </div>
</template>

<style scoped>
.demo-grid { position: absolute; inset: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 40px; }
.preview-column { display: flex; flex-direction: column; min-width: 0; }
.preview { position: relative; margin-top: auto; }
.viewport { width: 100%; aspect-ratio: 16 / 9; overflow: hidden; }
.viewport :deep(canvas) { display: block; width: 100%; height: 100%; }
.viewport p { padding: 20px; font-size: 14px; }
/* レイアウトに影響しないよう、画像の下の余白に重ねて置く。 */
.credit { position: absolute; top: 100%; right: 0; margin: 2px 0 0; font-size: 7px; line-height: 1.2; opacity: .5; white-space: nowrap; }
.code-column { min-width: 0; min-height: 0; }
.shader-code { height: 100%; }
.shader-code :deep(.slidev-code-wrapper) { height: 100%; }
.shader-code :deep(pre) { display: block; height: 100%; box-sizing: border-box; font-size: 12px; line-height: 1.5; overflow: auto; }
.controls { position: absolute; top: 8px; right: 8px; z-index: 1; width: 256px; transform: scale(.75); transform-origin: top right; }
</style>
