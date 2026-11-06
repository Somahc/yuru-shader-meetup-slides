uniform sampler2D uSource;
uniform float uTime;
uniform float uSpeed;
uniform bool uEnabled;
varying vec2 vUv;

float rand(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// #region main
void main() {
  vec2 uv = vUv;
  vec2 fragCoord = gl_FragCoord.xy;

  // 2.5秒周期でループし、0.5秒たったら演出を始める
  float t = uTime * uSpeed;
  float cycle = floor(t / 2.5);
  float glitchTime = uEnabled ? max(0.0, mod(t, 2.5) - 0.5) : 0.0;

  vec2 glitchUV = uv;

  // ---- 細かい横帯のグリッチ ----
  // 15px の帯ごとに、一部の帯だけ横に引き伸ばす
  float lineHeight = 15.0;
  float line = floor(fragCoord.y / lineHeight);
  float subLine = floor(mod(fragCoord.y, lineHeight) / 2.0);
  if (rand(vec2(line, cycle * 71.0)) > 0.55) {
    float startX = rand(vec2(line + 17.0, cycle));
    float baseLength = rand(vec2(line + 53.0, cycle)) * 0.25;
    float variation = rand(vec2(line * 17.0 + subLine, cycle + 92.0));
    float maxLength = baseLength * mix(0.4, 1.5, variation);
    float growth = smoothstep(0.0, 0.2, glitchTime) * 0.85
                 + smoothstep(0.2, 1.5, glitchTime) * 0.45;
    // 範囲内は startX の色で塗りつぶす（= 横に伸びて見える）
    if (uv.x > startX && uv.x < startX + maxLength * growth) {
      glitchUV.x = startX;
    }
  }

  // ---- 画面を5本の帯に分けて右へ流す ----
  float dispRand = rand(vec2(floor(uv.y * 5.0) + 37.0, cycle));
  float firstDistance = mix(0.1, 0.3, dispRand);
  float finalDistance = 1.15 + dispRand * 1.5;
  float firstMove = smoothstep(0.2, 0.6, glitchTime);
  float slowMove = clamp((glitchTime - 0.4) / 0.6, 0.0, 1.0) * 0.06;
  float secondMove = smoothstep(0.45, 0.85, glitchTime);
  float baseDisplacement = firstDistance * firstMove + slowMove
                         + (finalDistance - firstDistance - 0.06) * secondMove;

  // 流れる映像の端をギザギザにする
  float edgeHeight = mix(8.0, 1.0, secondMove);
  float edgeRand = rand(vec2(floor(fragCoord.y / edgeHeight), cycle + 83.0));
  float edgeOffset = (edgeRand * 2.0 - 1.0) * 0.03;
  glitchUV.x -= baseDisplacement + edgeOffset * smoothstep(0.0, 0.3, glitchTime);

  // 画面外に出た部分は黒
  float visible = step(0.0, glitchUV.x) * step(glitchUV.x, 1.0);
  vec3 col = texture2D(uSource, clamp(glitchUV, 0.0, 1.0)).rgb * visible;

  gl_FragColor = vec4(col, 1.0);
}
// #endregion main
