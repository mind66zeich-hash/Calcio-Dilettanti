import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// La chiave "anon" e' pubblica per progetto: la sicurezza e' garantita dalle policy RLS del database.
export const configured = Boolean(url && key)
export const supabase = configured ? createClient(url, key) : null
