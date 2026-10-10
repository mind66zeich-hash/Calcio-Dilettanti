import CrudManager from '../../components/CrudManager.jsx'
import { supabase } from '../../lib/supabase.js'
import { ROLES } from '../../lib/format.js'
import { useCompetition } from '../../lib/competition.jsx'

const CATEGORIES = [
  'Serie D', 'Eccellenza', 'Promozione', 'Prima Categoria', 'Seconda Categoria', 'Terza Categoria',
  'Juniores', 'Allievi', 'Giovanissimi', 'Esordienti', 'Pulcini', 'Calcio a 5', 'Femminile', 'Coppa', 'Altro',
]

export function AdminSeasons() {
  const { reload } = useCompetition()
  return (
    <CrudManager
      title="Stagioni"
      subtitle="Una stagione raggruppa i campionati dell'anno sportivo."
      table="seasons"
      order="name"
      ascending={false}
      newLabel="Nuova stagione"
      fields={[
        { key: 'name', label: 'Nome stagione', required: true, help: 'Es. 2026/2027' },
        { key: 'start_date', label: 'Inizio', type: 'date' },
        { key: 'end_date', label: 'Fine', type: 'date' },
        { key: 'is_current', label: 'Stagione corrente', type: 'checkbox', default: false },
      ]}
      columns={['name', 'start_date', 'end_date', 'is_current']}
      afterSave={async (saved) => {
        if (saved.is_current) {
          await supabase.from('seasons').update({ is_current: false }).neq('id', saved.id)
        }
        reload()
      }}
    />
  )
}

export function AdminCompetitions() {
  const { reload } = useCompetition()
  return (
    <CrudManager
      title="Campionati"
      subtitle="Eccellenza, Promozione, categorie provinciali, giovanili, coppe…"
      table="competitions"
      order="name"
      newLabel="Nuovo campionato"
      fields={[
        { key: 'name', label: 'Nome', required: true, help: 'Es. Prima Categoria Girone D' },
        {
          key: 'season_id', label: 'Stagione', type: 'select', required: true,
          relation: { table: 'seasons', label: (r) => r.name, order: 'name' },
        },
        { key: 'category', label: 'Categoria', type: 'select', options: CATEGORIES },
        {
          key: 'level', label: 'Livello', type: 'select', required: true, default: 'provinciale',
          options: [{ value: 'provinciale', label: 'Provinciale' }, { value: 'regionale', label: 'Regionale' }],
        },
        { key: 'region', label: 'Regione' },
        { key: 'province', label: 'Provincia (sigla)' },
        { key: 'points_win', label: 'Punti vittoria', type: 'number', default: 3 },
        { key: 'points_draw', label: 'Punti pareggio', type: 'number', default: 1 },
        { key: 'points_loss', label: 'Punti sconfitta', type: 'number', default: 0 },
      ]}
      columns={['name', 'season_id', 'category', 'level']}
      afterSave={reload}
    />
  )
}

export function AdminVenues() {
  return (
    <CrudManager
      title="Campi da gioco"
      table="venues"
      order="name"
      newLabel="Nuovo campo"
      fields={[
        { key: 'name', label: 'Nome impianto', required: true },
        { key: 'city', label: 'Comune' },
        { key: 'address', label: 'Indirizzo' },
        { key: 'surface', label: 'Fondo', type: 'select', options: ['Erba naturale', 'Erba sintetica', 'Terra battuta', 'Altro'] },
        { key: 'capacity', label: 'Capienza', type: 'number' },
        { key: 'notes', label: 'Note', type: 'textarea', wide: true },
      ]}
      columns={['name', 'city', 'surface', 'capacity']}
    />
  )
}

export function AdminTeams() {
  return (
    <CrudManager
      title="Squadre"
      subtitle="Società sportive. L'iscrizione ai campionati si fa dalla pagina «Squadre iscritte»."
      table="teams"
      order="name"
      newLabel="Nuova squadra"
      fields={[
        { key: 'name', label: 'Nome società', required: true },
        { key: 'short_name', label: 'Sigla (3-4 lettere)' },
        { key: 'city', label: 'Comune' },
        { key: 'province', label: 'Provincia (sigla)' },
        { key: 'region', label: 'Regione' },
        { key: 'founded_year', label: 'Anno di fondazione', type: 'number' },
        { key: 'colors', label: 'Colori sociali' },
        { key: 'president', label: 'Presidente' },
        { key: 'coach', label: 'Allenatore' },
        { key: 'phone', label: 'Telefono' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'website', label: 'Sito web', type: 'url' },
        {
          key: 'venue_id', label: 'Campo di casa', type: 'select',
          relation: { table: 'venues', label: (r) => `${r.name}${r.city ? ` (${r.city})` : ''}` },
        },
        { key: 'logo_url', label: 'Logo / stemma', type: 'image', folder: 'teams' },
        { key: 'notes', label: 'Note', type: 'textarea', wide: true },
      ]}
      columns={['logo_url', 'name', 'city', 'province', 'coach']}
    />
  )
}

export function AdminPlayers() {
  return (
    <CrudManager
      title="Giocatori"
      table="players"
      order="last_name"
      newLabel="Nuovo giocatore"
      fields={[
        { key: 'last_name', label: 'Cognome', required: true },
        { key: 'first_name', label: 'Nome', required: true },
        {
          key: 'team_id', label: 'Squadra', type: 'select',
          relation: { table: 'teams', label: (r) => r.name },
        },
        { key: 'role', label: 'Ruolo', type: 'select', options: ROLES },
        { key: 'shirt_number', label: 'Numero di maglia', type: 'number' },
        { key: 'birth_date', label: 'Data di nascita', type: 'date' },
        { key: 'nationality', label: 'Nazionalità', default: 'Italia' },
        { key: 'foot', label: 'Piede', type: 'select', options: ['Destro', 'Sinistro', 'Ambidestro'] },
        { key: 'height_cm', label: 'Altezza (cm)', type: 'number' },
        { key: 'license_number', label: 'N° tessera' },
        { key: 'photo_url', label: 'Foto', type: 'image', folder: 'players' },
        { key: 'notes', label: 'Note', type: 'textarea', wide: true },
      ]}
      columns={['last_name', 'first_name', 'team_id', 'role', 'shirt_number']}
    />
  )
}

export function AdminNews() {
  return (
    <CrudManager
      title="News e comunicati"
      table="news"
      order="published_at"
      ascending={false}
      newLabel="Nuova news"
      fields={[
        { key: 'title', label: 'Titolo', required: true, wide: true },
        { key: 'body', label: 'Testo', type: 'textarea', wide: true },
        { key: 'image_url', label: 'Immagine', type: 'image', folder: 'news' },
        { key: 'published_at', label: 'Data di pubblicazione', type: 'datetime', default: () => new Date().toISOString() },
        { key: 'published', label: 'Pubblicata (visibile a tutti)', type: 'checkbox', default: true },
      ]}
      columns={['title', 'published_at', 'published']}
    />
  )
}
