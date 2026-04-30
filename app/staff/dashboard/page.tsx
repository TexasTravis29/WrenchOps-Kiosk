'use client'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { getSession, clearSession } from '../../../lib/auth'
import { useState, useEffect, useCallback, useRef } from 'react'

type Checkin = {
  id: string
  customer_name: string
  phone: string
  is_new_customer: boolean
  services: any[]
  key_tag_number: string
  status: string
  created_at: string
  staff_notes: string
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fef9c3', color: '#854d0e' },
  in_progress: { bg: '#dbeafe', color: '#1e40af' },
  ready: { bg: '#dcfce7', color: '#166534' },
  complete: { bg: '#f4f4f5', color: '#71717a' },
}

export default function StaffDashboard() {
  const router = useRouter()
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const knownIdsRef = useRef<Set<string>>(new Set())
  const isFirstLoadRef = useRef(true)

  const playChaChing = () => {
    try {
      const ctx = new AudioContext()

      const playTone = (freq: number, start: number, duration: number, gain: number) => {
        const osc = ctx.createOscillator()
        const gainNode = ctx.createGain()
        osc.connect(gainNode)
        gainNode.connect(ctx.destination)
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
        gainNode.gain.setValueAtTime(0, ctx.currentTime + start)
        gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
        osc.start(ctx.currentTime + start)
        osc.stop(ctx.currentTime + start + duration)
      }

      // Cha — lower strike
      playTone(987, 0, 0.18, 0.4)
      playTone(1318, 0, 0.18, 0.3)
      // Ching — higher ring
      playTone(1760, 0.12, 0.5, 0.35)
      playTone(2093, 0.12, 0.5, 0.25)
    } catch (e) {
      // AudioContext blocked (no user interaction yet) — silent fail
    }
  }

  const load = useCallback(async () => {
    let query = supabase
      .from('checkins')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter !== 'all') query = query.eq('status', filter)

    const { data } = await query
    const fetched = data || []

    // Detect new pending checkins after first load
    if (isFirstLoadRef.current) {
      fetched.forEach(c => knownIdsRef.current.add(c.id))
      isFirstLoadRef.current = false
    } else {
      let hasNew = false
      fetched.forEach(c => {
        if (c.status === 'pending' && !knownIdsRef.current.has(c.id)) {
          hasNew = true
        }
        knownIdsRef.current.add(c.id)
      })
      if (hasNew) playChaChing()
    }

    setCheckins(fetched)
    setLoading(false)
  }, [filter])

  useEffect(() => {
    const session = getSession()
    if (!session || session.role !== 'staff') {
      router.push('/')
      return
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load, router])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('checkins').update({ status }).eq('id', id)
    load()
  }

  const saveNotes = async (id: string) => {
    await supabase.from('checkins').update({ staff_notes: notes[id] }).eq('id', id)
    load()
  }

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const statuses = ['pending', 'in_progress', 'ready', 'complete']

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f4f4f5',
      fontFamily: 'sans-serif',
    }}>

      {/* Header */}
      <div style={{
        background: '#ffffff',
        borderBottom: '0.5px solid #e4e4e7',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ color: '#18181b', fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>
            Check-In Dashboard
          </h1>
          <p style={{ color: '#71717a', fontSize: '0.85rem', margin: '2px 0 0' }}>
            Auto-refreshes every 30 seconds
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={load}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '0.5px solid #e4e4e7',
              background: '#ffffff',
              color: '#18181b',
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => { clearSession(); router.push('/') }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'none',
              color: '#a1a1aa',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        padding: '16px 32px',
        display: 'flex',
        gap: '8px',
        borderBottom: '0.5px solid #e4e4e7',
        background: '#ffffff',
      }}>
        {['all', ...statuses].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              background: filter === s ? '#18181b' : '#f4f4f5',
              color: filter === s ? '#ffffff' : '#71717a',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Checkins list */}
      <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <p style={{ color: '#71717a' }}>Loading...</p>
        ) : checkins.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: '#a1a1aa',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
            <p style={{ fontSize: '1.1rem' }}>No check-ins yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {checkins.map(c => {
              const colors = STATUS_COLORS[c.status] || STATUS_COLORS.pending
              const isExpanded = expanded === c.id
              return (
                <div
                  key={c.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '0.5px solid #e4e4e7',
                    overflow: 'hidden',
                  }}
                >
                  {/* Row */}
                  <div
                    onClick={() => setExpanded(isExpanded ? null : c.id)}
                    style={{
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Time */}
                    <div style={{ minWidth: '60px', color: '#71717a', fontSize: '0.85rem', fontWeight: '600' }}>
                      {formatTime(c.created_at)}
                    </div>

                    {/* Name */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', color: '#18181b', fontSize: '1rem' }}>
                          {c.customer_name || 'Unknown'}
                        </span>
                        {c.is_new_customer && (
                          <span style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '10px',
                          }}>NEW</span>
                        )}
                      </div>
                      <div style={{ color: '#71717a', fontSize: '0.85rem', marginTop: '2px' }}>
                        {c.services?.map((s: any) => s.name).join(', ') || 'No services'}
                      </div>
                    </div>

                    {/* Key tag */}
                    {c.key_tag_number && (
                      <div style={{
                        background: '#f4f4f5',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: '#18181b',
                      }}>
                        🔑 {c.key_tag_number}
                      </div>
                    )}

                    {/* Status badge */}
                    <div style={{
                      background: colors.bg,
                      color: colors.color,
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      textTransform: 'capitalize',
                      whiteSpace: 'nowrap',
                    }}>
                      {c.status === 'in_progress' ? 'In Progress' : c.status}
                    </div>

                    <div style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{
                      borderTop: '0.5px solid #f4f4f5',
                      padding: '20px 24px',
                      background: '#fafafa',
                    }}>
                      {/* Services detail */}
                      <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#a1a1aa', marginBottom: '8px', letterSpacing: '0.5px' }}>
                        SERVICES
                      </p>
                      <div style={{ marginBottom: '16px' }}>
                        {c.services?.map((s: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.95rem' }}>
                            <span style={{ color: '#18181b' }}>{s.name}</span>
                            <span style={{ color: '#71717a' }}>{s.price_display}</span>
                          </div>
                        ))}
                      </div>

                      {/* Staff notes */}
                      <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#a1a1aa', marginBottom: '8px', letterSpacing: '0.5px' }}>
                        STAFF NOTES
                      </p>
                      <textarea
                        placeholder="Add internal notes..."
                        value={notes[c.id] ?? c.staff_notes ?? ''}
                        onChange={e => setNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '0.5px solid #e4e4e7',
                          background: '#ffffff',
                          color: '#18181b',
                          fontSize: '0.95rem',
                          resize: 'vertical',
                          minHeight: '80px',
                          boxSizing: 'border-box',
                          marginBottom: '12px',
                          outline: 'none',
                          fontFamily: 'sans-serif',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => saveNotes(c.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: '#18181b',
                            color: 'white',
                            border: 'none',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          Save Notes
                        </button>

                        {/* Status buttons */}
                        {statuses.filter(s => s !== c.status).map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(c.id, s)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: '0.5px solid #e4e4e7',
                              background: '#ffffff',
                              color: '#18181b',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              textTransform: 'capitalize',
                            }}
                          >
                            → {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}