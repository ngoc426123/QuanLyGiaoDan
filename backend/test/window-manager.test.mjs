import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { it } from 'node:test'
import { restoreWindowState, readWindowState, saveWindowState } from '#/main/window-manager.js'

const primary = { workArea: { x: 0, y: 0, width: 1920, height: 1040 } }
const secondary = { workArea: { x: -1920, y: 0, width: 1920, height: 1080 } }

it('cửa sổ lưu/đọc đúng bounds thường và trạng thái phóng to', () => {
  const dir = mkdtempSync(join(tmpdir(), 'elecrusion-window-test-'))
  try {
    const file = join(dir, 'window-state.json')
    const state = { x: 150, y: 80, width: 1100, height: 700, isMaximized: true }
    saveWindowState(file, state)
    assert.deepEqual(restoreWindowState(readWindowState(file), [primary], primary), state)
    writeFileSync(file, '{invalid')
    assert.equal(readWindowState(file), null)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

it('tháo màn hình phụ: về giữa màn hình chính với kích thước mặc định', () => {
  const saved = { x: -1800, y: 50, width: 1000, height: 650, isMaximized: true }
  assert.equal(restoreWindowState(saved, [primary, secondary], primary).x, -1800)
  assert.deepEqual(restoreWindowState(saved, [primary], primary), {
    x: 320,
    y: 120,
    width: 1280,
    height: 800,
    isMaximized: false,
  })
})

it('kẹp kích thước, đưa thanh tiêu đề vào màn hình, bỏ JSON sai cấu trúc', () => {
  assert.deepEqual(
    restoreWindowState({ x: 1800, y: -500, width: 5000, height: 2500 }, [primary], primary),
    { x: 0, y: 0, width: 1920, height: 1040, isMaximized: false },
  )
  const tiny = restoreWindowState({ x: 20, y: 20, width: 1, height: 1 }, [primary], primary)
  assert.equal(tiny.width, 940)
  assert.equal(tiny.height, 600)
  for (const value of [null, [], 'bad', { x: 0, y: 0, width: -1, height: 600 }]) {
    assert.equal(restoreWindowState(value, [primary], primary).x, 320)
  }
})
