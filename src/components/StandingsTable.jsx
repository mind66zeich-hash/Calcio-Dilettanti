import { Link } from 'react-router-dom'
import { TeamBadge } from './ui.jsx'

export default function StandingsTable({ rows, compact = false }) {
  return (
    <div className="table-wrap">
      <table className="data standings">
        <thead>
          <tr>
            <th className="pos">#</th>
            <th>Squadra</th>
            <th className="center" title="Punti">Pt</th>
            <th className="center" title="Partite giocate">G</th>
            {!compact && (
              <>
                <th className="center hide-sm" title="Vinte">V</th>
                <th className="center hide-sm" title="Pareggiate">N</th>
                <th className="center hide-sm" title="Perse">P</th>
                <th className="center hide-sm" title="Gol fatti">GF</th>
                <th className="center hide-sm" title="Gol subiti">GS</th>
              </>
            )}
            <th className="center" title="Differenza reti">DR</th>
            {!compact && <th className="center hide-sm">Forma</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team_id}>
              <td className="pos">{r.pos}</td>
              <td>
                <Link to={`/squadre/${r.team_id}`} className="team-link">
                  <TeamBadge team={r.team} size={26} />
                  <span>{r.team?.name}</span>
                </Link>
                {r.penalty > 0 && (
                  <small className="muted"> (−{r.penalty} pen.)</small>
                )}
              </td>
              <td className="center pts">{r.pts}</td>
              <td className="center">{r.played}</td>
              {!compact && (
                <>
                  <td className="center hide-sm">{r.won}</td>
                  <td className="center hide-sm">{r.drawn}</td>
                  <td className="center hide-sm">{r.lost}</td>
                  <td className="center hide-sm">{r.gf}</td>
                  <td className="center hide-sm">{r.ga}</td>
                </>
              )}
              <td className="center">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              {!compact && (
                <td className="center hide-sm">
                  <span className="form-pills">
                    {r.form.map((f, i) => (
                      <span key={i} className={f}>{f}</span>
                    ))}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
