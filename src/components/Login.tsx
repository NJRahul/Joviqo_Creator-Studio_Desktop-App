import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import logo from '../imports/Joviqo_logo_4X_White_Fill.png'

interface Props {
  onLogin: (user: User) => void
  onBecome: () => void
}

export default function Login({ onLogin, onBecome }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      const user = data.user
      const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (!userRow || (userRow.role !== 'creator' && userRow.role !== 'admin')) {
        await supabase.auth.signOut()
        setError('This account does not have Creator Studio access.')
        setLoading(false)
        return
      }
      onLogin(user)
    } catch {
      setError('Incorrect email or password. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden" style={{ background: 'var(--void)' }}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=900&h=1100&fit=crop&auto=format)` }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(11,11,15,0.55) 0%, rgba(11,11,15,0.85) 60%, rgba(11,11,15,0.97) 100%)' }} />
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'var(--brand-gradient)' }} />
        <div className="relative z-10 p-10">
          <img src={logo} alt="Joviqo" className="h-10 w-auto" />
        </div>
        <div className="relative z-10 p-10 pb-14">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-5" style={{ background: 'rgba(255,138,0,0.18)', color: 'var(--joy-orange)', fontFamily: 'Nunito' }}>Creator Studio</span>
          <h1 className="text-5xl font-extrabold leading-tight mb-4" style={{ fontFamily: 'Baloo 2', color: 'var(--snow)' }}>
            Create.{' '}<span className="brand-gradient-text">Teach.</span><br />Earn.
          </h1>
          <p className="text-base leading-relaxed max-w-sm" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>
            Build learning experiences for South African kids. Upload videos, design learning paths, track your impact, and grow your income.
          </p>
          <div className="flex items-center gap-6 mt-10">
            {[{ value: '12 480', label: 'Active creators' }, { value: '3.2M', label: 'Young learners' }, { value: 'R 8.4M', label: 'Paid to creators' }].map((stat) => (
              <div key={stat.label}>
                <div className="text-xl font-extrabold brand-gradient-text" style={{ fontFamily: 'Baloo 2' }}>{stat.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 min-h-screen" style={{ background: 'var(--void)' }}>
        <div className="lg:hidden mb-10">
          <img src={logo} alt="Joviqo" className="h-9 w-auto" />
        </div>
        <div className="w-full max-w-[400px]">
          <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Baloo 2', color: 'var(--snow)' }}>Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>Sign in to your Creator Studio account</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Email</label>
              <input className="input-field" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Password</label>
              <div className="relative">
                <input className="input-field pr-12" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {error && <p className="text-sm" style={{ color: '#E63E54', fontFamily: 'Nunito' }}>{error}</p>}
            <button type="submit" className="btn-gradient w-full py-3 text-base mt-2" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--hairline)' }} />
            <span className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>New to Joviqo?</span>
            <div className="flex-1 h-px" style={{ background: 'var(--hairline)' }} />
          </div>
          <button onClick={onBecome} className="btn-ghost w-full py-3 text-sm">Become a creator — it&apos;s free</button>
        </div>
      </div>
    </div>
  )
}
