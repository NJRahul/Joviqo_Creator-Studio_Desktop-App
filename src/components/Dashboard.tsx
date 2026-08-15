import { useState, useEffect, useRef } from 'react'
import logo from '../imports/Joviqo_logo_4X_White_Fill.png'
import mascot from '../imports/Mascot.png'
import { supabase } from '../supabase'
import DashboardHome from './screens/DashboardHome'
import UploadFlow from './screens/UploadFlow'
import ContentLibrary from './screens/ContentLibrary'
import Analytics from './screens/Analytics'
import Earnings from './screens/Earnings'

interface CreatorProfile {
  id: string
  email: string
  channel_name: string | null
  handle: string | null
}

interface AppNotification {
  id: string
  type: string
  title: string
  message: string | null
  content_id: string | null
  is_read: boolean
  created_at: string
}

type NavItem = {
  id: string
  label: string
  icon: React.ReactNode
}

type Screen =
  | 'dashboard'
  | 'content'
  | 'paths'
  | 'comments'
  | 'analytics'
  | 'earnings'
  | 'channel'
  | 'policy'
  | 'settings'

const NAV: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
        <rect x="1" y="1" width="7" height="7" rx="2" opacity="0.9" />
        <rect x="10" y="1" width="7" height="7" rx="2" opacity="0.5" />
        <rect x="1" y="10" width="7" height="7" rx="2" opacity="0.5" />
        <rect x="10" y="10" width="7" height="7" rx="2" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: 'content',
    label: 'Content',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="2" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 6.5l5 2.5-5 2.5V6.5z" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'paths',
    label: 'Learning Paths',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 14 Q6 10 9 10 Q12 10 15 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="3" cy="14" r="2" fill="currentColor" />
        <circle cx="9" cy="10" r="2" fill="currentColor" opacity="0.6" />
        <circle cx="15" cy="6" r="2" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    id: 'comments',
    label: 'Comments',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 3h14a1 1 0 011 1v8a1 1 0 01-1 1H6l-4 3V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 14 L5 10 L9 12 L13 6 L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'earnings',
    label: 'Earnings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 5v1m0 6v1M6.5 7.5A2 2 0 019 6a2 2 0 012 2c0 1.5-2 2-2 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'channel',
    label: 'Channel',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'policy',
    label: 'Policy & Strikes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2L2 5v5c0 4.4 3 7.7 7 8.9C13 17.7 16 14.4 16 10V5L9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M3.2 14.8l1.4-1.4M13.4 4.6l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function Dashboard({ onLogout }: { onLogout?: () => void }) {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [showUpload, setShowUpload] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const notifChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('users').select('id, email, channel_name, handle').eq('id', user.id).single()
      if (data) setCreator({ id: data.id, email: data.email ?? user.email ?? '', channel_name: data.channel_name, handle: data.handle })

      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setNotifications(notifs ?? [])

      notifChannelRef.current = supabase
        .channel(`creator-notifs-${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => setNotifications((prev) => [payload.new as AppNotification, ...prev]))
        .subscribe()
    })
    return () => { if (notifChannelRef.current) supabase.removeChannel(notifChannelRef.current) }
  }, [])

  const displayName = creator?.channel_name ?? creator?.handle ?? '…'
  const avatarLetter = displayName[0]?.toUpperCase() ?? '?'

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard': return <DashboardHome userId={creator?.id ?? ''} channelName={creator?.channel_name ?? null} />
      case 'content':
        return showUpload
          ? <UploadFlow onBack={() => setShowUpload(false)} />
          : <ContentLibrary userId={creator?.id ?? ''} onUpload={() => setShowUpload(true)} />
      case 'analytics': return <Analytics />
      case 'earnings': return <Earnings />
      default: return <PlaceholderScreen name={NAV.find((n) => n.id === screen)?.label ?? screen} />
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--void)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-300"
        style={{
          width: collapsed ? '64px' : '260px',
          background: 'var(--charcoal)',
          borderRight: '1px solid var(--hairline)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: '1px solid var(--hairline)', minHeight: '68px', justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          {collapsed ? (
            <img src={mascot} alt="Jovi" style={{ width: '36px', height: '36px', objectFit: 'contain', flexShrink: 0 }} />
          ) : (
            <>
              <img src={logo} alt="Joviqo" className="flex-shrink-0" style={{ height: '28px', width: 'auto' }} />
              <div>
                <span className="text-xs font-bold uppercase tracking-widest block" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
                  Creator Studio
                </span>
                <div className="w-16 h-0.5 rounded-full mt-1" style={{ background: 'var(--brand-gradient)' }} />
              </div>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => { setScreen(item.id as Screen); setShowUpload(false) }}
              className={`sidebar-item w-full text-left ${screen === item.id ? 'active' : ''}`}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0" style={{ color: screen === item.id ? 'var(--snow)' : 'inherit' }}>
                {item.icon}
              </span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3" style={{ borderTop: '1px solid var(--hairline)' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-item w-full"
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              style={{ transition: 'transform 0.3s', transform: collapsed ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Collapse sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-6 py-0 flex-shrink-0"
          style={{
            background: 'var(--charcoal)',
            borderBottom: '1px solid var(--hairline)',
            height: '68px',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          {/* Channel switcher */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer"
            style={{ background: 'var(--slate)', border: '1px solid var(--hairline)' }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--brand-gradient)', color: 'white', fontFamily: 'Nunito' }}
            >
              {avatarLetter}
            </div>
            <span className="text-sm font-semibold" style={{ fontFamily: 'Nunito' }}>
              {displayName}
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="#6E6E7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-sm relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--grey)' }}
            >
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              className="input-field py-2 text-sm pl-9"
              style={{ borderRadius: '999px', background: 'var(--slate)' }}
              placeholder="Search creator tools..."
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
                className="w-9 h-9 rounded-xl flex items-center justify-center relative"
                style={{ background: 'var(--slate)', border: '1px solid var(--hairline)', cursor: 'pointer' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2a5 5 0 00-5 5v3l-1.5 2h13L14 10V7a5 5 0 00-5-5z" stroke="#B3B3BE" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M7.5 14a1.5 1.5 0 003 0" stroke="#B3B3BE" strokeWidth="1.5" />
                </svg>
                {notifications.filter((n) => !n.is_read).length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#E63E54', color: 'white', fontFamily: 'Nunito', fontSize: '9px', fontWeight: 700 }}>
                    {notifications.filter((n) => !n.is_read).length > 9 ? '9+' : notifications.filter((n) => !n.is_read).length}
                  </div>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden z-30" style={{ background: 'var(--slate)', border: '1px solid var(--hairline)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', maxHeight: '400px', overflowY: 'auto' }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--hairline)', position: 'sticky', top: 0, background: 'var(--slate)' }}>
                    <span className="text-sm font-bold" style={{ fontFamily: 'Baloo 2' }}>Notifications</span>
                    {notifications.some((n) => !n.is_read) && (
                      <span className="text-xs" style={{ color: 'var(--joy-orange)', fontFamily: 'Nunito', cursor: 'pointer' }}
                        onClick={async () => {
                          if (!creator) return
                          await supabase.from('notifications').update({ is_read: true }).eq('user_id', creator.id).eq('is_read', false)
                          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
                        }}>Mark all read</span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center" style={{ color: 'var(--grey)', fontFamily: 'Nunito', fontSize: '13px' }}>No notifications yet</div>
                  ) : notifications.map((n) => {
                    const icon = n.type === 'approved' ? '✅' : n.type === 'rejected' ? '❌' : n.type === 'changes_requested' ? '✏️' : '🔔'
                    const timeAgo = (() => { const diff = Date.now() - new Date(n.created_at).getTime(); const h = Math.floor(diff / 3600000); return h < 1 ? 'Just now' : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago` })()
                    return (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3"
                        style={{ background: n.is_read ? 'transparent' : 'rgba(255,138,0,0.05)', borderBottom: '1px solid var(--hairline)', cursor: 'pointer' }}
                        onClick={async () => {
                          if (!n.is_read) {
                            await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
                            setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x))
                          }
                        }}>
                        <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ fontFamily: 'Nunito', color: 'var(--snow)' }}>{n.title}</p>
                          {n.message && <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{n.message}</p>}
                          <p className="text-xs mt-1" style={{ color: 'var(--grey)', fontFamily: 'Nunito', opacity: 0.7 }}>{timeAgo}</p>
                        </div>
                        {!n.is_read && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--joy-orange)', flexShrink: 0, marginTop: '6px' }} />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer"
                style={{ background: 'var(--slate)', border: '1px solid var(--hairline)' }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'var(--brand-gradient)', color: 'white', fontFamily: 'Nunito' }}
                >
                  {avatarLetter}
                </div>
                <span className="text-sm font-semibold" style={{ fontFamily: 'Nunito' }}>{displayName}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="#6E6E7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {profileOpen && (
                <div
                  className="absolute right-0 top-12 w-52 rounded-2xl overflow-hidden z-30 py-1"
                  style={{ background: 'var(--slate)', border: '1px solid var(--hairline)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--hairline)' }}>
                    <p className="text-sm font-bold" style={{ fontFamily: 'Nunito' }}>{displayName}</p>
                    <p className="text-xs" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>{creator?.email ?? ''}</p>
                  </div>
                  {[
                    { label: 'Channel settings', action: () => setScreen('channel') },
                    { label: 'Account settings', action: () => setScreen('settings') },
                    { label: 'Sign out', action: () => { setProfileOpen(false); onLogout?.() } },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setProfileOpen(false) }}
                      className="w-full px-4 py-2.5 text-left text-sm font-semibold"
                      style={{ color: item.label === 'Sign out' ? '#E63E54' : 'var(--silver)', fontFamily: 'Nunito', background: 'none', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--charcoal)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content area */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: '32px 40px' }}
          onClick={() => { setNotifOpen(false); setProfileOpen(false) }}
        >
          <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
            {renderScreen()}
          </div>
        </main>
      </div>
    </div>
  )
}

function PlaceholderScreen({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
      {/* Jovi mascot */}
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'var(--slate)' }}
      >
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <defs>
            <linearGradient id="joviGradP" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF8A00" />
              <stop offset="50%" stopColor="#56B44A" />
              <stop offset="100%" stopColor="#1E88C7" />
            </linearGradient>
          </defs>
          <rect x="8" y="16" width="40" height="32" rx="8" fill="none" stroke="url(#joviGradP)" strokeWidth="3" />
          <line x1="28" y1="16" x2="28" y2="6" stroke="url(#joviGradP)" strokeWidth="2.5" />
          <circle cx="28" cy="4" r="3" fill="#FFC20E" />
          <circle cx="21" cy="30" r="2.5" fill="#FFC20E" />
          <path d="M21 37 Q28 42 35 37" stroke="#FFC20E" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M33 28 Q36 26 38 28" stroke="#FFC20E" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Baloo 2' }}>
        {name}
      </h2>
      <p className="text-sm" style={{ color: 'var(--grey)', fontFamily: 'Nunito' }}>
        This section is coming soon. Check back later!
      </p>
    </div>
  )
}
