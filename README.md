# yuru-shader-meetup-slides

シェーダー交流会用のSlidevプロジェクト。

走査線のデモでは、Three.jsの実行結果とfragment shaderを並べて表示します。
Tweakpaneで密度・強さ・速度・向きを変更でき、エフェクトのON/OFF、一時停止、リセットにも対応しています。

シェーダーは`shaders/scanlines.frag`、デモの実装は`components/ScanlineDemo.vue`にあります。

## 起動

```sh
npm install
npm run dev
```

`slides.md`を編集してスライドを作成します。

## ビルド

```sh
npm run build
```

## PDF出力

初回のみ、出力に使うブラウザーをインストールします。

```sh
npm install -D playwright-chromium
npm run export
```

[Slidev公式ガイド](https://sli.dev/guide/)
