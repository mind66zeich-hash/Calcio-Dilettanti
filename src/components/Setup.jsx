export default function Setup() {
  return (
    <div className="container narrow">
      <div className="card setup">
        <h1>Configurazione mancante</h1>
        <p>
          L'app non trova le chiavi del database. Per collegarla a Supabase imposta queste due variabili:
        </p>
        <pre>
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=chiave-anon-public`}
        </pre>
        <ul>
          <li>
            <strong>In locale:</strong> copia <code>.env.example</code> in <code>.env</code>, inserisci i valori e
            riavvia <code>npm run dev</code>.
          </li>
          <li>
            <strong>Su GitHub:</strong> repository → Settings → Secrets and variables → Actions → aggiungi i due
            secret con gli stessi nomi, poi rilancia il workflow di deploy.
          </li>
        </ul>
        <p className="muted">I valori si trovano in Supabase: Project Settings → API. Vedi il file README per la guida completa.</p>
      </div>
    </div>
  )
}
