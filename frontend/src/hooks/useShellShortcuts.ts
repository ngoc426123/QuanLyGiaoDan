import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/stores/ui.store.ts'

/** Phím tắt của khung, đăng ký đúng một lần; hành động nghiệp vụ dành cho Phase 4/5.
 * @returns {void}
 */
export function useShellShortcuts({ onCommandPalette }: { onCommandPalette?: () => void } = {}) {
  const navigate = useNavigate()
  const toggle = useUIStore((state) => state.toggleSidebar)
  useEffect(() => {
    function handleKey(event) {
      if (event.target.closest('input, textarea, select, [contenteditable="true"], dialog')) return
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return
      const key = event.key.toLowerCase()
      if (!['f', 'b', ',', 'k', 'n'].includes(key)) return
      event.preventDefault()
      if (key === 'f') document.getElementById('global-search')?.focus()
      if (key === 'b') toggle()
      if (key === ',') navigate('/settings')
      if (key === 'k') onCommandPalette?.()
      if (key === 'n') navigate('/persons', { state: { action: 'new' } })
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navigate, onCommandPalette, toggle])
}
