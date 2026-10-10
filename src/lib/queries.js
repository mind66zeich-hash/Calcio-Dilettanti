import { supabase } from './supabase.js'

// Partita con squadre e campo "incorporati"
export const MATCH_SELECT =
  '*, home:teams!home_team_id(id,name,short_name,logo_url), away:teams!away_team_id(id,name,short_name,logo_url), venue:venues(id,name,city)'

export const matchesOf = (competitionId) =>
  supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('competition_id', competitionId)
    .order('kickoff', { ascending: true, nullsFirst: false })

export const empty = () => Promise.resolve({ data: [], error: null })
