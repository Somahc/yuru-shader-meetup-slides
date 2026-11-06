<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { Pane } from 'tweakpane'
import { drawPM5544 } from './pm5544'
import { drawFontAtlas } from './fontAtlas'
import { demos, type Demo, type DemoName } from './demos'
import { extractRegion, highlightGlsl } from './highlight'

// codeFontSize: コード欄の文字サイズ（例: "11px"）。省略すると Slidev の既定値。
// Slidev は .slidev-code の font-size を !important で変数から決めるので、変数のほうを差し替える。
// hideCode: コード欄を出さず、映像だけを大きく表示する。
const props = defineProps<{ demo: DemoName, codeFontSize?: string, hideCode?: boolean }>()
const viewport = ref<HTMLDivElement>()
const controls = ref<HTMLDivElement>()
const error = ref('')
const codeHtml = ref('')
const { shader: fragmentShader, params: paramDefs, feedback = false, testCard = true, font = false }: Demo = demos[props.demo]
const defaults: Record<string, number | boolean> = Object.fromEntries(
  Object.entries(paramDefs).map(([key, def]) => [key, def.value]),
)
const params = { ...defaults, paused: false }
const uniformName = (key: string) => `u${key[0].toUpperCase()}${key.slice(1)}`
let dispose = () => {}

// 右側に表示するコード。シェーダーの `#region main` の範囲だけを出す。
if (!props.hideCode) highlightGlsl(extractRegion(fragmentShader, 'main')).then((html) => { codeHtml.value = html })

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
  // 文字テクスチャ。使うデモのときだけ作る。
  let fontTexture: THREE.CanvasTexture | null = null
  if (font) {
    const atlas = document.createElement('canvas')
    atlas.width = atlas.height = 1024
    drawFontAtlas(atlas.getContext('2d')!, atlas.width)
    fontTexture = new THREE.CanvasTexture(atlas)
    // マスの境目で隣の文字が混ざらないよう、ミップマップは使わない。
    fontTexture.generateMipmaps = false
    fontTexture.minFilter = THREE.LinearFilter
  }
  const uniforms: Record<string, THREE.IUniform> = {
    uSource: { value: texture }, uFont: { value: fontTexture }, uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) }, uBackbuffer: { value: null },
    ...Object.fromEntries(Object.keys(defaults).map(key => [uniformName(key), { value: params[key] }])),
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

  // Video Feedback 用。2枚のレンダーターゲットを交互に使い、前フレームの出力を読めるようにする。
  // Shadertoy のバッファと同じく、1.0 を超える値も保持できる半精度浮動小数点で持つ。
  const targets = feedback
    ? [0, 1].map(() => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false }))
    : []
  const copyMaterial = new THREE.ShaderMaterial({
    uniforms: { tSource: { value: null } },
    vertexShader: material.vertexShader,
    fragmentShader: 'uniform sampler2D tSource; varying vec2 vUv; void main() { gl_FragColor = texture2D(tSource, vUv); }',
    depthTest: false, depthWrite: false,
  })
  const copyScene = new THREE.Scene()
  copyScene.add(new THREE.Mesh(geometry, copyMaterial))
  const clearTargets = () => {
    for (const target of targets) { renderer.setRenderTarget(target); renderer.clear() }
    renderer.setRenderTarget(null)
  }
  const render = () => {
    if (!feedback) { renderer.render(scene, camera); return }
    const [read, write] = targets
    // 一時停止中は前フレームを描き直すだけにして、フィードバックを進めない。
    if (!params.paused) {
      uniforms.uBackbuffer.value = read.texture
      renderer.setRenderTarget(write)
      renderer.render(scene, camera)
      renderer.setRenderTarget(null)
      targets.reverse()
    }
    copyMaterial.uniforms.tSource.value = targets[0].texture
    renderer.render(copyScene, camera)
  }
  const pane = new Pane({ container: controls.value!, title: 'Parameters' })
  // どのデモでも Enabled → Paused → 各パラメーターの順に並べる。
  const entries = Object.entries(paramDefs)
  // ラベルはシェーダー内の uniform 名と同じにする。
  const addParam = ([key, { value: _, ...options }]: (typeof entries)[number]) =>
    pane.addBinding(params, key, { ...options, label: uniformName(key) })
  entries.filter(([key]) => key === 'enabled').forEach(addParam)
  pane.addBinding(params, 'paused', { label: 'Paused' })
  entries.filter(([key]) => key !== 'enabled').forEach(addParam)
  pane.addButton({ title: 'Reset' }).on('click', () => {
    Object.assign(params, defaults, { paused: false })
    uniforms.uTime.value = 0
    clearTargets()
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
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false)
      uniforms.uResolution.value.set(w, h)
      for (const target of targets) target.setSize(w, h)
    }
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
    for (const key of Object.keys(defaults)) uniforms[uniformName(key)].value = params[key]
    render()
  })
  dispose = () => {
    renderer.setAnimationLoop(null)
    observer.disconnect(); pane.dispose()
    geometry.dispose(); material.dispose(); copyMaterial.dispose()
    for (const target of targets) target.dispose()
    texture.dispose(); fontTexture?.dispose(); renderer.dispose()
    renderer.domElement.remove()
  }
})
onUnmounted(() => dispose())
</script>

<template>
  <div class="demo-grid" :class="{ 'hide-code': hideCode }">
    <div class="preview-column">
      <slot name="intro" />
      <div class="preview">
        <div ref="viewport" class="viewport"><p v-if="error" role="alert">{{ error }}</p></div>
        <div ref="controls" class="controls" @keydown.stop @pointerdown.stop @click.stop />
        <p v-if="testCard" class="credit">Test card: "Philips PM5544" by ebnz, CC BY 2.5, via Wikimedia Commons</p>
      </div>
      <slot name="caption" />
    </div>
    <div v-if="!hideCode" class="code-column">
      <div class="shader-code" :style="codeFontSize ? { '--slidev-code-font-size': codeFontSize } : undefined"><div class="slidev-code-wrapper" v-html="codeHtml" /></div>
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
.shader-code :deep(pre) { display: block; height: 100%; box-sizing: border-box; overflow: auto; }
/* コードを出さないときは、映像を中央に大きく置く。 */
.demo-grid.hide-code { grid-template-columns: 1fr; }
.hide-code .preview-column { justify-content: center; }
.hide-code .preview { width: 680px; max-width: 100%; margin: 0 auto; }
.controls { position: absolute; top: 8px; right: 8px; z-index: 1; width: 256px; transform: scale(.75); transform-origin: top right; }
</style>
