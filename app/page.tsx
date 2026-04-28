'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function Home() {
  const [pressed, setPressed] = useState(false)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #2d3748 0%, #3d4f63 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      
      {/* Logo */}
      <Image
        src="/wrenchops_logo_trans.png"
        alt="WrenchOps"
        width={420}
        height={200}
        priority
        style={{ marginBottom: '40px' }}
      />

      {/* Welcome Text */}
      <h1 style={{
        fontSize: '3.5rem',
        fontWeight: '800',
        color: 'white',
        marginBottom: '12px',
        letterSpacing: '-1px',
      }}>
        Welcome to Our Shop
      </h1>

      <p style={{
        fontSize: '1.3rem',
        color: '#a0aec0',
        marginBottom: '60px',
      }}>
        Tap below to get started with your check-in
      </p>

      {/* Main Button */}
      <button
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
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

      {/* Footer */}
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