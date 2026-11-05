<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { Pane } from 'tweakpane'
import fragmentShader from '../shaders/scanlines.frag?raw'

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  // ローカルで生成する入力画像。ネットワークや外部素材を使わず比較できる。
  const source = document.createElement('canvas')
  source.width = 960
  source.height = 720
  const ctx = source.getContext('2d')!
  ctx.fillStyle = '#10172a'
  ctx.fillRect(0, 0, 960, 720)
  const colors = ['#f4eee1', '#e9ce43', '#55d7d2', '#6bc988', '#e776a7', '#dc644f', '#647aca']
  colors.forEach((color, i) => {
    ctx.fillStyle = color
    ctx.fillRect(i * 960 / 7, 0, 960 / 7 + 1, 250)
  })
  const gradient = ctx.createLinearGradient(0, 0, 960, 0)
  gradient.addColorStop(0, '#111827')
  gradient.addColorStop(1, '#ffffff')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 570, 960, 150)
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 2
  for (let x = 0; x < 960; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, 250); ctx.lineTo(x, 570); ctx.stroke()
  }
  for (let y = 250; y <= 570; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke()
  }
  ctx.fillStyle = '#eef2f6'
  ctx.font = 'bold 100px monospace'
  ctx.fillText('YURU', 52, 380)
  ctx.fillText('SHADER', 52, 490)
  ctx.beginPath(); ctx.arc(770, 410, 108, 0, Math.PI * 2)
  ctx.fillStyle = '#5eead4'; ctx.fill()
  ctx.beginPath(); ctx.arc(770, 410, 64, 0, Math.PI * 2)
  ctx.fillStyle = '#10172a'; ctx.fill()

  const texture = new THREE.CanvasTexture(source)
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
  const resize = new ResizeObserver(() => {
    // Slidevの拡大縮小率に依存しない描画サイズ。
    renderer.setSize(viewport.value!.clientWidth, viewport.value!.clientHeight, false)
  })
  resize.observe(viewport.value!)
  let visible = true
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
  observer.observe(viewport.value!)
  let previous = performance.now()
  renderer.setAnimationLoop((now) => {
    const dt = Math.min((now - previous) / 1000, 0.1)
    previous = now
    if (!visible || document.hidden) return
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
    resize.disconnect(); observer.disconnect(); pane.dispose()
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
.code-column { min-width: 0; min-height: 0; }
.shader-code { height: 100%; }
.shader-code :deep(.slidev-code-wrapper) { height: 100%; }
.shader-code :deep(pre) { display: block; height: 100%; box-sizing: border-box; font-size: 12px; line-height: 1.5; overflow: auto; }
.controls { position: absolute; top: 8px; right: 8px; z-index: 1; width: 256px; transform: scale(.75); transform-origin: top right; }
</style>
