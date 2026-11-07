import scanlines from "../shaders/scanlines.frag?raw";
import flicker from "../shaders/flicker.frag?raw";
import shift from "../shaders/shift.frag?raw";
import shiftLines from "../shaders/shift-lines.frag?raw";
import shiftBands from "../shaders/shift-bands.frag?raw";
import shiftEdge from "../shaders/shift-edge.frag?raw";
import feedback from "../shaders/feedback.frag?raw";
import blockGlitch from "../shaders/block-glitch.frag?raw";
import grain from "../shaders/grain.frag?raw";
import reference from "../shaders/reference/edgerunners_yuru.glsl?raw";

// Shadertoy 用のシェーダーを、そのままデモで動かせるようにする。
// Shadertoy の変数を、デモが渡す uniform に置き換える。
const shadertoy = (source: string) => `
uniform sampler2D uBackbuffer;
uniform sampler2D uSource;
uniform sampler2D uFont;
uniform float uTime;
uniform vec2 uResolution;
#define iChannel0 uBackbuffer
#define iChannel1 uSource
#define iChannel2 uFont
#define iTime uTime
#define iResolution vec3(uResolution, 1.0)
${source}
void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }
`;

// Tweakpane に出すパラメーター。キー名 foo は uniform uFoo に渡され、Tweakpane にも uFoo と表示される。
export type DemoParam =
  | { value: number; min: number; max: number; step: number }
  | { value: boolean; options?: Record<string, boolean> };

export interface Demo {
  shader: string;
  params: Record<string, DemoParam>;
  // true にすると、前フレームの出力を uBackbuffer として読める
  feedback?: boolean;
  // false にすると、テストパターンのクレジットを表示しない（入力画像を使わないデモ用）
  testCard?: boolean;
  // true にすると、ASCII の文字テクスチャを uFont として読める
  font?: boolean;
}

export const demos = {
  scanlines: {
    shader: scanlines,
    params: {
      density: { value: 200, min: 10, max: 300, step: 10 },
      strength: { value: 0.8, min: 0, max: 1, step: 0.01 },
      vertical: {
        value: false,
        options: { Horizontal: false, Vertical: true },
      },
      enabled: { value: true },
    },
  },
  flicker: {
    shader: flicker,
    params: {
      speed: { value: 120, min: 1, max: 120, step: 1 },
      strength: { value: 0.45, min: 0, max: 1, step: 0.01 },
      enabled: { value: true },
    },
  },
  shiftLines: {
    shader: shiftLines,
    params: {
      speed: { value: 1, min: 0.1, max: 2, step: 0.05 },
      rate: { value: 0.45, min: 0, max: 1, step: 0.01 },
      lineHeight: { value: 15, min: 2, max: 40, step: 1 },
      enabled: { value: true },
    },
  },
  shiftBands: {
    shader: shiftBands,
    params: {
      speed: { value: 1, min: 0.1, max: 2, step: 0.05 },
      bands: { value: 5, min: 1, max: 12, step: 1 },
      enabled: { value: true },
    },
  },
  shiftEdge: {
    shader: shiftEdge,
    params: {
      speed: { value: 1, min: 0.1, max: 2, step: 0.05 },
      offset: { value: 0, min: 0, max: 1, step: 0.01 },
      amount: { value: 0.03, min: 0, max: 0.1, step: 0.005 },
      enabled: { value: true },
    },
  },
  shift: {
    shader: shift,
    params: {
      speed: { value: 1, min: 0.1, max: 2, step: 0.05 },
      enabled: { value: true },
    },
  },
  feedback: {
    shader: feedback,
    feedback: true,
    testCard: false,
    params: {
      amount: { value: 0.95, min: 0, max: 1, step: 0.01 },
      gain: { value: 1.15, min: 0.9, max: 1.3, step: 0.01 },
      duration: { value: 1.2, min: 0.2, max: 5, step: 0.1 },
      scanlines: { value: true },
      grain: { value: true },
      enabled: { value: true },
    },
  },
  blockGlitch: {
    shader: blockGlitch,
    params: {
      amount: { value: 0.4, min: 0, max: 1, step: 0.01 },
      rate: { value: 30, min: 1, max: 60, step: 1 },
      lacunarity: { value: 0.5, min: 0.1, max: 1.5, step: 0.05 },
      persistence: { value: 0.5, min: 0, max: 1, step: 0.05 },
      invert: { value: true },
      enabled: { value: true },
    },
  },
  grain: {
    shader: grain,
    params: {
      amount: { value: 0.01, min: 0, max: 0.02, step: 0.0005 },
      fps: { value: 24, min: 1, max: 60, step: 1 },
      enabled: { value: true },
    },
  },
  final: {
    shader: shadertoy(reference),
    feedback: true,
    font: true,
    params: {},
  },
} satisfies Record<string, Demo>;

export type DemoName = keyof typeof demos;
