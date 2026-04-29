'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewCustomer() {
  const router = useRouter()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.first_name.trim()) e.first_name = 'First name is required'
    if (!form.last_name.trim()) e.last_name = 'Last name is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    return e
  }

  const handleContinue = () => {
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    localStorage.setItem('checkin_customer', JSON.stringify({
      ...form,
      id: null,
      is_new_customer: true,
    }))
    router.push('/kiosk/service')
  }

  const inputStyle = (field: string) => ({
    width: '100%',
    padding: '18px 20px',
    fontSize: '1.1rem',
    borderRadius: '12px',
    border: errors[field] ? '1.5px solid #e03b1f' : '0.5px solid #e4e4e7',
    background: '#ffffff',
    color: '#18181b',
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: '4px',
  })

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
      padding: '48px 40px',
      overflowY: 'auto',
    }}>
      <h1 style={{ color: '#18181b', fontSize: '2.4rem', fontWeight: '800', marginBottom: '8px' }}>
        Welcome! Let's get you set up
      </h1>
      <p style={{ color: '#71717a', fontSize: '1.1rem', marginBottom: '40px' }}>
        Just a few quick details
      </p>

      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <input
              autoFocus
              type="text"
              placeholder="First name"
              value={form.first_name}
              onChange={e => update('first_name', e.target.value)}
              style={inputStyle('first_name')}
            />
            {errors.first_name && (
              <p style={{ color: '#e03b1f', fontSize: '0.85rem', margin: '0 0 8px' }}>{errors.first_name}</p>
            )}
          </div>
          <div>
            <input
              type="text"
              placeholder="Last name"
              value={form.last_name}
              onChange={e => update('last_name', e.target.value)}
              style={inputStyle('last_name')}
            />
            {errors.last_name && (
              <p style={{ color: '#e03b1f', fontSize: '0.85rem', margin: '0 0 8px' }}>{errors.last_name}</p>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <input
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={e => update('phone', e.target.value)}
            style={inputStyle('phone')}
          />
          {errors.phone && (
            <p style={{ color: '#e03b1f', fontSize: '0.85rem', margin: '0 0 8px' }}>{errors.phone}</p>
          )}
        </div>

        <div style={{ marginBottom: '32px' }}>
          <input
            type="email"
            placeholder="Email address (optional)"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            style={inputStyle('email')}
          />
        </div>

        <button
          onClick={handleContinue}
          style={{
            width: '100%',
            padding: '20px',
            borderRadius: '16px',
            background: '#e03b1f',
            color: 'white',
            border: 'none',
            fontSize: '1.3rem',
            fontWeight: '800',
            cursor: 'pointer',
          }}
        >
          Continue →
        </button>
      </div>

      <button
        onClick={() => router.push('/kiosk')}
        style={{
          marginTop: '32px',
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