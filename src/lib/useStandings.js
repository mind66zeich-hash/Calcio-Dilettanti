import { useMemo } from 'react'
import { supabase } from './supabase.js'
import { useQuery } from './hooks.js'
import { computeStandings } from './standings.js'
import { matchesOf, empty } from './queries.js'

/** Carica iscritti e partite del campionato e calcola la classifica. */
export function useStandings(competition) {
  const cid = competition?.id
  const regs = useQuery(
    () => (cid ? supabase.from('competition_teams').select('*, teams(*)').eq('competition_id', cid) : empty()),
    [cid],
  )
  const matches = useQuery(() => (cid ? matchesOf(cid) : empty()), [cid])

  const rows = useMemo(() => {
    if (!competition || !regs.data || !matches.data) return null
    return computeStandings(regs.data, matches.data, {
      win: competition.points_win,
      draw: competition.points_draw,
      loss: competition.points_loss,
    })
  }, [competition, regs.data, matches.data])

  return {
    rows,
    matches: matches.data,
    registrations: regs.data,
    loading: regs.loading || matches.loading,
    error: regs.error || matches.error,
  }
}
