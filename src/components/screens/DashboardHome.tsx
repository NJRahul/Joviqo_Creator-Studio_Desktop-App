import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

interface ContentRow {
  id: string
  status: string
  title: string | null
  uploaded_at: string | null
  subject: string | null
  audience: string | null
}

const announcements = [
  { title: 'New: Premium Creator badges', body: 'Top creators now earn gold badges on their channel pages.', color: '#FF8A00' },
  { title: 'Policy update — Kids content', body: 'Updated guidelines for Preschool category content. Review before uploading.', color: '#E63E54' },
  { title: 'Payout window opens 28/08/2026', body: 'Ensure your bank details are verified before the deadline.', color: '#56B44A' },
]

function MiniSparkline({ color }: { color: string }) {
  const points = [30, 45, 38, 60, 55, 72, 65, 80, 76, 90]
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const w = 120
  const h = 40
  const pts = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  )
}

interface Props {
  userId: string
  channelName: string | null
}

export default function DashboardHome({ userId, channelName }: Props) {
  const [content, setContent] = useState<ContentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('content')
      .select('id, status, title, uploaded_at, subject, audience')
      .eq('creator_id', userId)
      .order('uploaded_at', { ascending: false })
      .then(({ data }) => {
        setContent(data ?? [])
        setLoading(false)
      })
  }, [userId])

  const publishedCount = content.filter(c => c.status === 'approved').length
  const pendingCount = content.filter(c => c.status === 'pending' || c.status === 'changes_requested').length
  const rejectedCount = content.filter(c => c.status === 'rejected').length
  const totalCount = content.length

  const inReview = content.filter(c => c.status === 'pending' || c.status === 'changes_requested').slice(0, 3)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const displayName = channelName ?? '…'

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Baloo 2' }}>
            {greeting}, {displayName} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
            {displayName} · {publishedCount} video{publishedCount !== 1 ? 's' : ''} published
          </p>
        </div>
        <button className="btn-gradient px-6 py-2.5 text-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Upload
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total videos', value: totalCount.toString(), color: '#FF8A00' },
          { label: 'Published', value: publishedCount.toString(), color: '#56B44A' },
          { label: 'In review', value: pendingCount.toString(), color: '#FFC20E' },
          { label: 'Rejected', value: rejectedCount.toString(), color: '#E63E54' },
        ].map((kpi) => (
          <div key={kpi.label} className="kpi-card cursor-default">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                {kpi.label}
              </p>
            </div>
            <div className="text-2xl font-extrabold mb-3" style={{ fontFamily: 'Baloo 2', color: 'var(--snow)' }}>
              {loading ? '—' : kpi.value}
            </div>
            <MiniSparkline color={kpi.color} />
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl" style={{ background: `linear-gradient(90deg, ${kpi.color}, transparent)` }} />
          </div>
        ))}
      </div>

      {/* Two-column content area */}
      <div className="grid grid-cols-3 gap-4">
        {/* In-review panel */}
        <div className="col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ fontFamily: 'Baloo 2' }}>In review</h3>
              <span className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                {pendingCount} item{pendingCount !== 1 ? 's' : ''} pending
              </span>
            </div>
            {loading ? (
              <div className="py-4 text-center" style={{ color: 'var(--grey)', fontFamily: 'Nunito', fontSize: '14px' }}>Loading…</div>
            ) : inReview.length === 0 ? (
              <div className="py-6 text-center" style={{ color: 'var(--grey)', fontFamily: 'Nunito', fontSize: '14px' }}>
                No content in review. Upload your first video!
              </div>
            ) : (
              <div className="space-y-3">
                {inReview.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'var(--slate)' }}>
                    <div className="w-12 h-9 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E1E28, #2A2A36)' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="1" y="2" width="14" height="12" rx="2" fill="#2A2A36" stroke="#3A3A48" />
                        <path d="M6 5.5l5 2.5-5 2.5V5.5z" fill="#6E6E7A" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold truncate" style={{ fontFamily: 'Nunito', color: 'var(--snow)' }}>
                          {item.title ?? '—'}
                        </p>
                        {item.audience && (
                          <span className="status-chip flex-shrink-0" style={{ background: 'rgba(86,180,74,0.15)', color: '#56B44A', fontSize: '10px' }}>
                            {item.audience}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                          {item.status === 'changes_requested' ? 'Changes requested' : 'Awaiting review'}
                        </span>
                        {item.subject && (
                          <>
                            <span className="text-xs" style={{ color: 'var(--grey)' }}>·</span>
                            <span className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{item.subject}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent uploads */}
          {content.filter(c => c.status === 'approved').length > 0 && (
            <div className="card p-5">
              <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Baloo 2' }}>Recently published</h3>
              <div className="space-y-3">
                {content.filter(c => c.status === 'approved').slice(0, 3).map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ background: 'var(--brand-gradient)', fontFamily: 'Nunito', color: 'white' }}>
                      {(item.title ?? '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ fontFamily: 'Nunito', color: 'var(--snow)' }}>{item.title ?? '—'}</p>
                      <p className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                        {item.subject ?? '—'} · {item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString('en-ZA') : '—'}
                      </p>
                    </div>
                    <span className="status-chip flex-shrink-0" style={{ background: 'rgba(86,180,74,0.15)', color: '#56B44A', fontSize: '10px' }}>Published</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — announcements + snapshot */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Baloo 2' }}>Announcements</h3>
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.title} className="p-3 rounded-xl" style={{ background: 'var(--slate)', borderLeft: `3px solid ${a.color}` }}>
                  <p className="text-sm font-bold mb-1" style={{ fontFamily: 'Nunito', color: 'var(--snow)' }}>{a.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>{a.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-base font-bold mb-4" style={{ fontFamily: 'Baloo 2' }}>Channel snapshot</h3>
            {[
              { label: 'Videos published', val: loading ? '—' : publishedCount.toString() },
              { label: 'Videos in review', val: loading ? '—' : pendingCount.toString() },
              { label: 'Videos rejected', val: loading ? '—' : rejectedCount.toString() },
              { label: 'Total uploads', val: loading ? '—' : totalCount.toString() },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--hairline)' }}>
                <span className="text-sm" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>{s.label}</span>
                <span className="text-sm font-bold" style={{ fontFamily: 'Nunito', color: 'var(--snow)' }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
