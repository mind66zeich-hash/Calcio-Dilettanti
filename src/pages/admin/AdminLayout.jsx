import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/auth.jsx'

export default function AdminLayout() {
  const { isAdmin } = useAuth()
  return (
    <div className="admin">
      <nav className="sidebar" aria-label="Gestione">
        <NavLink to="/admin" end>Dashboard</NavLink>
        <div className="group">Campionato</div>
        <NavLink to="/admin/stagioni">Stagioni</NavLink>
        <NavLink to="/admin/campionati">Campionati</NavLink>
        <NavLink to="/admin/iscrizioni">Squadre iscritte</NavLink>
        <NavLink to="/admin/calendario">Genera calendario</NavLink>
        <NavLink to="/admin/partite">Partite e referti</NavLink>
        <div className="group">Anagrafiche</div>
        <NavLink to="/admin/squadre">Squadre</NavLink>
        <NavLink to="/admin/giocatori">Giocatori</NavLink>
        <NavLink to="/admin/campi">Campi</NavLink>
        <div className="group">Contenuti</div>
        <NavLink to="/admin/news">News</NavLink>
        {isAdmin && (
          <>
            <div className="group">Sistema</div>
            <NavLink to="/admin/utenti">Utenti</NavLink>
          </>
        )}
      </nav>
      <section>
        <Outlet />
      </section>
    </div>
  )
}
