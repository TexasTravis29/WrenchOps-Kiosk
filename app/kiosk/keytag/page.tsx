'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function KeyTag() {
  const router = useRouter()
  const [keyTag, setKeyTag] = useState('')
  const [pressed, setPressed] = useState<string | null>(null)

  const handleKey = (val: string) => {
    if (val === 'delete') {
      setKeyTag(prev => prev.slice(0, -1))
    } else if (keyTag.length < 10) {
      setKeyTag(prev => prev + val)
    }
  }

  const handleContinue = () => {
    localStorage.setItem('checkin_keytag', keyTag)
    router.push('/kiosk/confirm')
  }

  const keys = ['1','2','3','4','5','6','7','8','9','0','delete']

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
    }}>
      <h1 style={{ color: '#18181b', fontSize: '2.4rem', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>
        Tag your key
      </h1>
      <p style={{ color: '#71717a', fontSize: '1.1rem', marginBottom: '8px', textAlign: 'center' }}>
        Enter the number on your key tag, then drop your key in the box
      </p>
      <p style={{ color: '#a1a1aa', fontSize: '0.95rem', marginBottom: '40px', textAlign: 'center' }}>
        Skip this step if you're keeping your key
      </p>

      {/* Display */}
      <div style={{
        width: '280px',
        padding: '20px',
        background: '#ffffff',
        border: '0.5px solid #e4e4e7',
        borderRadius: '16px',
        textAlign: 'center',
        fontSize: '3rem',
        fontWeight: '800',
        color: keyTag ? '#18181b' : '#e4e4e7',
        letterSpacing: '8px',
        marginBottom: '32px',
        minHeight: '90px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {keyTag || '—'}
      </div>

      {/* Number Pad */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        width: '280px',
        marginBottom: '32px',
      }}>
        {['1','2','3','4','5','6','7','8','9','','0','delete'].map((val, i) => {
          if (val === '') return <div key={`empty-${i}`} />
          const isDelete = val === 'delete'
          const isPressed = pressed === val
          return (
            <button
            key={`key-${val}`}
            onMouseDown={() => setPressed(val)}
            onMouseUp={() => { setPressed(null); handleKey(val) }}
            onMouseLeave={() => setPressed(null)}
            onTouchStart={() => setPressed(val)}
            onTouchEnd={() => { setPressed(null); handleKey(val) }}
            style={{
                height: '72px',
                borderRadius: '12px',
                border: '0.5px solid #e4e4e7',
                background: isPressed ? '#e4e4e7' : '#ffffff',
                color: isDelete ? '#e03b1f' : '#18181b',
                fontSize: isDelete ? '1rem' : '1.6rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
                transform: isPressed ? 'scale(0.94)' : 'scale(1)',
      }}
    >
      {isDelete ? '⌫' : val}
    </button>
  )
})}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={handleContinue}
          disabled={keyTag.length === 0}
          style={{
            padding: '18px 48px',
            borderRadius: '16px',
            background: keyTag.length > 0 ? '#e03b1f' : '#e4e4e7',
            color: keyTag.length > 0 ? 'white' : '#a1a1aa',
            border: 'none',
            fontSize: '1.2rem',
            fontWeight: '800',
            cursor: keyTag.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
          }}
        >
          Continue →
        </button>

        <button
          onClick={() => {
            localStorage.setItem('checkin_keytag', '')
            router.push('/kiosk/confirm')
          }}
          style={{
            padding: '18px 48px',
            borderRadius: '16px',
            background: 'none',
            border: '0.5px solid #e4e4e7',
            color: '#71717a',
            fontSize: '1.2rem',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Skip
        </button>
      </div>

      <button
        onClick={() => router.push('/kiosk/upsell')}
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