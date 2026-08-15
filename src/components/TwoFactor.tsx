import { useState, useRef } from 'react'
import logo from '../imports/Joviqo_logo_4X_White_Fill.png'

interface Props {
  user?: import('@supabase/supabase-js').User | null
  onVerify: () => void
  onBack: () => void
}

export default function TwoFactor({ onVerify, onBack }: Props) {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const [trust, setTrust] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...code]
    next[i] = val
    setCode(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
    if (next.every((c) => c !== '')) {
      setTimeout(() => onVerify(), 300)
    }
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      setTimeout(() => onVerify(), 400)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--void)' }}
    >
      {/* Brand gradient top bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1"
        style={{ background: 'var(--brand-gradient)' }}
      />

      <div className="w-full max-w-[380px] flex flex-col items-center text-center">
        <img src={logo} alt="Joviqo" className="h-9 w-auto mb-10" />

        {/* Shield icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'var(--slate)' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF8A00" />
                <stop offset="100%" stopColor="#1E88C7" />
              </linearGradient>
            </defs>
            <path
              d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
              fill="url(#shieldGrad)"
              opacity="0.9"
            />
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Baloo 2' }}>
          Two-step verification
        </h2>
        <p className="text-sm mb-2" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>
          We sent a 6-digit code to
        </p>
        <p className="text-sm font-bold mb-8" style={{ color: 'var(--snow)', fontFamily: 'Nunito' }}>
          t***@gmail.com
        </p>

        {/* Code boxes */}
        <div className="flex gap-3 mb-6" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-2xl font-bold rounded-xl outline-none transition-all"
              style={{
                background: 'var(--slate)',
                border: `2px solid ${digit ? 'var(--joy-orange)' : 'var(--hairline)'}`,
                color: 'var(--snow)',
                fontFamily: 'Nunito',
                boxShadow: digit ? '0 0 0 4px rgba(255,138,0,0.12)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Trust device */}
        <label className="flex items-center gap-2.5 cursor-pointer mb-8">
          <div
            onClick={() => setTrust(!trust)}
            className="w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
            style={{
              background: trust ? 'var(--brand-gradient)' : 'var(--slate)',
              border: trust ? 'none' : '2px solid var(--hairline)',
            }}
          >
            {trust && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-sm" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>
            Trust this device for 30 days
          </span>
        </label>

        <button
          onClick={onVerify}
          className="btn-gradient w-full py-3 text-base mb-4"
        >
          Verify
        </button>

        <button
          onClick={onBack}
          className="btn-ghost w-full py-3 text-sm mb-6"
        >
          Back to sign in
        </button>

        <p className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
          Didn&apos;t receive a code?{' '}
          <span
            className="font-semibold cursor-pointer"
            style={{ color: 'var(--joy-orange)' }}
          >
            Resend in 0:42
          </span>
        </p>
      </div>
    </div>
  )
}
