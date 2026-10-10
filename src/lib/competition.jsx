import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase.js'
import { useQuery } from './hooks.js'

const Ctx = createContext(null)
const KEY = 'calcio.competition'

export function CompetitionProvider({ children }) {
  const q = useQuery(
    () =>
      supabase
        ? supabase.from('competitions').select('*, seasons(name,is_current)').order('name')
        : Promise.resolve({ data: [], error: null }),
    [],
  )
  const [selected, setSelected] = useState(() => {
    try { return localStorage.getItem(KEY) } catch { return null }
  })

  const competitions = useMemo(() => {
    const list = q.data || []
    // stagione corrente per prima, poi per nome
    return [...list].sort((a, b) => {
      const ca = a.seasons?.is_current ? 0 : 1
      const cb = b.seasons?.is_current ? 0 : 1
      return ca - cb || (b.seasons?.name || '').localeCompare(a.seasons?.name || '') || a.name.localeCompare(b.name)
    })
  }, [q.data])

  const current = useMemo(
    () => competitions.find((c) => c.id === selected) || competitions[0] || null,
    [competitions, selected],
  )

  useEffect(() => {
    try { if (current) localStorage.setItem(KEY, current.id) } catch { /* ignora */ }
  }, [current])

  const value = useMemo(
    () => ({
      competitions,
      current,
      loading: q.loading,
      error: q.error,
      setCurrentId: setSelected,
      reload: q.reload,
    }),
    [competitions, current, q.loading, q.error, q.reload],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useCompetition = () => useContext(Ctx)
