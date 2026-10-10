import { useCompetition } from '../lib/competition.jsx'
import { useStandings } from '../lib/useStandings.js'
import StandingsTable from '../components/StandingsTable.jsx'
import { Empty, ErrorBox, Loading, PageHeader } from '../components/ui.jsx'

export default function Standings() {
  const { current } = useCompetition()
  const st = useStandings(current)

  if (!current) return <Empty>Nessun campionato selezionato.</Empty>

  return (
    <div>
      <PageHeader title="Classifica" subtitle={current.name} />
      <ErrorBox error={st.error} />
      {st.loading && !st.rows ? (
        <Loading />
      ) : !st.rows?.length ? (
        <Empty>Nessuna squadra iscritta a questo campionato.</Empty>
      ) : (
        <>
          <StandingsTable rows={st.rows} />
          <p className="muted">
            Pt punti · G giocate · V vinte · N pareggiate · P perse · GF/GS gol fatti/subiti · DR differenza reti.
            In caso di parità: scontri diretti, differenza reti, gol fatti.
          </p>
        </>
      )}
    </div>
  )
}
