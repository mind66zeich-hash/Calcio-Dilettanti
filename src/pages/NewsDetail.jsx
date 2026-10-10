import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useQuery } from '../lib/hooks.js'
import { fmtDate } from '../lib/format.js'
import { Empty, ErrorBox, Loading } from '../components/ui.jsx'

export default function NewsDetail() {
  const { id } = useParams()
  const q = useQuery(() => supabase.from('news').select('*').eq('id', id).maybeSingle(), [id])

  if (q.loading) return <Loading />
  if (q.error) return <ErrorBox error={q.error} />
  if (!q.data) return <Empty>News non trovata.</Empty>
  const n = q.data

  return (
    <article className="card" style={{ maxWidth: 760, margin: '0 auto' }}>
      <p><Link to="/news">← Tutte le news</Link></p>
      <h1>{n.title}</h1>
      <p className="muted">{fmtDate(n.published_at)}</p>
      {n.image_url && <img src={n.image_url} alt="" style={{ borderRadius: 10, marginBottom: '1rem' }} />}
      <div className="news-body">{n.body}</div>
    </article>
  )
}
