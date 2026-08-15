import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabase'

type DbStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested'
type DisplayStatus = 'Published' | 'In review' | 'Rejected' | 'Changes requested'
type AudienceType = 'kids' | 'general' | 'restricted'
type VisibilityType = 'public' | 'unlisted' | 'private' | 'schedule'

interface ContentRow {
  id: string
  title: string | null
  description: string | null
  subject: string | null
  language: string | null
  audience: string | null
  age_band: string | null
  grade: string | null
  fpb: string | null
  status: DbStatus
  thumbnail_url: string | null
  cover_image_url: string | null
  xp_reward: number | null
  is_series: boolean | null
  series_name: string | null
  episode_number: number | null
  total_episodes: number | null
  tags: string[] | null
  uploaded_at: string | null
  visibility: string | null
  review_note: string | null
  rejection_reason: string | null
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

const LANGUAGES = ['English', 'isiZulu', 'isiXhosa', 'Afrikaans', 'Sesotho', 'Setswana', 'Sepedi', 'Tshivenda']
const SUBJECTS = ['Maths', 'Science', 'Literacy', 'Languages', 'Life Skills', 'Arts & Culture', 'Coding', 'Music', 'Geography', 'Stories']
const GRADES = ['Preschool', 'Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9']

const LABEL_STYLE: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--grey)', fontFamily: 'Nunito', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }
const INPUT_STYLE: React.CSSProperties = { width: '100%', background: 'var(--slate)', border: '1px solid var(--hairline)', borderRadius: '10px', padding: '10px 14px', color: 'var(--snow)', fontFamily: 'Nunito', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
const SECTION_LABEL: React.CSSProperties = { fontFamily: 'Baloo 2', fontWeight: 800, fontSize: '15px', color: 'var(--snow)', marginTop: '8px', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid var(--hairline)' }

interface Props {
  userId: string
  onUpload?: () => void
}

async function uploadToStorage(bucket: string, file: File, uid: string): Promise<string> {
  const path = `${uid}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
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
  const [fDescription, setFDescription] = useState('')
  const [fSubject, setFSubject] = useState('')
  const [fLanguage, setFLanguage] = useState('English')
  const [fTags, setFTags] = useState('')
  const [fXpReward, setFXpReward] = useState('')
  const [fIsSeries, setFIsSeries] = useState(false)
  const [fSeriesName, setFSeriesName] = useState('')
  const [fEpisodeNumber, setFEpisodeNumber] = useState('')
  const [fTotalEpisodes, setFTotalEpisodes] = useState('')
  const [fAudience, setFAudience] = useState<AudienceType | ''>('')
  const [fAgeBand, setFAgeBand] = useState('')
  const [fFpb, setFFpb] = useState('')
  const [fGrade, setFGrade] = useState('')
  const [fVisibility, setFVisibility] = useState<VisibilityType>('public')
  const [editThumbFile, setEditThumbFile] = useState<File | null>(null)
  const [editThumbPreview, setEditThumbPreview] = useState<string | null>(null)
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null)
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const editThumbRef = useRef<HTMLInputElement>(null)
  const editCoverRef = useRef<HTMLInputElement>(null)

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
    setFDescription(video.description ?? '')
    setFSubject(video.subject ?? '')
    setFLanguage(video.language ?? 'English')
    setFTags((video.tags ?? []).join(', '))
    setFXpReward(video.xp_reward?.toString() ?? '')
    setFIsSeries(video.is_series ?? false)
    setFSeriesName(video.series_name ?? '')
    setFEpisodeNumber(video.episode_number?.toString() ?? '')
    setFTotalEpisodes(video.total_episodes?.toString() ?? '')
    setFAudience((video.audience as AudienceType) ?? '')
    setFAgeBand(video.age_band ?? '')
    setFFpb(video.fpb ?? '')
    setFGrade(video.grade ?? '')
    setFVisibility((video.visibility as VisibilityType) ?? 'public')
    setEditThumbFile(null)
    setEditThumbPreview(null)
    setEditCoverFile(null)
    setEditCoverPreview(null)
  }

  async function saveEdit() {
    if (!editTarget) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let thumbnailUrl = editTarget.thumbnail_url
      let coverUrl = editTarget.cover_image_url

      if (editThumbFile) thumbnailUrl = await uploadToStorage('thumbnails', editThumbFile, user.id)
      if (editCoverFile) coverUrl = await uploadToStorage('covers', editCoverFile, user.id)

      await supabase.from('content').update({
        title: fTitle || null,
        description: fDescription || null,
        subject: fSubject || null,
        language: fLanguage || null,
        tags: fTags ? fTags.split(',').map((t) => t.trim()).filter(Boolean) : null,
        xp_reward: fXpReward ? parseInt(fXpReward) : null,
        thumbnail_url: thumbnailUrl,
        cover_image_url: coverUrl,
        is_series: fIsSeries,
        series_name: fIsSeries ? fSeriesName : null,
        episode_number: fIsSeries && fEpisodeNumber ? parseInt(fEpisodeNumber) : null,
        total_episodes: fIsSeries && fTotalEpisodes ? parseInt(fTotalEpisodes) : null,
        audience: fAudience || null,
        age_band: fAgeBand || null,
        fpb: fFpb || null,
        grade: fGrade || null,
        visibility: fVisibility,
      }).eq('id', editTarget.id)

      setEditTarget(null)
      const { data } = await supabase.from('content').select('*').eq('creator_id', userId).order('uploaded_at', { ascending: false })
      setVideos(data ?? [])
    } finally {
      setSaving(false)
    }
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
          <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{ background: filter === f ? 'var(--brand-gradient)' : 'var(--slate)', color: filter === f ? 'white' : 'var(--silver)', border: 'none', cursor: 'pointer', fontFamily: 'Nunito' }}>
            {f}
          </button>
        ))}
        <div className="ml-auto">
          <input className="input-field py-1.5 text-sm" placeholder="Search videos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '200px', borderRadius: '999px' }} />
        </div>
      </div>

      {/* Bulk toolbar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl mb-4" style={{ background: 'var(--slate)', border: '1px solid var(--hairline)' }}>
          <span className="text-sm font-semibold" style={{ fontFamily: 'Nunito' }}>{selected.length} selected</span>
          {['Make public', 'Make private'].map((action) => (
            <button key={action} className="text-sm font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'var(--charcoal)', color: 'var(--snow)', border: '1px solid var(--hairline)', fontFamily: 'Nunito', cursor: 'pointer' }}>{action}</button>
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
                    <tr key={video.id} className="group transition-colors"
                      style={{ borderBottom: expandedVideo === video.id ? 'none' : '1px solid var(--hairline)', background: selected.includes(video.id) ? 'rgba(255,138,0,0.05)' : 'transparent' }}
                      onMouseEnter={(e) => { if (!selected.includes(video.id)) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--slate)' }}
                      onMouseLeave={(e) => { if (!selected.includes(video.id)) (e.currentTarget as HTMLTableRowElement).style.background = selected.includes(video.id) ? 'rgba(255,138,0,0.05)' : 'transparent' }}>
                      <td className="p-4">
                        <div onClick={() => toggleSelect(video.id)} className="w-4 h-4 rounded cursor-pointer flex items-center justify-center" style={{ background: selected.includes(video.id) ? 'var(--brand-gradient)' : 'var(--slate)', border: selected.includes(video.id) ? 'none' : '2px solid var(--hairline)' }}>
                          {selected.includes(video.id) && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg overflow-hidden flex-shrink-0 relative cursor-pointer" style={{ width: '80px', height: '45px', background: 'var(--slate)' }} onClick={() => setExpandedVideo(expandedVideo === video.id ? null : video.id)}>
                            {video.thumbnail_url ? <img src={video.thumbnail_url} alt={video.title ?? ''} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--grey)' }}>—</div>}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.4)' }}>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M5 3l9 5-9 5V3z"/></svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ fontFamily: 'Nunito', color: 'var(--snow)', maxWidth: '200px' }}>{video.title ?? '—'}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {video.is_series && video.series_name != null && (
                                <span className="status-chip" style={{ background: 'rgba(255,138,0,0.12)', color: 'var(--joy-orange)', fontSize: '10px', padding: '1px 6px' }}>Ep {video.episode_number} · {video.series_name}</span>
                              )}
                              {video.grade && <span className="status-chip" style={{ background: 'rgba(110,110,122,0.15)', color: 'var(--silver)', fontSize: '10px', padding: '1px 6px' }}>{video.grade}</span>}
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
                          <span className="status-chip" style={{ background: video.audience === 'kids' ? 'rgba(86,180,74,0.15)' : 'rgba(30,136,199,0.15)', color: video.audience === 'kids' ? '#56B44A' : '#1E88C7' }}>
                            {video.audience === 'kids' ? 'Kids' : video.audience === 'general' ? 'General' : '18+'}
                          </span>
                        ) : <span style={{ color: 'var(--grey)', fontFamily: 'Nunito', fontSize: '14px' }}>—</span>}
                        {video.age_band && <p className="text-xs mt-1" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{video.age_band}</p>}
                      </td>
                      <td className="p-4">
                        <span className="status-chip" style={STATUS_COLORS[ds]}>{ds}</span>
                        {(video.review_note || video.rejection_reason) && (
                          <div onClick={() => setExpandedVideo(video.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', cursor: 'pointer' }}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3l3 3 3-3h3a1 1 0 001-1V3a1 1 0 00-1-1z" stroke={video.status === 'rejected' ? '#E63E54' : '#FFC20E'} strokeWidth="1.5" strokeLinejoin="round"/></svg>
                            <span style={{ fontFamily: 'Nunito', fontSize: '11px', fontWeight: 700, color: video.status === 'rejected' ? '#E63E54' : '#FFC20E' }}>View feedback</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm" style={{ color: 'var(--grey)', fontFamily: 'Nunito', whiteSpace: 'nowrap' }}>{fmtDate(video.uploaded_at)}</td>
                      <td className="p-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect(); setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right }); setOpenMenu(openMenu === video.id ? null : video.id) }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'var(--slate)', border: '1px solid var(--hairline)', cursor: 'pointer', color: 'var(--silver)' }}>⋯</button>
                      </td>
                    </tr>
                    {expandedVideo === video.id && (
                      <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                        <td colSpan={7} className="px-4 pb-4">
                          {/* Admin feedback banner */}
                          {(video.review_note || video.rejection_reason) && (
                            <div style={{ marginBottom: '10px', padding: '14px 16px', borderRadius: '12px', background: video.status === 'rejected' ? 'rgba(230,62,84,0.08)' : 'rgba(255,194,14,0.07)', border: `1px solid ${video.status === 'rejected' ? 'rgba(230,62,84,0.35)' : 'rgba(255,194,14,0.35)'}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3l3 3 3-3h3a1 1 0 001-1V3a1 1 0 00-1-1z" stroke={video.status === 'rejected' ? '#E63E54' : '#FFC20E'} strokeWidth="1.5" strokeLinejoin="round"/></svg>
                                <span style={{ fontFamily: 'Nunito', fontSize: '11px', fontWeight: 800, color: video.status === 'rejected' ? '#E63E54' : '#FFC20E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                  {video.status === 'rejected' ? 'Rejection reason' : 'Admin feedback — changes required'}
                                </span>
                              </div>
                              {video.rejection_reason && (
                                <p style={{ fontFamily: 'Nunito', fontSize: '13px', fontWeight: 700, color: '#E63E54', margin: 0, marginBottom: video.review_note ? '4px' : '0' }}>{video.rejection_reason}</p>
                              )}
                              {video.review_note && (
                                <p style={{ fontFamily: 'Nunito', fontSize: '13px', color: 'var(--silver)', margin: 0, lineHeight: 1.5 }}>{video.review_note}</p>
                              )}
                            </div>
                          )}
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
        <div style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999, background: 'var(--slate)', border: '1px solid var(--hairline)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', borderRadius: '12px', padding: '4px 0', minWidth: '160px' }}
          onClick={(e) => e.stopPropagation()}>
          {[
            { label: 'Edit details', danger: false, action: () => { const v = videos.find((x) => x.id === openMenu); if (v) openEdit(v); setOpenMenu(null) } },
            { label: 'Analytics', danger: false, action: () => { const v = videos.find((x) => x.id === openMenu); if (v) setAnalyticsTarget(v); setOpenMenu(null) } },
            { label: 'Delete', danger: true, action: () => { const v = videos.find((x) => x.id === openMenu); if (v) setDeleteTarget({ id: v.id, label: v.title ?? 'this video' }); setOpenMenu(null) } },
          ].map((item) => (
            <button key={item.label} onClick={(e) => { e.stopPropagation(); item.action() }}
              style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 600, color: item.danger ? '#E63E54' : 'var(--silver)', fontFamily: 'Nunito', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--charcoal)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Edit details modal ── */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setEditTarget(null)}>
          <div style={{ background: 'var(--charcoal)', border: '1px solid var(--hairline)', borderRadius: '20px', width: '600px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'Baloo 2', fontWeight: 800, fontSize: '20px', color: 'var(--snow)', margin: 0 }}>Edit video details</h3>
                <button onClick={() => setEditTarget(null)} style={{ background: 'var(--slate)', border: '1px solid var(--hairline)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--grey)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
              </div>
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY: 'auto', padding: '0 28px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '8px' }}>

                {/* ── DETAILS ── */}
                <p style={SECTION_LABEL}>Details</p>

                <div>
                  <label style={LABEL_STYLE}>Title *</label>
                  <input style={INPUT_STYLE} value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Give your video a descriptive title" />
                </div>

                <div>
                  <label style={LABEL_STYLE}>Description</label>
                  <textarea style={{ ...INPUT_STYLE, resize: 'none', height: '80px' } as React.CSSProperties} value={fDescription} onChange={(e) => setFDescription(e.target.value)} placeholder="Describe what learners will gain from this video..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={LABEL_STYLE}>Subject / Category</label>
                    <select style={{ ...INPUT_STYLE, appearance: 'none' } as React.CSSProperties} value={fSubject} onChange={(e) => setFSubject(e.target.value)}>
                      <option value="">Select subject</option>
                      {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>Language</label>
                    <select style={{ ...INPUT_STYLE, appearance: 'none' } as React.CSSProperties} value={fLanguage} onChange={(e) => setFLanguage(e.target.value)}>
                      {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={LABEL_STYLE}>Tags (comma-separated)</label>
                    <input style={INPUT_STYLE} value={fTags} onChange={(e) => setFTags(e.target.value)} placeholder="maths, grade 3, counting" />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>XP Reward</label>
                    <input style={INPUT_STYLE} type="number" min="0" max="500" value={fXpReward} onChange={(e) => setFXpReward(e.target.value)} placeholder="150" />
                  </div>
                </div>

                {/* Thumbnail */}
                <div>
                  <label style={LABEL_STYLE}>Video thumbnail</label>
                  <p style={{ fontFamily: 'Nunito', fontSize: '12px', color: 'var(--grey)', marginBottom: '8px', marginTop: '-2px' }}>Small 16:9 image shown in video cards</p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {(editThumbPreview || editTarget.thumbnail_url) && (
                      <div style={{ width: '128px', height: '72px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--joy-orange)' }}>
                        <img src={editThumbPreview ?? editTarget.thumbnail_url!} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div onClick={() => editThumbRef.current?.click()} style={{ width: '128px', height: '72px', borderRadius: '10px', border: '2px dashed var(--hairline)', background: 'var(--slate)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <input ref={editThumbRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEditThumbFile(f); setEditThumbPreview(URL.createObjectURL(f)) } }} />
                      <span style={{ fontSize: '20px', color: 'var(--grey)' }}>+</span>
                      <span style={{ fontFamily: 'Nunito', fontSize: '12px', color: 'var(--grey)' }}>{editThumbFile ? 'Change' : editTarget.thumbnail_url ? 'Replace' : 'Upload'}</span>
                    </div>
                  </div>
                </div>

                {/* Cover image */}
                <div>
                  <label style={LABEL_STYLE}>Cover image</label>
                  <p style={{ fontFamily: 'Nunito', fontSize: '12px', color: 'var(--grey)', marginBottom: '8px', marginTop: '-2px' }}>Wide 16:9 banner shown on home page hero</p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {(editCoverPreview || editTarget.cover_image_url) && (
                      <div style={{ width: '160px', height: '90px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--joy-orange)' }}>
                        <img src={editCoverPreview ?? editTarget.cover_image_url!} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div onClick={() => editCoverRef.current?.click()} style={{ width: '160px', height: '90px', borderRadius: '10px', border: '2px dashed var(--hairline)', background: 'var(--slate)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <input ref={editCoverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEditCoverFile(f); setEditCoverPreview(URL.createObjectURL(f)) } }} />
                      <span style={{ fontSize: '20px', color: 'var(--grey)' }}>+</span>
                      <span style={{ fontFamily: 'Nunito', fontSize: '12px', color: 'var(--grey)' }}>{editCoverFile ? 'Change' : editTarget.cover_image_url ? 'Replace' : 'Upload'}</span>
                    </div>
                  </div>
                </div>

                {/* Series toggle */}
                <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--slate)', border: '1px solid var(--hairline)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: fIsSeries ? '12px' : '0' }}>
                    <div>
                      <p style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: '14px', color: 'var(--snow)', margin: 0 }}>Part of a series?</p>
                      <p style={{ fontFamily: 'Nunito', fontSize: '12px', color: 'var(--grey)', margin: 0 }}>Group this video with other episodes</p>
                    </div>
                    <button onClick={() => setFIsSeries(!fIsSeries)} style={{ width: '44px', height: '24px', background: fIsSeries ? 'var(--brand-gradient)' : 'var(--hairline)', borderRadius: '999px', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: '3px', left: fIsSeries ? '23px' : '3px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
                    </button>
                  </div>
                  {fIsSeries && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={LABEL_STYLE}>Series name</label>
                        <input style={{ ...INPUT_STYLE, background: 'var(--charcoal)' }} value={fSeriesName} onChange={(e) => setFSeriesName(e.target.value)} placeholder="e.g. Counting with Zola" />
                      </div>
                      <div>
                        <label style={LABEL_STYLE}>Episode #</label>
                        <input style={{ ...INPUT_STYLE, background: 'var(--charcoal)' }} type="number" min="1" value={fEpisodeNumber} onChange={(e) => setFEpisodeNumber(e.target.value)} placeholder="1" />
                      </div>
                      <div>
                        <label style={LABEL_STYLE}>Total episodes</label>
                        <input style={{ ...INPUT_STYLE, background: 'var(--charcoal)' }} type="number" min="1" value={fTotalEpisodes} onChange={(e) => setFTotalEpisodes(e.target.value)} placeholder="10" />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── AUDIENCE ── */}
                <p style={{ ...SECTION_LABEL, marginTop: '4px' }}>Audience</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { id: 'kids' as AudienceType, icon: '🌟', label: 'Made for Kids', desc: 'Content specifically for children. Requires human review before publishing.', color: '#56B44A' },
                    { id: 'general' as AudienceType, icon: '👥', label: 'General audience', desc: 'Suitable for all ages. Standard moderation applies.', color: '#1E88C7' },
                    { id: 'restricted' as AudienceType, icon: '🔞', label: '18+ restricted', desc: 'Adult content only. Not eligible for the Joviqo Kids platform.', color: '#E63E54' },
                  ].map((opt) => (
                    <div key={opt.id} onClick={() => setFAudience(opt.id)} style={{ padding: '14px 16px', borderRadius: '14px', cursor: 'pointer', background: fAudience === opt.id ? 'var(--slate)' : 'var(--charcoal)', border: `2px solid ${fAudience === opt.id ? opt.color : 'var(--hairline)'}`, transition: 'border-color 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '20px' }}>{opt.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: '14px', color: 'var(--snow)', margin: 0 }}>{opt.label}</p>
                          <p style={{ fontFamily: 'Nunito', fontSize: '12px', color: 'var(--silver)', margin: 0 }}>{opt.desc}</p>
                        </div>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${fAudience === opt.id ? opt.color : 'var(--hairline)'}`, background: fAudience === opt.id ? opt.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {fAudience === opt.id && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {fAudience === 'kids' && (
                  <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--slate)', border: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={LABEL_STYLE}>Age band</label>
                        <select style={{ ...INPUT_STYLE, appearance: 'none', background: 'var(--charcoal)' } as React.CSSProperties} value={fAgeBand} onChange={(e) => setFAgeBand(e.target.value)}>
                          <option value="">Select</option>
                          <option>Preschool (2–4)</option>
                          <option>Younger (5–8)</option>
                          <option>Older (9–12)</option>
                        </select>
                      </div>
                      <div>
                        <label style={LABEL_STYLE}>FPB rating</label>
                        <select style={{ ...INPUT_STYLE, appearance: 'none', background: 'var(--charcoal)' } as React.CSSProperties} value={fFpb} onChange={(e) => setFFpb(e.target.value)}>
                          <option value="">Select</option>
                          {['A', 'PG', '7–9PG', '10–12PG', '13', '16', '18'].map((r) => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={LABEL_STYLE}>Grade level</label>
                      <select style={{ ...INPUT_STYLE, appearance: 'none', background: 'var(--charcoal)' } as React.CSSProperties} value={fGrade} onChange={(e) => setFGrade(e.target.value)}>
                        <option value="">Select grade</option>
                        {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* ── VISIBILITY ── */}
                <p style={{ ...SECTION_LABEL, marginTop: '4px' }}>Visibility</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '8px' }}>
                  {[
                    { id: 'public' as VisibilityType, label: 'Public', desc: 'Anyone can find and watch this video.' },
                    { id: 'unlisted' as VisibilityType, label: 'Unlisted', desc: 'Only people with the link can watch.' },
                    { id: 'private' as VisibilityType, label: 'Private', desc: 'Only you can see this video.' },
                    { id: 'schedule' as VisibilityType, label: 'Schedule', desc: 'Choose a date and time to publish.' },
                  ].map((v) => (
                    <div key={v.id} onClick={() => setFVisibility(v.id)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', background: fVisibility === v.id ? 'var(--slate)' : 'var(--charcoal)', border: `1px solid ${fVisibility === v.id ? 'var(--joy-orange)' : 'var(--hairline)'}` }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${fVisibility === v.id ? 'var(--joy-orange)' : 'var(--hairline)'}`, background: fVisibility === v.id ? 'var(--joy-orange)' : 'transparent' }} />
                      <div>
                        <p style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: '13px', color: 'var(--snow)', margin: 0 }}>{v.label}</p>
                        <p style={{ fontFamily: 'Nunito', fontSize: '12px', color: 'var(--grey)', margin: 0 }}>{v.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 28px 24px', flexShrink: 0, borderTop: '1px solid var(--hairline)', display: 'flex', gap: '12px' }}>
              <button onClick={() => setEditTarget(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--slate)', border: '1px solid var(--hairline)', color: 'var(--silver)', fontFamily: 'Nunito', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving || !fTitle} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--brand-gradient)', border: 'none', color: 'white', fontFamily: 'Nunito', fontWeight: 700, fontSize: '14px', cursor: saving || !fTitle ? 'not-allowed' : 'pointer', opacity: saving || !fTitle ? 0.6 : 1 }}>
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
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--slate)', border: '1px solid var(--hairline)', color: 'var(--silver)', fontFamily: 'Nunito', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
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
