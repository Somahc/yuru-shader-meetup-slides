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
transition: slide-left
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
layout: default
---

<ScanlineDemo>

<template #intro>

# 走査線

- 周期的な明暗を重ねる。密度と強さで、画面の質感が変わる。
- test

</template>

<template #code>

<<< @/shaders/scanlines.frag#main glsl

</template>

</ScanlineDemo>
