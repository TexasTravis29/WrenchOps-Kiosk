'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const ADMIN_PASSWORD = 'admin123'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pressed, setPressed] = useState(false)

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('admin_auth', 'true')
      router.push('/admin/dashboard')
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: '#f4f4f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
    }}>
      <h1 style={{ color: '#18181b', fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>
        Admin Login
      </h1>
      <p style={{ color: '#71717a', fontSize: '1rem', marginBottom: '40px' }}>
        Shop administrator access only
      </p>

      <div style={{ width: '100%', maxWidth: '360px' }}>
        <input
          autoFocus
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%',
            padding: '18px 20px',
            fontSize: '1.1rem',
            borderRadius: '12px',
            border: error ? '1.5px solid #e03b1f' : '0.5px solid #e4e4e7',
            background: '#ffffff',
            color: '#18181b',
            outline: 'none',
            boxSizing: 'border-box' as const,
            marginBottom: '8px',
          }}
        />
        {error && (
          <p style={{ color: '#e03b1f', fontSize: '0.9rem', marginBottom: '16px' }}>{error}</p>
        )}

        <button
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '12px',
            background: pressed ? '#c42d0f' : '#e03b1f',
            color: 'white',
            border: 'none',
            fontSize: '1.1rem',
            fontWeight: '800',
            cursor: 'pointer',
            transform: pressed ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.1s ease',
          }}
        >
          Sign In
        </button>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '32px',
        display: 'flex',
        gap: '24px',
      }}>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '0.9rem', cursor: 'pointer' }}
        >
          ← Kiosk
        </button>
        <button
          onClick={() => router.push('/staff')}
          style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '0.9rem', cursor: 'pointer' }}
        >
          Staff →
        </button>
      </div>
    </div>
  )
}