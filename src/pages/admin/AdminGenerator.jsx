import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useQuery } from '../../lib/hooks.js'
import { useCompetition } from '../../lib/competition.jsx'
import { empty } from '../../lib/queries.js'
import { roundRobin } from '../../lib/roundrobin.js'
import { fmtDate } from '../../lib/format.js'
import { Empty, ErrorBox, PageHeader } from '../../components/ui.jsx'

function nextSunday() {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7))
  return d.toISOString().slice(0, 10)
}

export default function AdminGenerator() {
  const { competitions, current } = useCompetition()
  const [cid, setCid] = useState(current?.id || '')
  const [start, setStart] = useState(nextSunday())
  const [time, setTime] = useState('15:00')
  const [interval, setIntervalDays] = useState(7)
  const [double, setDouble] = useState(true)
  const [clear, setClear] = useState(true)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [done, setDone] = useState(null)

  useEffect(() => {
    if (!cid && current) setCid(current.id)
  }, [current, cid])

  const regs = useQuery(
    () => (cid ? supabase.from('competition_teams').select('team_id, teams(id,name,venue_id)').eq('competition_id', cid) : empty()),
    [cid],
  )
  const existing = useQuery(
    () => (cid ? supabase.from('matches').select('id,status').eq('competition_id', cid) : empty()),
    [cid, done],
  )

  const teams = useMemo(() => (regs.data || []).map((r) => r.teams).filter(Boolean), [regs.data])
  const byId = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])

  function generate() {
    setErr(null)
    setDone(null)
    if (teams.length < 2) return setErr({ message: 'Servono almeno 2 squadre iscritte al campionato.' })
    // l'ordine casuale evita che il calendario segua sempre l'ordine alfabetico
    const shuffled = [...teams].map((t) => t.id).sort(() => Math.random() - 0.5)
    const rounds = roundRobin(shuffled, double)
    const [y, m, d] = start.split('-').map(Number)
    const [hh, mm] = time.split(':').map(Number)
    const days = rounds.map((pairs, i) => ({
      matchday: i + 1,
      date: new Date(y, m - 1, d + i * Number(interval), hh, mm),
      pairs,
    }))
    setPreview(days)
  }

  async function save() {
    setBusy(true)
    setErr(null)
    if (clear) {
      const { error } = await supabase.from('matches').delete().eq('competition_id', cid).eq('status', 'scheduled')
      if (error) { setBusy(false); return setErr(error) }
    }
    const rows = preview.flatMap((day) =>
      day.pairs.map(([home, away]) => ({
        competition_id: cid,
        matchday: day.matchday,
        home_team_id: home,
        away_team_id: away,
        venue_id: byId.get(home)?.venue_id || null,
        kickoff: day.date.toISOString(),
        status: 'scheduled',
      })),
    )
    for (let i = 0; i < rows.length; i += 400) {
      const { error } = await supabase.from('matches').insert(rows.slice(i, i + 400))
      if (error) { setBusy(false); return setErr(error) }
    }
    setBusy(false)
    setPreview(null)
    setDone(`Calendario salvato: ${rows.length} partite in ${preview.length} giornate.`)
  }

  const hasPlayed = (existing.data || []).some((m) => m.status !== 'scheduled')

  return (
    <div>
      <PageHeader
        title="Genera calendario"
        subtitle="Crea in automatico il calendario all'italiana (andata e ritorno) con le squadre iscritte."
      />

      <div className="card stack">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="g-comp">Campionato</label>
            <select id="g-comp" value={cid} onChange={(e) => { setCid(e.target.value); setPreview(null); setDone(null) }}>
              <option value="">Seleziona…</option>
              {competitions.map((c) => <option key={c.id} value={c.id}>{c.name}{c.seasons?.name ? ` · ${c.seasons.name}` : ''}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="g-start">Data prima giornata</label>
            <input id="g-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="g-time">Orario di inizio</label>
            <input id="g-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="g-int">Giorni tra una giornata e l'altra</label>
            <input id="g-int" type="number" min="1" value={interval} onChange={(e) => setIntervalDays(e.target.value)} />
          </div>
          <label className="check field">
            <input type="checkbox" checked={double} onChange={(e) => setDouble(e.target.checked)} />
            <span>Andata e ritorno</span>
          </label>
          <label className="check field">
            <input type="checkbox" checked={clear} onChange={(e) => setClear(e.target.checked)} />
            <span>Sostituisci le partite non ancora giocate</span>
          </label>
        </div>

        {cid && (
          <p className="muted" style={{ margin: 0 }}>
            Squadre iscritte: <strong>{teams.length}</strong>
            {(existing.data || []).length > 0 && <> · partite già presenti: <strong>{existing.data.length}</strong></>}
            {teams.length < 2 && <> — <Link to="/admin/iscrizioni">iscrivi le squadre</Link> prima di generare.</>}
          </p>
        )}
        {hasPlayed && !clear && (
          <p className="muted" style={{ margin: 0 }}>
            Attenzione: esistono già partite giocate; con l'opzione disattivata il nuovo calendario si aggiunge a quello esistente.
          </p>
        )}

        <div>
          <button type="button" className="btn primary" disabled={!cid || teams.length < 2} onClick={generate}>
            Genera anteprima
          </button>
        </div>
        <ErrorBox error={err || regs.error} />
        {done && <p role="status" style={{ color: 'var(--brand)', margin: 0 }}>{done} <Link to="/admin/partite">Vai alle partite →</Link></p>}
      </div>

      {preview && (
        <section style={{ marginTop: '1.25rem' }}>
          <div className="section-title">
            <h2>Anteprima: {preview.length} giornate</h2>
            <div className="actions">
              <button type="button" className="btn" onClick={generate}>Rigenera</button>
              <button type="button" className="btn primary" onClick={save} disabled={busy}>
                {busy ? 'Salvataggio…' : 'Salva calendario'}
              </button>
            </div>
          </div>
          <div className="grid cols-2">
            {preview.map((day) => (
              <div key={day.matchday} className="card preview-day">
                <h3>{day.matchday}ª giornata · {fmtDate(day.date)}</h3>
                <ul>
                  {day.pairs.map(([h, a]) => (
                    <li key={h + a}>{byId.get(h)?.name} – {byId.get(a)?.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      {!cid && <Empty>Seleziona un campionato per iniziare.</Empty>}
    </div>
  )
}
