import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { initials } from '../lib/format.js'

export function Loading({ text = 'Caricamento…' }) {
  return <div className="state" role="status">{text}</div>
}

export function ErrorBox({ error }) {
  if (!error) return null
  return <div className="state error" role="alert">Errore: {error.message || String(error)}</div>
}

export function Empty({ children }) {
  return <div className="state">{children}</div>
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children && <div className="actions">{children}</div>}
    </div>
  )
}

export function TeamBadge({ team, size = 32 }) {
  if (!team) return null
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) }
  if (team.logo_url) {
    return <img className="badge" style={style} src={team.logo_url} alt="" loading="lazy" />
  }
  return (
    <span className="badge badge-init" style={style} aria-hidden="true">
      {initials(team.short_name || team.name)}
    </span>
  )
}

export function TeamLink({ team, size = 24 }) {
  if (!team) return null
  return (
    <Link to={`/squadre/${team.id}`} className="team-link">
      <TeamBadge team={team} size={size} />
      <span>{team.name}</span>
    </Link>
  )
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="btn ghost small" onClick={onClose} aria-label="Chiudi">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
