/**
 * Calcolo classifica, marcatori e disciplina interamente lato client,
 * a partire da partite ed eventi del database.
 *
 * Criteri di parita' (regolamento dilettanti, semplificato):
 *  1. punti   2. scontri diretti (punti, differenza reti)
 *  3. differenza reti generale   4. gol fatti   5. ordine alfabetico
 */

const isPlayed = (m) => m.status === 'played' && m.home_score != null && m.away_score != null

export function computeStandings(registrations, matches, rules = {}) {
  const win = rules.win ?? 3
  const draw = rules.draw ?? 1
  const loss = rules.loss ?? 0

  const rows = new Map()
  registrations.forEach((r) => {
    rows.set(r.team_id, {
      team_id: r.team_id,
      team: r.teams,
      penalty: r.penalty_points || 0,
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0,
      pts: -(r.penalty_points || 0),
      form: [],
    })
  })

  const played = matches
    .filter(isPlayed)
    .sort((a, b) => new Date(a.kickoff || 0) - new Date(b.kickoff || 0))

  const apply = (row, gf, ga) => {
    row.played++
    row.gf += gf
    row.ga += ga
    row.gd = row.gf - row.ga
    if (gf > ga) { row.won++; row.pts += win; row.form.push('V') }
    else if (gf === ga) { row.drawn++; row.pts += draw; row.form.push('N') }
    else { row.lost++; row.pts += loss; row.form.push('P') }
  }

  played.forEach((m) => {
    const h = rows.get(m.home_team_id)
    const a = rows.get(m.away_team_id)
    if (h) apply(h, m.home_score, m.away_score)
    if (a) apply(a, m.away_score, m.home_score)
  })

  const byPoints = [...rows.values()].sort((x, y) => y.pts - x.pts)
  const sorted = []
  let i = 0
  while (i < byPoints.length) {
    let j = i
    while (j < byPoints.length && byPoints[j].pts === byPoints[i].pts) j++
    const group = byPoints.slice(i, j)
    sorted.push(...(group.length > 1 ? breakTies(group, played, { win, draw, loss }) : group))
    i = j
  }
  return sorted.map((r, idx) => ({ ...r, pos: idx + 1, form: r.form.slice(-5) }))
}

function breakTies(group, played, rules) {
  const ids = new Set(group.map((r) => r.team_id))
  const mini = new Map(group.map((r) => [r.team_id, { pts: 0, gd: 0 }]))
  played
    .filter((m) => ids.has(m.home_team_id) && ids.has(m.away_team_id))
    .forEach((m) => {
      const h = mini.get(m.home_team_id)
      const a = mini.get(m.away_team_id)
      h.gd += m.home_score - m.away_score
      a.gd += m.away_score - m.home_score
      if (m.home_score > m.away_score) { h.pts += rules.win; a.pts += rules.loss }
      else if (m.home_score < m.away_score) { a.pts += rules.win; h.pts += rules.loss }
      else { h.pts += rules.draw; a.pts += rules.draw }
    })
  return [...group].sort((x, y) => {
    const mx = mini.get(x.team_id)
    const my = mini.get(y.team_id)
    return (
      my.pts - mx.pts ||
      my.gd - mx.gd ||
      y.gd - x.gd ||
      y.gf - x.gf ||
      (x.team?.name || '').localeCompare(y.team?.name || '')
    )
  })
}

/** Risultato calcolato dagli eventi del referto (gol, rigori, autogol). */
export function scoreFromEvents(events, homeId, awayId) {
  let home = 0
  let away = 0
  events.forEach((e) => {
    if (e.type === 'goal' || e.type === 'penalty') {
      if (e.team_id === homeId) home++
      else if (e.team_id === awayId) away++
    } else if (e.type === 'own_goal') {
      if (e.team_id === homeId) away++
      else if (e.team_id === awayId) home++
    }
  })
  return { home, away }
}

export function computeScorers(events) {
  const map = new Map()
  events.forEach((e) => {
    if (!e.player) return
    const cur = map.get(e.player_id) || { player: e.player, team: e.team, goals: 0, penalties: 0 }
    cur.goals++
    if (e.type === 'penalty') cur.penalties++
    map.set(e.player_id, cur)
  })
  return [...map.values()].sort(
    (a, b) => b.goals - a.goals || a.player.last_name.localeCompare(b.player.last_name),
  )
}

export function computeDiscipline(events) {
  const map = new Map()
  events.forEach((e) => {
    if (!e.player) return
    const cur = map.get(e.player_id) || { player: e.player, team: e.team, yellow: 0, red: 0 }
    if (e.type === 'yellow') cur.yellow++
    if (e.type === 'red') cur.red++
    map.set(e.player_id, cur)
  })
  return [...map.values()].sort(
    (a, b) => b.red - a.red || b.yellow - a.yellow || a.player.last_name.localeCompare(b.player.last_name),
  )
}
