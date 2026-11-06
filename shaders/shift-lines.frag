uniform sampler2D uSource;
uniform float uTime;
uniform float uSpeed;
uniform float uRate;
uniform float uLineHeight;
uniform bool uEnabled;
varying vec2 vUv;

float rand(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// #region main
void main() {
  vec2 uv = vUv;
  vec2 glitchUV = uv;

  float t = uTime * uSpeed;
  float cycle = floor(t / 2.5);
  float glitchTime = uEnabled ? max(0.0, mod(t, 2.5) - 0.5) : 0.0;

  float line = floor(gl_FragCoord.y / uLineHeight);
  float subLine = floor(mod(gl_FragCoord.y, uLineHeight) / 2.0);

  if (rand(vec2(line, cycle * 71.0)) > 1.0 - uRate) {
    float startX = rand(vec2(line + 17.0, cycle));

    float baseLength = rand(vec2(line + 53.0, cycle)) * 0.25;
    float variation = rand(vec2(line * 17.0 + subLine, cycle + 92.0));
    float maxLength = baseLength * mix(0.4, 1.5, variation);

    float growth = smoothstep(0.0, 1.0, glitchTime);

    if (uv.x > startX && uv.x < startX + maxLength * growth) {
      glitchUV.x = startX;
    }
  }

  gl_FragColor = vec4(texture2D(uSource, glitchUV).rgb, 1.0);
}
// #endregion main
