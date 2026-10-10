import { supabase } from '../../lib/supabase.js'
import { useQuery } from '../../lib/hooks.js'
import { useAuth } from '../../lib/auth.jsx'
import { Empty, ErrorBox, Loading, PageHeader } from '../../components/ui.jsx'

const ROLE_LABELS = {
  admin: 'Amministratore',
  editor: 'Editor (inserisce dati)',
  user: 'Utente (sola lettura)',
}

export default function AdminUsers() {
  const { isAdmin, user } = useAuth()
  const q = useQuery(() => supabase.from('profiles').select('*').order('created_at'), [])

  if (!isAdmin) return <Empty>Questa sezione è riservata agli amministratori.</Empty>

  async function changeRole(p, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', p.id)
    if (error) window.alert(error.message)
    q.reload()
  }

  return (
    <div>
      <PageHeader
        title="Utenti"
        subtitle="Chi si registra dall'app parte come «Utente». Qui assegni i permessi di gestione."
      />
      <ErrorBox error={q.error} />
      {q.loading && !q.data ? (
        <Loading />
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Ruolo</th>
              </tr>
            </thead>
            <tbody>
              {(q.data || []).map((p) => (
                <tr key={p.id}>
                  <td>{p.full_name || '—'}</td>
                  <td>{p.email}</td>
                  <td>
                    <select
                      value={p.role}
                      disabled={p.id === user?.id}
                      title={p.id === user?.id ? 'Non puoi cambiare il tuo ruolo' : undefined}
                      onChange={(e) => changeRole(p, e.target.value)}
                      aria-label={`Ruolo di ${p.email}`}
                    >
                      {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
