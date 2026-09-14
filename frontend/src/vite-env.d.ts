/// <reference types="vite/client" />

declare global {
  interface Window {
    // Preload là ranh giới IPC; hợp đồng domain sẽ được thu hẹp dần ở Phase 4.
    api: any
  }
}

export {}
