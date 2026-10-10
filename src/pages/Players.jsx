import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useQuery } from '../lib/hooks.js'
import { ROLES, age, fullName } from '../lib/format.js'
import { Empty, ErrorBox, Loading, PageHeader, TeamLink } from '../components/ui.jsx'

export default function Players() {
  const q = useQuery(
    () =>
      supabase
        .from('players')
        .select('*, team:teams(id,name,short_name,logo_url)')
        .order('last_name')
        .limit(1000),
    [],
  )
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [team, setTeam] = useState('')

  const teams = useMemo(() => {
    const map = new Map()
    ;(q.data || []).forEach((p) => p.team && map.set(p.team.id, p.team.name))
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [q.data])

  const list = useMemo(() => {
    const s = search.trim().toLowerCase()
    return (q.data || []).filter(
      (p) =>
        (!s || fullName(p).toLowerCase().includes(s) || `${p.first_name} ${p.last_name}`.toLowerCase().includes(s)) &&
        (!role || p.role === role) &&
        (!team || p.team_id === team),
    )
  }, [q.data, search, role, team])

  return (
    <div>
      <PageHeader title="Giocatori" subtitle="Anagrafica dei tesserati" />
      <div className="filters">
        <input type="search" placeholder="Cerca per nome…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Cerca giocatore" />
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Ruolo">
          <option value="">Tutti i ruoli</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={team} onChange={(e) => setTeam(e.target.value)} aria-label="Squadra">
          <option value="">Tutte le squadre</option>
          {teams.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </div>
      <ErrorBox error={q.error} />
      {q.loading && !q.data ? (
        <Loading />
      ) : !list.length ? (
        <Empty>Nessun giocatore trovato.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Giocatore</th>
                <th>Squadra</th>
                <th className="hide-sm">Ruolo</th>
                <th className="center hide-sm">N°</th>
                <th className="right hide-sm">Età</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td><Link to={`/giocatori/${p.id}`}>{fullName(p)}</Link></td>
                  <td>{p.team ? <TeamLink team={p.team} /> : '—'}</td>
                  <td className="hide-sm">{p.role || '—'}</td>
                  <td className="center hide-sm">{p.shirt_number ?? '—'}</td>
                  <td className="right hide-sm">{age(p.birth_date) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
