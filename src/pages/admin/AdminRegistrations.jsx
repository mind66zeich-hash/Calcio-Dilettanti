import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useQuery } from '../../lib/hooks.js'
import { useCompetition } from '../../lib/competition.jsx'
import { empty } from '../../lib/queries.js'
import { Empty, ErrorBox, Loading, PageHeader, TeamLink } from '../../components/ui.jsx'

export default function AdminRegistrations() {
  const { competitions, current } = useCompetition()
  const [cid, setCid] = useState(current?.id || '')
  const [teamId, setTeamId] = useState('')
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!cid && current) setCid(current.id)
  }, [current, cid])

  const regs = useQuery(
    () => (cid ? supabase.from('competition_teams').select('*, teams(id,name,short_name,logo_url)').eq('competition_id', cid) : empty()),
    [cid],
  )
  const teams = useQuery(() => supabase.from('teams').select('id,name').order('name'), [])

  const registered = new Set((regs.data || []).map((r) => r.team_id))
  const available = (teams.data || []).filter((t) => !registered.has(t.id))

  async function add(e) {
    e.preventDefault()
    if (!teamId) return
    setErr(null)
    const { error } = await supabase.from('competition_teams').insert({ competition_id: cid, team_id: teamId })
    if (error) return setErr(error)
    setTeamId('')
    regs.reload()
  }

  async function remove(r) {
    if (!window.confirm(`Togliere ${r.teams?.name} dal campionato? Le partite già inserite non vengono cancellate.`)) return
    const { error } = await supabase.from('competition_teams').delete().eq('competition_id', cid).eq('team_id', r.team_id)
    if (error) window.alert(error.message)
    else regs.reload()
  }

  async function setPenalty(r, value) {
    const n = Number(value) || 0
    if (n === r.penalty_points) return
    const { error } = await supabase
      .from('competition_teams')
      .update({ penalty_points: n })
      .eq('competition_id', cid)
      .eq('team_id', r.team_id)
    if (error) window.alert(error.message)
    else regs.reload()
  }

  return (
    <div>
      <PageHeader title="Squadre iscritte" subtitle="Quali squadre partecipano al campionato, ed eventuali penalizzazioni." />

      <div className="filters">
        <select value={cid} onChange={(e) => setCid(e.target.value)} aria-label="Campionato">
          <option value="">Seleziona un campionato…</option>
          {competitions.map((c) => <option key={c.id} value={c.id}>{c.name}{c.seasons?.name ? ` · ${c.seasons.name}` : ''}</option>)}
        </select>
      </div>

      {!cid ? (
        <Empty>Seleziona un campionato.</Empty>
      ) : (
        <>
          <form className="inline-form card" onSubmit={add} style={{ marginBottom: '1rem' }}>
            <div className="field">
              <label htmlFor="r-team">Aggiungi squadra</label>
              <select id="r-team" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                <option value="">Seleziona una squadra…</option>
                {available.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <button className="btn primary" disabled={!teamId}>Iscrivi</button>
          </form>
          <ErrorBox error={err || regs.error} />

          {regs.loading && !regs.data ? (
            <Loading />
          ) : !regs.data?.length ? (
            <Empty>Nessuna squadra iscritta.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Squadra</th>
                    <th className="center">Penalizzazione (punti)</th>
                    <th className="right">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {[...regs.data].sort((a, b) => a.teams.name.localeCompare(b.teams.name)).map((r) => (
                    <tr key={r.team_id}>
                      <td><TeamLink team={r.teams} /></td>
                      <td className="center">
                        <input
                          className="penalty"
                          type="number"
                          min="0"
                          defaultValue={r.penalty_points}
                          key={`${r.team_id}-${r.penalty_points}`}
                          aria-label={`Penalizzazione ${r.teams.name}`}
                          onBlur={(e) => setPenalty(r, e.target.value)}
                        />
                      </td>
                      <td className="right">
                        <button type="button" className="btn small danger" onClick={() => remove(r)}>Rimuovi</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
