uniform sampler2D uSource;
uniform float uDensity;
uniform float uStrength;
uniform bool uVertical;
uniform bool uEnabled;
varying vec2 vUv;

const float pi = acos(-1.);

// #region main
void main() {
  vec3 col = texture2D(uSource, vUv).rgb;

  // sin 波を並べて縞の明暗を作る（uDensity / 2 本）
  // x 方向に並べると縦縞、y 方向に並べると横縞になる
  float axis = uVertical ? vUv.x : vUv.y;
  float scan = sin(axis * uDensity * pi);

  // -1〜1 を 0〜1 にして、uStrength の分だけ暗くする。最後に少し明るさを足す
  scan = mix(1.0, (scan + 1.0) / 2.0, uStrength) + 0.1;

  col *= uEnabled ? scan : 1.0;
  gl_FragColor = vec4(col, 1.0);
}
// #endregion main
