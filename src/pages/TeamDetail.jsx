import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useQuery } from '../lib/hooks.js'
import { MATCH_SELECT } from '../lib/queries.js'
import { ROLES, age, fullName } from '../lib/format.js'
import MatchCard from '../components/MatchCard.jsx'
import { Empty, ErrorBox, Loading, TeamBadge } from '../components/ui.jsx'

export default function TeamDetail() {
  const { id } = useParams()
  const team = useQuery(() => supabase.from('teams').select('*, venue:venues(id,name,city,address)').eq('id', id).maybeSingle(), [id])
  const players = useQuery(() => supabase.from('players').select('*').eq('team_id', id).order('shirt_number', { nullsFirst: false }), [id])
  const matches = useQuery(
    () =>
      supabase
        .from('matches')
        .select(MATCH_SELECT)
        .or(`home_team_id.eq.${id},away_team_id.eq.${id}`)
        .order('kickoff', { ascending: false, nullsFirst: true }),
    [id],
  )

  if (team.loading) return <Loading />
  if (team.error) return <ErrorBox error={team.error} />
  if (!team.data) return <Empty>Squadra non trovata.</Empty>
  const t = team.data

  const played = (matches.data || []).filter((m) => m.status === 'played' && m.home_score != null)
  const stats = played.reduce(
    (s, m) => {
      const home = m.home_team_id === id
      const gf = home ? m.home_score : m.away_score
      const ga = home ? m.away_score : m.home_score
      s.g++
      s.gf += gf
      s.ga += ga
      if (gf > ga) s.w++
      else if (gf === ga) s.d++
      else s.l++
      return s
    },
    { g: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 },
  )

  const info = [
    ['Città', [t.city, t.province && `(${t.province})`].filter(Boolean).join(' ')],
    ['Regione', t.region],
    ['Fondazione', t.founded_year],
    ['Colori sociali', t.colors],
    ['Presidente', t.president],
    ['Allenatore', t.coach],
    ['Campo', t.venue && [t.venue.name, t.venue.city].filter(Boolean).join(', ')],
    ['Telefono', t.phone],
    ['Email', t.email],
  ].filter(([, v]) => v)

  return (
    <div className="stack">
      <section className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <TeamBadge team={t} size={84} />
        <div>
          <h1>{t.name}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {[t.city, t.region].filter(Boolean).join(' · ')}
          </p>
          {t.website && (
            <a href={t.website} target="_blank" rel="noreferrer">Sito web ↗</a>
          )}
        </div>
        <div className="stats" style={{ marginLeft: 'auto' }}>
          {[['G', stats.g], ['V', stats.w], ['N', stats.d], ['P', stats.l], ['GF', stats.gf], ['GS', stats.ga]].map(([k, v]) => (
            <div key={k} className="stat"><b>{v}</b><span>{k}</span></div>
          ))}
        </div>
      </section>

      <div className="grid cols-2">
        <section className="card">
          <h2>Scheda società</h2>
          {info.length ? (
            <dl className="kv">
              {info.map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="muted">Nessun dato inserito.</p>
          )}
          {t.notes && <p style={{ whiteSpace: 'pre-wrap' }}>{t.notes}</p>}
        </section>

        <section>
          <h2>Partite</h2>
          <ErrorBox error={matches.error} />
          {!matches.data?.length ? (
            <Empty>Nessuna partita.</Empty>
          ) : (
            <div className="matches">
              {matches.data.slice(0, 8).map((m) => <MatchCard key={m.id} m={m} />)}
            </div>
          )}
        </section>
      </div>

      <section>
        <h2>Rosa</h2>
        <ErrorBox error={players.error} />
        {!players.data?.length ? (
          <Empty>Nessun giocatore tesserato inserito.</Empty>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th className="center">N°</th>
                  <th>Giocatore</th>
                  <th>Ruolo</th>
                  <th className="right">Età</th>
                </tr>
              </thead>
              <tbody>
                {[...players.data]
                  .sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role))
                  .map((p) => (
                    <tr key={p.id}>
                      <td className="center">{p.shirt_number ?? '—'}</td>
                      <td><Link to={`/giocatori/${p.id}`}>{fullName(p)}</Link></td>
                      <td>{p.role || '—'}</td>
                      <td className="right">{age(p.birth_date) ?? '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
