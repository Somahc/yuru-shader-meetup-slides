// Cyberpunk: Edgerunners 風の演出（edgerunners_yuru.mov の元になった Shadertoy シェーダー）。
// スライドで解説する内容の参照用。最後のスライドの完成版デモでは、このファイルをそのまま読み込んで動かす。
//
// Shadertoy のチャンネル構成:
//   iChannel0: このバッファ自身（前フレーム。Video Feedback 用）
//   iChannel1: 元の映像・画像
//   iChannel2: フォントテクスチャ（16×16 の ASCII アトラス）
//
// 4秒周期のタイムライン（localTime）:
//   0.0〜0.6s  元映像のまま（glitchTime = 0）
//   0.51〜0.9s 明るさのチラつき（点滅）
//   0.6s〜     Phase 1 の細かい横帯グリッチ、映像が右へ流れる、黒い部分を赤・黄色の帯で塗る
//   1.4〜2.6s  Video Feedback（glitchTime 0.8〜2.0）
//   2.6s〜     白背景に黒文字の「YURU SHADER」（Block Displacement Glitch つき）
//   走査線は localTime < 1.5 または > 2.5 のときだけ掛かる

#define backbuffer iChannel0
const float pi = acos(-1.);
const float tau = pi*2.;
mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,s,-s,c);}

const mat3 ycc2rgb = mat3(
    1.0,     1.0,    1.0,
    0.0,    -0.344,  1.773,
    1.403,  -0.714,  0.0
);
const mat3 rgb2ycc = mat3(
    0.299,    -0.168936,   0.499413,
    0.587,    -0.330468,  -0.418931,
    0.114,     0.499704,  -0.081282
);

float drawChar(vec2 p, float ascii)
{
    if (p.x < 0.0 || p.x >= 1.0 ||
        p.y < 0.0 || p.y >= 1.0)
        return 0.0;

    vec2 cell = vec2(
        mod(ascii, 16.0),
        15.0 - floor(ascii / 16.0)
    );

    vec2 atlasUV = (cell + p) / 16.0;

    return texture(iChannel2, atlasUV).r;
}

float rand(vec2 p)
{
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// http://www.jcgt.org/published/0009/03/02/
uvec3 hash3u(uvec3 v) {
  v = v * 1664525u + 1013904223u;

  v.x += v.y * v.z;
  v.y += v.z * v.x;
  v.z += v.x * v.y;

  v ^= v >> 16u;

  v.x += v.y * v.z;
  v.y += v.z * v.x;
  v.z += v.x * v.y;

  return v;
}

vec2 getNoise(vec2 p, float amount) {
  const vec2 BLOCK_SIZE = vec2(2., .5);
  const float RATE = 30.0;
  const float LACUNARITY = 0.5;
  const float PERSISTENCE = .5;

  vec2 sum = vec2(0.0);
  float amp = 1.0;
  for (int i = 0; i < 5; i++) {
    int idy = int(floor(p.y / BLOCK_SIZE.y));
    float dicey = float(hash3u(uvec3(idy, 0, RATE * iTime)).x) / float(0xffffffffu);
    float offx = floor(BLOCK_SIZE.x / BLOCK_SIZE.y * dicey) * BLOCK_SIZE.y;
    vec2 pt = p + vec2(offx, 0.0);
    ivec2 id = ivec2(floor(pt / BLOCK_SIZE));
    vec3 dice = vec3(hash3u(uvec3(id.xy, RATE * iTime))) / float(0xffffffffu);
    if (dice.z < amount) {
      sum += (dice.xy - 0.5) * amp;
    }

    amp *= PERSISTENCE;
    p *= LACUNARITY;
  }
  
  return sum;
}


float titleMask(vec2 uv, float titleTime)
{
    float charHeight = 0.055;
    float height_offset =exp(-40.0 * titleTime);
    charHeight = mix(0.055, 10.55, height_offset);
    float charWidth = charHeight *
        iResolution.y / iResolution.x;

    float spacingOffset = exp(-1. * titleTime);
    float spacing = charWidth * mix(2.0, 1.7, spacingOffset);
    float totalWidth = 11.0 * spacing;

    vec2 start = vec2(
        0.5 - totalWidth * 0.5,
        0.5 - charHeight * 0.5
    );

    float mask = 0.0;
    
    for (int i = 0; i < 11; i++)
    {
        float ascii = 32.0;

        // YURU SHADER
        if (i == 0) ascii = 89.0;
        if (i == 1) ascii = 85.0;
        if (i == 2) ascii = 82.0;
        if (i == 3) ascii = 85.0;
        if (i == 4) ascii = 32.0;
        if (i == 5) ascii = 83.0;
        if (i == 6) ascii = 72.0;
        if (i == 7) ascii = 65.0;
        if (i == 8) ascii = 68.0;
        if (i == 9) ascii = 69.0;
        if (i == 10) ascii = 82.0;

        vec2 p = (uv - vec2(
            start.x + float(i) * spacing,
            start.y
        )) / vec2(charWidth, charHeight);

        mask = max(mask, drawChar(p, ascii));
    }

    return mask;
}


void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    float time = iTime;

    vec2 uv = fragCoord / iResolution.xy;
    vec2 asp = iResolution.xy / min(iResolution.x, iResolution.y);
    vec2 suv = (uv * 2. - 1.) * asp;
    vec2 screenUV = uv;

    // ----------------------------------------
    // Time
    // ----------------------------------------

    float duration = 4.;
    float cycle = floor(time / duration);
    float localTime = mod(time, duration);

    // グリッチ用の時間
    // 0.6秒までは0、その後進行
    float glitchTime = max(0.0, localTime - 0.6);

    vec2 glitchUV = uv;
    
    
    float _NoiseY = 0.3;
    if (screenUV.y > _NoiseY && screenUV.y < _NoiseY + 0.3)
    {
        //screenUV.y = _NoiseY;
    }

    // ----------------------------------------
    // Phase 1 : Fine glitch
    // ----------------------------------------

    float lineHeight = 15.0;

    // 横帯ごとのID
    float line = floor(fragCoord.y / lineHeight);

    // 帯の内部を2px単位に分割
    float subLine = floor(mod(fragCoord.y, lineHeight) / 2.0);

    // 周期ごとにランダム配置を固定
    float r = rand(vec2(line, cycle * 71.0));

    if (r > 0.55)
    {
        // 開始位置は帯全体で共通
        float startX = rand(vec2(line + 17.0, cycle));

        // 帯の基本的な最大長
        float baseLength = rand(vec2(line + 53.0, cycle)) * 0.25;

        // Y座標ごとにランダムな長さ
        float variation = rand(vec2(
            line * 17.0 + subLine,
            cycle + 92.0
        ));

        // それぞれの高さで長さをランダム化
        float maxLength = baseLength * mix(0.4, 1.5, variation);

        // 0〜0.5秒で85%まで伸びる
        float earlyGrowth = smoothstep(0.0, 0.2, glitchTime) * 0.85;

        // 0.5〜1.5秒で残り15%をゆっくり伸ばす
        float lateGrowth = smoothstep(0.2, 1.5, glitchTime) * 0.45;

        float growth = earlyGrowth + lateGrowth;

        float length = maxLength * growth;

        if (uv.x > startX && uv.x < startX + length)
        {
            glitchUV.x = startX;
        }
    }

    // ----------------------------------------
    // Additional large displacement glitch
    // ----------------------------------------

    float dispBlockCount = 5.0;
    float dispBlockID = floor(screenUV.y * dispBlockCount);

    float dispRand = rand(vec2(dispBlockID + 37.0, cycle));

    // 最初の移動距離：画面幅の20〜30%
    float firstDistance = mix(0.1, 0.3, dispRand);

    // 最終移動距離：画面外まで
    float finalDistance = 1.15 + dispRand * 1.5;

    // 0.2〜0.4秒で大きく移動
    float firstMove = smoothstep(0.2, 0.6, glitchTime);

    // 0.4秒以降も少しずつ右へ動き続ける
    float slowMove = clamp(
        (glitchTime - 0.4) / 0.6,
        0.0, 1.0
    ) * 0.06;

    // 0.45秒から再加速し、一気に右へ流れる
    float secondMove = smoothstep(0.45, 0.85, glitchTime);

    // ----------------------------------------
    // Jagged displacement edge
    // ----------------------------------------

    // 3ピクセルごとにランダムな段差
    float edgeHeight = mix(8.0, 1.0, secondMove);
    float edgeSubLine = floor(fragCoord.y / edgeHeight);

    // Y座標ごとにランダムな値を固定
    float edgeRand = rand(vec2(
        edgeSubLine,
        cycle + 83.0
    ));

    // 画面幅の±3%程度のガタつき
    float edgeOffset = (edgeRand * 2.0 - 1.0) * 0.03;

    // 元の移動量
    float baseDisplacement =
        firstDistance * firstMove
        + slowMove
        + (finalDistance - firstDistance - 0.06) * secondMove;

    // ガタつきを移動量に追加
    float displacement =
        baseDisplacement
        + edgeOffset * smoothstep(0.0, 0.3, glitchTime);

    // 映像を右へ移動
    glitchUV.x -= displacement;

    // ----------------------------------------
    // Image
    // ----------------------------------------

    // 右へ移動した元画像のUV
    vec2 sampleUV = glitchUV;

    // UVが画像の範囲内にあるか
    float visible = step(0.0, sampleUV.x) * step(sampleUV.x, 1.0);

    // 元画像をサンプリング
    vec3 col = texture(iChannel1, clamp(sampleUV, 0.0, 1.0)).rgb;

    // 画像が右へ流れた後は黒
    col *= visible;

    // ----------------------------------------
    // Red / Yellow fill
    // ----------------------------------------

    float fillUV = glitchUV.x + baseDisplacement;
    
    // 8分割で色を決定
    float fillBlockCount = 8.0;
    float fillBlockID = floor(screenUV.y * fillBlockCount);
    
    // 0.06秒ごとにランダム更新
    float colorTime = floor(glitchTime / 0.06);
    float randomSeed = cycle * 137.0 + colorTime;

    // ブロックごとに赤か黄色
    float colorRand = rand(vec2(fillBlockID + 91.0, randomSeed));

    vec3 red = vec3(1.0, 0.02, 0.0);
    vec3 yellow = vec3(1.0, 0.85, 0.0);

    vec3 fillColor = colorRand < 0.5 ? red : yellow;
    
    // 横帯ごとのランダムな横幅（黒い領域の20〜80%）
    float fillLength = mix(
        0.2, 0.8,
        rand(vec2(fillBlockID + 153.0, randomSeed))
    );

    // 横幅に応じて開始位置を制限
    float fillStart = rand(vec2(fillBlockID + 127.0, randomSeed)) * (1.0 - fillLength);

    // 黒い領域の中に必ず収める
    float blackWidth = clamp(baseDisplacement, 0.0, 1.0);

    float startX = blackWidth * fillStart;
    float endX = startX + blackWidth * fillLength;

    // 開始位置から終了位置までを塗る
    float fillMask = step(startX, fillUV) * step(fillUV, endX);

    // 元画像が範囲外になった部分
    float blackArea = 1.0 - visible;
    

    // 黒い部分を赤・黄色で90%覆う
    col = mix(col, fillColor, blackArea * fillMask * 0.9);
    
    // ----------------------------------------
    // Video Feedback?
    // https://www.shadertoy.com/view/tX3yDX
    // ----------------------------------------
    vec3 back = vec3(0.), ycc = vec3(0.);
    vec3 y = rgb2ycc*texture(backbuffer, uv).rgb;
    y.yz *= rot(y.z*tau)*1.15;
    ycc += y;
    back = ycc2rgb*ycc;
    
    // 赤黄色の表示開始から0.8秒後に有効化
    float feedbackStart = 0.8;

    // 有効になってから1.2秒間継続
    float feedbackDuration = 1.2;

    float feedbackMask =
        step(feedbackStart, glitchTime) *
        (1.0 - step(
            feedbackStart + feedbackDuration,
            glitchTime
        ));

    col = mix(col, back, 0.95 * feedbackMask);
    
    // Fine distortion
    float grain = rand(fragCoord + floor(iTime * 24.0) * 17.0);
    screenUV.x += (grain - 0.5) * 0.001;
    
    // ----------------------------------------
    // YURU SHADER
    // ----------------------------------------
    
    // 白背景に黒文字
    if(localTime >= 2.6)
    {
        float titleTime = localTime - 2.6;

        vec2 noise = getNoise(suv, 3. - localTime);
        
        float r = titleMask(screenUV + noise * 0.4, titleTime);
        float g = titleMask(screenUV + noise * 0.5, titleTime);
        float b = titleMask(screenUV + noise * 0.6, titleTime);
        
        
        // 白背景に黒文字
        vec3 titleCol = vec3(1.0) - vec3(r, g, b);
        
        // ノイズが発生している部分を判定
        float noiseMask = step(0.0001, length(noise));

        // ノイズ部分だけネガポジ反転
        titleCol = mix(titleCol,1.0 - titleCol * 0.8,noiseMask);
        col = titleCol;
    }
    
    
    // ----------------------------------------
    // Display startup (0.0〜0.1秒)
    // ----------------------------------------

    float startup = smoothstep(0.0, 0.1, glitchTime);

    // 走査線のフェードイン
    float scan = sin(screenUV.x * 500.0 * pi + time * 3.0);
    scan = mix(1.0, (scan + 1.0) / 2.0, 0.3 * startup) + 0.1;

    // 最初だけ明るさチラつき
    float flickerTime = floor(glitchTime * 120.0);
    float flickerRand = rand(vec2(flickerTime, cycle + 137.0));
    float flickerStrength = (localTime >= 0.51 && localTime < 0.9) ? 0.45 : 0.0;
    float brightness = 1.0 + (flickerRand * 2.0 - 1.0) * flickerStrength;

    if(localTime < 1.5 || localTime > 2.5) col *= scan;
    col *= brightness;
    
    fragColor = vec4(col, 1.0);
}