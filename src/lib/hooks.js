import { useEffect, useState } from 'react'

/**
 * Esegue una funzione che restituisce una promessa { data, error } (come le query Supabase)
 * e la riesegue quando cambiano le dipendenze o si chiama reload().
 */
export function useQuery(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    Promise.resolve()
      .then(fn)
      .then((res) => {
        if (!alive) return
        setState({ data: res?.data ?? null, loading: false, error: res?.error ?? null })
      })
      .catch((error) => {
        if (alive) setState({ data: null, loading: false, error })
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { ...state, reload: () => setTick((t) => t + 1) }
}
