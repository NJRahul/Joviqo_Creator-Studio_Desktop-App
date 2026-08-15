import { useState } from 'react'

const MONTHLY = [
  { month: 'Mar', amount: 2100 },
  { month: 'Apr', amount: 2840 },
  { month: 'May', amount: 3200 },
  { month: 'Jun', amount: 2960 },
  { month: 'Jul', amount: 4760 },
  { month: 'Aug', amount: 1240 },
]

const SOURCES = [
  { label: 'Ad share', amount: 'R 2 840', pct: 60, color: '#FF8A00' },
  { label: 'Pay-per-view share', amount: 'R 1 140', pct: 24, color: '#FFC20E' },
  { label: 'Channel memberships', amount: 'R 560', pct: 12, color: '#56B44A' },
  { label: 'Tips', amount: 'R 220', pct: 4, color: '#1E88C7' },
]

const TRANSACTIONS = [
  { date: '28/07/2026', desc: 'Ad revenue — July', amount: 'R 2 840', status: 'Paid', type: 'credit' },
  { date: '28/07/2026', desc: 'Pay-per-view share', amount: 'R 1 140', status: 'Paid', type: 'credit' },
  { date: '28/07/2026', desc: 'Membership fees', amount: 'R 560', status: 'Paid', type: 'credit' },
  { date: '15/07/2026', desc: 'Tip from viewer', amount: 'R 120', status: 'Paid', type: 'credit' },
  { date: '01/07/2026', desc: 'Payout to ABSA ****4821', amount: '-R 3 200', status: 'Settled', type: 'debit' },
  { date: '28/06/2026', desc: 'Ad revenue — June', amount: 'R 2 960', status: 'Paid', type: 'credit' },
]

function BarChart() {
  const max = Math.max(...MONTHLY.map((m) => m.amount))
  const h = 80

  return (
    <div className="flex items-end gap-3" style={{ height: `${h + 24}px` }}>
      {MONTHLY.map((m, i) => {
        const barH = (m.amount / max) * h
        const isLast = i === MONTHLY.length - 1
        return (
          <div key={m.month} className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full rounded-t-lg transition-all"
              style={{
                height: `${barH}px`,
                background: isLast ? 'rgba(255,138,0,0.3)' : 'var(--brand-gradient)',
                minWidth: '32px',
              }}
            />
            <span className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
              {m.month}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function Earnings() {
  const [showPayout, setShowPayout] = useState(false)
  const [payoutStep, setPayoutStep] = useState<1 | 2>(1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Baloo 2' }}>Earnings</h2>
        <button className="btn-gradient px-5 py-2 text-sm" onClick={() => { setShowPayout(true); setPayoutStep(1) }}>
          Request payout
        </button>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="kpi-card">
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
            Available balance
          </p>
          <p className="text-3xl font-extrabold brand-gradient-text" style={{ fontFamily: 'Baloo 2' }}>
            R 4 760
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
            Minimum payout R 500
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl" style={{ background: 'var(--brand-gradient)' }} />
        </div>
        <div className="kpi-card">
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
            Pending (in review)
          </p>
          <p className="text-3xl font-extrabold" style={{ fontFamily: 'Baloo 2', color: '#FFC20E' }}>
            R 1 240
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
            Available after 14 days
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl" style={{ background: 'linear-gradient(90deg, #FFC20E, transparent)' }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Monthly earnings */}
        <div className="col-span-2 card p-5">
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Baloo 2' }}>Monthly earnings (Rand)</h3>
          <BarChart />
          <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--hairline)' }}>
            <div className="w-2.5 h-2.5 rounded" style={{ background: 'rgba(255,138,0,0.3)' }} />
            <span className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>Aug 2026 (partial month, in progress)</span>
          </div>
        </div>

        {/* Revenue breakdown */}
        <div className="card p-5">
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Baloo 2' }}>Revenue sources</h3>
          <div className="space-y-3">
            {SOURCES.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>{s.label}</span>
                  <span className="text-xs font-bold" style={{ fontFamily: 'Nunito', color: 'var(--snow)' }}>{s.amount}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--slate)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${s.pct}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}99)` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="card overflow-hidden">
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--hairline)' }}>
          <h3 className="text-base font-bold" style={{ fontFamily: 'Baloo 2' }}>Transaction history</h3>
        </div>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
              {['Date', 'Description', 'Amount', 'Status'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRANSACTIONS.map((t, i) => (
              <tr
                key={i}
                style={{ borderBottom: '1px solid var(--hairline)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--slate)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
              >
                <td className="px-5 py-3 text-sm" style={{ color: 'var(--grey)', fontFamily: 'Nunito', whiteSpace: 'nowrap' }}>
                  {t.date}
                </td>
                <td className="px-5 py-3 text-sm" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>
                  {t.desc}
                </td>
                <td className="px-5 py-3 text-sm font-bold" style={{ fontFamily: 'Nunito', color: t.type === 'credit' ? '#56B44A' : '#E63E54' }}>
                  {t.amount}
                </td>
                <td className="px-5 py-3">
                  <span
                    className="status-chip"
                    style={{
                      background: t.status === 'Paid' ? 'rgba(86,180,74,0.15)' : 'rgba(110,110,122,0.2)',
                      color: t.status === 'Paid' ? '#56B44A' : '#B3B3BE',
                    }}
                  >
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payout modal */}
      {showPayout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(11,11,15,0.85)' }}
          onClick={() => setShowPayout(false)}
        >
          <div
            className="w-full max-w-[440px] rounded-2xl p-8"
            style={{ background: 'var(--charcoal)', border: '1px solid var(--hairline)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ fontFamily: 'Baloo 2' }}>
                {payoutStep === 1 ? 'Request payout' : 'Confirm payout'}
              </h3>
              <button onClick={() => setShowPayout(false)} style={{ color: 'var(--grey)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            {payoutStep === 1 ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl" style={{ background: 'var(--slate)' }}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>Available balance</span>
                    <span className="text-sm font-bold brand-gradient-text" style={{ fontFamily: 'Nunito' }}>R 4 760</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>Minimum threshold</span>
                    <span className="text-sm font-bold" style={{ fontFamily: 'Nunito' }}>R 500</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>
                    Destination account
                  </label>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--slate)', border: '1px solid var(--hairline)' }}>
                    <p className="text-sm font-semibold" style={{ fontFamily: 'Nunito' }}>ABSA Bank</p>
                    <p className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>Account ending ****4821</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { type: 'Standard payout', desc: 'Free · Next monthly run 28/08/2026', fee: 'R 0' },
                    { type: 'Instant payout', desc: 'Available within 30 min', fee: 'R 25 fee' },
                  ].map((opt, i) => (
                    <div
                      key={opt.type}
                      className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
                      style={{ background: i === 0 ? 'var(--slate)' : 'var(--charcoal)', border: `1px solid ${i === 0 ? 'var(--joy-orange)' : 'var(--hairline)'}` }}
                    >
                      <div>
                        <p className="text-sm font-bold" style={{ fontFamily: 'Nunito' }}>{opt.type}</p>
                        <p className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{opt.desc}</p>
                      </div>
                      <span className="text-sm font-bold" style={{ fontFamily: 'Nunito', color: i === 0 ? '#56B44A' : 'var(--silver)' }}>
                        {opt.fee}
                      </span>
                    </div>
                  ))}
                </div>

                <button className="btn-gradient w-full py-3 text-base" onClick={() => setPayoutStep(2)}>
                  Continue →
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-5 rounded-xl text-center" style={{ background: 'var(--slate)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>You will receive</p>
                  <p className="text-3xl font-extrabold brand-gradient-text" style={{ fontFamily: 'Baloo 2' }}>R 4 760</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>to ABSA ****4821 · Free standard payout</p>
                </div>
                <div className="flex gap-3">
                  <button className="btn-ghost flex-1 py-3 text-sm" onClick={() => setPayoutStep(1)}>
                    ← Back
                  </button>
                  <button
                    className="btn-gradient flex-1 py-3 text-sm"
                    onClick={() => setShowPayout(false)}
                  >
                    Confirm payout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
