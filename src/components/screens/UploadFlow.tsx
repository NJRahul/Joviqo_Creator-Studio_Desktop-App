import { useState, useRef } from 'react'
import { supabase } from '../../supabase'

type Step = 1 | 2 | 3 | 4 | 5
type VideoType = 'single' | 'series'

const STEPS = ['Select files', 'Details', 'Audience', 'Publish', 'Review status']
const LANGUAGES = ['English', 'isiZulu', 'isiXhosa', 'Afrikaans', 'Sesotho', 'Setswana', 'Sepedi', 'Tshivenda']
const SUBJECTS = ['Maths', 'Science', 'Literacy', 'Languages', 'Life Skills', 'Arts & Culture', 'Coding', 'Music', 'Geography', 'Stories']
const GRADES = ['Preschool', 'Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9']

interface EpisodeEntry {
  uid: string
  videoFile: File | null
  title: string
  description: string
  thumbnailFile: File | null
  thumbnailPreview: string | null
}

interface UploadFlowProps {
  onBack?: () => void
}

let _uid = 0
function newUid() { return String(++_uid) }

function emptyEpisode(): EpisodeEntry {
  return { uid: newUid(), videoFile: null, title: '', description: '', thumbnailFile: null, thumbnailPreview: null }
}

async function uploadToStorage(bucket: string, file: File, uid: string, onProgress?: (pct: number) => void): Promise<string> {
  const path = `${uid}/${Date.now()}_${file.name}`
  onProgress?.(10)
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  onProgress?.(100)
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export default function UploadFlow({ onBack }: UploadFlowProps) {
  const [step, setStep] = useState<Step>(1)
  const [dragging, setDragging] = useState(false)

  // ── Video type ──────────────────────────────────
  const [videoType, setVideoType] = useState<VideoType>('single')

  // ── Single video state ──────────────────────────
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  // ── Series state ────────────────────────────────
  const [seriesName, setSeriesName] = useState('')
  const [episodes, setEpisodes] = useState<EpisodeEntry[]>([emptyEpisode()])
  const [expandedEp, setExpandedEp] = useState<string | null>(null)
  const [seriesCoverFile, setSeriesCoverFile] = useState<File | null>(null)
  const [seriesCoverPreview, setSeriesCoverPreview] = useState<string | null>(null)

  // ── Shared details (both modes) ─────────────────
  const [subject, setSubject] = useState('')
  const [language, setLanguage] = useState('English')
  const [tags, setTags] = useState('')
  const [xpReward, setXpReward] = useState('150')

  // ── Audience ────────────────────────────────────
  const [audience, setAudience] = useState<'kids' | 'general' | 'restricted' | null>(null)
  const [ageBand, setAgeBand] = useState('')
  const [grade, setGrade] = useState('')
  const [fpb, setFpb] = useState('')

  // ── Publish ─────────────────────────────────────
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private' | 'schedule'>('public')

  // ── Submission state ────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentEpUploading, setCurrentEpUploading] = useState(0)

  const singleFileRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const thumbRef = useRef<HTMLInputElement>(null)
  const seriesCoverRef = useRef<HTMLInputElement>(null)

  // ── Episode helpers ─────────────────────────────
  function updateEp(uid: string, patch: Partial<EpisodeEntry>) {
    setEpisodes(eps => eps.map(e => e.uid === uid ? { ...e, ...patch } : e))
  }

  function addEpisode() {
    setEpisodes(eps => [...eps, emptyEpisode()])
  }

  function removeEpisode(uid: string) {
    setEpisodes(eps => eps.filter(e => e.uid !== uid))
  }

  function moveEp(uid: string, dir: 'up' | 'down') {
    setEpisodes(eps => {
      const idx = eps.findIndex(e => e.uid === uid)
      const next = idx + (dir === 'up' ? -1 : 1)
      if (next < 0 || next >= eps.length) return eps
      const arr = [...eps]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr
    })
  }

  function handleEpVideoFile(uid: string, file: File) {
    updateEp(uid, { videoFile: file })
  }

  function handleEpThumb(uid: string, file: File) {
    updateEp(uid, { thumbnailFile: file, thumbnailPreview: URL.createObjectURL(file) })
  }

  // ── Validation ──────────────────────────────────
  const canNext = () => {
    if (step === 1) {
      if (videoType === 'single') return videoFile !== null
      return seriesName.trim().length > 0 && episodes.length > 0 && episodes.every(e => e.videoFile !== null)
    }
    if (step === 2) {
      if (videoType === 'single') return title.trim().length > 0
      return episodes.every(e => e.title.trim().length > 0)
    }
    if (step === 3) return audience !== null
    return true
  }

  // ── Submit ──────────────────────────────────────
  async function handleSubmit() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitError('You must be signed in to upload.'); return }
    setSubmitting(true)
    setSubmitError('')
    setStep(5)
    try {
      const uid = user.id
      if (videoType === 'single') {
        setUploadProgress(0)
        let finalVideoUrl = ''
        let finalThumbUrl = ''
        let finalCoverUrl = ''
        if (videoFile) finalVideoUrl = await uploadToStorage('videos', videoFile, uid, setUploadProgress)
        if (thumbnailFile) finalThumbUrl = await uploadToStorage('thumbnails', thumbnailFile, uid)
        if (coverFile) finalCoverUrl = await uploadToStorage('covers', coverFile, uid)
        const { error } = await supabase.from('content').insert({
          title, description, subject, language,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          xp_reward: Number(xpReward) || 150,
          video_url: finalVideoUrl, thumbnail_url: finalThumbUrl, cover_image_url: finalCoverUrl,
          audience, age_band: ageBand, grade, fpb,
          is_series: false, series_name: null, episode_number: null, total_episodes: null,
          visibility, creator_id: uid, creator_name: user.email ?? 'Creator',
          status: 'pending', views: 0,
        })
        if (error) throw error
      } else {
        let finalCoverUrl = ''
        if (seriesCoverFile) finalCoverUrl = await uploadToStorage('covers', seriesCoverFile, uid)
        const total = episodes.length
        for (let i = 0; i < total; i++) {
          const ep = episodes[i]
          setCurrentEpUploading(i + 1)
          setUploadProgress(0)
          let epVideoUrl = ''
          let epThumbUrl = ''
          if (ep.videoFile) epVideoUrl = await uploadToStorage('videos', ep.videoFile, uid, setUploadProgress)
          if (ep.thumbnailFile) epThumbUrl = await uploadToStorage('thumbnails', ep.thumbnailFile, uid)
          const { error } = await supabase.from('content').insert({
            title: ep.title, description: ep.description || null, subject, language,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            xp_reward: Number(xpReward) || 150,
            video_url: epVideoUrl, thumbnail_url: epThumbUrl, cover_image_url: finalCoverUrl,
            audience, age_band: ageBand, grade, fpb,
            is_series: true, series_name: seriesName, episode_number: i + 1, total_episodes: total,
            visibility, creator_id: uid, creator_name: user.email ?? 'Creator',
            status: 'pending', views: 0,
          })
          if (error) throw error
        }
      }
      setSubmitted(true)
    } catch (err) {
      setSubmitError('Upload failed. Please check your connection and try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (step === 4) { handleSubmit(); return }
    setStep((s) => (s + 1) as Step)
  }

  const LABEL = 'block text-xs font-bold mb-1.5 uppercase tracking-wider'
  const labelStyle = { color: 'var(--silver)', fontFamily: 'Nunito' }
  const inputBg = { background: 'var(--slate)' }

  return (
    <div className="max-w-2xl">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm mb-6"
          style={{ color: 'var(--grey)', fontFamily: 'Nunito', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to library
        </button>
      )}

      {/* Step progress */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{ background: i + 1 === step ? 'var(--brand-gradient)' : i + 1 < step ? 'rgba(86,180,74,0.2)' : 'var(--slate)', color: i + 1 <= step ? 'white' : 'var(--grey)', fontFamily: 'Nunito' }}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span className="text-xs mt-1 font-semibold text-center" style={{ color: i + 1 === step ? 'var(--snow)' : 'var(--grey)', fontFamily: 'Nunito', whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-16 h-0.5 mb-4 mx-1" style={{ background: i + 1 < step ? '#56B44A' : 'var(--hairline)' }} />}
          </div>
        ))}
      </div>

      {/* ── Step 1 — Select files ── */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Baloo 2' }}>What are you uploading?</h2>

          {/* Video type radio */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {([
              { id: 'single' as VideoType, icon: '🎬', label: 'Single video', desc: 'One standalone video with its own details.' },
              { id: 'series' as VideoType, icon: '📺', label: 'Series', desc: 'Multiple episodes grouped under one series name.' },
            ] as const).map((opt) => (
              <div key={opt.id} onClick={() => setVideoType(opt.id)}
                style={{ padding: '20px', borderRadius: '16px', cursor: 'pointer', background: videoType === opt.id ? 'var(--slate)' : 'var(--charcoal)', border: `2px solid ${videoType === opt.id ? 'var(--joy-orange)' : 'var(--hairline)'}`, transition: 'border-color 0.15s', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '14px', right: '14px', width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${videoType === opt.id ? 'var(--joy-orange)' : 'var(--hairline)'}`, background: videoType === opt.id ? 'var(--joy-orange)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {videoType === opt.id && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />}
                </div>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>{opt.icon}</div>
                <p style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: '15px', color: 'var(--snow)', marginBottom: '4px' }}>{opt.label}</p>
                <p style={{ fontFamily: 'Nunito', fontSize: '12px', color: 'var(--grey)', lineHeight: 1.5 }}>{opt.desc}</p>
              </div>
            ))}
          </div>

          {/* ─── Single: dropzone ─── */}
          {videoType === 'single' && (
            videoFile ? (
              <div className="card p-8 text-center">
                <div className="text-4xl mb-3">🎬</div>
                <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'Baloo 2' }}>{videoFile.name}</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                  {(videoFile.size / 1024 / 1024).toFixed(1)} MB · Ready to upload
                </p>
                <button className="btn-ghost px-5 py-2 text-sm" onClick={() => setVideoFile(null)}>Choose different file</button>
              </div>
            ) : (
              <div
                onClick={() => singleFileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('video/')) setVideoFile(f) }}
                className="card flex flex-col items-center justify-center py-16 cursor-pointer transition-all"
                style={{ border: `2px dashed ${dragging ? 'var(--joy-orange)' : 'var(--hairline)'}`, background: dragging ? 'rgba(255,138,0,0.05)' : 'var(--charcoal)' }}>
                <input ref={singleFileRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setVideoFile(f) }} />
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--slate)' }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M14 4v14M7 11l7-7 7 7" stroke="url(#upG)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 22h20" stroke="url(#upG)" strokeWidth="2.5" strokeLinecap="round" />
                    <defs><linearGradient id="upG" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FF8A00" /><stop offset="1" stopColor="#1E88C7" /></linearGradient></defs>
                  </svg>
                </div>
                <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'Baloo 2' }}>Drag & drop your video here</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>or click to browse files</p>
                <p className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>MP4, MOV, AVI, MKV, WebM · Max 50 GB</p>
              </div>
            )
          )}

          {/* ─── Series: name + episode list ─── */}
          {videoType === 'series' && (
            <div className="space-y-5">
              <div>
                <label className={LABEL} style={labelStyle}>Series name *</label>
                <input className="input-field" placeholder="e.g. Counting with Zola" value={seriesName} onChange={(e) => setSeriesName(e.target.value)} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold" style={{ fontFamily: 'Nunito', color: 'var(--snow)' }}>Episodes ({episodes.length})</p>
                  <button onClick={addEpisode} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--slate)', border: '1px solid var(--hairline)', borderRadius: '8px', padding: '6px 12px', color: 'var(--silver)', fontFamily: 'Nunito', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    Add episode
                  </button>
                </div>

                <div className="space-y-3">
                  {episodes.map((ep, idx) => (
                    <div key={ep.uid} style={{ background: 'var(--slate)', border: '1px solid var(--hairline)', borderRadius: '14px', padding: '14px 16px' }}>
                      <div className="flex items-center gap-3">
                        {/* Reorder */}
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          <button onClick={() => moveEp(ep.uid, 'up')} disabled={idx === 0}
                            style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--hairline)' : 'var(--grey)', cursor: idx === 0 ? 'default' : 'pointer', padding: '2px', lineHeight: 1, display: 'flex' }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 9l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <button onClick={() => moveEp(ep.uid, 'down')} disabled={idx === episodes.length - 1}
                            style={{ background: 'none', border: 'none', color: idx === episodes.length - 1 ? 'var(--hairline)' : 'var(--grey)', cursor: idx === episodes.length - 1 ? 'default' : 'pointer', padding: '2px', lineHeight: 1, display: 'flex' }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>

                        {/* Episode number */}
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,138,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'Baloo 2', fontWeight: 800, fontSize: '13px', color: 'var(--joy-orange)' }}>{idx + 1}</span>
                        </div>

                        {/* Video file picker */}
                        <div style={{ flex: 1 }}>
                          <input id={`ep-vid-${ep.uid}`} type="file" accept="video/*" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleEpVideoFile(ep.uid, f) }} />
                          <div onClick={() => document.getElementById(`ep-vid-${ep.uid}`)?.click()}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: ep.videoFile ? 'rgba(86,180,74,0.1)' : 'var(--charcoal)', border: `1px dashed ${ep.videoFile ? '#56B44A' : 'var(--hairline)'}`, cursor: 'pointer' }}>
                            {ep.videoFile ? (
                              <>
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="#56B44A"><path d="M5 3l9 5-9 5V3z"/></svg>
                                <span style={{ fontFamily: 'Nunito', fontSize: '12px', color: '#56B44A', fontWeight: 600 }}>{ep.videoFile.name}</span>
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v9M4 7l4-5 4 5" stroke="var(--grey)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 13h12" stroke="var(--grey)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                <span style={{ fontFamily: 'Nunito', fontSize: '12px', color: 'var(--grey)' }}>Select video file</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <input style={{ flex: 1, background: 'var(--charcoal)', border: '1px solid var(--hairline)', borderRadius: '8px', padding: '8px 12px', color: 'var(--snow)', fontFamily: 'Nunito', fontSize: '13px', outline: 'none' }}
                          placeholder={`Episode ${idx + 1} title`} value={ep.title}
                          onChange={(e) => updateEp(ep.uid, { title: e.target.value })} />

                        {/* Remove */}
                        <button onClick={() => removeEpisode(ep.uid)} disabled={episodes.length === 1}
                          style={{ background: 'none', border: 'none', color: episodes.length === 1 ? 'var(--hairline)' : '#E63E54', cursor: episodes.length === 1 ? 'default' : 'pointer', padding: '4px', display: 'flex', flexShrink: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {episodes.some(e => !e.videoFile) && (
                  <p className="text-xs mt-2" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>All episodes must have a video file selected before continuing.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2 — Details ── */}
      {step === 2 && videoType === 'single' && (
        <div>
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Baloo 2' }}>Video details</h2>
          <div className="space-y-5">
            <div>
              <label className={LABEL} style={labelStyle}>Title *</label>
              <input className="input-field" placeholder="Give your video a descriptive title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className={LABEL} style={labelStyle}>Description</label>
              <textarea className="input-field resize-none h-24" placeholder="Describe what learners will gain from this video..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL} style={labelStyle}>Subject / Category</label>
                <select className="input-field" value={subject} onChange={(e) => setSubject(e.target.value)} style={inputBg}>
                  <option value="">Select subject</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL} style={labelStyle}>Language</label>
                <select className="input-field" value={language} onChange={(e) => setLanguage(e.target.value)} style={inputBg}>
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL} style={labelStyle}>Tags</label>
                <input className="input-field" placeholder="maths, grade 3, counting" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
              <div>
                <label className={LABEL} style={labelStyle}>XP Reward</label>
                <input className="input-field" type="number" min="0" max="500" placeholder="150" value={xpReward} onChange={(e) => setXpReward(e.target.value)} />
              </div>
            </div>

            {/* Thumbnail */}
            <div>
              <label className={LABEL} style={labelStyle}>Video thumbnail</label>
              <p className="text-xs mb-2" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>Small 16:9 image shown in video cards</p>
              <div className="flex gap-3 items-center">
                {thumbnailPreview && (
                  <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: '128px', height: '72px', border: '2px solid var(--joy-orange)' }}>
                    <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>
                )}
                <div onClick={() => thumbRef.current?.click()} className="flex flex-col items-center justify-center rounded-xl cursor-pointer flex-shrink-0"
                  style={{ width: '128px', height: '72px', border: '2px dashed var(--hairline)', background: 'var(--slate)' }}>
                  <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setThumbnailFile(f); setThumbnailPreview(URL.createObjectURL(f)) } }} />
                  <span className="text-xl" style={{ color: 'var(--grey)' }}>+</span>
                  <span className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{thumbnailFile ? 'Change' : 'Upload'}</span>
                </div>
              </div>
            </div>

            {/* Cover */}
            <div>
              <label className={LABEL} style={labelStyle}>Cover image</label>
              <p className="text-xs mb-2" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>Wide 16:9 banner shown on home page hero</p>
              <div className="flex gap-3 items-center">
                {coverPreview && (
                  <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: '160px', height: '90px', border: '2px solid var(--joy-orange)' }}>
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                )}
                <div onClick={() => coverRef.current?.click()} className="flex flex-col items-center justify-center rounded-xl cursor-pointer flex-shrink-0"
                  style={{ width: '160px', height: '90px', border: '2px dashed var(--hairline)', background: 'var(--slate)' }}>
                  <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) } }} />
                  <span className="text-xl" style={{ color: 'var(--grey)' }}>+</span>
                  <span className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{coverFile ? 'Change' : 'Upload custom'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2 — Series details ── */}
      {step === 2 && videoType === 'series' && (
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Baloo 2' }}>Series details</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
            Fill in shared settings, then expand each episode to add its own title, description, and thumbnail.
          </p>

          {/* Shared fields */}
          <div className="space-y-4 mb-6">
            <p style={{ fontFamily: 'Baloo 2', fontWeight: 800, fontSize: '14px', color: 'var(--snow)', paddingBottom: '8px', borderBottom: '1px solid var(--hairline)' }}>
              Shared across all episodes
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL} style={labelStyle}>Subject / Category</label>
                <select className="input-field" value={subject} onChange={(e) => setSubject(e.target.value)} style={inputBg}>
                  <option value="">Select subject</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL} style={labelStyle}>Language</label>
                <select className="input-field" value={language} onChange={(e) => setLanguage(e.target.value)} style={inputBg}>
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL} style={labelStyle}>Tags</label>
                <input className="input-field" placeholder="maths, grade 3, counting" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
              <div>
                <label className={LABEL} style={labelStyle}>XP Reward (per episode)</label>
                <input className="input-field" type="number" min="0" max="500" placeholder="150" value={xpReward} onChange={(e) => setXpReward(e.target.value)} />
              </div>
            </div>
            {/* Series cover image */}
            <div>
              <label className={LABEL} style={labelStyle}>Series cover image</label>
              <p className="text-xs mb-2" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>Wide 16:9 banner used for the series on the home page hero</p>
              <div className="flex gap-3 items-center">
                {seriesCoverPreview && (
                  <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: '160px', height: '90px', border: '2px solid var(--joy-orange)' }}>
                    <img src={seriesCoverPreview} alt="Series cover" className="w-full h-full object-cover" />
                  </div>
                )}
                <div onClick={() => seriesCoverRef.current?.click()} className="flex flex-col items-center justify-center rounded-xl cursor-pointer flex-shrink-0"
                  style={{ width: '160px', height: '90px', border: '2px dashed var(--hairline)', background: 'var(--slate)' }}>
                  <input ref={seriesCoverRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setSeriesCoverFile(f); setSeriesCoverPreview(URL.createObjectURL(f)) } }} />
                  <span className="text-xl" style={{ color: 'var(--grey)' }}>+</span>
                  <span className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{seriesCoverFile ? 'Change' : 'Upload'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Per-episode cards */}
          <p style={{ fontFamily: 'Baloo 2', fontWeight: 800, fontSize: '14px', color: 'var(--snow)', paddingBottom: '8px', borderBottom: '1px solid var(--hairline)', marginBottom: '14px' }}>
            Episode details — {seriesName}
          </p>
          <div className="space-y-3">
            {episodes.map((ep, idx) => {
              const isOpen = expandedEp === ep.uid
              const titleMissing = ep.title.trim().length === 0
              return (
                <div key={ep.uid} style={{ border: `1px solid ${titleMissing ? 'rgba(230,62,84,0.4)' : isOpen ? 'rgba(255,138,0,0.45)' : 'var(--hairline)'}`, borderRadius: '14px', background: isOpen ? 'var(--slate)' : 'var(--charcoal)', overflow: 'hidden', transition: 'border-color 0.15s' }}>
                  {/* Header */}
                  <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpandedEp(isOpen ? null : ep.uid)}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,138,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: 'Baloo 2', fontWeight: 800, fontSize: '13px', color: 'var(--joy-orange)' }}>{idx + 1}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: '14px', color: ep.title ? 'var(--snow)' : 'var(--grey)', margin: 0 }}>
                        {ep.title || `Episode ${idx + 1} — title required`}
                      </p>
                      {ep.videoFile && <p style={{ fontFamily: 'Nunito', fontSize: '11px', color: 'var(--grey)', margin: 0 }}>{ep.videoFile.name}</p>}
                    </div>
                    {titleMissing && <span style={{ fontFamily: 'Nunito', fontSize: '11px', fontWeight: 700, color: '#E63E54', background: 'rgba(230,62,84,0.1)', padding: '2px 8px', borderRadius: '6px' }}>Title required</span>}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--grey)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                      <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  {/* Expanded body */}
                  {isOpen && (
                    <div className="space-y-4 px-4 pb-4">
                      <div style={{ height: '1px', background: 'var(--hairline)', marginBottom: '4px' }} />
                      <div>
                        <label className={LABEL} style={labelStyle}>Title *</label>
                        <input className="input-field" placeholder={`Episode ${idx + 1} title`} value={ep.title}
                          onChange={(e) => updateEp(ep.uid, { title: e.target.value })} />
                      </div>
                      <div>
                        <label className={LABEL} style={labelStyle}>Description</label>
                        <textarea className="input-field resize-none h-20" placeholder="What will viewers learn in this episode?" value={ep.description}
                          onChange={(e) => updateEp(ep.uid, { description: e.target.value })} />
                      </div>
                      <div>
                        <label className={LABEL} style={labelStyle}>Episode thumbnail</label>
                        <div className="flex gap-3 items-center">
                          {ep.thumbnailPreview && (
                            <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: '112px', height: '63px', border: '2px solid var(--joy-orange)' }}>
                              <img src={ep.thumbnailPreview} alt="thumb" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div onClick={() => document.getElementById(`ep-thumb-${ep.uid}`)?.click()}
                            className="flex flex-col items-center justify-center rounded-xl cursor-pointer flex-shrink-0"
                            style={{ width: '112px', height: '63px', border: '2px dashed var(--hairline)', background: 'var(--charcoal)' }}>
                            <input id={`ep-thumb-${ep.uid}`} type="file" accept="image/*" className="hidden"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleEpThumb(ep.uid, f) }} />
                            <span style={{ fontSize: '18px', color: 'var(--grey)' }}>+</span>
                            <span style={{ fontFamily: 'Nunito', fontSize: '11px', color: 'var(--grey)' }}>{ep.thumbnailFile ? 'Change' : 'Upload'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Step 3 — Audience ── */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Baloo 2' }}>Audience (required)</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
            {videoType === 'series' ? 'Applies to all episodes in this series.' : 'This setting affects content moderation and monetization.'}
          </p>
          <div className="space-y-3">
            {[
              { id: 'kids' as const, icon: '🌟', label: 'Made for Kids', desc: 'Content specifically for children. Requires human review before publishing.', color: '#56B44A' },
              { id: 'general' as const, icon: '👥', label: 'General audience', desc: 'Suitable for all ages. Standard moderation applies.', color: '#1E88C7' },
              { id: 'restricted' as const, icon: '🔞', label: '18+ restricted', desc: 'Adult content only. Not eligible for the Joviqo Kids platform.', color: '#E63E54' },
            ].map((opt) => (
              <div key={opt.id} onClick={() => setAudience(opt.id)} className="p-5 rounded-2xl cursor-pointer transition-all"
                style={{ background: audience === opt.id ? 'var(--slate)' : 'var(--charcoal)', border: `2px solid ${audience === opt.id ? opt.color : 'var(--hairline)'}` }}>
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold mb-1" style={{ fontFamily: 'Nunito', color: 'var(--snow)' }}>{opt.label}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>{opt.desc}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
                    style={{ border: `2px solid ${audience === opt.id ? opt.color : 'var(--hairline)'}`, background: audience === opt.id ? opt.color : 'transparent' }}>
                    {audience === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {audience === 'kids' && (
            <div className="mt-5 space-y-4 p-5 rounded-2xl" style={{ background: 'var(--slate)', border: '1px solid var(--hairline)' }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL} style={labelStyle}>Age band</label>
                  <select className="input-field" value={ageBand} onChange={(e) => setAgeBand(e.target.value)} style={{ background: 'var(--charcoal)' }}>
                    <option value="">Select</option>
                    <option>Preschool (2–4)</option><option>Younger (5–8)</option><option>Older (9–12)</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL} style={labelStyle}>FPB rating</label>
                  <select className="input-field" value={fpb} onChange={(e) => setFpb(e.target.value)} style={{ background: 'var(--charcoal)' }}>
                    <option value="">Select</option>
                    {['A', 'PG', '7–9PG', '10–12PG', '13', '16', '18'].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL} style={labelStyle}>Grade level</label>
                <select className="input-field" value={grade} onChange={(e) => setGrade(e.target.value)} style={{ background: 'var(--charcoal)' }}>
                  <option value="">Select grade</option>
                  {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 4 — Publish ── */}
      {step === 4 && (
        <div>
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Baloo 2' }}>Visibility & publish</h2>
          <div className="space-y-3 mb-6">
            {[
              { id: 'public', label: 'Public', desc: 'Anyone can find and watch this video.' },
              { id: 'unlisted', label: 'Unlisted', desc: 'Only people with the link can watch.' },
              { id: 'private', label: 'Private', desc: 'Only you can see this video.' },
              { id: 'schedule', label: 'Schedule', desc: 'Choose a date and time to publish.' },
            ].map((v) => (
              <div key={v.id} onClick={() => setVisibility(v.id as typeof visibility)} className="flex items-center gap-4 p-4 rounded-xl cursor-pointer"
                style={{ background: visibility === v.id ? 'var(--slate)' : 'var(--charcoal)', border: `1px solid ${visibility === v.id ? 'var(--joy-orange)' : 'var(--hairline)'}` }}>
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ border: `2px solid ${visibility === v.id ? 'var(--joy-orange)' : 'var(--hairline)'}`, background: visibility === v.id ? 'var(--joy-orange)' : 'transparent' }} />
                <div>
                  <p className="text-sm font-bold" style={{ fontFamily: 'Nunito' }}>{v.label}</p>
                  <p className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="p-5 rounded-2xl" style={{ background: 'var(--slate)', border: '1px solid var(--hairline)' }}>
            <h3 className="text-sm font-bold mb-3" style={{ fontFamily: 'Baloo 2' }}>Review summary</h3>
            {videoType === 'single' ? (
              [
                { label: 'Type', val: 'Single video' },
                { label: 'Title', val: title || '—' },
                { label: 'Subject', val: subject || '—' },
                { label: 'Language', val: language },
                { label: 'XP Reward', val: xpReward ? `${xpReward} XP` : '—' },
                { label: 'Audience', val: audience === 'kids' ? 'Made for Kids' : audience === 'general' ? 'General' : '18+ Restricted' },
                ...(audience === 'kids' ? [{ label: 'Age band', val: ageBand || '—' }, { label: 'Grade', val: grade || '—' }] : []),
                { label: 'Visibility', val: visibility.charAt(0).toUpperCase() + visibility.slice(1) },
                { label: 'Video file', val: videoFile?.name || '—' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <span className="text-sm" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{item.label}</span>
                  <span className="text-sm font-semibold" style={{ fontFamily: 'Nunito', color: 'var(--snow)', textAlign: 'right', maxWidth: '60%' }}>{item.val}</span>
                </div>
              ))
            ) : (
              <>
                {[
                  { label: 'Type', val: 'Series' },
                  { label: 'Series name', val: seriesName },
                  { label: 'Episodes', val: `${episodes.length}` },
                  { label: 'Subject', val: subject || '—' },
                  { label: 'Language', val: language },
                  { label: 'XP Reward', val: xpReward ? `${xpReward} XP / episode` : '—' },
                  { label: 'Audience', val: audience === 'kids' ? 'Made for Kids' : audience === 'general' ? 'General' : '18+ Restricted' },
                  { label: 'Visibility', val: visibility.charAt(0).toUpperCase() + visibility.slice(1) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--hairline)' }}>
                    <span className="text-sm" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{item.label}</span>
                    <span className="text-sm font-semibold" style={{ fontFamily: 'Nunito', color: 'var(--snow)', textAlign: 'right', maxWidth: '60%' }}>{item.val}</span>
                  </div>
                ))}
                <div className="mt-3 space-y-1">
                  {episodes.map((ep, i) => (
                    <div key={ep.uid} className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid var(--hairline)' }}>
                      <span style={{ fontFamily: 'Nunito', fontSize: '12px', color: 'var(--grey)', minWidth: '40px' }}>Ep {i + 1}</span>
                      <span style={{ fontFamily: 'Nunito', fontSize: '13px', color: 'var(--snow)', flex: 1 }}>{ep.title}</span>
                      <span style={{ fontFamily: 'Nunito', fontSize: '11px', color: '#56B44A' }}>{ep.videoFile ? '✓ File ready' : '—'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Step 5 — Review status ── */}
      {step === 5 && (
        <div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Baloo 2' }}>
            {submitting ? 'Uploading…' : submitted ? 'Submitted for review' : 'Processing & review'}
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
            {submitted
              ? videoType === 'series'
                ? `All ${episodes.length} episodes are in the admin review queue.`
                : "Your video is in the admin review queue. We'll notify you when it's published."
              : videoType === 'series'
                ? `Uploading episode ${currentEpUploading} of ${episodes.length}…`
                : 'Uploading your video to Joviqo…'}
          </p>

          {submitting && (
            <div className="card p-8 text-center">
              {videoType === 'series' && (
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                  Episode {currentEpUploading} of {episodes.length}
                </p>
              )}
              <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: 'var(--slate)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${uploadProgress}%`, background: 'var(--brand-gradient)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{uploadProgress}% uploaded</p>
            </div>
          )}

          {submitError && (
            <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(230,62,84,0.1)', border: '1px solid rgba(230,62,84,0.2)' }}>
              <p className="text-sm" style={{ color: '#E63E54', fontFamily: 'Nunito' }}>{submitError}</p>
            </div>
          )}

          {submitted && (
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-0.5" style={{ background: 'var(--hairline)' }} />
              <div className="space-y-4">
                {[
                  { label: 'Uploaded', done: true },
                  { label: 'Processing', done: true },
                  { label: 'Automated safety check', done: false, active: true },
                  { label: 'Human review (admin approval)', done: false },
                  { label: 'Published', done: false },
                ].map((stage) => (
                  <div key={stage.label} className="flex items-center gap-4 relative">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center z-10"
                      style={{ background: stage.done ? 'rgba(86,180,74,0.2)' : stage.active ? 'var(--brand-gradient)' : 'var(--slate)', border: `2px solid ${stage.done ? '#56B44A' : stage.active ? 'transparent' : 'var(--hairline)'}` }}>
                      {stage.done
                        ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="#56B44A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        : stage.active ? <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                        : <div className="w-2 h-2 rounded-full" style={{ background: 'var(--grey)' }} />}
                    </div>
                    <p className="text-sm font-bold" style={{ fontFamily: 'Nunito', color: stage.done ? '#56B44A' : stage.active ? 'var(--snow)' : 'var(--grey)' }}>{stage.label}</p>
                    {stage.done && <span className="status-chip" style={{ background: 'rgba(86,180,74,0.15)', color: '#56B44A', fontSize: '11px' }}>Done</span>}
                    {stage.active && <span className="status-chip" style={{ background: 'rgba(255,138,0,0.15)', color: 'var(--joy-orange)', fontSize: '11px' }}>Pending</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      {step < 5 && (
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button className="btn-ghost px-6 py-2.5 text-sm" onClick={() => setStep((s) => (s - 1) as Step)}>← Back</button>
          ) : <div />}
          <button className="btn-gradient px-6 py-2.5 text-sm" onClick={handleNext} disabled={!canNext()}
            style={{ opacity: canNext() ? 1 : 0.4, cursor: canNext() ? 'pointer' : 'not-allowed' }}>
            {step === 4 ? 'Submit for review →' : 'Continue →'}
          </button>
        </div>
      )}
      {step === 5 && submitted && (
        <div className="flex justify-between mt-8">
          {onBack && (
            <button className="btn-gradient px-6 py-2.5 text-sm" onClick={onBack}>← Back to library</button>
          )}
          <button className="btn-ghost px-6 py-2.5 text-sm" onClick={() => {
            setStep(1); setVideoType('single'); setVideoFile(null); setTitle(''); setSubmitted(false);
            setEpisodes([emptyEpisode()]); setSeriesName(''); setSubject(''); setTags(''); setAudience(null);
          }}>Upload another</button>
        </div>
      )}
    </div>
  )
}
