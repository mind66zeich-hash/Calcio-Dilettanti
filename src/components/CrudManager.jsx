import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useQuery } from '../lib/hooks.js'
import { Loading, ErrorBox, Empty, Modal, PageHeader } from './ui.jsx'
import ImageUpload from './ImageUpload.jsx'
import { fmtDate, fmtDateTime, toLocalInput, fromLocalInput } from '../lib/format.js'

const optionsOf = (f) => (f.options || []).map((o) => (typeof o === 'object' ? o : { value: o, label: o }))

function Field({ f, value, onChange, relOptions }) {
  const id = `f-${f.key}`
  const common = { id, required: f.required, value: value ?? '' }

  let control
  switch (f.type) {
    case 'textarea':
      control = <textarea {...common} rows={5} onChange={(e) => onChange(e.target.value)} />
      break
    case 'number':
      control = <input {...common} type="number" step="any" onChange={(e) => onChange(e.target.value)} />
      break
    case 'date':
      control = <input {...common} type="date" onChange={(e) => onChange(e.target.value)} />
      break
    case 'datetime':
      control = (
        <input
          id={id}
          type="datetime-local"
          required={f.required}
          value={toLocalInput(value)}
          onChange={(e) => onChange(fromLocalInput(e.target.value))}
        />
      )
      break
    case 'checkbox':
      return (
        <label className="check field">
          <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span>{f.label}</span>
        </label>
      )
    case 'image':
      return (
        <div className="field">
          <span className="label">{f.label}</span>
          <ImageUpload value={value} onChange={onChange} folder={f.folder || 'misc'} />
        </div>
      )
    case 'select': {
      const opts = f.relation ? relOptions || [] : optionsOf(f)
      control = (
        <select {...common} onChange={(e) => onChange(e.target.value)}>
          <option value="">{f.required ? 'Seleziona…' : '— nessuno —'}</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
      break
    }
    default:
      control = (
        <input
          {...common}
          type={f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : 'text'}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }

  return (
    <div className={'field' + (f.wide ? ' wide' : '')}>
      <label htmlFor={id}>
        {f.label}
        {f.required && ' *'}
      </label>
      {control}
      {f.help && <small className="muted">{f.help}</small>}
    </div>
  )
}

/**
 * Pagina CRUD generica: elenco con ricerca + modulo di inserimento/modifica + eliminazione.
 * Configurata da: table, fields[], columns[].
 */
export default function CrudManager({
  title,
  subtitle,
  table,
  fields,
  columns,
  order = 'created_at',
  ascending = true,
  afterSave,
  newLabel = 'Nuovo',
}) {
  const relFields = useMemo(() => fields.filter((f) => f.relation), [fields])
  const rowsQ = useQuery(() => supabase.from(table).select('*').order(order, { ascending }), [table])
  const relQ = useQuery(async () => {
    const out = {}
    for (const f of relFields) {
      const { data, error } = await supabase
        .from(f.relation.table)
        .select('*')
        .order(f.relation.order || 'name')
      if (error) return { data: null, error }
      out[f.key] = data.map((r) => ({ value: r.id, label: f.relation.label(r) }))
    }
    return { data: out, error: null }
  }, [table])

  const [editing, setEditing] = useState(null)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const rel = relQ.data || {}
  const rows = rowsQ.data || []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      Object.values(r).some((v) => typeof v === 'string' && v.toLowerCase().includes(q)),
    )
  }, [rows, query])

  const defaults = () =>
    Object.fromEntries(
      fields.map((f) => [f.key, typeof f.default === 'function' ? f.default() : f.default]),
    )

  const cell = (row, col) => {
    if (col.render) return col.render(row, rel)
    const key = typeof col === 'string' ? col : col.key
    const f = fields.find((x) => x.key === key)
    const v = row[key]
    if (v == null || v === '') return '—'
    if (!f) return String(v)
    if (f.relation) return (rel[key] || []).find((o) => o.value === v)?.label ?? '—'
    if (f.type === 'checkbox') return v ? '✓' : '—'
    if (f.type === 'date') return fmtDate(v)
    if (f.type === 'datetime') return fmtDateTime(v)
    if (f.type === 'image') return <img className="thumb" src={v} alt="" />
    return String(v)
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    const payload = {}
    for (const f of fields) {
      let v = editing[f.key]
      if (v === '' || v === undefined) v = null
      if (f.type === 'number' && v != null) v = Number(v)
      if (f.type === 'checkbox') v = !!v
      payload[f.key] = v
    }
    const q = editing.id
      ? supabase.from(table).update(payload).eq('id', editing.id).select().single()
      : supabase.from(table).insert(payload).select().single()
    const { data, error } = await q
    if (error) {
      setErr(error)
      setSaving(false)
      return
    }
    if (afterSave) await afterSave(data)
    setSaving(false)
    setEditing(null)
    rowsQ.reload()
  }

  async function remove(row) {
    if (!window.confirm('Eliminare definitivamente questo elemento? L\'operazione non si puo\' annullare.')) return
    const { error } = await supabase.from(table).delete().eq('id', row.id)
    if (error) {
      window.alert(`Impossibile eliminare: ${error.message}`)
      return
    }
    rowsQ.reload()
  }

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle}>
        <button type="button" className="btn primary" onClick={() => { setErr(null); setEditing(defaults()) }}>
          + {newLabel}
        </button>
      </PageHeader>

      <div className="search-row">
        <input
          type="search"
          placeholder="Cerca…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cerca"
        />
        <span className="muted">{filtered.length} element{filtered.length === 1 ? 'o' : 'i'}</span>
      </div>

      <ErrorBox error={rowsQ.error || relQ.error} />
      {rowsQ.loading && !rowsQ.data ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty>Nessun elemento. Usa il pulsante «{newLabel}» per aggiungerne uno.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                {columns.map((c) => {
                  const key = typeof c === 'string' ? c : c.key
                  const f = fields.find((x) => x.key === key)
                  return <th key={key}>{c.label || f?.label || key}</th>
                })}
                <th className="right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  {columns.map((c) => (
                    <td key={typeof c === 'string' ? c : c.key}>{cell(row, c)}</td>
                  ))}
                  <td className="right nowrap">
                    <button type="button" className="btn small" onClick={() => { setErr(null); setEditing({ ...row }) }}>
                      Modifica
                    </button>{' '}
                    <button type="button" className="btn small danger" onClick={() => remove(row)}>
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'Modifica' : newLabel} onClose={() => setEditing(null)} wide>
          <form onSubmit={save}>
            <div className="form-grid">
              {fields.map((f) => (
                <Field
                  key={f.key}
                  f={f}
                  value={editing[f.key]}
                  relOptions={rel[f.key]}
                  onChange={(v) => setEditing((cur) => ({ ...cur, [f.key]: v }))}
                />
              ))}
            </div>
            <ErrorBox error={err} />
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setEditing(null)}>Annulla</button>
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? 'Salvataggio…' : 'Salva'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
