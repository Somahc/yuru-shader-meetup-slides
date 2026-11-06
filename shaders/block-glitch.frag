uniform sampler2D uSource;
uniform float uTime;
uniform vec2 uResolution;
uniform float uAmount;
uniform float uScale;
uniform bool uInvert;
uniform bool uEnabled;
varying vec2 vUv;

// http://www.jcgt.org/published/0009/03/02/
uvec3 hash3u(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}

// #region main
vec2 getNoise(vec2 p, float amount) {
  const vec2 BLOCK_SIZE = vec2(2., .5);
  const float RATE = 30.0;       // 1秒間に30回ブロックを作り直す
  const float LACUNARITY = 0.5;  // オクターブごとにブロックを2倍の大きさに
  const float PERSISTENCE = .5;  // オクターブごとにずれ量を半分に

  vec2 sum = vec2(0.0);
  float amp = 1.0;
  for (int i = 0; i < 5; i++) {
    // 行ごとにブロックの区切りを横にずらして、格子っぽさを消す
    int idy = int(floor(p.y / BLOCK_SIZE.y));
    float dicey = float(hash3u(uvec3(idy, 0, RATE * uTime)).x) / float(0xffffffffu);
    float offx = floor(BLOCK_SIZE.x / BLOCK_SIZE.y * dicey) * BLOCK_SIZE.y;
    vec2 pt = p + vec2(offx, 0.0);

    // ブロックごとに乱数を作り、amount の確率でずらす
    ivec2 id = ivec2(floor(pt / BLOCK_SIZE));
    vec3 dice = vec3(hash3u(uvec3(id.xy, RATE * uTime))) / float(0xffffffffu);
    if (dice.z < amount) {
      sum += (dice.xy - 0.5) * amp;
    }

    amp *= PERSISTENCE;
    p *= LACUNARITY;
  }
  return sum;
}

void main() {
  vec2 asp = uResolution / min(uResolution.x, uResolution.y);
  vec2 suv = (vUv * 2.0 - 1.0) * asp;
  vec2 noise = uEnabled ? getNoise(suv, uAmount) * uScale : vec2(0.0);

  // RGB ごとにずらす量を変えて、色ずれを作る
  vec3 col = vec3(
    texture2D(uSource, vUv + noise * 0.4).r,
    texture2D(uSource, vUv + noise * 0.5).g,
    texture2D(uSource, vUv + noise * 0.6).b
  );

  // ずれたブロックだけネガポジ反転
  float noiseMask = step(0.0001, length(noise));
  if (uInvert) col = mix(col, 1.0 - col * 0.8, noiseMask);

  gl_FragColor = vec4(col, 1.0);
}
// #endregion main
