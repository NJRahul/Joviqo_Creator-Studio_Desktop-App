import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import Login from './components/Login'
import TwoFactor from './components/TwoFactor'
import Dashboard from './components/Dashboard'
import Onboarding from './components/Onboarding'

type Screen = 'loading' | 'login' | '2fa' | 'onboarding' | 'dashboard'

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [pendingUser, setPendingUser] = useState<User | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      if (user) {
        const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
        if (!data) {
          setScreen('onboarding')
        } else if (data.role === 'creator' || data.role === 'admin') {
          setScreen('dashboard')
        } else {
          await supabase.auth.signOut()
          setScreen('login')
        }
      } else {
        setScreen('login')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  if (screen === 'loading') {
    return (
      <div style={{ background: 'var(--void)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--joy-orange)', animation: 'spin 0.75s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <>
      {screen === 'login' && (
        <Login
          onLogin={(user) => { setPendingUser(user); setScreen('2fa') }}
          onBecome={() => setScreen('onboarding')}
        />
      )}
      {screen === '2fa' && (
        <TwoFactor
          user={pendingUser}
          onVerify={() => setScreen('dashboard')}
          onBack={() => setScreen('login')}
        />
      )}
      {screen === 'onboarding' && (
        <Onboarding
          onComplete={() => setScreen('dashboard')}
          onBack={() => setScreen('login')}
        />
      )}
      {screen === 'dashboard' && <Dashboard onLogout={async () => { await supabase.auth.signOut(); setScreen('login') }} />}
    </>
  )
}
