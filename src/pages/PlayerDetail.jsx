import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useQuery } from '../lib/hooks.js'
import { EVENT_ICONS, EVENT_TYPES, age, fmtDate, fullName } from '../lib/format.js'
import { Empty, ErrorBox, Loading, TeamLink } from '../components/ui.jsx'

export default function PlayerDetail() {
  const { id } = useParams()
  const p = useQuery(
    () => supabase.from('players').select('*, team:teams(id,name,short_name,logo_url)').eq('id', id).maybeSingle(),
    [id],
  )
  const ev = useQuery(
    () =>
      supabase
        .from('match_events')
        .select('id,type,minute,match:matches(id,kickoff,matchday,home:teams!home_team_id(name),away:teams!away_team_id(name))')
        .eq('player_id', id),
    [id],
  )

  if (p.loading) return <Loading />
  if (p.error) return <ErrorBox error={p.error} />
  if (!p.data) return <Empty>Giocatore non trovato.</Empty>
  const pl = p.data

  const events = ev.data || []
  const count = (types) => events.filter((e) => types.includes(e.type)).length

  const info = [
    ['Ruolo', pl.role],
    ['Numero di maglia', pl.shirt_number],
    ['Data di nascita', pl.birth_date && `${fmtDate(pl.birth_date)} (${age(pl.birth_date)} anni)`],
    ['Nazionalità', pl.nationality],
    ['Piede', pl.foot],
    ['Altezza', pl.height_cm && `${pl.height_cm} cm`],
    ['N° tessera', pl.license_number],
  ].filter(([, v]) => v)

  return (
    <div className="stack">
      <section className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {pl.photo_url && <img className="thumb large" src={pl.photo_url} alt="" />}
        <div>
          <h1>{fullName(pl)}</h1>
          {pl.team && <TeamLink team={pl.team} size={28} />}
        </div>
        <div className="stats" style={{ marginLeft: 'auto' }}>
          <div className="stat"><b>{count(['goal', 'penalty'])}</b><span>Gol</span></div>
          <div className="stat"><b>{count(['yellow'])}</b><span>Gialli</span></div>
          <div className="stat"><b>{count(['red'])}</b><span>Rossi</span></div>
        </div>
      </section>

      <div className="grid cols-2">
        <section className="card">
          <h2>Scheda</h2>
          <dl className="kv">
            {info.map(([k, v]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {pl.notes && <p style={{ whiteSpace: 'pre-wrap' }}>{pl.notes}</p>}
        </section>

        <section>
          <h2>Eventi in partita</h2>
          <ErrorBox error={ev.error} />
          {!events.length ? (
            <Empty>Nessun evento registrato.</Empty>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <tbody>
                  {[...events]
                    .sort((a, b) => new Date(b.match?.kickoff || 0) - new Date(a.match?.kickoff || 0))
                    .map((e) => (
                      <tr key={e.id}>
                        <td>{EVENT_ICONS[e.type]} {EVENT_TYPES[e.type]}{e.minute != null ? ` ${e.minute}'` : ''}</td>
                        <td>
                          <Link to={`/partita/${e.match?.id}`}>
                            {e.match?.home?.name} – {e.match?.away?.name}
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
