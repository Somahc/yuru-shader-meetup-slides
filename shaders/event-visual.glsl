// ゆるゆるシェーダー交流会 #2 のビジュアル（Shadertoy 用のシェーダー）。
// スライドでは components/demos.ts の shadertoy() で包んで、そのまま動かす。
const float pi = acos(-1.);
float seedOffset = 2.4;
mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,s,-s,c);}

vec2 hash( vec2 p )
{
    p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

vec3 hash33(vec3 p3)
{
    p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz+33.33);
    return fract((p3.xxy + p3.yxx)*p3.zyx);
}

float qt(vec2 uv, out float diamond)
{
    const int maxDepth = 4;

    uv *= 1.;

    float scale = 1.;
    vec2 cellId = vec2(0.0);
    int depth = 0;

    float cellScale = 1.0;

    for(int i = 0; i < maxDepth; i++)
    {
        cellScale = scale;

        cellId = floor(uv * scale);

        vec3 h = hash33(vec3(cellId, float(i)+seedOffset));
        depth = i;

        float splitChance = mix(
            0.7,
            0.3,
            float(i) / float(maxDepth - 1)
        );

        if(h.x > splitChance)
            break;

        scale *= 2.0;
    }

    vec3 h = hash33(vec3(cellId, float(depth)));

    // --------------------------------
    // diamond
    // --------------------------------
    diamond = 0.0;

    if(depth == maxDepth - 1 && h.x < 0.2)
    {
        vec2 local = fract(uv * cellScale) - 0.5;

    local *= 1.8;

    vec2 d_vec = abs(local * rot(pi / 4.0));

    float thickness = .06;
    float size = 0.48;

    float d = abs(abs(local.x) + abs(local.y) - size);
    diamond = float(d < thickness);

    }

    // orange
    if(depth >= 2 && h.z < 0.25)
        return 2.0;

    // gray
    if(h.y < 0.35)
        return 1.0;

    return 0.0;
}

// See: https://www.shadertoy.com/view/Msf3WH
float snoise2D( in vec2 p )
{
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

    vec2  i = floor( p + (p.x+p.y)*K1 );
    vec2  a = p - i + (i.x+i.y)*K2;
    float m = step(a.y,a.x);
    vec2  o = vec2(m,1.0-m);
    vec2  b = a - o + K2;
    vec2  c = a - 1.0 + 2.0*K2;
    vec3  h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
    vec3  n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
    return dot( n, vec3(70.0) );
}

float squareGrid(vec2 p, float gridSize)
{
    vec2 q = p / gridSize;

    vec2 g = abs(fract(q + 0.5) - 0.5) * gridSize;

    float thickness = 0.00255; // 0.002 looks good on MacBook, but it's not visible when resolution is not enough

    // 線自体も0/1
    float vertical   = float(g.x < thickness);
    float horizontal = float(g.y < thickness);

    // 破線の周期
    float freq = 30.0;

    // 0 / 1 を繰り返す
    float dashV = step(0.3, fract(p.y * freq));
    float dashH = step(0.3, fract(p.x * freq));

    vertical   *= dashV;
    horizontal *= dashH;

    return max(vertical, horizontal);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    vec2 asp = iResolution.xy / min(iResolution.x, iResolution.y);
    vec2 suv = (uv * 2. - 1.) * asp;

    vec2 p = suv;
    p *=2.;

    p += snoise2D(p) * .4;

    // --------------------------------
    // 等高線
    // See: https://renard.hateblo.jp/entry/2023/07/05/122300
    // --------------------------------
    const vec2 e = vec2(1e-4,0);

    float w = .04;
    float f = 6.;

    float t = iTime * 0.05;

    vec2 warp = vec2(
        snoise2D(p * 0.35 + vec2(t, 0.0)),
        snoise2D(p * 0.35 + vec2(0.0, t))
    );

    vec2 np = p + warp * 0.35;

    float n0 = snoise2D(np+e.xy);
    float n1 = snoise2D(np-e.xy);
    float n2 = snoise2D(np+e.yx);
    float n3 = snoise2D(np-e.yx);

    vec2 g = vec2(n0-n1,n2-n3)/(2.*e.x);

    float i0 = fract((snoise2D(np)*.5+.5)*f);
    float d = i0 / length(g);

    // アンチエイリアス
    float aa = fwidth(d) * 0.2;

    float c = 1.0 - smoothstep(
        w - aa,
        w + aa,
        d
    );


    vec3 col = vec3(0.96);

    float diamond;
    float q = qt(suv, diamond);

    float grayMask   = float(q == 1.0);
    float orangeMask = float(q == 2.0);

    vec3 gray   = vec3(0.4);
    vec3 orange = vec3(1.00, 0.25, 0.04);

    // 背景
    col = mix(col, gray, grayMask);
    col = mix(col, orange, orangeMask);

    // gray / orangeでは白い等高線
    float coloredMask = max(grayMask, orangeMask);

    vec3 lineColor = mix(
        vec3(0.0),
        vec3(1.0),
        coloredMask
    );

    col = mix(col, lineColor, c);

    // --------------------------------
    // grid & diamond
    // --------------------------------
    float grid = squareGrid(suv, 0.5);
    col = mix(col, vec3(0.1), grid);

    vec3 green = vec3(0.0, 0.77, 0.09);
    col = mix(col, green, diamond);

    fragColor = vec4(col, 1.0);
}
