import { useState } from 'react'
import { supabase } from '../supabase'
import logo from '../imports/Joviqo_logo_4X_White_Fill.png'

type Step = 1 | 2 | 3 | 4

const STEPS = ['Channel basics', 'Verify identity', 'Payout details', 'Kids safety']

interface Props {
  onComplete: () => void
  onBack: () => void
}

const SAFETY_RULES = [
  'Content must be age-appropriate for the selected audience band',
  'No violent, sexual, or discriminatory content',
  'Educational claims must be accurate and fact-checked',
  'All featured people must have given consent to appear',
  'No misleading thumbnails or titles targeting children',
  'Creators must complete a kids-safety quiz before publishing',
]

export default function Onboarding({ onComplete, onBack }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [channelName, setChannelName] = useState('')
  const [handle, setHandle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [idType, setIdType] = useState<'id' | 'passport'>('id')
  const [idNumber, setIdNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [branchCode, setBranchCode] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canNext = () => {
    if (step === 1) return channelName.length > 0 && handle.length > 0 && email.includes('@') && password.length >= 6 && password === confirmPassword
    if (step === 4) return accepted && quizAnswer === 'b'
    return true
  }

  const handleComplete = async () => {
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError
      const user = data.user
      if (!user) throw new Error('No user returned. Disable email confirmation in Supabase Auth settings.')
      await supabase.from('users').insert({
        id: user.id,
        email,
        role: 'creator',
        channel_name: channelName,
        handle,
        category,
        description,
        account_status: 'pending_verification',
        verified: false,
        strikes: 0,
      })
      onComplete()
    } catch (err: any) {
      const msg = err?.message ?? ''
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('An account with this email already exists. Please sign in instead.')
      } else {
        setError(msg || 'Failed to create account. Please try again.')
      }
      setSubmitting(false)
    }
  }

  const progressPct = ((step - 1) / 3) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: 'var(--void)' }}>
      {/* Brand gradient top bar */}
      <div className="fixed top-0 left-0 right-0 h-1" style={{ background: 'var(--brand-gradient)' }} />

      <div className="w-full max-w-[540px]">
        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="Joviqo" className="h-8 w-auto" />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
            Become a creator
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--slate)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: 'var(--brand-gradient)' }}
            />
          </div>
        </div>
        <div className="flex justify-between mb-8">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className="text-xs font-semibold"
              style={{
                fontFamily: 'Nunito',
                color: i + 1 === step ? 'var(--snow)' : i + 1 < step ? '#56B44A' : 'var(--grey)',
              }}
            >
              {i + 1 < step ? '✓ ' : ''}{s}
            </span>
          ))}
        </div>

        <div className="card p-8">
          {/* Step 1 — Channel basics */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Baloo 2' }}>Channel basics</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                Create your Joviqo creator account.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Email *</label>
                  <input className="input-field" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Password *</label>
                    <input className="input-field" type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Confirm password *</label>
                    <input className="input-field" type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs" style={{ color: '#E63E54', fontFamily: 'Nunito' }}>Passwords do not match.</p>
                )}
                <div style={{ height: '1px', background: 'var(--hairline)' }} />
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Channel name *</label>
                  <input className="input-field" placeholder="e.g. Thandi Teaches" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Handle *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>@</span>
                    <input
                      className="input-field pl-8"
                      placeholder="thandi.teaches"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Category</label>
                  <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)} style={{ background: 'var(--slate)' }}>
                    <option value="">Select a category</option>
                    {['Maths', 'Science', 'Languages', 'Life Skills', 'Arts & Culture', 'Technology', 'History'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Channel description</label>
                  <textarea
                    className="input-field resize-none h-20"
                    placeholder="Tell learners what your channel is about..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                {/* Banner upload */}
                <div
                  className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
                  style={{ background: 'var(--slate)', border: '2px dashed var(--hairline)' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ fontFamily: 'Nunito' }}>Channel banner</p>
                    <p className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>Recommended: 2560 × 1440px · JPG or PNG</p>
                  </div>
                  <button className="btn-ghost px-4 py-1.5 text-xs">Upload</button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Verify identity */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Baloo 2' }}>Verify your identity</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                Required for creators in South Africa to comply with FICA regulations.
              </p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  {(['id', 'passport'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setIdType(t)}
                      className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: idType === t ? 'var(--slate)' : 'var(--charcoal)',
                        border: `2px solid ${idType === t ? 'var(--joy-orange)' : 'var(--hairline)'}`,
                        color: idType === t ? 'var(--snow)' : 'var(--grey)',
                        fontFamily: 'Nunito',
                        cursor: 'pointer',
                      }}
                    >
                      {t === 'id' ? 'SA ID number' : 'Passport'}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>
                    {idType === 'id' ? 'SA ID number' : 'Passport number'}
                  </label>
                  <input
                    className="input-field"
                    placeholder={idType === 'id' ? '0000000000000' : 'A00000000'}
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                  />
                </div>
                {/* Document upload */}
                <div className="grid grid-cols-2 gap-3">
                  {['Document photo', 'Selfie with document'].map((label) => (
                    <div
                      key={label}
                      className="flex flex-col items-center justify-center py-8 rounded-xl cursor-pointer"
                      style={{ background: 'var(--slate)', border: '2px dashed var(--hairline)' }}
                    >
                      <span className="text-2xl mb-2">📄</span>
                      <p className="text-xs font-semibold text-center" style={{ fontFamily: 'Nunito', color: 'var(--silver)' }}>
                        {label}
                      </p>
                      <p className="text-xs text-center mt-1" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                        Tap to upload
                      </p>
                    </div>
                  ))}
                </div>
                {/* Status chip */}
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,194,14,0.08)', border: '1px solid rgba(255,194,14,0.2)' }}>
                  <span className="status-chip" style={{ background: 'rgba(255,194,14,0.2)', color: '#FFC20E' }}>
                    Pending review
                  </span>
                  <p className="text-xs" style={{ color: '#FFC20E', fontFamily: 'Nunito' }}>
                    Identity verification typically takes 1–2 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Payout details */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Baloo 2' }}>Payout details</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                Where should we send your earnings? Minimum payout: R 500.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Bank name</label>
                  <select className="input-field" value={bankName} onChange={(e) => setBankName(e.target.value)} style={{ background: 'var(--slate)' }}>
                    <option value="">Select your bank</option>
                    {['ABSA', 'FNB', 'Standard Bank', 'Nedbank', 'Capitec', 'Discovery Bank', 'TymeBank'].map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Account number</label>
                    <input className="input-field" placeholder="000 000 0000" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Branch code</label>
                    <input className="input-field" placeholder="000000" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>
                    SARS tax reference{' '}
                    <span className="normal-case font-normal" style={{ color: 'var(--grey)' }}>(optional)</span>
                  </label>
                  <input className="input-field" placeholder="e.g. 0000000000" />
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(86,180,74,0.08)', border: '1px solid rgba(86,180,74,0.2)' }}>
                  <p className="text-xs" style={{ color: '#56B44A', fontFamily: 'Nunito' }}>
                    🔒 Your banking details are encrypted and stored securely. Joviqo never shares them with third parties.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Kids safety */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Baloo 2' }}>Kids safety guidelines</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                Creators uploading content for children must agree to these rules.
              </p>
              <div className="space-y-2 mb-6">
                {SAFETY_RULES.map((rule, i) => (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
                      style={{ background: 'rgba(86,180,74,0.15)' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5 3.5-3.5" stroke="#56B44A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm" style={{ fontFamily: 'Nunito', color: 'var(--silver)', lineHeight: '1.5' }}>
                      {rule}
                    </p>
                  </div>
                ))}
              </div>

              {/* Quiz */}
              <div
                className="p-4 rounded-xl mb-5"
                style={{ background: 'var(--slate)', border: '1px solid var(--hairline)' }}
              >
                <p className="text-sm font-bold mb-3" style={{ fontFamily: 'Nunito' }}>
                  Quick check: If a viewer reports your kids content as harmful, what happens?
                </p>
                {[
                  { id: 'a', text: 'Nothing, I decide what is appropriate.' },
                  { id: 'b', text: 'It is immediately suspended pending human review.' },
                  { id: 'c', text: 'The comment is hidden but the video stays live.' },
                ].map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setQuizAnswer(opt.id)}
                    className="flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer transition-all"
                    style={{
                      background: quizAnswer === opt.id ? (opt.id === 'b' ? 'rgba(86,180,74,0.1)' : 'rgba(230,62,84,0.1)') : 'var(--charcoal)',
                      border: `1px solid ${quizAnswer === opt.id ? (opt.id === 'b' ? '#56B44A' : '#E63E54') : 'var(--hairline)'}`,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{
                        border: `2px solid ${quizAnswer === opt.id ? (opt.id === 'b' ? '#56B44A' : '#E63E54') : 'var(--hairline)'}`,
                        background: quizAnswer === opt.id ? (opt.id === 'b' ? '#56B44A' : '#E63E54') : 'transparent',
                      }}
                    />
                    <p className="text-sm" style={{ fontFamily: 'Nunito', color: 'var(--silver)' }}>
                      {opt.text}
                    </p>
                  </div>
                ))}
                {quizAnswer && quizAnswer !== 'b' && (
                  <p className="text-xs mt-2" style={{ color: '#E63E54', fontFamily: 'Nunito' }}>
                    That&apos;s not quite right. All reported kids content is immediately reviewed by our safety team.
                  </p>
                )}
                {quizAnswer === 'b' && (
                  <p className="text-xs mt-2" style={{ color: '#56B44A', fontFamily: 'Nunito' }}>
                    ✓ Correct! Child safety is our top priority.
                  </p>
                )}
              </div>

              {/* Acceptance */}
              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  onClick={() => setAccepted(!accepted)}
                  className="w-5 h-5 rounded-md flex-shrink-0 mt-0.5 flex items-center justify-center"
                  style={{
                    background: accepted ? 'var(--brand-gradient)' : 'var(--slate)',
                    border: accepted ? 'none' : '2px solid var(--hairline)',
                  }}
                >
                  {accepted && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p className="text-sm" style={{ fontFamily: 'Nunito', color: 'var(--silver)', lineHeight: '1.5' }}>
                  I have read and agree to the Joviqo Kids Content Guidelines and understand that violations may result in content removal, strikes, or channel termination.
                </p>
              </label>
            </div>
          )}
        </div>

        {/* Navigation */}
        {error && (
          <p className="text-sm mt-4 text-center" style={{ color: '#E63E54', fontFamily: 'Nunito' }}>{error}</p>
        )}
        <div className="flex justify-between mt-6">
          <button
            onClick={step === 1 ? onBack : () => setStep((s) => (s - 1) as Step)}
            className="btn-ghost px-6 py-2.5 text-sm"
            disabled={submitting}
          >
            ← {step === 1 ? 'Back to login' : 'Back'}
          </button>
          <button
            onClick={step === 4 ? handleComplete : () => setStep((s) => (s + 1) as Step)}
            className="btn-gradient px-6 py-2.5 text-sm"
            disabled={!canNext() || submitting}
            style={{ opacity: canNext() && !submitting ? 1 : 0.4, cursor: canNext() && !submitting ? 'pointer' : 'not-allowed' }}
          >
            {step === 4 ? (submitting ? 'Creating channel…' : 'Create my channel →') : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
