import { Link } from 'react-router-dom'
import { TeamBadge } from './ui.jsx'
import { fmtDateTime, fmtTime, STATUS } from '../lib/format.js'

export default function MatchCard({ m }) {
  const done = m.status === 'played' && m.home_score != null && m.away_score != null
  const special = m.status === 'postponed' || m.status === 'cancelled'

  return (
    <Link to={`/partita/${m.id}`} className="match">
      <div className="match-meta">
        <span>
          {m.matchday ? `${m.matchday}ª giornata · ` : ''}
          {fmtDateTime(m.kickoff)}
        </span>
        {special && <span className={'pill ' + m.status}>{STATUS[m.status]}</span>}
      </div>
      <div className="match-row">
        <span className="side home">
          <span>{m.home?.name}</span>
          <TeamBadge team={m.home} />
        </span>
        <span className={'score' + (done ? ' done' : '')}>
          {done ? `${m.home_score} - ${m.away_score}` : m.kickoff ? fmtTime(m.kickoff) : 'vs'}
        </span>
        <span className="side away">
          <TeamBadge team={m.away} />
          <span>{m.away?.name}</span>
        </span>
      </div>
      {m.venue && (
        <div className="match-meta">
          {m.venue.name}
          {m.venue.city ? `, ${m.venue.city}` : ''}
        </div>
      )}
    </Link>
  )
}
