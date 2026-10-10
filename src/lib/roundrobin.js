/**
 * Calendario all'italiana con il "metodo del cerchio".
 * Restituisce un array di giornate; ogni giornata e' un array di coppie [casa, trasferta].
 * Con numero dispari di squadre una riposa a turno. Se doubleRound e' true
 * aggiunge il girone di ritorno con le sedi invertite.
 */
export function roundRobin(teamIds, doubleRound = true) {
  const list = [...teamIds]
  if (list.length < 2) return []
  if (list.length % 2 === 1) list.push(null)

  const n = list.length
  let arr = [...list]
  const first = []

  for (let r = 0; r < n - 1; r++) {
    const pairs = []
    for (let i = 0; i < n / 2; i++) {
      let home = arr[i]
      let away = arr[n - 1 - i]
      if (home === null || away === null) continue
      if ((r + i) % 2 === 1) [home, away] = [away, home]
      pairs.push([home, away])
    }
    first.push(pairs)
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)]
  }

  if (!doubleRound) return first
  const second = first.map((day) => day.map(([h, a]) => [a, h]))
  return [...first, ...second]
}
