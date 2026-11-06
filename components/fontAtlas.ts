// Shadertoy のフォントテクスチャ（iChannel の "Font 1"）の代わりに使う ASCII アトラス。
// Shadertoy と同じく 16×16 マスに文字コード順で並べ、左上のマスを 0 番にする。
// 白い文字を黒地に描くので、シェーダーでは .r を文字のマスクとして読める。
export function drawFontAtlas(ctx: CanvasRenderingContext2D, size: number) {
  const cell = size / 16
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // マスの外にはみ出すと隣の文字に混ざるので、マスより少し小さめに描く
  ctx.font = `bold ${cell * 0.8}px Arial, Helvetica, sans-serif`
  for (let code = 33; code < 127; code++) {
    const x = (code % 16 + 0.5) * cell
    const y = (Math.floor(code / 16) + 0.5) * cell
    ctx.fillText(String.fromCharCode(code), x, y)
  }
}
