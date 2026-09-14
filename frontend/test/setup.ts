import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

export const media = new EventTarget()
media.matches = false
media.media = '(prefers-color-scheme: dark)'
window.matchMedia = () => media

globalThis.ResizeObserver = class {
  constructor(callback) {
    this.callback = callback
  }
  observe() {
    this.callback()
  }
  disconnect() {}
}

// jsdom chưa có thuật toán top-layer của Chromium; cần kiểm bẫy focus thật riêng trong Electron.
HTMLDialogElement.prototype.showModal = function () {
  this.open = true
  this.querySelector('button')?.focus()
}
HTMLDialogElement.prototype.close = function () {
  this.open = false
}

beforeEach(() => {
  document.documentElement.style.setProperty('--row-height', '52px')
  media.matches = false
  localStorage.clear()
  window.location.hash = '/'
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
