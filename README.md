# Calcio Dilettanti

App web per gestire e consultare campionati di calcio **provinciali e regionali**: classifiche, calendari, referti,
marcatori, disciplina, rose, campi e news. Il pubblico consulta, gli **amministratori** inseriscono e modificano i dati
da un pannello protetto da login.

- **Frontend:** React + Vite, pubblicato gratis su **GitHub Pages**
- **Database, login e immagini:** **Supabase** (piano gratuito)
- Nessun server da gestire: la sicurezza è nelle regole del database (Row Level Security)

## Cosa include

**Parte pubblica**
Home · Classifica (con scontri diretti, penalizzazioni, forma ultime 5) · Calendario e risultati per giornata ·
Squadre e scheda società · Rose e giocatori (ricerca e filtri) · Scheda partita con referto · Classifica marcatori ·
Disciplina (gialli e rossi) · Campi con link a Google Maps · News · Selettore campionato e stagione.

**Pannello di gestione** (`/#/admin`)
Stagioni · Campionati (categoria, provinciale/regionale, punti vittoria/pareggio) · Squadre con logo · Giocatori con foto ·
Campi · Iscrizione squadre e penalizzazioni · **Generatore di calendario** andata/ritorno · Partite e **referto**
(gol, rigori, autogol, ammonizioni, espulsioni) · News · Gestione utenti e ruoli.

Ruoli: **admin** (tutto, anche utenti) · **editor** (inserisce e modifica dati) · **user** (solo lettura).

---

## Messa online, passo per passo

### 1. Crea il progetto Supabase
1. Registrati su <https://supabase.com> e crea un nuovo progetto (piano Free).
2. Apri **SQL Editor → New query**, incolla tutto il contenuto di `supabase/schema.sql` e premi **Run**.
3. *(Facoltativo)* per provare l'app con dati di esempio, esegui anche `supabase/seed.sql`.
4. In **Project Settings → API** copia:
   - **Project URL**
   - chiave **anon public**

> Non usare mai la chiave `service_role` nell'app: va tenuta segreta. La chiave `anon` è pensata per essere pubblica,
> perché i permessi sono controllati dalle regole del database.

### 2. Metti il codice su GitHub
1. Crea un repository su GitHub (es. `calcio-dilettanti`).
2. Carica tutti i file di questa cartella (compresa `.github/`) sul ramo `main`.
   Da terminale:
   ```bash
   git init
   git add .
   git commit -m "Prima versione"
   git branch -M main
   git remote add origin https://github.com/TUO-UTENTE/calcio-dilettanti.git
   git push -u origin main
   ```

### 3. Collega GitHub a Supabase
Nel repository: **Settings → Secrets and variables → Actions → New repository secret**. Crea due secret:

| Nome | Valore |
|---|---|
| `VITE_SUPABASE_URL` | Project URL di Supabase |
| `VITE_SUPABASE_ANON_KEY` | chiave anon public |

### 4. Attiva GitHub Pages
**Settings → Pages → Build and deployment → Source: GitHub Actions.**
Poi vai su **Actions**, apri «Compila e pubblica su GitHub Pages» e premi **Run workflow** (oppure basta un nuovo push).
Al termine il sito è su `https://TUO-UTENTE.github.io/calcio-dilettanti/`.

### 5. Crea il primo amministratore
1. Apri il sito → **Accedi → Registrati** con la tua email.
2. Il **primo utente registrato diventa automaticamente admin**: fallo subito dopo la messa online.
3. Se Supabase richiede conferma email, clicca il link ricevuto, poi accedi. Per saltare la conferma: Supabase →
   Authentication → Providers → Email → disattiva «Confirm email».
4. Dal pannello **Gestione → Utenti** potrai promuovere altri registrati a *editor* o *admin*.

> **Sicurezza consigliata:** dopo aver creato gli account che servono, in Supabase vai su Authentication →
> Sign In / Providers e disattiva le nuove registrazioni (*Allow new users to sign up*). Per aggiungere altri addetti li
> inviti da Authentication → Users → Invite user, poi assegni il ruolo da «Utenti».

### 6. Primo utilizzo
Segui la guida in dashboard: stagione → campionato → squadre e campi → iscrizioni → giocatori → genera calendario →
dopo ogni giornata inserisci i referti. Classifica, marcatori e disciplina si calcolano da soli.

---

## Sviluppo in locale

```bash
npm install
cp .env.example .env     # inserisci URL e chiave anon di Supabase
npm run dev              # http://localhost:5173
npm run build            # compila in dist/
```

## Note utili

- **Progetto in pausa:** i progetti Supabase gratuiti si sospendono dopo circa 7 giorni di inattività. Il workflow
  `keepalive.yml` interroga il database due volte a settimana per evitarlo (usa gli stessi secret).
- **Immagini:** loghi, foto e immagini delle news vengono caricati nel bucket pubblico `media` (max 2 MB ciascuna);
  in alternativa si può incollare l'indirizzo di un'immagine già online.
- **Classifica:** calcolata dall'app sulle partite con stato «Giocata». Parità: scontri diretti (punti e differenza reti),
  differenza reti generale, gol fatti. Per regolamenti diversi modifica `src/lib/standings.js`.
- **Punti per campionato:** 3/1/0 di default, modificabili per ogni campionato.
- **Disciplina:** mostra i cartellini inseriti nei referti; le squalifiche ufficiali restano quelle del comunicato del Comitato.
- **Dominio personalizzato:** configurabile da Settings → Pages. L'app usa indirizzi con `#` e funziona in qualunque sottocartella.
- **Backup:** da Supabase, Database → Backups (o esporta le tabelle in CSV dal Table Editor).

## Struttura

```
supabase/schema.sql   tabelle, ruoli, sicurezza (RLS), storage
supabase/seed.sql     dati demo facoltativi
src/lib/              client Supabase, login, classifica, calendario
src/pages/            pagine pubbliche
src/pages/admin/      pannello di gestione
.github/workflows/    deploy automatico + keep-alive
```
