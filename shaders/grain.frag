uniform sampler2D uSource;
uniform float uTime;
uniform float uAmount;
uniform float uFps;
uniform bool uEnabled;
varying vec2 vUv;

// #region main
float rand(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  // ピクセルごとのランダム値。1秒間に uFps 回作り直す
  float grain = rand(gl_FragCoord.xy + floor(uTime * uFps) * 17.0);

  // 読み取る位置を横に少しだけずらす
  uv.x += uEnabled ? (grain - 0.5) * uAmount : 0.0;

  gl_FragColor = vec4(texture2D(uSource, uv).rgb, 1.0);
}
// #endregion main
