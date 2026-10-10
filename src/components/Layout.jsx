import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import { useCompetition } from '../lib/competition.jsx'

const LINKS = [
  ['/', 'Home'],
  ['/classifica', 'Classifica'],
  ['/calendario', 'Calendario'],
  ['/squadre', 'Squadre'],
  ['/giocatori', 'Giocatori'],
  ['/marcatori', 'Marcatori'],
  ['/disciplina', 'Disciplina'],
  ['/campi', 'Campi'],
  ['/news', 'News'],
]

function CompetitionPicker() {
  const { competitions, current, setCurrentId } = useCompetition()
  if (!competitions.length) return null
  return (
    <label className="picker">
      <span className="sr-only">Campionato</span>
      <select value={current?.id || ''} onChange={(e) => setCurrentId(e.target.value)}>
        {competitions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.seasons?.name ? ` · ${c.seasons.name}` : ''}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { session, isStaff, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => setOpen(false), [location.pathname])

  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <img src="./favicon.svg" alt="" width="32" height="32" />
            <span>Calcio Dilettanti</span>
          </Link>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Chiudi' : 'Menu'}
          </button>
          <nav id="main-nav" className={'nav' + (open ? ' open' : '')} aria-label="Principale">
            {LINKS.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>
                {label}
              </NavLink>
            ))}
            <div className="nav-tools">
              <CompetitionPicker />
              {session ? (
                <>
                  {isStaff && (
                    <Link to="/admin" className="btn small accent">Gestione</Link>
                  )}
                  <button
                    type="button"
                    className="btn small ghost-light"
                    onClick={async () => {
                      await signOut()
                      navigate('/')
                    }}
                  >
                    Esci
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn small accent">Accedi</Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <small>Calcio Dilettanti · gestione campionati provinciali e regionali</small>
        </div>
      </footer>
    </div>
  )
}
