// Chạy đồng bộ trước CSS và React; script ngoài để tuân thủ CSP production.
;(function () {
  let theme = 'system'
  try {
    theme = localStorage.getItem('elecrusion.theme') || 'system'
  } catch {
    /* Không có cache vẫn theo hệ thống. */
  }
  const dark =
    theme === 'dark' || (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
})()
