// デモのシェーダーコードをハイライトする。
// Slidev の `<<< @/file#region` 構文は、dev サーバー起動後に追加したスライドで
// 「Snippet syntax is not supported」となり読み込まれない（@slidev/cli 53.x のバグ）ため、
// コンポーネント側で Shiki を使って表示する。
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import glsl from 'shiki/langs/glsl.mjs'
import vitesseDark from 'shiki/themes/vitesse-dark.mjs'

let highlighter: Promise<HighlighterCore> | undefined

// `// #region name` 〜 `// #endregion name` の間を取り出す。見つからなければ全体を返す。
export function extractRegion(source: string, name: string) {
  const lines = source.split(/\r?\n/)
  const start = lines.findIndex(line => line.trim() === `// #region ${name}`)
  const end = lines.findIndex((line, i) => i > start && line.trim() === `// #endregion ${name}`)
  if (start < 0 || end < 0) return source.trim()
  return lines.slice(start + 1, end).join('\n').trim()
}

export async function highlightGlsl(code: string) {
  highlighter ??= createHighlighterCore({
    themes: [vitesseDark],
    langs: [glsl],
    engine: createJavaScriptRegexEngine(),
  })
  return (await highlighter).codeToHtml(code, {
    lang: 'glsl',
    theme: 'vitesse-dark',
    // Slidev のコードブロックと同じ見た目にする。
    transformers: [{ pre(node) { this.addClassToHast(node, 'slidev-code') } }],
  })
}
