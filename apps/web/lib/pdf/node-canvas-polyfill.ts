/* eslint-disable @typescript-eslint/no-explicit-any */
export async function ensurePdfNodeCanvasGlobals() {
  const needsCanvasGlobals =
    typeof globalThis.DOMMatrix === 'undefined' ||
    typeof globalThis.ImageData === 'undefined' ||
    typeof globalThis.Path2D === 'undefined'

  if (!needsCanvasGlobals) return

  const canvas = await import('@napi-rs/canvas')
  const globalScope = globalThis as any

  globalScope.DOMMatrix ??= canvas.DOMMatrix
  globalScope.ImageData ??= canvas.ImageData
  globalScope.Path2D ??= canvas.Path2D
}
