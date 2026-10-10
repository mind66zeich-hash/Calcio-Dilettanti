import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useQuery } from '../lib/hooks.js'
import { MATCH_SELECT } from '../lib/queries.js'
import { EVENT_ICONS, EVENT_TYPES, STATUS, fmtDateTime, fullName } from '../lib/format.js'
import { Empty, ErrorBox, Loading, TeamBadge } from '../components/ui.jsx'

export default function MatchDetail() {
  const { id } = useParams()
  const m = useQuery(
    () => supabase.from('matches').select(`${MATCH_SELECT}, competition:competitions(id,name)`).eq('id', id).maybeSingle(),
    [id],
  )
  const ev = useQuery(
    () =>
      supabase
        .from('match_events')
        .select('*, player:players(id,first_name,last_name)')
        .eq('match_id', id)
        .order('minute', { nullsFirst: true }),
    [id],
  )

  if (m.loading) return <Loading />
  if (m.error) return <ErrorBox error={m.error} />
  if (!m.data) return <Empty>Partita non trovata.</Empty>
  const x = m.data
  const done = x.status === 'played' && x.home_score != null

  const label = (e) => {
    const name = e.player ? fullName(e.player) : 'Giocatore non indicato'
    return (
      <>
        {EVENT_ICONS[e.type]} {name}
        {e.type === 'penalty' && <small className="muted"> (rig.)</small>}
        {e.type === 'own_goal' && <small className="muted"> (autogol)</small>}
      </>
    )
  }

  return (
    <div className="stack">
      <section className="card match-hero">
        <div className="muted">
          {x.competition?.name}
          {x.matchday ? ` · ${x.matchday}ª giornata` : ''}
        </div>
        <div className="teams">
          <Link to={`/squadre/${x.home?.id}`} className="t" style={{ color: 'inherit' }}>
            <TeamBadge team={x.home} size={64} />
            {x.home?.name}
          </Link>
          <div className="big">{done ? `${x.home_score} - ${x.away_score}` : 'vs'}</div>
          <Link to={`/squadre/${x.away?.id}`} className="t" style={{ color: 'inherit' }}>
            <TeamBadge team={x.away} size={64} />
            {x.away?.name}
          </Link>
        </div>
        <div className="muted">
          {fmtDateTime(x.kickoff)}
          {x.venue ? ` · ${x.venue.name}${x.venue.city ? `, ${x.venue.city}` : ''}` : ''}
        </div>
        {x.status !== 'played' && x.status !== 'scheduled' && (
          <p><span className={'pill ' + x.status}>{STATUS[x.status]}</span></p>
        )}
        {x.referee && <div className="muted">Arbitro: {x.referee}</div>}
      </section>

      <section className="card">
        <h2>Referto</h2>
        <ErrorBox error={ev.error} />
        {!ev.data?.length ? (
          <p className="muted">Nessun evento registrato per questa partita.</p>
        ) : (
          <div className="timeline">
            {ev.data.map((e) => {
              const left = e.team_id === x.home_team_id
              return (
                <div key={e.id} className="event">
                  <div className="l">{left ? label(e) : ''}</div>
                  <div className="min" title={EVENT_TYPES[e.type]}>{e.minute != null ? `${e.minute}'` : '–'}</div>
                  <div className="r">{!left ? label(e) : ''}</div>
                </div>
              )
            })}
          </div>
        )}
        {x.notes && <p style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{x.notes}</p>}
      </section>
    </div>
  )
}
