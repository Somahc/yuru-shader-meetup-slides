uniform sampler2D uSource;
uniform float uTime;
uniform float uSpeed;
uniform float uOffset;
uniform float uAmount;
uniform bool uEnabled;
varying vec2 vUv;

float rand(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// #region main
void main() {
  vec2 uv = vUv;

  // 2秒周期でループし、0.5秒たったら始める。周期ごとにガタつきを変える
  float t = uTime * uSpeed;
  float cycle = floor(t / 2.0);
  float glitchTime = uEnabled ? max(0.0, mod(t, 2.0) - 0.5) : 0.0;

  // 段差の高さを 8px から 1px へ細かくしていく
  float secondMove = smoothstep(0.45, 0.85, glitchTime);
  float edgeHeight = mix(8.0, 1.0, secondMove);

  // edgeHeight px ごとに、ずらす量をランダムに変える
  float edgeRand = rand(vec2(floor(gl_FragCoord.y / edgeHeight), cycle + 83.0));
  float edgeOffset = (edgeRand * 2.0 - 1.0) * uAmount;

  // 全体を uOffset だけ右へずらし、行ごとのガタつきを 0.3秒かけて足す
  uv.x -= uOffset + edgeOffset * smoothstep(0.0, 0.3, glitchTime);

  // 画面外に出た部分は黒
  float visible = step(0.0, uv.x) * step(uv.x, 1.0);
  vec3 col = texture2D(uSource, clamp(uv, 0.0, 1.0)).rgb * visible;
  gl_FragColor = vec4(col, 1.0);
}
// #endregion main
