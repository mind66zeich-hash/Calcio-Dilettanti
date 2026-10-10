import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useQuery } from '../../lib/hooks.js'
import { useCompetition } from '../../lib/competition.jsx'
import { matchesOf, empty } from '../../lib/queries.js'
import { STATUS, fmtDateTime } from '../../lib/format.js'
import { Empty, ErrorBox, Loading, PageHeader } from '../../components/ui.jsx'

export default function AdminMatches() {
  const { competitions, current } = useCompetition()
  const navigate = useNavigate()
  const [cid, setCid] = useState(current?.id || '')
  const [day, setDay] = useState('')

  useEffect(() => {
    if (!cid && current) setCid(current.id)
  }, [current, cid])

  const q = useQuery(() => (cid ? matchesOf(cid) : empty()), [cid])

  const days = [...new Set((q.data || []).map((m) => m.matchday ?? 0))].sort((a, b) => a - b)
  const list = (q.data || []).filter((m) => day === '' || (m.matchday ?? 0) === Number(day))

  async function remove(m) {
    if (!window.confirm(`Eliminare la partita ${m.home?.name} – ${m.away?.name}? Verranno eliminati anche gli eventi del referto.`)) return
    const { error } = await supabase.from('matches').delete().eq('id', m.id)
    if (error) window.alert(error.message)
    else q.reload()
  }

  return (
    <div>
      <PageHeader title="Partite e referti" subtitle="Seleziona una partita per inserire il risultato, i gol e i cartellini.">
        <button
          type="button"
          className="btn primary"
          disabled={!cid}
          onClick={() => navigate(`/admin/partite/nuova?c=${cid}`)}
        >
          + Nuova partita
        </button>
      </PageHeader>

      <div className="filters">
        <select value={cid} onChange={(e) => { setCid(e.target.value); setDay('') }} aria-label="Campionato">
          <option value="">Seleziona un campionato…</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.seasons?.name ? ` · ${c.seasons.name}` : ''}</option>
          ))}
        </select>
        <select value={day} onChange={(e) => setDay(e.target.value)} aria-label="Giornata">
          <option value="">Tutte le giornate</option>
          {days.map((d) => <option key={d} value={d}>{d === 0 ? 'Altre partite' : `${d}ª giornata`}</option>)}
        </select>
      </div>

      <ErrorBox error={q.error} />
      {!cid ? (
        <Empty>Seleziona un campionato.</Empty>
      ) : q.loading && !q.data ? (
        <Loading />
      ) : !list.length ? (
        <Empty>
          Nessuna partita. Puoi <Link to="/admin/calendario">generare il calendario</Link> oppure aggiungere le partite a mano.
        </Empty>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th className="center">G.</th>
                <th>Data</th>
                <th>Partita</th>
                <th className="center">Risultato</th>
                <th>Stato</th>
                <th className="right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id}>
                  <td className="center">{m.matchday ?? '—'}</td>
                  <td className="nowrap">{fmtDateTime(m.kickoff)}</td>
                  <td>{m.home?.name} – {m.away?.name}</td>
                  <td className="center">{m.home_score != null ? `${m.home_score} - ${m.away_score}` : '—'}</td>
                  <td>{STATUS[m.status]}</td>
                  <td className="right nowrap">
                    <Link className="btn small" to={`/admin/partite/${m.id}`}>Referto / modifica</Link>{' '}
                    <button type="button" className="btn small danger" onClick={() => remove(m)}>Elimina</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
