import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useQuery } from '../lib/hooks.js'
import { useCompetition } from '../lib/competition.jsx'
import { empty } from '../lib/queries.js'
import { computeScorers } from '../lib/standings.js'
import { fullName } from '../lib/format.js'
import { Empty, ErrorBox, Loading, PageHeader, TeamLink } from '../components/ui.jsx'

export default function Scorers() {
  const { current } = useCompetition()
  const cid = current?.id
  const q = useQuery(
    () =>
      cid
        ? supabase
            .from('match_events')
            .select(
              'type,player_id,team_id,player:players(id,first_name,last_name),team:teams(id,name,short_name,logo_url),matches!inner(competition_id)',
            )
            .eq('matches.competition_id', cid)
            .in('type', ['goal', 'penalty'])
        : empty(),
    [cid],
  )

  if (!current) return <Empty>Nessun campionato selezionato.</Empty>
  const rows = computeScorers(q.data || [])

  return (
    <div>
      <PageHeader title="Classifica marcatori" subtitle={current.name} />
      <ErrorBox error={q.error} />
      {q.loading && !q.data ? (
        <Loading />
      ) : !rows.length ? (
        <Empty>Nessun gol registrato.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th className="center">#</th>
                <th>Giocatore</th>
                <th>Squadra</th>
                <th className="center">Gol</th>
                <th className="center hide-sm">Rigori</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.player.id}>
                  <td className="center">{i > 0 && rows[i - 1].goals === r.goals ? '' : i + 1}</td>
                  <td><Link to={`/giocatori/${r.player.id}`}>{fullName(r.player)}</Link></td>
                  <td><TeamLink team={r.team} /></td>
                  <td className="center"><strong>{r.goals}</strong></td>
                  <td className="center hide-sm">{r.penalties}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
