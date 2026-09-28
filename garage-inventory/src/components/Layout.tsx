import { useEffect } from 'react'
import { NavLink, Outlet, useSearchParams } from 'react-router-dom'
import { clearError, useStore } from '../store'

const links = [
  ['/', 'Find'],
  ['/scan', 'Scan'],
  ['/locations', 'Locations'],
  ['/map', 'Map'],
  ['/export', 'Export'],
  ['/settings', 'Settings'],
] as const

export function Layout() {
  const { status, error, repoName } = useStore()
  const [params] = useSearchParams()
  const kiosk = params.get('kiosk') === '1'
  useEffect(() => {
    document.body.classList.toggle('kiosk', kiosk)
  }, [kiosk])

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">
          🔧 Garage
        </NavLink>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        {error && (
          <div className="banner error">
            <span style={{ flex: 1 }}>{error}</span>
            <button className="ghost" onClick={clearError}>
              ✕
            </button>
          </div>
        )}
        {status === 'loading' ? <p className="muted">Loading from {repoName}…</p> : <Outlet />}
      </main>
    </div>
  )
}
