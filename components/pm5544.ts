// Philips PM5544 のテストパターンを 16:9 に広げて描く。
// 元画像: "Philips PM5544" by ebnz, CC BY 2.5, via Wikimedia Commons
// https://commons.wikimedia.org/wiki/File:Philips_PM5544.svg
// 元画像は 4:3（768×576）なので、左右に同じ寸法の格子を描き足して 16:9 にする。

const SRC_W = 768
const SRC_H = 576
// 元画像の格子の寸法（元画像のピクセル単位）
const PITCH = 43 // 格子1マスの間隔（灰色40 + 白線3）
const LINE = 3
const LINE_X0 = 17 // 最初の縦線の位置。左外周ブロックの幅でもある
const LINE_Y0 = 7 // 最初の横線の位置。上外周ブロックの高さでもある
const GRAY = '#808080'

const SRC_URL = `${import.meta.env.BASE_URL}images/pm5544.svg`

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`画像を読み込めませんでした: ${src}`))
    img.src = src
  })
}

// [x0, x1) の範囲に、元画像と同じ格子と上下の外周ブロックを描く。
function fillGrid(ctx: CanvasRenderingContext2D, x0: number, x1: number) {
  const w = x1 - x0
  ctx.fillStyle = GRAY
  ctx.fillRect(x0, 0, w, SRC_H)
  ctx.fillStyle = '#ffffff'
  for (let y = LINE_Y0; y < SRC_H; y += PITCH) ctx.fillRect(x0, y, w, LINE)
  // 上下の外周：白地に、偶数番目のマスだけ黒
  ctx.fillRect(x0, 0, w, LINE_Y0)
  ctx.fillRect(x0, SRC_H - LINE_Y0, w, LINE_Y0)
  const kMin = Math.floor((x0 - LINE_X0) / PITCH)
  const kMax = Math.ceil((x1 - LINE_X0) / PITCH)
  for (let k = kMin; k <= kMax; k++) {
    const lineX = LINE_X0 + k * PITCH
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(lineX, 0, LINE, SRC_H)
    if (k % 2 === 0) {
      ctx.fillStyle = '#000000'
      ctx.fillRect(lineX + LINE, 0, PITCH - LINE, LINE_Y0)
      ctx.fillRect(lineX + LINE, SRC_H - LINE_Y0, PITCH - LINE, LINE_Y0)
    }
  }
}

// [x0, x1) の範囲に、左右の外周ブロック（白地に黒が縦に並ぶ）を描く。
function fillSideBorder(ctx: CanvasRenderingContext2D, x0: number, x1: number) {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x0, 0, x1 - x0, SRC_H)
  ctx.fillStyle = '#000000'
  for (let m = 0; LINE_Y0 + m * PITCH < SRC_H - LINE_Y0; m += 2) {
    ctx.fillRect(x0, LINE_Y0 + LINE + m * PITCH, x1 - x0, PITCH - LINE)
  }
}

export async function drawPM5544(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const img = await loadImage(SRC_URL)
  const scale = height / SRC_H
  const ext = (width / scale - SRC_W) / 2 // 左右に足す幅（元画像のピクセル単位）

  ctx.save()
  ctx.scale(scale, scale)
  ctx.translate(ext, 0)
  ctx.drawImage(img, 0, 0, SRC_W, SRC_H)

  // 元画像の左右の外周ブロックは、格子で上書きして内側の一部にする。
  const rightEdge = LINE_X0 + Math.floor((SRC_W - LINE_X0) / PITCH) * PITCH + LINE
  fillGrid(ctx, -ext, LINE_X0 + LINE)
  fillGrid(ctx, rightEdge - LINE, SRC_W + ext)

  // 広げた画像の端に、新しい外周ブロックを描く。
  const leftBorderEnd = LINE_X0 - Math.floor((LINE_X0 + ext) / PITCH) * PITCH
  const rightBorderStart = rightEdge + Math.floor((SRC_W + ext - rightEdge) / PITCH) * PITCH
  fillSideBorder(ctx, -ext, leftBorderEnd)
  fillSideBorder(ctx, rightBorderStart, SRC_W + ext)
  ctx.restore()
}
