import { useEffect, useMemo, useState } from 'react'
import { useCompetition } from '../lib/competition.jsx'
import { useQuery } from '../lib/hooks.js'
import { matchesOf, empty } from '../lib/queries.js'
import MatchCard from '../components/MatchCard.jsx'
import { Empty, ErrorBox, Loading, PageHeader } from '../components/ui.jsx'

export default function Fixtures() {
  const { current } = useCompetition()
  const cid = current?.id
  const q = useQuery(() => (cid ? matchesOf(cid) : empty()), [cid])
  const [day, setDay] = useState(null)

  const days = useMemo(() => {
    const set = new Set((q.data || []).map((m) => m.matchday ?? 0))
    return [...set].sort((a, b) => a - b)
  }, [q.data])

  // giornata iniziale: la prima con partite ancora da giocare
  useEffect(() => {
    if (!q.data?.length) return
    const now = Date.now()
    const next = q.data.find((m) => m.status === 'scheduled' && (!m.kickoff || new Date(m.kickoff) >= now - 86400000))
    setDay(next ? next.matchday ?? 0 : days[days.length - 1])
  }, [q.data, days])

  if (!current) return <Empty>Nessun campionato selezionato.</Empty>

  const idx = days.indexOf(day)
  const list = (q.data || []).filter((m) => (m.matchday ?? 0) === day)

  return (
    <div>
      <PageHeader title="Calendario e risultati" subtitle={current.name} />
      <ErrorBox error={q.error} />
      {q.loading && !q.data ? (
        <Loading />
      ) : !days.length ? (
        <Empty>Il calendario non è ancora stato inserito.</Empty>
      ) : (
        <>
          <div className="md-nav">
            <button type="button" className="btn" disabled={idx <= 0} onClick={() => setDay(days[idx - 1])}>
              ← Precedente
            </button>
            <select
              aria-label="Giornata"
              value={day ?? ''}
              onChange={(e) => setDay(Number(e.target.value))}
              style={{ width: 'auto' }}
            >
              {days.map((d) => (
                <option key={d} value={d}>
                  {d === 0 ? 'Altre partite' : `${d}ª giornata`}
                </option>
              ))}
            </select>
            <button type="button" className="btn" disabled={idx >= days.length - 1} onClick={() => setDay(days[idx + 1])}>
              Successiva →
            </button>
          </div>
          <div className="matches">
            {list.map((m) => (
              <MatchCard key={m.id} m={m} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
