uniform sampler2D uSource;
uniform float uTime;
uniform float uSpeed;
uniform float uBands;
uniform bool uEnabled;
varying vec2 vUv;

float rand(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// #region main
void main() {
  vec2 uv = vUv;

  // 2秒周期でループし、0.5秒たったら動き始める
  float t = uTime * uSpeed;
  float cycle = floor(t / 2.0);
  float glitchTime = uEnabled ? max(0.0, mod(t, 2.0) - 0.5) : 0.0;

  // 画面を uBands 本の帯に分け、帯ごとに乱数を作る
  float dispRand = rand(vec2(floor(uv.y * uBands) + 37.0, cycle));
  float moveDistance = 1.15 + dispRand * 1.5; // 帯ごとに移動距離を変える（どれも画面の外まで）

  // 1秒かけて右へ流す
  float displacement = moveDistance * smoothstep(0.0, 1.0, glitchTime);
  uv.x -= displacement;

  // 画面外に出た部分は黒
  float visible = step(0.0, uv.x) * step(uv.x, 1.0);
  vec3 col = texture2D(uSource, clamp(uv, 0.0, 1.0)).rgb * visible;
  gl_FragColor = vec4(col, 1.0);
}
// #endregion main
