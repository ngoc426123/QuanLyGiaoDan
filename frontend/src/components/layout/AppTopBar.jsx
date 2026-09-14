import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Icon } from '@/components/ui/Icon.jsx'
import { Modal } from '@/components/ui/Modal.jsx'
import { useUIStore } from '@/stores/ui.store.js'
import { routeTitle } from './navigation.js'
import styles from './AppTopBar.module.css'

export function AppTopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMaximized, setIsMaximized] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)
  const [isAboutOpen, setAboutOpen] = useState(false)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const query = new URLSearchParams(location.search).get('q') || ''
  useEffect(() => {
    const applyWindowState = (state) => setIsMaximized(state?.maximized === true)
    const unsubscribe = window.api?.events?.onWindowStateChanged?.(applyWindowState)
    window.api?.app
      ?.getWindowState?.()
      .then((result) => applyWindowState(result?.data ?? result))
      .catch(() => {})
    return unsubscribe
  }, [])
  function search(event) {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get('search').trim()
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }
  function closeWindow() {
    window.api?.app?.closeWindow?.()
  }
  function minimizeWindow() {
    window.api?.app?.minimizeWindow?.()
  }
  async function toggleMaximize() {
    const result = await window.api?.app?.toggleMaximize?.()
    setIsMaximized(result?.data?.maximized ?? result?.maximized ?? false)
  }
  function chooseMenu(action) {
    setOpenMenu(null)
    action()
  }
  return (
    <header className={styles.bar}>
      <div className={styles.titlebar}>
        <span className={styles.appTitle}>DANH BẠ GIÁO XỨ</span>
        <div className={styles.menu} role="menubar" aria-label="Thanh menu">
          <div className={styles.menuGroup}>
            <button
              type="button"
              aria-expanded={openMenu === 'file'}
              aria-controls="file-menu"
              onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
            >
              Tệp
            </button>
            {openMenu === 'file' && (
              <div id="file-menu" className={styles.menuPopup} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => chooseMenu(() => navigate('/settings'))}
                >
                  Cài đặt
                </button>
                <button type="button" role="menuitem" onClick={() => chooseMenu(closeWindow)}>
                  Thoát ứng dụng
                </button>
              </div>
            )}
          </div>
          <div className={styles.menuGroup}>
            <button
              type="button"
              aria-expanded={openMenu === 'view'}
              aria-controls="view-menu"
              onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')}
            >
              Xem
            </button>
            {openMenu === 'view' && (
              <div id="view-menu" className={styles.menuPopup} role="menu">
                <button type="button" role="menuitem" onClick={() => chooseMenu(toggleSidebar)}>
                  Thu gọn hoặc mở rộng thanh bên
                </button>
              </div>
            )}
          </div>
          <div className={styles.menuGroup}>
            <button
              type="button"
              aria-expanded={openMenu === 'help'}
              aria-controls="help-menu"
              onClick={() => setOpenMenu(openMenu === 'help' ? null : 'help')}
            >
              Trợ giúp
            </button>
            {openMenu === 'help' && (
              <div id="help-menu" className={styles.menuPopup} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => chooseMenu(() => setAboutOpen(true))}
                >
                  Giới thiệu ứng dụng
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.windowControls}>
        <button type="button" onClick={minimizeWindow} aria-label="Thu nhỏ cửa sổ" title="Thu nhỏ">
          <Icon name="minimize" />
        </button>
        <button
          type="button"
          onClick={toggleMaximize}
          aria-label={isMaximized ? 'Khôi phục cửa sổ' : 'Phóng to cửa sổ'}
          title={isMaximized ? 'Khôi phục' : 'Phóng to'}
        >
          <Icon name={isMaximized ? 'restore' : 'maximize'} />
        </button>
        <button
          className={styles.close}
          type="button"
          onClick={closeWindow}
          aria-label="Đóng cửa sổ"
          title="Đóng cửa sổ"
        >
          <Icon name="close" />
        </button>
      </div>
      <div className={styles.breadcrumb}>
        Giáo xứ <span aria-hidden="true">/</span> <strong>{routeTitle(location.pathname)}</strong>
      </div>
      <form key={query} role="search" className={styles.search} onSubmit={search}>
        <Input
          id="global-search"
          name="search"
          aria-label="Tìm kiếm toàn bộ danh bạ"
          placeholder="Tìm trong danh bạ…"
          type="search"
          defaultValue={query}
        />
        <Button type="submit" aria-label="Tìm kiếm">
          <Icon name="search" />
        </Button>
      </form>
      <Link className={styles.trash} to="/trash" aria-label="Thùng rác" title="Thùng rác">
        <Icon name="trash" />
      </Link>
      {isAboutOpen && (
        <Modal title="Danh bạ giáo xứ" onClose={() => setAboutOpen(false)}>
          <p>Ứng dụng quản lý giáo dân, gia đình và giáo họ, hoạt động với dữ liệu lưu trên máy.</p>
        </Modal>
      )}
    </header>
  )
}
