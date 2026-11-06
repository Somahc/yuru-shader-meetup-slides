uniform sampler2D uBackbuffer; // 前フレームの出力
uniform float uTime;
uniform float uAmount;
uniform float uGain;
uniform float uDuration;
uniform bool uEnabled;
varying vec2 vUv;

const float tau = acos(-1.) * 2.;
mat2 rot(float a) { float s = sin(a), c = cos(a); return mat2(c, s, -s, c); }

const mat3 ycc2rgb = mat3(
  1.0,    1.0,    1.0,
  0.0,   -0.344,  1.773,
  1.403, -0.714,  0.0
);
const mat3 rgb2ycc = mat3(
  0.299, -0.168936,  0.499413,
  0.587, -0.330468, -0.418931,
  0.114,  0.499704, -0.081282
);

float rand(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// 「映像が横に流れる演出」の赤・黄色の帯。黒地に8本の帯を、0.06秒ごとに並べ替える
// 帯を塗る X 座標は、reference と同じく細かい横帯のグリッチと端のギザギザでずらす
// （映像が流れきった後の状態で固定し、伸びる・流れるアニメーションはなし）
vec3 fillBands(vec2 uv, float time, vec2 fragCoord) {
  float x = uv.x;

  // 細かい横帯のグリッチ（伸びきった状態）
  float lineHeight = 15.0;
  float line = floor(fragCoord.y / lineHeight);
  float subLine = floor(mod(fragCoord.y, lineHeight) / 2.0);
  if (rand(vec2(line, 0.0)) > 0.55) {
    float startX = rand(vec2(line + 17.0, 0.0));
    float baseLength = rand(vec2(line + 53.0, 0.0)) * 0.25;
    float variation = rand(vec2(line * 17.0 + subLine, 92.0));
    float maxLength = baseLength * mix(0.4, 1.5, variation) * 1.3;
    if (uv.x > startX && uv.x < startX + maxLength) x = startX;
  }

  // 端のギザギザ（1px ごとに ±3%）
  float edgeRand = rand(vec2(floor(fragCoord.y), 83.0));
  x -= (edgeRand * 2.0 - 1.0) * 0.03;

  float id = floor(uv.y * 8.0);
  float seed = floor(time / 0.06);
  vec3 red = vec3(1.0, 0.02, 0.0);
  vec3 yellow = vec3(1.0, 0.85, 0.0);
  vec3 color = rand(vec2(id + 91.0, seed)) < 0.5 ? red : yellow;
  float len = mix(0.2, 0.8, rand(vec2(id + 153.0, seed)));
  float start = rand(vec2(id + 127.0, seed)) * (1.0 - len);
  float mask = step(start, x) * step(x, start + len);
  return color * mask * 0.9;
}

// #region main
void main() {
  vec3 col = fillBands(vUv, uTime, gl_FragCoord.xy);

  // 前フレームの色を YCbCr（明るさ + 色差）に変換
  vec3 ycc = rgb2ycc * texture2D(uBackbuffer, vUv).rgb;

  // 色差 (Cb, Cr) を Cr に応じた角度で回転し、uGain 倍に強める
  // → 毎フレーム色相が回り、彩度が上がっていく
  ycc.yz *= rot(ycc.z / 16.0 * tau) * uGain;
  vec3 back = ycc2rgb * ycc;

  // uDuration 秒だけフィードバックを掛け、1秒休んで元に戻す
  float localTime = mod(uTime, uDuration + 1.0);
  float feedbackMask = (uEnabled && localTime < uDuration) ? 1.0 : 0.0;

  col = mix(col, back, uAmount * feedbackMask);
  gl_FragColor = vec4(col, 1.0);
}
// #endregion main
