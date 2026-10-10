import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useQuery } from '../../lib/hooks.js'
import { useCompetition } from '../../lib/competition.jsx'
import { empty } from '../../lib/queries.js'
import { scoreFromEvents } from '../../lib/standings.js'
import { EVENT_ICONS, EVENT_TYPES, STATUS, fromLocalInput, fullName, toLocalInput } from '../../lib/format.js'
import { ErrorBox, Loading, PageHeader } from '../../components/ui.jsx'

const BLANK = {
  competition_id: '', matchday: '', home_team_id: '', away_team_id: '', venue_id: '',
  kickoff: null, home_score: '', away_score: '', status: 'scheduled', referee: '', notes: '',
}

export default function MatchEditor() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const isNew = id === 'nuova'
  const { competitions } = useCompetition()

  const [form, setForm] = useState(isNew ? { ...BLANK, competition_id: sp.get('c') || '' } : null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const [msg, setMsg] = useState(null)
  const [ev, setEv] = useState({ team_id: '', player_id: '', type: 'goal', minute: '' })
  const [evErr, setEvErr] = useState(null)

  const matchQ = useQuery(
    () => (isNew ? Promise.resolve({ data: null, error: null }) : supabase.from('matches').select('*').eq('id', id).single()),
    [id],
  )
  useEffect(() => {
    if (matchQ.data) setForm(matchQ.data)
  }, [matchQ.data])

  const cid = form?.competition_id
  const teamsQ = useQuery(
    () =>
      cid
        ? supabase.from('competition_teams').select('team_id, teams(id,name,venue_id)').eq('competition_id', cid)
        : empty(),
    [cid],
  )
  const venuesQ = useQuery(() => supabase.from('venues').select('id,name,city').order('name'), [])
  const eventsQ = useQuery(
    () =>
      isNew
        ? empty()
        : supabase.from('match_events').select('*, player:players(id,first_name,last_name)').eq('match_id', id).order('minute', { nullsFirst: true }),
    [id],
  )
  const homeId = form?.home_team_id
  const awayId = form?.away_team_id
  const playersQ = useQuery(
    () => {
      const ids = [homeId, awayId].filter(Boolean)
      return ids.length ? supabase.from('players').select('id,first_name,last_name,team_id,shirt_number').in('team_id', ids).order('last_name') : empty()
    },
    [homeId, awayId],
  )

  if (!form) return matchQ.error ? <ErrorBox error={matchQ.error} /> : <Loading />

  const teams = (teamsQ.data || []).map((r) => r.teams).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const nameOf = (tid) => teams.find((t) => t.id === tid)?.name || '—'

  async function save(e) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    const num = (v) => (v === '' || v == null ? null : Number(v))
    const payload = {
      competition_id: form.competition_id,
      matchday: num(form.matchday),
      home_team_id: form.home_team_id,
      away_team_id: form.away_team_id,
      venue_id: form.venue_id || null,
      kickoff: form.kickoff || null,
      home_score: num(form.home_score),
      away_score: num(form.away_score),
      status: form.status,
      referee: form.referee || null,
      notes: form.notes || null,
    }
    if (!payload.competition_id || !payload.home_team_id || !payload.away_team_id) {
      return setErr({ message: 'Seleziona campionato, squadra di casa e squadra ospite.' })
    }
    if (payload.home_team_id === payload.away_team_id) {
      return setErr({ message: 'La squadra di casa e quella ospite devono essere diverse.' })
    }
    if ((payload.home_score == null) !== (payload.away_score == null)) {
      return setErr({ message: 'Inserisci entrambi i punteggi oppure nessuno.' })
    }
    if (payload.home_score != null && payload.status === 'scheduled') payload.status = 'played'

    setSaving(true)
    const q = isNew
      ? supabase.from('matches').insert(payload).select().single()
      : supabase.from('matches').update(payload).eq('id', id).select().single()
    const { data, error } = await q
    setSaving(false)
    if (error) return setErr(error)
    if (isNew) navigate(`/admin/partite/${data.id}`, { replace: true })
    else {
      setForm(data)
      setMsg('Partita salvata.')
    }
  }

  async function addEvent(e) {
    e.preventDefault()
    setEvErr(null)
    if (!ev.team_id) return setEvErr({ message: 'Seleziona la squadra.' })
    const { error } = await supabase.from('match_events').insert({
      match_id: id,
      team_id: ev.team_id,
      player_id: ev.player_id || null,
      minute: ev.minute === '' ? null : Number(ev.minute),
      type: ev.type,
    })
    if (error) return setEvErr(error)
    setEv((x) => ({ ...x, player_id: '', minute: '' }))
    eventsQ.reload()
  }

  async function removeEvent(eid) {
    const { error } = await supabase.from('match_events').delete().eq('id', eid)
    if (error) window.alert(error.message)
    else eventsQ.reload()
  }

  function scoreFromReport() {
    const { home, away } = scoreFromEvents(eventsQ.data || [], form.home_team_id, form.away_team_id)
    setForm((f) => ({ ...f, home_score: home, away_score: away, status: f.status === 'scheduled' ? 'played' : f.status }))
    setMsg('Risultato calcolato dal referto. Premi «Salva partita» per confermarlo.')
  }

  const teamPlayers = (playersQ.data || []).filter((p) => p.team_id === ev.team_id)
  const competition = competitions.find((c) => c.id === form.competition_id)

  return (
    <div className="stack">
      <PageHeader title={isNew ? 'Nuova partita' : 'Referto partita'} subtitle={competition?.name}>
        <Link className="btn" to="/admin/partite">← Elenco partite</Link>
      </PageHeader>

      <form className="card" onSubmit={save}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="m-comp">Campionato *</label>
            <select id="m-comp" required disabled={!isNew} value={form.competition_id} onChange={(e) => setForm((f) => ({ ...f, competition_id: e.target.value, home_team_id: '', away_team_id: '' }))}>
              <option value="">Seleziona…</option>
              {competitions.map((c) => <option key={c.id} value={c.id}>{c.name}{c.seasons?.name ? ` · ${c.seasons.name}` : ''}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="m-day">Giornata</label>
            <input id="m-day" type="number" min="0" value={form.matchday ?? ''} onChange={(e) => set('matchday', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="m-home">Squadra di casa *</label>
            <select
              id="m-home" required value={form.home_team_id}
              onChange={(e) => {
                const t = teams.find((x) => x.id === e.target.value)
                setForm((f) => ({ ...f, home_team_id: e.target.value, venue_id: f.venue_id || t?.venue_id || '' }))
              }}
            >
              <option value="">Seleziona…</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="m-away">Squadra ospite *</label>
            <select id="m-away" required value={form.away_team_id} onChange={(e) => set('away_team_id', e.target.value)}>
              <option value="">Seleziona…</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="m-when">Data e ora</label>
            <input id="m-when" type="datetime-local" value={toLocalInput(form.kickoff)} onChange={(e) => set('kickoff', fromLocalInput(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="m-venue">Campo</label>
            <select id="m-venue" value={form.venue_id ?? ''} onChange={(e) => set('venue_id', e.target.value)}>
              <option value="">— da definire —</option>
              {(venuesQ.data || []).map((v) => <option key={v.id} value={v.id}>{v.name}{v.city ? ` (${v.city})` : ''}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="m-hs">Gol squadra di casa</label>
            <input id="m-hs" type="number" min="0" value={form.home_score ?? ''} onChange={(e) => set('home_score', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="m-as">Gol squadra ospite</label>
            <input id="m-as" type="number" min="0" value={form.away_score ?? ''} onChange={(e) => set('away_score', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="m-status">Stato</label>
            <select id="m-status" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="m-ref">Arbitro</label>
            <input id="m-ref" value={form.referee ?? ''} onChange={(e) => set('referee', e.target.value)} />
          </div>
          <div className="field wide">
            <label htmlFor="m-notes">Note</label>
            <textarea id="m-notes" rows={3} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>
        <ErrorBox error={err} />
        {msg && <p role="status" style={{ color: 'var(--brand)' }}>{msg}</p>}
        <div className="form-actions">
          {!isNew && <button type="button" className="btn" onClick={scoreFromReport}>Calcola risultato dal referto</button>}
          <button className="btn primary" disabled={saving}>{saving ? 'Salvataggio…' : 'Salva partita'}</button>
        </div>
      </form>

      {isNew ? (
        <p className="muted">Dopo aver salvato la partita potrai inserire gol e cartellini nel referto.</p>
      ) : (
        <section className="card">
          <h2>Eventi del referto</h2>
          <form className="inline-form" onSubmit={addEvent}>
            <div className="field">
              <label htmlFor="e-type">Evento</label>
              <select id="e-type" value={ev.type} onChange={(e) => setEv({ ...ev, type: e.target.value })}>
                {Object.entries(EVENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="e-team">Squadra</label>
              <select id="e-team" value={ev.team_id} onChange={(e) => setEv({ ...ev, team_id: e.target.value, player_id: '' })}>
                <option value="">Seleziona…</option>
                {[form.home_team_id, form.away_team_id].filter(Boolean).map((tid) => <option key={tid} value={tid}>{nameOf(tid)}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="e-player">Giocatore</label>
              <select id="e-player" value={ev.player_id} onChange={(e) => setEv({ ...ev, player_id: e.target.value })}>
                <option value="">— non indicato —</option>
                {teamPlayers.map((p) => <option key={p.id} value={p.id}>{p.shirt_number ? `${p.shirt_number} · ` : ''}{fullName(p)}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="e-min">Minuto</label>
              <input id="e-min" type="number" min="0" max="130" value={ev.minute} onChange={(e) => setEv({ ...ev, minute: e.target.value })} />
            </div>
            <button className="btn primary">Aggiungi</button>
          </form>
          <ErrorBox error={evErr} />

          {!(eventsQ.data || []).length ? (
            <p className="muted">Nessun evento inserito.</p>
          ) : (
            <div className="table-wrap" style={{ marginTop: '0.8rem' }}>
              <table className="data">
                <tbody>
                  {eventsQ.data.map((e) => (
                    <tr key={e.id}>
                      <td className="nowrap">{e.minute != null ? `${e.minute}'` : '–'}</td>
                      <td>{EVENT_ICONS[e.type]} {EVENT_TYPES[e.type]}</td>
                      <td>{e.player ? fullName(e.player) : <span className="muted">non indicato</span>}</td>
                      <td>{nameOf(e.team_id)}</td>
                      <td className="right"><button type="button" className="btn small danger" onClick={() => removeEvent(e.id)}>Elimina</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
