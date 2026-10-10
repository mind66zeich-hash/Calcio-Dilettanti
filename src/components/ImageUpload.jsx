import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

/** Carica un'immagine nel bucket "media" di Supabase Storage oppure accetta un URL. */
export default function ImageUpload({ value, onChange, folder = 'misc' }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return setErr('Seleziona un file immagine.')
    if (file.size > 2 * 1024 * 1024) return setErr('Immagine troppo grande (massimo 2 MB).')

    setBusy(true)
    setErr(null)
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const path = `${folder}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from('media')
      .upload(path, file, { contentType: file.type, cacheControl: '31536000' })
    if (error) {
      setErr(error.message)
    } else {
      const { data } = supabase.storage.from('media').getPublicUrl(path)
      onChange(data.publicUrl)
    }
    setBusy(false)
  }

  return (
    <div className="image-upload">
      {value && <img className="thumb large" src={value} alt="Anteprima" />}
      <div className="row">
        <input type="file" accept="image/*" onChange={onFile} disabled={busy} />
        {value && (
          <button type="button" className="btn ghost small" onClick={() => onChange(null)}>
            Rimuovi
          </button>
        )}
      </div>
      <input
        type="url"
        placeholder="…oppure incolla un indirizzo (URL) dell'immagine"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
      />
      {busy && <small className="muted">Caricamento in corso…</small>}
      {err && <small className="err">{err}</small>}
    </div>
  )
}
