import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useQuery } from '../lib/hooks.js'
import { fmtDate } from '../lib/format.js'
import { Empty, ErrorBox, Loading, PageHeader } from '../components/ui.jsx'

export default function NewsList() {
  const q = useQuery(
    () =>
      supabase
        .from('news')
        .select('id,title,body,image_url,published_at')
        .eq('published', true)
        .order('published_at', { ascending: false }),
    [],
  )

  return (
    <div>
      <PageHeader title="News e comunicati" />
      <ErrorBox error={q.error} />
      {q.loading && !q.data ? (
        <Loading />
      ) : !q.data?.length ? (
        <Empty>Nessuna news pubblicata.</Empty>
      ) : (
        <div className="grid cols-3">
          {q.data.map((n) => (
            <Link key={n.id} to={`/news/${n.id}`} className="card news-card">
              {n.image_url && <img src={n.image_url} alt="" loading="lazy" />}
              <strong>{n.title}</strong>
              <small className="muted">{fmtDate(n.published_at)}</small>
              {n.body && <span className="muted">{n.body.length > 120 ? `${n.body.slice(0, 120)}…` : n.body}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
