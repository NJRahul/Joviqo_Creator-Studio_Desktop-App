import { useState, useRef } from 'react'
import { supabase } from '../../supabase'

type Step = 1 | 2 | 3 | 4 | 5

const STEPS = ['Select file', 'Details', 'Audience', 'Publish', 'Review status']
const LANGUAGES = ['English', 'isiZulu', 'isiXhosa', 'Afrikaans', 'Sesotho', 'Setswana', 'Sepedi', 'Tshivenda']
const SUBJECTS = ['Maths', 'Science', 'Literacy', 'Languages', 'Life Skills', 'Arts & Culture', 'Coding', 'Music', 'Geography', 'Stories']
const GRADES = ['Preschool', 'Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9']

export default function UploadFlow() {
  const [step, setStep] = useState<Step>(1)
  const [dragging, setDragging] = useState(false)

  // File state
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  // Step 2 — Details
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [subject, setSubject] = useState('')
  const [language, setLanguage] = useState('English')
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isSeries, setIsSeries] = useState(false)
  const [seriesName, setSeriesName] = useState('')
  const [episodeNumber, setEpisodeNumber] = useState('')
  const [totalEpisodes, setTotalEpisodes] = useState('')
  const [xpReward, setXpReward] = useState('150')

  // Step 3 — Audience
  const [audience, setAudience] = useState<'kids' | 'general' | 'restricted' | null>(null)
  const [ageBand, setAgeBand] = useState('')
  const [grade, setGrade] = useState('')
  const [fpb, setFpb] = useState('')

  // Step 4 — Publish
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private' | 'schedule'>('public')

  // Step 5 — submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const thumbRef = useRef<HTMLInputElement>(null)

  function handleVideoFile(file: File) {
    setVideoFile(file)
    setUploading(false)
    setUploadProgress(0)
  }

  function handleThumbnailFile(file: File) {
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  function handleCoverFile(file: File) {
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
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

  async function handleSubmit() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitError('You must be signed in to upload.'); return }
    setSubmitting(true)
    setSubmitError('')
    try {
      const uid = user.id
      let finalVideoUrl = ''
      let finalThumbnailUrl = ''

      // Upload video
      if (videoFile) {
        setStep(5)
        setUploadProgress(0)
        finalVideoUrl = await uploadToStorage('videos', videoFile, uid, setUploadProgress)
        setVideoUrl(finalVideoUrl)
      }

      // Upload thumbnail
      if (thumbnailFile) {
        finalThumbnailUrl = await uploadToStorage('thumbnails', thumbnailFile, uid)
        setThumbnailUrl(finalThumbnailUrl)
      }

      // Upload cover image
      let coverImageUrl = ''
      if (coverFile) {
        coverImageUrl = await uploadToStorage('covers', coverFile, uid)
      }

      // Insert content row in Supabase
      const { error: insertError } = await supabase.from('content').insert({
        title,
        description,
        subject,
        language,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        xp_reward: Number(xpReward) || 150,
        video_url: finalVideoUrl,
        thumbnail_url: finalThumbnailUrl,
        cover_image_url: coverImageUrl,
        audience,
        age_band: ageBand,
        grade,
        fpb,
        is_series: isSeries,
        series_name: isSeries ? seriesName : '',
        episode_number: isSeries ? Number(episodeNumber) : null,
        total_episodes: isSeries ? Number(totalEpisodes) : null,
        visibility,
        creator_id: uid,
        creator_name: user.email ?? 'Creator',
        status: 'pending',
        views: 0,
      })
      if (insertError) throw insertError

      setSubmitted(true)
    } catch (err) {
      setSubmitError('Upload failed. Please check your connection and try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const canNext = () => {
    if (step === 1) return videoFile !== null
    if (step === 2) return title.length > 0
    if (step === 3) return audience !== null
    return true
  }

  const handleNext = () => {
    if (step === 4) { handleSubmit(); return }
    setStep((s) => (s + 1) as Step)
  }

  return (
    <div className="max-w-2xl">
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

      {/* Step 1 — Select file */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Baloo 2' }}>Select your video</h2>
          {videoFile ? (
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
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('video/')) handleVideoFile(f) }}
              className="card flex flex-col items-center justify-center py-16 cursor-pointer transition-all"
              style={{ border: `2px dashed ${dragging ? 'var(--joy-orange)' : 'var(--hairline)'}`, background: dragging ? 'rgba(255,138,0,0.05)' : 'var(--charcoal)' }}
            >
              <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoFile(f) }} />
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--slate)' }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 4v14M7 11l7-7 7 7" stroke="url(#upGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 22h20" stroke="url(#upGrad)" strokeWidth="2.5" strokeLinecap="round" />
                  <defs><linearGradient id="upGrad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FF8A00" /><stop offset="1" stopColor="#1E88C7" /></linearGradient></defs>
                </svg>
              </div>
              <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'Baloo 2' }}>Drag & drop your video here</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>or click to browse files</p>
              <p className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>Supported formats: MP4, MOV, AVI, MKV, WebM · Max 50 GB</p>
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Details */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Baloo 2' }}>Video details</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Title *</label>
              <input className="input-field" placeholder="Give your video a descriptive title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Description</label>
              <textarea className="input-field resize-none h-24" placeholder="Describe what learners will gain from this video..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Subject / Category</label>
                <select className="input-field" value={subject} onChange={(e) => setSubject(e.target.value)} style={{ background: 'var(--slate)' }}>
                  <option value="">Select subject</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Language</label>
                <select className="input-field" value={language} onChange={(e) => setLanguage(e.target.value)} style={{ background: 'var(--slate)' }}>
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Tags</label>
                <input className="input-field" placeholder="maths, grade 3, counting" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>XP Reward</label>
                <input className="input-field" type="number" min="0" max="500" placeholder="150" value={xpReward} onChange={(e) => setXpReward(e.target.value)} />
              </div>
            </div>

            {/* Thumbnail upload */}
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Video thumbnail</label>
              <p className="text-xs mb-2" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>Small 16:9 thumbnail shown in video cards</p>
              <div className="flex gap-3 items-center">
                {thumbnailPreview && (
                  <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: '128px', height: '72px', border: '2px solid var(--joy-orange)' }}>
                    <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>
                )}
                <div onClick={() => thumbRef.current?.click()} className="flex flex-col items-center justify-center rounded-xl cursor-pointer flex-shrink-0"
                  style={{ width: '128px', height: '72px', border: '2px dashed var(--hairline)', background: 'var(--slate)' }}>
                  <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbnailFile(f) }} />
                  <span className="text-xl" style={{ color: 'var(--grey)' }}>+</span>
                  <span className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{thumbnailFile ? 'Change' : 'Upload'}</span>
                </div>
              </div>
            </div>

            {/* Cover image upload */}
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Cover image</label>
              <p className="text-xs mb-2" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>Wide 16:9 banner shown on home page hero</p>
              <div className="flex gap-3 items-center">
                {coverPreview && (
                  <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: '160px', height: '90px', border: '2px solid var(--joy-orange)' }}>
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                )}
                <div onClick={() => coverRef.current?.click()} className="flex flex-col items-center justify-center rounded-xl cursor-pointer flex-shrink-0"
                  style={{ width: '160px', height: '90px', border: '2px dashed var(--hairline)', background: 'var(--slate)' }}>
                  <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverFile(f) }} />
                  <span className="text-xl" style={{ color: 'var(--grey)' }}>+</span>
                  <span className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{coverFile ? 'Change' : 'Upload custom'}</span>
                </div>
              </div>
            </div>

            {/* Series toggle */}
            <div className="p-4 rounded-2xl" style={{ background: 'var(--slate)', border: '1px solid var(--hairline)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold" style={{ fontFamily: 'Nunito', color: 'var(--snow)' }}>Part of a series?</p>
                  <p className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>Group this video with other episodes</p>
                </div>
                <button onClick={() => setIsSeries(!isSeries)} style={{ width: '44px', height: '24px', background: isSeries ? 'var(--brand-gradient)' : 'var(--hairline)', borderRadius: '999px', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ position: 'absolute', top: '3px', left: isSeries ? '23px' : '3px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
                </button>
              </div>
              {isSeries && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="col-span-3">
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Series name</label>
                    <input className="input-field" style={{ background: 'var(--charcoal)' }} placeholder="e.g. Counting with Zola" value={seriesName} onChange={(e) => setSeriesName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Episode #</label>
                    <input className="input-field" style={{ background: 'var(--charcoal)' }} type="number" min="1" placeholder="1" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Total episodes</label>
                    <input className="input-field" style={{ background: 'var(--charcoal)' }} type="number" min="1" placeholder="10" value={totalEpisodes} onChange={(e) => setTotalEpisodes(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Audience */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Baloo 2' }}>Audience (required)</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>This setting affects content moderation and monetization.</p>
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
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Age band</label>
                  <select className="input-field" value={ageBand} onChange={(e) => setAgeBand(e.target.value)} style={{ background: 'var(--charcoal)' }}>
                    <option value="">Select</option>
                    <option>Preschool (2–4)</option><option>Younger (5–8)</option><option>Older (9–12)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>FPB rating</label>
                  <select className="input-field" value={fpb} onChange={(e) => setFpb(e.target.value)} style={{ background: 'var(--charcoal)' }}>
                    <option value="">Select</option>
                    {['A', 'PG', '7–9PG', '10–12PG', '13', '16', '18'].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--silver)', fontFamily: 'Nunito' }}>Grade level</label>
                <select className="input-field" value={grade} onChange={(e) => setGrade(e.target.value)} style={{ background: 'var(--charcoal)' }}>
                  <option value="">Select grade</option>
                  {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4 — Publish */}
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
          <div className="p-5 rounded-2xl" style={{ background: 'var(--slate)', border: '1px solid var(--hairline)' }}>
            <h3 className="text-sm font-bold mb-3" style={{ fontFamily: 'Baloo 2' }}>Review summary</h3>
            {[
              { label: 'Title', val: title || '—' },
              { label: 'Subject', val: subject || '—' },
              { label: 'Language', val: language },
              { label: 'XP Reward', val: xpReward ? `${xpReward} XP` : '—' },
              { label: 'Audience', val: audience === 'kids' ? 'Made for Kids' : audience === 'general' ? 'General' : '18+ Restricted' },
              ...(audience === 'kids' ? [{ label: 'Age band', val: ageBand || '—' }, { label: 'Grade', val: grade || '—' }] : []),
              { label: 'Visibility', val: visibility.charAt(0).toUpperCase() + visibility.slice(1) },
              { label: 'Video file', val: videoFile?.name || '—' },
              { label: 'Thumbnail', val: thumbnailFile?.name || 'None' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--hairline)' }}>
                <span className="text-sm" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{item.label}</span>
                <span className="text-sm font-semibold" style={{ fontFamily: 'Nunito', color: 'var(--snow)', textAlign: 'right', maxWidth: '60%' }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 5 — Review status */}
      {step === 5 && (
        <div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Baloo 2' }}>
            {submitting ? 'Uploading…' : submitted ? 'Submitted for review' : 'Processing & review'}
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
            {submitted ? "Your video is in the admin review queue. We'll notify you when it's published." : "Uploading your video to Joviqo…"}
          </p>

          {submitting && (
            <div className="card p-8 text-center">
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
                      {stage.done ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="#56B44A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        : stage.active ? <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                        : <div className="w-2 h-2 rounded-full" style={{ background: 'var(--grey)' }} />}
                    </div>
                    <p className="text-sm font-bold" style={{ fontFamily: 'Nunito', color: stage.done ? '#56B44A' : stage.active ? 'var(--snow)' : 'var(--grey)' }}>{stage.label}</p>
                    {stage.done && <span className="status-chip text-xs" style={{ background: 'rgba(86,180,74,0.15)', color: '#56B44A', fontSize: '11px' }}>Done</span>}
                    {stage.active && <span className="status-chip text-xs" style={{ background: 'rgba(255,138,0,0.15)', color: 'var(--joy-orange)', fontSize: '11px' }}>Pending</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      {step < 5 && (
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button className="btn-ghost px-6 py-2.5 text-sm" onClick={() => setStep((s) => (s - 1) as Step)}>← Back</button>
          ) : <div />}
          <button className="btn-gradient px-6 py-2.5 text-sm" onClick={handleNext} disabled={!canNext() || submitting}
            style={{ opacity: canNext() && !submitting ? 1 : 0.4, cursor: canNext() && !submitting ? 'pointer' : 'not-allowed' }}>
            {step === 4 ? 'Submit for review →' : 'Continue →'}
          </button>
        </div>
      )}
      {step === 5 && submitted && (
        <div className="flex justify-end mt-8">
          <button className="btn-ghost px-6 py-2.5 text-sm" onClick={() => { setStep(1); setVideoFile(null); setTitle(''); setSubmitted(false); setVideoUrl(''); setThumbnailUrl(''); }}>Upload another video</button>
        </div>
      )}
    </div>
  )
}
