import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

type DbStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested'
type DisplayStatus = 'Published' | 'In review' | 'Rejected' | 'Changes requested'

interface ContentRow {
  id: string
  title: string | null
  subject: string | null
  language: string | null
  audience: string | null
  age_band: string | null
  grade: string | null
  status: DbStatus
  thumbnail_url: string | null
  cover_image_url: string | null
  xp_reward: number | null
  is_series: boolean | null
  series_name: string | null
  episode_number: number | null
  tags: string[] | null
  uploaded_at: string | null
}

function displayStatus(s: DbStatus): DisplayStatus {
  if (s === 'approved') return 'Published'
  if (s === 'rejected') return 'Rejected'
  if (s === 'changes_requested') return 'Changes requested'
  return 'In review'
}

const STATUS_COLORS: Record<DisplayStatus, { bg: string; color: string }> = {
  Published: { bg: 'rgba(86,180,74,0.15)', color: '#56B44A' },
  'In review': { bg: 'rgba(255,138,0,0.15)', color: '#FF8A00' },
  Rejected: { bg: 'rgba(230,62,84,0.15)', color: '#E63E54' },
  'Changes requested': { bg: 'rgba(255,194,14,0.15)', color: '#FFC20E' },
}

interface Props {
  userId: string
  onUpload?: () => void
}

export default function ContentLibrary({ userId, onUpload }: Props) {
  const [videos, setVideos] = useState<ContentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [filter, setFilter] = useState<'All' | DisplayStatus>('All')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!userId) return
    supabase
      .from('content')
      .select('*')
      .eq('creator_id', userId)
      .order('uploaded_at', { ascending: false })
      .then(({ data }) => {
        setVideos(data ?? [])
        setLoading(false)
      })

    const channel = supabase.channel('content-lib')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content' }, () => {
        supabase.from('content').select('*').eq('creator_id', userId).order('uploaded_at', { ascending: false }).then(({ data }) => setVideos(data ?? []))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const filtered = videos.filter((v) => {
    const ds = displayStatus(v.status)
    const matchesFilter = filter === 'All' || ds === filter
    const matchesSearch = !searchQuery || (v.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) || (v.subject ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const toggleSelect = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  const allSelected = filtered.length > 0 && filtered.every((v) => selected.includes(v.id))
  const toggleAll = () => { if (allSelected) setSelected([]); else setSelected(filtered.map((v) => v.id)) }

  function fmtDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-ZA')
  }

  const publishedCount = videos.filter(v => v.status === 'approved').length
  const reviewCount = videos.filter(v => v.status === 'pending').length
  const rejectedCount = videos.filter(v => v.status === 'rejected').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Baloo 2' }}>Content library</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
            {publishedCount} published · {reviewCount} in review · {rejectedCount} rejected
          </p>
        </div>
        <button className="btn-gradient px-5 py-2 text-sm" onClick={onUpload}>+ Upload video</button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {(['All', 'Published', 'In review', 'Changes requested', 'Rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{ background: filter === f ? 'var(--brand-gradient)' : 'var(--slate)', color: filter === f ? 'white' : 'var(--silver)', border: 'none', cursor: 'pointer', fontFamily: 'Nunito' }}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto">
          <input
            className="input-field py-1.5 text-sm"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '200px', borderRadius: '999px' }}
          />
        </div>
      </div>

      {/* Bulk toolbar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl mb-4" style={{ background: 'var(--slate)', border: '1px solid var(--hairline)' }}>
          <span className="text-sm font-semibold" style={{ fontFamily: 'Nunito' }}>{selected.length} selected</span>
          {['Make public', 'Make private'].map((action) => (
            <button key={action} className="text-sm font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'var(--charcoal)', color: 'var(--snow)', border: '1px solid var(--hairline)', fontFamily: 'Nunito', cursor: 'pointer' }}>
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--joy-orange)', animation: 'spin 0.75s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
            {searchQuery || filter !== 'All' ? 'No videos match your filter.' : 'No videos uploaded yet. Click "+ Upload video" to get started.'}
          </div>
        ) : (
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                <th className="p-4 w-10">
                  <div onClick={toggleAll} className="w-4 h-4 rounded cursor-pointer flex items-center justify-center" style={{ background: allSelected ? 'var(--brand-gradient)' : 'var(--slate)', border: allSelected ? 'none' : '2px solid var(--hairline)' }}>
                    {allSelected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </th>
                {['Video', 'Subject', 'Audience', 'Status', 'Date', ''].map((h) => (
                  <th key={h} className="p-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((video) => {
                const ds = displayStatus(video.status)
                return (
                  <>
                    <tr
                      key={video.id}
                      className="group transition-colors"
                      style={{ borderBottom: expandedVideo === video.id ? 'none' : '1px solid var(--hairline)', background: selected.includes(video.id) ? 'rgba(255,138,0,0.05)' : 'transparent' }}
                      onMouseEnter={(e) => { if (!selected.includes(video.id)) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--slate)' }}
                      onMouseLeave={(e) => { if (!selected.includes(video.id)) (e.currentTarget as HTMLTableRowElement).style.background = selected.includes(video.id) ? 'rgba(255,138,0,0.05)' : 'transparent' }}
                    >
                      <td className="p-4">
                        <div onClick={() => toggleSelect(video.id)} className="w-4 h-4 rounded cursor-pointer flex items-center justify-center" style={{ background: selected.includes(video.id) ? 'var(--brand-gradient)' : 'var(--slate)', border: selected.includes(video.id) ? 'none' : '2px solid var(--hairline)' }}>
                          {selected.includes(video.id) && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg overflow-hidden flex-shrink-0 relative cursor-pointer" style={{ width: '80px', height: '45px', background: 'var(--slate)' }} onClick={() => setExpandedVideo(expandedVideo === video.id ? null : video.id)}>
                            {video.thumbnail_url
                              ? <img src={video.thumbnail_url} alt={video.title ?? ''} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--grey)' }}>—</div>
                            }
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.4)' }}>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M5 3l9 5-9 5V3z"/></svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ fontFamily: 'Nunito', color: 'var(--snow)', maxWidth: '200px' }}>{video.title ?? '—'}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {video.is_series && video.series_name != null && (
                                <span className="status-chip" style={{ background: 'rgba(255,138,0,0.12)', color: 'var(--joy-orange)', fontSize: '10px', padding: '1px 6px' }}>
                                  Ep {video.episode_number} · {video.series_name}
                                </span>
                              )}
                              {video.grade && (
                                <span className="status-chip" style={{ background: 'rgba(110,110,122,0.15)', color: 'var(--silver)', fontSize: '10px', padding: '1px 6px' }}>{video.grade}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-semibold" style={{ fontFamily: 'Nunito', color: 'var(--snow)' }}>{video.subject ?? '—'}</p>
                        {video.language && <p className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>🌐 {video.language}</p>}
                      </td>
                      <td className="p-4">
                        {video.audience ? (
                          <span className="status-chip" style={{ background: video.audience === 'Kids' ? 'rgba(86,180,74,0.15)' : 'rgba(30,136,199,0.15)', color: video.audience === 'Kids' ? '#56B44A' : '#1E88C7' }}>
                            {video.audience}
                          </span>
                        ) : <span style={{ color: 'var(--grey)', fontFamily: 'Nunito', fontSize: '14px' }}>—</span>}
                        {video.age_band && <p className="text-xs mt-1" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{video.age_band}</p>}
                      </td>
                      <td className="p-4">
                        <span className="status-chip" style={STATUS_COLORS[ds]}>{ds}</span>
                      </td>
                      <td className="p-4 text-sm" style={{ color: 'var(--grey)', fontFamily: 'Nunito', whiteSpace: 'nowrap' }}>
                        {fmtDate(video.uploaded_at)}
                      </td>
                      <td className="p-4 relative">
                        <button onClick={() => setOpenMenu(openMenu === video.id ? null : video.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--slate)', border: '1px solid var(--hairline)', cursor: 'pointer', color: 'var(--silver)' }}>⋯</button>
                        {openMenu === video.id && (
                          <div className="absolute right-4 top-12 z-20 rounded-xl overflow-hidden py-1 min-w-[160px]" style={{ background: 'var(--slate)', border: '1px solid var(--hairline)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
                            {['Edit details', 'Analytics', 'Delete'].map((action) => (
                              <button key={action} onClick={() => setOpenMenu(null)} className="w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors" style={{ color: action === 'Delete' ? '#E63E54' : 'var(--silver)', fontFamily: 'Nunito', background: 'none', border: 'none', cursor: 'pointer' }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--charcoal)' }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
                                {action}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedVideo === video.id && (
                      <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                        <td colSpan={7} className="px-4 pb-4">
                          <div className="flex gap-5 p-4 rounded-xl" style={{ background: 'var(--slate)' }}>
                            {video.cover_image_url && (
                              <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: '200px', height: '112px' }}>
                                <img src={video.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 grid grid-cols-3 gap-4">
                              {[
                                { label: 'Subject', val: video.subject ?? '—' },
                                { label: 'Language', val: video.language ?? '—' },
                                { label: 'Grade', val: video.grade ?? '—' },
                                { label: 'Age band', val: video.age_band ?? '—' },
                                { label: 'XP Reward', val: video.xp_reward != null ? `${video.xp_reward} XP` : '—' },
                                { label: 'Tags', val: (video.tags ?? []).join(', ') || '—' },
                              ].map((f) => (
                                <div key={f.label}>
                                  <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{f.label}</p>
                                  <p className="text-sm" style={{ color: 'var(--snow)', fontFamily: 'Nunito' }}>{f.val}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
