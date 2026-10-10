import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

export default function Login() {
  const { session, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  if (session) return <Navigate to="/admin" replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else navigate('/admin')
    } else {
      const { data, error } = await signUp(email, password, name)
      if (error) setError(error.message)
      else if (!data.session) {
        setInfo('Registrazione effettuata. Controlla la posta per confermare l\'indirizzo email, poi accedi.')
        setMode('login')
      }
    }
    setBusy(false)
  }

  return (
    <div className="container narrow">
      <form className="card stack" onSubmit={submit}>
        <h1>{mode === 'login' ? 'Accedi' : 'Registrati'}</h1>
        <p className="muted">
          {mode === 'login'
            ? 'Area riservata agli amministratori e agli addetti delle società.'
            : 'Dopo la registrazione un amministratore dovrà abilitare il tuo account alla gestione dei dati.'}
        </p>

        {mode === 'register' && (
          <div className="field">
            <label htmlFor="name">Nome e cognome</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {error && <div className="state error" role="alert">{error}</div>}
        {info && <div className="state" role="status">{info}</div>}

        <button className="btn primary" disabled={busy}>
          {busy ? 'Attendi…' : mode === 'login' ? 'Accedi' : 'Crea account'}
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
        >
          {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
        </button>
      </form>
    </div>
  )
}
