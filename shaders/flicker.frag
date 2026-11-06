uniform sampler2D uSource;
uniform float uTime;
uniform float uSpeed;
uniform float uStrength;
uniform bool uEnabled;
varying vec2 vUv;

// #region main
float rand(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 col = texture2D(uSource, vUv).rgb;

  // 1秒間に uSpeed 回、明るさのランダム値を更新する
  float flickerTime = floor(uTime * uSpeed);
  float flickerRand = rand(vec2(flickerTime, 137.0));

  // 明るさを 1.0 ± uStrength の範囲で揺らす
  float brightness = 1.0 + (flickerRand * 2.0 - 1.0) * uStrength;

  col *= uEnabled ? brightness : 1.0;
  gl_FragColor = vec4(col, 1.0);
}
// #endregion main
