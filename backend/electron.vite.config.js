import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'electron-vite'

const sharedDir = fileURLToPath(new URL('../shared', import.meta.url))
const srcDir = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  main: {
    resolve: { alias: { '#': srcDir, '@shared': sharedDir } },
    build: {
      outDir: 'out',
      emptyOutDir: true,
      lib: { entry: 'src/main/index.ts', formats: ['es'] },
      rollupOptions: { output: { entryFileNames: 'main.js' } },
    },
  },

  preload: {
    resolve: { alias: { '@shared': sharedDir } },
    build: {
      // Preload chạy trong sandbox nên bắt buộc là CommonJS — Electron không nạp
      // được preload dạng ESM khi `sandbox: true`. Vì `backend/package.json` khai
      // báo `type: module`, đuôi phải là `.cjs` thì Node mới đọc đúng định dạng.
      outDir: 'out',
      emptyOutDir: false,
      lib: { entry: 'src/preload/index.ts', formats: ['cjs'] },
      rollupOptions: {
        output: { entryFileNames: 'preload.cjs', inlineDynamicImports: true },
      },
    },
  },
})
