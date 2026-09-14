import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Bốn khoá bắt buộc đúng giá trị: `docs/01-architecture/project-structure.md` §6.
export default defineConfig({
  plugins: [react()],

  // Bắt buộc './' — đường dẫn tuyệt đối hỏng khi chạy qua file:// ở bản đóng gói.
  base: './',

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },

  server: {
    host: '127.0.0.1',
    port: 5173,
    // Cổng cố định: Main chờ đúng cổng này rồi mới mở cửa sổ.
    strictPort: true,
    // Cho phép đọc ngược lên thư mục cha để lấy `shared/`.
    fs: { allow: ['..'] },
  },

  build: {
    outDir: '../backend/renderer',
    emptyOutDir: true,
  },
})
