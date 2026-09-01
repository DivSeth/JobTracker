import { afterEach, describe, expect, it } from 'vitest'

import { ensurePdfNodeCanvasGlobals } from '@/lib/pdf/node-canvas-polyfill'

const originalDescriptors = {
  DOMMatrix: Object.getOwnPropertyDescriptor(globalThis, 'DOMMatrix'),
  ImageData: Object.getOwnPropertyDescriptor(globalThis, 'ImageData'),
  Path2D: Object.getOwnPropertyDescriptor(globalThis, 'Path2D'),
}

function setGlobal(name: 'DOMMatrix' | 'ImageData' | 'Path2D', value: unknown) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  })
}

afterEach(() => {
  for (const [name, descriptor] of Object.entries(originalDescriptors)) {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor)
    } else {
      delete (globalThis as Record<string, unknown>)[name]
    }
  }
})

describe('ensurePdfNodeCanvasGlobals', () => {
  it('installs PDF.js canvas globals when Node does not provide them', async () => {
    setGlobal('DOMMatrix', undefined)
    setGlobal('ImageData', undefined)
    setGlobal('Path2D', undefined)

    await ensurePdfNodeCanvasGlobals()

    expect(globalThis.DOMMatrix).toBeTypeOf('function')
    expect(globalThis.ImageData).toBeTypeOf('function')
    expect(globalThis.Path2D).toBeTypeOf('function')
  })
})
