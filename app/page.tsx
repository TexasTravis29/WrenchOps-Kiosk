'use client'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [pressed, setPressed] = useState(false)
  const router = useRouter()

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
    }}>

      <Image
        src="/wrenchops_logo_trans.png"
        alt="WrenchOps"
        width={500}
        height={300}
        priority
        style={{ marginBottom: '60px' }}
      />

      <h1 style={{
        fontSize: '3.5rem',
        fontWeight: '800',
        color: 'black',
        marginBottom: '50px',
        letterSpacing: '-1px',
      }}>
        Welcome to Our Shop
      </h1>

      <p style={{
        fontSize: '1.3rem',
        color: '#a0aec0',
        marginBottom: '30px',
      }}>
        Tap below to get started
      </p>

      <button
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => { setPressed(false); router.push('/kiosk') }}
        onClick={() => router.push('/kiosk')}
        style={{
          padding: '28px 80px',
          borderRadius: '20px',
          fontSize: '2rem',
          fontWeight: '800',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #e03b1f, #c42d0f)',
          boxShadow: pressed
            ? '0 5px 20px rgba(224, 59, 31, 0.3)'
            : '0 20px 60px rgba(224, 59, 31, 0.4)',
          transform: pressed ? 'scale(0.96) translateY(4px)' : 'scale(1) translateY(0px)',
          transition: 'all 0.15s ease',
          letterSpacing: '1px',
        }}
      >
        Check In
      </button>

      <p style={{
        position: 'absolute',
        bottom: '24px',
        fontSize: '0.85rem',
        color: '#4a5568',
      }}>
        Powered by WrenchOps
      </p>

    </div>
  )
}