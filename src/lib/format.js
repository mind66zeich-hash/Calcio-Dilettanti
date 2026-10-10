export const ROLES = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante']

export const EVENT_TYPES = {
  goal: 'Gol',
  penalty: 'Gol su rigore',
  own_goal: 'Autogol',
  yellow: 'Ammonizione',
  red: 'Espulsione',
}

export const EVENT_ICONS = {
  goal: '⚽',
  penalty: '⚽',
  own_goal: '⚽',
  yellow: '🟨',
  red: '🟥',
}

export const STATUS = {
  scheduled: 'Programmata',
  played: 'Giocata',
  postponed: 'Rinviata',
  cancelled: 'Annullata',
}

const dateFmt = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
const dateShortFmt = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short' })
const timeFmt = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' })
const dateTimeFmt = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
})

export const fmtDate = (v) => (v ? dateFmt.format(new Date(v)) : '')
export const fmtDateShort = (v) => (v ? dateShortFmt.format(new Date(v)) : '')
export const fmtTime = (v) => (v ? timeFmt.format(new Date(v)) : '')
export const fmtDateTime = (v) => (v ? dateTimeFmt.format(new Date(v)) : 'Data da definire')

export function age(birth) {
  if (!birth) return null
  const b = new Date(birth)
  const now = new Date()
  let a = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--
  return a
}

export const fullName = (p) => (p ? `${p.last_name} ${p.first_name}` : '')

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const pad = (n) => String(n).padStart(2, '0')

// ISO -> valore per <input type="datetime-local">
export function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// valore di <input type="datetime-local"> -> ISO
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null)
