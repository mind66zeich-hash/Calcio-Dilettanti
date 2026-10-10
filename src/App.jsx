import { Navigate, Route, Routes } from 'react-router-dom'
import { configured } from './lib/supabase.js'
import { useAuth } from './lib/auth.jsx'
import Layout from './components/Layout.jsx'
import Setup from './components/Setup.jsx'
import { Loading } from './components/ui.jsx'

import Home from './pages/Home.jsx'
import Standings from './pages/Standings.jsx'
import Fixtures from './pages/Fixtures.jsx'
import Teams from './pages/Teams.jsx'
import TeamDetail from './pages/TeamDetail.jsx'
import Players from './pages/Players.jsx'
import PlayerDetail from './pages/PlayerDetail.jsx'
import MatchDetail from './pages/MatchDetail.jsx'
import Scorers from './pages/Scorers.jsx'
import Discipline from './pages/Discipline.jsx'
import Venues from './pages/Venues.jsx'
import NewsList from './pages/NewsList.jsx'
import NewsDetail from './pages/NewsDetail.jsx'
import Login from './pages/Login.jsx'

import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminHome from './pages/admin/AdminHome.jsx'
import AdminMatches from './pages/admin/AdminMatches.jsx'
import MatchEditor from './pages/admin/MatchEditor.jsx'
import AdminRegistrations from './pages/admin/AdminRegistrations.jsx'
import AdminGenerator from './pages/admin/AdminGenerator.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import {
  AdminSeasons,
  AdminCompetitions,
  AdminTeams,
  AdminPlayers,
  AdminVenues,
  AdminNews,
} from './pages/admin/crudPages.jsx'

function RequireStaff({ children }) {
  const { session, isStaff, loading, profile } = useAuth()
  if (loading) return <div className="container"><Loading /></div>
  if (!session) return <Navigate to="/login" replace />
  if (!isStaff) {
    return (
      <div className="container narrow">
        <div className="card">
          <h1>Accesso limitato</h1>
          <p>
            L'account <strong>{profile?.email || session.user.email}</strong> non ha i permessi di gestione.
            Chiedi a un amministratore di assegnarti il ruolo «editor» o «admin».
          </p>
        </div>
      </div>
    )
  }
  return children
}

export default function App() {
  if (!configured) return <Setup />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="classifica" element={<Standings />} />
        <Route path="calendario" element={<Fixtures />} />
        <Route path="squadre" element={<Teams />} />
        <Route path="squadre/:id" element={<TeamDetail />} />
        <Route path="giocatori" element={<Players />} />
        <Route path="giocatori/:id" element={<PlayerDetail />} />
        <Route path="partita/:id" element={<MatchDetail />} />
        <Route path="marcatori" element={<Scorers />} />
        <Route path="disciplina" element={<Discipline />} />
        <Route path="campi" element={<Venues />} />
        <Route path="news" element={<NewsList />} />
        <Route path="news/:id" element={<NewsDetail />} />
        <Route path="login" element={<Login />} />

        <Route
          path="admin"
          element={
            <RequireStaff>
              <AdminLayout />
            </RequireStaff>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="campionati" element={<AdminCompetitions />} />
          <Route path="stagioni" element={<AdminSeasons />} />
          <Route path="iscrizioni" element={<AdminRegistrations />} />
          <Route path="squadre" element={<AdminTeams />} />
          <Route path="giocatori" element={<AdminPlayers />} />
          <Route path="campi" element={<AdminVenues />} />
          <Route path="partite" element={<AdminMatches />} />
          <Route path="partite/:id" element={<MatchEditor />} />
          <Route path="calendario" element={<AdminGenerator />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="utenti" element={<AdminUsers />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
