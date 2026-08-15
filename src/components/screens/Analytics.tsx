import { useState } from 'react'

const VIEWS_DATA = [
  { date: '01/07', views: 1840, watchTime: 140 },
  { date: '05/07', views: 2200, watchTime: 178 },
  { date: '10/07', views: 3100, watchTime: 240 },
  { date: '15/07', views: 2800, watchTime: 210 },
  { date: '20/07', views: 4200, watchTime: 320 },
  { date: '25/07', views: 3800, watchTime: 290 },
  { date: '01/08', views: 5100, watchTime: 390 },
]

const TRAFFIC = [
  { source: 'Browse & discovery', pct: 38, color: '#FF8A00' },
  { source: 'Direct / links', pct: 24, color: '#FFC20E' },
  { source: 'Learning paths', pct: 20, color: '#56B44A' },
  { source: 'Search', pct: 12, color: '#1E88C7' },
  { source: 'Other', pct: 6, color: '#6E6E7A' },
]

const TOP_VIDEOS = [
  { title: 'Counting with Zola — Ep 4', views: '28 440', change: '+18%', up: true },
  { title: 'Maths Made Fun — Grade 3', views: '14 800', change: '+4%', up: true },
  { title: 'SA History — Apartheid Era', views: '9 210', change: '-2%', up: false },
  { title: 'isiZulu Basics — Lesson 1', views: '6 340', change: '+31%', up: true },
  { title: 'Creative Writing Workshop', views: '3 210', change: '+11%', up: true },
]

const PROVINCES = [
  { name: 'Gauteng', pct: 34, views: '28 620' },
  { name: 'Western Cape', pct: 22, views: '18 510' },
  { name: 'KwaZulu-Natal', pct: 18, views: '15 140' },
  { name: 'Eastern Cape', pct: 10, views: '8 420' },
  { name: 'Limpopo', pct: 8, views: '6 730' },
  { name: 'Other provinces', pct: 8, views: '6 730' },
]

function AreaChart() {
  const w = 600
  const h = 140
  const maxVal = Math.max(...VIEWS_DATA.map((d) => d.views))
  const pts = VIEWS_DATA.map((d, i) => ({
    x: (i / (VIEWS_DATA.length - 1)) * w,
    y: h - (d.views / maxVal) * (h - 16),
  }))
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const area = `${pts[0].x},${h} ${polyline} ${pts[pts.length - 1].x},${h}`

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF8A00" />
          <stop offset="50%" stopColor="#56B44A" />
          <stop offset="100%" stopColor="#1E88C7" />
        </linearGradient>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF8A00" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1E88C7" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon fill="url(#areaFill)" points={area} />
      <polyline
        fill="none"
        stroke="url(#areaGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polyline}
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="url(#areaGrad)" />
      ))}
    </svg>
  )
}

function DonutChart() {
  const r = 56
  const cx = 70
  const cy = 70
  const circumference = 2 * Math.PI * r
  let offset = 0

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {TRAFFIC.map((t) => {
        const dashArray = (t.pct / 100) * circumference
        const gap = circumference - dashArray
        const el = (
          <circle
            key={t.source}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={t.color}
            strokeWidth="20"
            strokeDasharray={`${dashArray - 2} ${gap + 2}`}
            strokeDashoffset={-offset + circumference / 4}
            strokeLinecap="round"
          />
        )
        offset += dashArray
        return el
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Baloo 2">
        84K
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#6E6E7A" fontSize="10" fontFamily="Nunito">
        total views
      </text>
    </svg>
  )
}

export default function Analytics() {
  const [range, setRange] = useState('Last 28 days')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Baloo 2' }}>Analytics</h2>
        <div className="flex gap-2">
          {['Last 7 days', 'Last 28 days', 'Last 90 days', 'Custom'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: range === r ? 'var(--brand-gradient)' : 'var(--slate)',
                color: range === r ? 'white' : 'var(--silver)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Nunito',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Views chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ fontFamily: 'Baloo 2' }}>Views over time</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded" style={{ background: 'var(--brand-gradient)' }} />
              <span className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>Views</span>
            </div>
          </div>
        </div>
        <div className="overflow-hidden">
          <AreaChart />
        </div>
        <div className="flex justify-between mt-2">
          {VIEWS_DATA.map((d) => (
            <span key={d.date} className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
              {d.date}
            </span>
          ))}
        </div>
      </div>

      {/* Traffic + Top videos */}
      <div className="grid grid-cols-5 gap-4">
        {/* Traffic sources donut */}
        <div className="col-span-2 card p-5">
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Baloo 2' }}>Traffic sources</h3>
          <div className="flex items-center gap-5">
            <DonutChart />
            <div className="space-y-2 flex-1">
              {TRAFFIC.map((t) => (
                <div key={t.source} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.color }} />
                  <span className="text-xs flex-1" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>
                    {t.source}
                  </span>
                  <span className="text-xs font-bold" style={{ fontFamily: 'Nunito', color: 'var(--snow)' }}>
                    {t.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top videos */}
        <div className="col-span-3 card p-5">
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Baloo 2' }}>Top videos</h3>
          <div className="space-y-0">
            {TOP_VIDEOS.map((v, i) => (
              <div
                key={v.title}
                className="flex items-center gap-4 py-3"
                style={{ borderBottom: i < TOP_VIDEOS.length - 1 ? '1px solid var(--hairline)' : 'none' }}
              >
                <span className="text-sm font-bold w-5 text-center" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ fontFamily: 'Nunito', color: 'var(--snow)' }}>
                    {v.title}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ fontFamily: 'Nunito', color: 'var(--snow)' }}>
                    {v.views}
                  </p>
                  <p
                    className="text-xs font-bold"
                    style={{ color: v.up ? '#56B44A' : '#E63E54', fontFamily: 'Nunito' }}
                  >
                    {v.up ? '▲' : '▼'} {v.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Province breakdown */}
      <div className="card p-5">
        <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Baloo 2' }}>Viewers by province — South Africa</h3>
        <div className="space-y-3">
          {PROVINCES.map((p) => (
            <div key={p.name} className="flex items-center gap-4">
              <span className="text-sm w-40 flex-shrink-0" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>
                {p.name}
              </span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--slate)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${p.pct}%`, background: 'var(--brand-gradient)' }}
                />
              </div>
              <span className="text-sm font-bold w-16 text-right" style={{ fontFamily: 'Nunito', color: 'var(--snow)' }}>
                {p.views}
              </span>
              <span className="text-xs w-8 text-right" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                {p.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
