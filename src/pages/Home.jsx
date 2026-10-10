import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useQuery } from '../lib/hooks.js'
import { useCompetition } from '../lib/competition.jsx'
import { useStandings } from '../lib/useStandings.js'
import { fmtDate } from '../lib/format.js'
import MatchCard from '../components/MatchCard.jsx'
import StandingsTable from '../components/StandingsTable.jsx'
import { Empty, ErrorBox, Loading } from '../components/ui.jsx'

export default function Home() {
  const { current, loading: compLoading } = useCompetition()
  const st = useStandings(current)
  const news = useQuery(
    () =>
      supabase
        .from('news')
        .select('id,title,body,image_url,published_at')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(3),
    [],
  )

  if (compLoading) return <Loading />

  const matches = st.matches || []
  const results = matches
    .filter((m) => m.status === 'played')
    .sort((a, b) => new Date(b.kickoff || 0) - new Date(a.kickoff || 0))
    .slice(0, 5)
  const upcoming = matches
    .filter((m) => m.status === 'scheduled')
    .sort((a, b) => new Date(a.kickoff || '2999-01-01') - new Date(b.kickoff || '2999-01-01'))
    .slice(0, 5)

  return (
    <div className="stack">
      <section className="hero">
        <h1>{current ? current.name : 'Benvenuto'}</h1>
        <p>
          {current
            ? [current.seasons?.name, current.category, current.level === 'regionale' ? 'Regionale' : 'Provinciale']
                .filter(Boolean)
                .join(' · ')
            : 'Risultati, classifiche e calendari dei campionati dilettantistici.'}
        </p>
      </section>

      {!current ? (
        <Empty>
          Nessun campionato presente. Accedi come amministratore e crea la prima stagione e il primo campionato
          dal pannello «Gestione».
        </Empty>
      ) : (
        <>
          <ErrorBox error={st.error} />
          <div className="grid cols-2">
            <section>
              <div className="section-title">
                <h2>Ultimi risultati</h2>
                <Link to="/calendario">Calendario →</Link>
              </div>
              {results.length ? (
                <div className="matches">{results.map((m) => <MatchCard key={m.id} m={m} />)}</div>
              ) : (
                <Empty>Nessuna partita giocata.</Empty>
              )}
            </section>
            <section>
              <div className="section-title">
                <h2>Prossime partite</h2>
                <Link to="/calendario">Tutte →</Link>
              </div>
              {upcoming.length ? (
                <div className="matches">{upcoming.map((m) => <MatchCard key={m.id} m={m} />)}</div>
              ) : (
                <Empty>Nessuna partita in programma.</Empty>
              )}
            </section>
          </div>

          <section>
            <div className="section-title">
              <h2>Classifica</h2>
              <Link to="/classifica">Classifica completa →</Link>
            </div>
            {st.rows?.length ? (
              <StandingsTable rows={st.rows.slice(0, 6)} compact />
            ) : (
              <Empty>Nessuna squadra iscritta a questo campionato.</Empty>
            )}
          </section>
        </>
      )}

      {news.data?.length > 0 && (
        <section>
          <div className="section-title">
            <h2>Ultime news</h2>
            <Link to="/news">Tutte le news →</Link>
          </div>
          <div className="grid cols-3">
            {news.data.map((n) => (
              <Link key={n.id} to={`/news/${n.id}`} className="card news-card">
                {n.image_url && <img src={n.image_url} alt="" loading="lazy" />}
                <strong>{n.title}</strong>
                <small className="muted">{fmtDate(n.published_at)}</small>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
