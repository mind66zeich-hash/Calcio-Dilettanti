import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useQuery } from '../lib/hooks.js'
import { useCompetition } from '../lib/competition.jsx'
import { empty } from '../lib/queries.js'
import { computeDiscipline } from '../lib/standings.js'
import { fullName } from '../lib/format.js'
import { Empty, ErrorBox, Loading, PageHeader, TeamLink } from '../components/ui.jsx'

export default function Discipline() {
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
            .in('type', ['yellow', 'red'])
        : empty(),
    [cid],
  )

  if (!current) return <Empty>Nessun campionato selezionato.</Empty>
  const rows = computeDiscipline(q.data || [])

  return (
    <div>
      <PageHeader title="Disciplina" subtitle={`${current.name} · ammonizioni ed espulsioni`} />
      <ErrorBox error={q.error} />
      {q.loading && !q.data ? (
        <Loading />
      ) : !rows.length ? (
        <Empty>Nessun cartellino registrato.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Giocatore</th>
                <th>Squadra</th>
                <th className="center">🟨</th>
                <th className="center">🟥</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.player.id}>
                  <td><Link to={`/giocatori/${r.player.id}`}>{fullName(r.player)}</Link></td>
                  <td><TeamLink team={r.team} /></td>
                  <td className="center">{r.yellow}</td>
                  <td className="center">{r.red}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted">
        Le eventuali squalifiche vanno verificate sul comunicato ufficiale del Comitato: questa pagina riporta solo i
        cartellini inseriti nei referti.
      </p>
    </div>
  )
}
