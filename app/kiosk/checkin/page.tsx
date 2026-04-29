'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getSession, clearSession } from '../../../lib/auth'

export default function KioskStart() {
  const router = useRouter()
  const [pressed, setPressed] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session || session.role !== 'kiosk') {
      router.push('/')
    }
  }, [router])

  const btn = (label: string, sub: string, key: string, route: string, emoji: string) => (
    <button
      onMouseDown={() => setPressed(key)}
      onMouseUp={() => setPressed(null)}
      onMouseLeave={() => setPressed(null)}
      onTouchStart={() => setPressed(key)}
      onTouchEnd={() => { setPressed(null); router.push(route) }}
      onClick={() => router.push(route)}
      style={{
        width: '340px',
        padding: '40px 32px',
        borderRadius: '24px',
        border: '0.5px solid #e4e4e7',
        background: pressed === key ? 'rgba(224,59,31,0.08)' : '#ffffff',
        color: '#18181b',
        cursor: 'pointer',
        transform: pressed === key ? 'scale(0.96)' : 'scale(1)',
        transition: 'all 0.15s ease',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{emoji}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '1rem', color: '#71717a' }}>{sub}</div>
    </button>
  )

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#f4f4f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
    }}>

      {/* Sign Out — top right, subtle */}
      <button
        onClick={() => { clearSession(); router.push('/') }}
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          background: 'none',
          border: '0.5px solid #e4e4e7',
          color: '#a1a1aa',
          fontSize: '0.85rem',
          fontWeight: '600',
          cursor: 'pointer',
          padding: '8px 16px',
          borderRadius: '10px',
        }}
      >
        Sign Out
      </button>

      <h1 style={{ color: '#18181b', fontSize: '2.4rem', fontWeight: '800', marginBottom: '8px' }}>
        Have you been here before?
      </h1>
      <p style={{ color: '#71717a', fontSize: '1.2rem', marginBottom: '40px' }}>
        Select one to get started
      </p>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {btn('Returning Customer', "I've visited before", 'returning', '/kiosk/returning', '👋')}
        {btn('New Customer', 'First time here', 'new', '/kiosk/new', '✨')}
      </div>

      {/* Back button */}
      <button
        onClick={() => router.push('/kiosk')}
        style={{
          marginTop: '48px',
          background: 'none',
          border: 'none',
          color: '#a1a1aa',
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        ← Back
      </button>

    </div>
  )
}