uniform sampler2D uSource;
uniform float uTime;
uniform float uDensity;
uniform float uStrength;
uniform float uSpeed;
uniform bool uVertical;
uniform bool uEnabled;
varying vec2 vUv;

// #region main
void main() {
  vec3 color = texture2D(uSource, vUv).rgb;
  float axis = uVertical ? vUv.x : vUv.y;
  float phase = axis * uDensity - uTime * uSpeed;
  float wave = 0.5 + 0.5 * cos(phase * 6.283185);
  float scan = mix(1.0, wave, uStrength);
  color *= uEnabled ? scan : 1.0;
  gl_FragColor = vec4(color, 1.0);
}
// #endregion main
