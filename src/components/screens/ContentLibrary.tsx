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

const LABEL_STYLE: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--grey)', fontFamily: 'Nunito', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }
const INPUT_STYLE: React.CSSProperties = { width: '100%', background: 'var(--slate)', border: '1px solid var(--hairline)', borderRadius: '10px', padding: '10px 14px', color: 'var(--snow)', fontFamily: 'Nunito', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }

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
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Edit modal
  const [editTarget, setEditTarget] = useState<ContentRow | null>(null)
  const [fTitle, setFTitle] = useState('')
  const [fSubject, setFSubject] = useState('')
  const [fLanguage, setFLanguage] = useState('')
  const [fAudience, setFAudience] = useState('')
  const [fAgeBand, setFAgeBand] = useState('')
  const [fGrade, setFGrade] = useState('')
  const [fXpReward, setFXpReward] = useState('')
  const [fTags, setFTags] = useState('')
  const [saving, setSaving] = useState(false)

  // Analytics panel
  const [analyticsTarget, setAnalyticsTarget] = useState<ContentRow | null>(null)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  function openEdit(video: ContentRow) {
    setEditTarget(video)
    setFTitle(video.title ?? '')
    setFSubject(video.subject ?? '')
    setFLanguage(video.language ?? '')
    setFAudience(video.audience ?? '')
    setFAgeBand(video.age_band ?? '')
    setFGrade(video.grade ?? '')
    setFXpReward(video.xp_reward?.toString() ?? '')
    setFTags((video.tags ?? []).join(', '))
  }

  async function saveEdit() {
    if (!editTarget) return
    setSaving(true)
    await supabase.from('content').update({
      title: fTitle || null,
      subject: fSubject || null,
      language: fLanguage || null,
      audience: fAudience || null,
      age_band: fAgeBand || null,
      grade: fGrade || null,
      xp_reward: fXpReward ? parseInt(fXpReward) : null,
      tags: fTags ? fTags.split(',').map((t) => t.trim()).filter(Boolean) : null,
    }).eq('id', editTarget.id)
    setSaving(false)
    setEditTarget(null)
    const { data } = await supabase.from('content').select('*').eq('creator_id', userId).order('uploaded_at', { ascending: false })
    setVideos(data ?? [])
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('content').delete().eq('id', deleteTarget.id)
    setVideos((v) => v.filter((x) => x.id !== deleteTarget.id))
    setDeleting(false)
    setDeleteTarget(null)
  }

  const publishedCount = videos.filter(v => v.status === 'approved').length
  const reviewCount = videos.filter(v => v.status === 'pending').length
  const rejectedCount = videos.filter(v => v.status === 'rejected').length

  return (
    <div onClick={() => setOpenMenu(null)}>
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
                      <td className="p-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect(); setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right }); setOpenMenu(openMenu === video.id ? null : video.id) }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--slate)', border: '1px solid var(--hairline)', cursor: 'pointer', color: 'var(--silver)' }}
                        >⋯</button>
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

      {/* Fixed-position kebab dropdown */}
      {openMenu && (
        <div
          style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999, background: 'var(--slate)', border: '1px solid var(--hairline)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', borderRadius: '12px', padding: '4px 0', minWidth: '160px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            {
              label: 'Edit details',
              danger: false,
              action: () => {
                const v = videos.find((x) => x.id === openMenu)
                if (v) openEdit(v)
                setOpenMenu(null)
              },
            },
            {
              label: 'Analytics',
              danger: false,
              action: () => {
                const v = videos.find((x) => x.id === openMenu)
                if (v) setAnalyticsTarget(v)
                setOpenMenu(null)
              },
            },
            {
              label: 'Delete',
              danger: true,
              action: () => {
                const v = videos.find((x) => x.id === openMenu)
                if (v) setDeleteTarget({ id: v.id, label: v.title ?? 'this video' })
                setOpenMenu(null)
              },
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={(e) => { e.stopPropagation(); item.action() }}
              style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: item.danger ? '#E63E54' : 'var(--silver)', fontFamily: 'Nunito', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--charcoal)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Edit details modal */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setEditTarget(null)}>
          <div style={{ background: 'var(--charcoal)', border: '1px solid var(--hairline)', borderRadius: '20px', padding: '32px', width: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Baloo 2', fontWeight: 800, fontSize: '20px', color: 'var(--snow)', marginBottom: '24px' }}>Edit details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={LABEL_STYLE}>Title</label>
                <input style={INPUT_STYLE} value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Video title" />
              </div>
              <div>
                <label style={LABEL_STYLE}>Subject</label>
                <input style={INPUT_STYLE} value={fSubject} onChange={(e) => setFSubject(e.target.value)} placeholder="e.g. Mathematics" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={LABEL_STYLE}>Language</label>
                  <input style={INPUT_STYLE} value={fLanguage} onChange={(e) => setFLanguage(e.target.value)} placeholder="e.g. English" />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Audience</label>
                  <select style={{ ...INPUT_STYLE, appearance: 'none' }} value={fAudience} onChange={(e) => setFAudience(e.target.value)}>
                    <option value="">— Select —</option>
                    <option value="Kids">Kids</option>
                    <option value="Parents">Parents</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={LABEL_STYLE}>Age band</label>
                  <input style={INPUT_STYLE} value={fAgeBand} onChange={(e) => setFAgeBand(e.target.value)} placeholder="e.g. 6–9" />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Grade</label>
                  <input style={INPUT_STYLE} value={fGrade} onChange={(e) => setFGrade(e.target.value)} placeholder="e.g. Grade 3" />
                </div>
              </div>
              <div>
                <label style={LABEL_STYLE}>XP Reward</label>
                <input style={INPUT_STYLE} type="number" value={fXpReward} onChange={(e) => setFXpReward(e.target.value)} placeholder="e.g. 50" />
              </div>
              <div>
                <label style={LABEL_STYLE}>Tags (comma-separated)</label>
                <input style={INPUT_STYLE} value={fTags} onChange={(e) => setFTags(e.target.value)} placeholder="fractions, math, grade3" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button onClick={() => setEditTarget(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--slate)', border: '1px solid var(--hairline)', color: 'var(--silver)', fontFamily: 'Nunito', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--brand-gradient)', border: 'none', color: 'white', fontFamily: 'Nunito', fontWeight: 700, fontSize: '14px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics modal */}
      {analyticsTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setAnalyticsTarget(null)}>
          <div style={{ background: 'var(--charcoal)', border: '1px solid var(--hairline)', borderRadius: '20px', padding: '32px', width: '480px', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'Baloo 2', fontWeight: 800, fontSize: '20px', color: 'var(--snow)', margin: 0 }}>Analytics</h3>
              <button onClick={() => setAnalyticsTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--grey)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>✕</button>
            </div>
            <p style={{ fontFamily: 'Nunito', fontSize: '14px', color: 'var(--grey)', marginBottom: '24px', marginTop: '-12px' }}>{analyticsTarget.title ?? 'Untitled'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total views', value: '—', icon: '👁' },
                { label: 'Watch time', value: '—', icon: '⏱' },
                { label: 'Completion rate', value: '—', icon: '✅' },
                { label: 'XP awarded', value: analyticsTarget.xp_reward != null ? `${analyticsTarget.xp_reward} XP` : '—', icon: '⭐' },
              ].map((stat) => (
                <div key={stat.label} style={{ background: 'var(--slate)', border: '1px solid var(--hairline)', borderRadius: '14px', padding: '16px' }}>
                  <p style={{ fontFamily: 'Nunito', fontSize: '12px', color: 'var(--grey)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{stat.icon} {stat.label}</p>
                  <p style={{ fontFamily: 'Baloo 2', fontSize: '24px', fontWeight: 800, color: 'var(--snow)', margin: 0 }}>{stat.value}</p>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: 'Nunito', fontSize: '13px', color: 'var(--grey)', textAlign: 'center' }}>
              Detailed analytics will appear here once your video is published and has views.
            </p>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setDeleteTarget(null)}>
          <div style={{ background: 'var(--charcoal)', border: '1px solid var(--hairline)', borderRadius: '20px', padding: '32px', width: '400px', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(230,62,84,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E63E54" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </div>
            <h3 style={{ fontFamily: 'Baloo 2', fontWeight: 800, fontSize: '18px', color: 'var(--snow)', marginBottom: '8px' }}>Delete video?</h3>
            <p style={{ fontFamily: 'Nunito', fontSize: '14px', color: 'var(--grey)', marginBottom: '28px', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--silver)' }}>{deleteTarget.label}</strong> will be permanently removed. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--slate)', border: '1px solid var(--hairline)', color: 'var(--silver)', fontFamily: 'Nunito', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#E63E54', border: 'none', color: 'white', fontFamily: 'Nunito', fontWeight: 700, fontSize: '14px', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
