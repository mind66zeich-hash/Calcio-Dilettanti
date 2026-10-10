import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useQuery } from '../../lib/hooks.js'
import { useAuth } from '../../lib/auth.jsx'
import { PageHeader } from '../../components/ui.jsx'

const TABLES = [
  ['teams', 'Squadre'],
  ['players', 'Giocatori'],
  ['matches', 'Partite'],
  ['competitions', 'Campionati'],
  ['venues', 'Campi'],
  ['news', 'News'],
]

export default function AdminHome() {
  const { profile } = useAuth()
  const counts = useQuery(async () => {
    const res = await Promise.all(
      TABLES.map(([t]) => supabase.from(t).select('*', { count: 'exact', head: true })),
    )
    const error = res.find((r) => r.error)?.error || null
    return { data: Object.fromEntries(TABLES.map(([t], i) => [t, res[i].count ?? 0])), error }
  }, [])

  return (
    <div>
      <PageHeader
        title="Pannello di gestione"
        subtitle={`Connesso come ${profile?.full_name || profile?.email || ''} · ruolo ${profile?.role}`}
      />

      <div className="tiles">
        {TABLES.map(([t, label]) => (
          <div key={t} className="tile">
            <b>{counts.data ? counts.data[t] : '…'}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Come si inizia</h2>
        <ol>
          <li><Link to="/admin/stagioni">Crea la stagione</Link> (es. 2026/2027) e segnala come «corrente».</li>
          <li><Link to="/admin/campionati">Crea il campionato</Link> (categoria, livello provinciale o regionale).</li>
          <li><Link to="/admin/squadre">Inserisci le squadre</Link> e i <Link to="/admin/campi">campi</Link> di gioco.</li>
          <li><Link to="/admin/iscrizioni">Iscrivi le squadre</Link> al campionato.</li>
          <li><Link to="/admin/giocatori">Inserisci i giocatori</Link> di ogni rosa.</li>
          <li><Link to="/admin/calendario">Genera il calendario</Link> andata e ritorno in un clic.</li>
          <li>Dopo ogni giornata compila i <Link to="/admin/partite">referti</Link>: classifica, marcatori e disciplina si aggiornano da soli.</li>
        </ol>
      </div>
    </div>
  )
}
