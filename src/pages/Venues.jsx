import { supabase } from '../lib/supabase.js'
import { useQuery } from '../lib/hooks.js'
import { Empty, ErrorBox, Loading, PageHeader } from '../components/ui.jsx'

export default function Venues() {
  const q = useQuery(() => supabase.from('venues').select('*').order('name'), [])

  return (
    <div>
      <PageHeader title="Campi da gioco" />
      <ErrorBox error={q.error} />
      {q.loading && !q.data ? (
        <Loading />
      ) : !q.data?.length ? (
        <Empty>Nessun campo inserito.</Empty>
      ) : (
        <div className="grid cols-3">
          {q.data.map((v) => {
            const where = [v.name, v.address, v.city].filter(Boolean).join(', ')
            return (
              <div key={v.id} className="card">
                <h3>{v.name}</h3>
                <p className="muted" style={{ margin: '0 0 0.5rem' }}>
                  {[v.address, v.city].filter(Boolean).join(', ') || 'Indirizzo non indicato'}
                </p>
                <p style={{ margin: '0 0 0.5rem' }}>
                  {[v.surface, v.capacity && `${v.capacity} posti`].filter(Boolean).join(' · ')}
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(where)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apri in Google Maps ↗
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
