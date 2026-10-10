import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useQuery } from '../lib/hooks.js'
import { useCompetition } from '../lib/competition.jsx'
import { Empty, ErrorBox, Loading, PageHeader, TeamBadge } from '../components/ui.jsx'

export default function Teams() {
  const { current } = useCompetition()
  const [all, setAll] = useState(false)
  const cid = current?.id

  const q = useQuery(async () => {
    if (all || !cid) {
      return supabase.from('teams').select('*').order('name')
    }
    const { data, error } = await supabase
      .from('competition_teams')
      .select('teams(*)')
      .eq('competition_id', cid)
    return { data: (data || []).map((r) => r.teams).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name)), error }
  }, [all, cid])

  return (
    <div>
      <PageHeader title="Squadre" subtitle={all || !current ? 'Tutte le società' : current.name}>
        {current && (
          <label className="check">
            <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
            <span>Mostra tutte le società</span>
          </label>
        )}
      </PageHeader>
      <ErrorBox error={q.error} />
      {q.loading && !q.data ? (
        <Loading />
      ) : !q.data?.length ? (
        <Empty>Nessuna squadra presente.</Empty>
      ) : (
        <div className="grid cols-3">
          {q.data.map((t) => (
            <Link key={t.id} to={`/squadre/${t.id}`} className="card team-card">
              <TeamBadge team={t} size={48} />
              <div>
                <strong>{t.name}</strong>
                <div className="muted">
                  {[t.city, t.province].filter(Boolean).join(' (') + (t.city && t.province ? ')' : '')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
