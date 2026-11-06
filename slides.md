---
theme: default
title: 'シェーダーでCyberpunk: Edgerunners風の演出を作ってみた'
colorSchema: light
fonts:
  sans: Noto Sans JP
  weights: '400,600,700'
layout: cover
class: title-slide
info: false
mdc: true
---

# シェーダーでCyberpunk: Edgerunners風の演出を作ってみた

<div class="title-event">2026/11/7 ゆるゆるシェーダー交流会 #2</div>

---
layout: default
class: profile-slide
---

# 何をされてる方なの？

<div class="profile-description">

- Sigreni（@nimono_vr） / Somahc
- 株式会社ジュニでフロントエンドエンジニアとしてインターン（2024/6~）
  - 普段は大学院2年生として修論（やばい）
- シェーダー歴は2年くらい
  - SESSIONS 2024がきっかけ
- 来年からは関西のゲーム会社でテクニカル<br />アーティスト
  - （卒業できれば、、）

</div>

<div class="profile-image">
  <img src="/images/profile_sigreni.jpeg" alt="プロフィール画像" />
</div>

---
layout: default
class: works-slide
---

# こんなもの作ってます

<div class="works-grid">
  <div class="work-panel">
    <div class="work-caption">4k Executable Graphics - ♡MOE♡</div>
    <img src="/images/moe.png" alt="制作物 moe" />
  </div>
  <div class="work-panel">
    <div class="work-caption">ふわふわ時間（共作、VRChatワールド）</div>
    <img src="/images/fuwatime.png" alt="制作物 fuwatime" />
  </div>
  <div class="work-panel">
    <div class="work-caption">VJ at A!</div>
    <SlidevVideo :autoplay="true" autoreset="slide" muted loop playsinline controls preload="metadata">
      <source src="https://i.gyazo.com/164d54dd6048457f46b45d61db1db839.mp4" type="video/mp4" />
    </SlidevVideo>
  </div>
  <div class="work-panel">
    <div class="work-caption">VJ at draw(tokyo); #4</div>
    <SlidevVideo :autoplay="true" autoreset="slide" muted loop playsinline controls preload="metadata">
      <source src="/images/draw_vj.mp4" type="video/mp4" />
    </SlidevVideo>
  </div>
</div>

---
layout: center
class: text-center
---

# Cyberpunk: Edgerunnersみましたか？

---
layout: default
class: edgerunners-slide
---

# Cyberpunk: Edgerunners

<div class="edgerunners-description">

- TRIGGER制作のアニメ
    - Netflixでみれます
- CD PROJEKT RED『Cyberpunk 2077』の世界が舞台
    - 1期2期がそれぞれゲーム本編の前日譚と後日譚
    - 2期はつい先日公開
- 世界観やストーリー、キャラクターが最高にかっこいい
    - AKIRA、攻殻機動隊とかが好きなら刺さりそう
    - ゲームやってなくても楽しめます！

</div>

<div class="edgerunners-image">
  <img src="/images/CPER2-2.webp" alt="Cyberpunk: Edgerunners 2 のキービジュアル" />
</div>

---
layout: center
class: text-center
---

Cyberpunk: Edgerunners
# EDへ移る演出がかっこいい

---
layout: center
class: text-center
---

# それっぽいの作ってみました

---
layout: center
class: text-center
---

<div class="yuru-video">
  <SlidevVideo :autoplay="true" autoreset="slide" muted loop playsinline preload="auto">
    <source src="/images/edgerunners_yuru.mov" />
  </SlidevVideo>
</div>

<p class="yuru-video-caption">コレの話をします</p>

---
layout: default
---

# 実装したもの

- 点滅
- 走査線
- 映像が横に流れる演出
- Video Feedback（色がだんだん変わってくやつ）
- Block Displacement Glitch
- グレイン

---
layout: default
---

<ShaderDemo demo="flicker">

<template #intro>

# 点滅

- 一定時間ごとにランダムな値を作り、色の出力に乗算
- Speedで更新の速さ、Strengthで明るさの振れ幅が変わる

</template>

</ShaderDemo>

---
layout: default
---

<ShaderDemo demo="scanlines">

<template #intro>

# 走査線

- 周期的な明暗を重ねる。密度と強さで、画面の質感が変わる。
- test

</template>

</ShaderDemo>

---
layout: default
---

<ShaderDemo demo="shiftLines" code-font-size="12px">

<template #intro>

# 細かい横帯のグリッチ

- 15pxの帯のうち、一部の帯だけを選ぶ
- 帯の中の一点の色で、右へ引き伸ばす
- 伸ばす長さを2pxごとに変えて、端をバラつかせる

</template>

</ShaderDemo>

---
layout: default
---

<ShaderDemo demo="shiftBands">

<template #intro>

# 画面を帯に分けて右へ流す

- 画面を5本の帯に分け、帯ごとに移動距離を変える
- 帯ごとに速さが違うので、バラバラに画面外へ流れていく
- 画面外に出た部分は黒にする

</template>

</ShaderDemo>

---
layout: default
---

<ShaderDemo demo="shiftEdge">

<template #intro>

# 流れる映像の端をギザギザにする

- 数pxごとに、ずらす量をランダムに変える
- 帯の端がまっすぐにならず、ガタついて見える

</template>

</ShaderDemo>

---
layout: default
---

<ShaderDemo demo="shift">

<template #intro>

# 映像が横に流れる演出

- 3つを組み合わせるとこんな感じ
  - 細かい横帯のグリッチ
  - 画面を帯に分けて右へ流す
  - 流れる映像の端をギザギザにする

</template>

</ShaderDemo>

---
layout: default
---

<ShaderDemo demo="feedback">

<template #intro>

# Video Feedback

- 前フレームの出力を読み、今のフレームに混ぜる
- YCbCrに変換し、色差だけを回転・増幅して色相を回す

</template>

</ShaderDemo>

---
layout: default
---

<ShaderDemo demo="blockGlitch">

<template #intro>

# Block Displacement Glitch

- ブロックごとの乱数で、読み取る位置をずらす
- 大きさの違うブロックを5段重ねる
- RGBごとにずれ幅を変えて色ずれを作る

</template>

</ShaderDemo>

---
layout: default
---

<ShaderDemo demo="grain">

<template #intro>

# グレイン

- ピクセルごとの乱数で、読み取る位置を横にわずかに揺らす
- 1秒に24回更新して、フィルムっぽいざらつきを出す

</template>

</ShaderDemo>
