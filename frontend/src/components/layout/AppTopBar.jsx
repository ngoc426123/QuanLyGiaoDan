import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Icon } from '@/components/ui/Icon.jsx'
import { routeTitle } from './navigation.js'
import styles from './AppTopBar.module.css'

export function AppTopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const query = new URLSearchParams(location.search).get('q') || ''
  function search(event) {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get('search').trim()
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }
  return (
    <header className={styles.bar}>
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
    </header>
  )
}
