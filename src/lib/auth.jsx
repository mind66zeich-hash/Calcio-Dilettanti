import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (!supabase) return undefined
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase) return
    if (!session) {
      setProfile(null)
      return
    }
    let alive = true
    setProfileLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) {
          setProfile(data)
          setProfileLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [session])

  const value = useMemo(() => {
    const role = profile?.role || null
    return {
      session,
      user: session?.user || null,
      profile,
      role,
      isAdmin: role === 'admin',
      isStaff: role === 'admin' || role === 'editor',
      loading: loading || (Boolean(session) && profileLoading),
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signUp: (email, password, fullName) =>
        supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }),
      signOut: () => supabase.auth.signOut(),
    }
  }, [session, profile, loading, profileLoading])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
