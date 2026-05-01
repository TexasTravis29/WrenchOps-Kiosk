'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { login, saveSession, getSession } from '../lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (session) routeByRole(session.role)
  }, [])

  const routeByRole = (role: string) => {
    if (role === 'kiosk') router.push('/kiosk')
    else if (role === 'staff') router.push('/staff/dashboard')
    else if (role === 'admin') router.push('/admin/dashboard')
    else if (role === 'superadmin') router.push('/superadmin/dashboard')
  }

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return
    setLoading(true)
    setError('')
    const user = await login(username, password)
    if (!user) {
      setError('Incorrect username or password')
      setPassword('')
      setLoading(false)
      return
    }
    saveSession(user)
    routeByRole(user.role)
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
      <Image
        src="/wrenchops_logo_trans.png"
        alt="WrenchOps"
        width={320}
        height={140}
        priority
        style={{ marginBottom: '40px', objectFit: 'contain' }}
      />

      <h1 style={{ color: '#18181b', fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>
        Welcome back
      </h1>
      <p style={{ color: '#71717a', fontSize: '1rem', marginBottom: '40px' }}>
        Sign in to continue
      </p>

      <div style={{ width: '100%', maxWidth: '360px' }}>
        <input
          autoFocus
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => { setUsername(e.target.value); setError('') }}
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
            boxSizing: 'border-box',
            marginBottom: '12px',
          }}
        />
        <input
          type="password"
          placeholder="Password"
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
            boxSizing: 'border-box',
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
          disabled={loading}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '12px',
            background: pressed ? '#c42d0f' : '#e03b1f',
            color: 'white',
            border: 'none',
            fontSize: '1.1rem',
            fontWeight: '800',
            cursor: loading ? 'not-allowed' : 'pointer',
            transform: pressed ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 0.1s ease',
            opacity: loading ? 0.7 : 1,
            marginBottom: '24px',
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {/* Signup link */}
        <p style={{ textAlign: 'center', color: '#71717a', fontSize: '0.95rem', margin: 0 }}>
          Don't have an account?{' '}
          <a
            href="/signup"
            style={{
              color: '#e03b1f',
              fontWeight: '700',
              textDecoration: 'none',
            }}
          >
            Get started now!
          </a>
        </p>
      </div>
    </div>
  )
}