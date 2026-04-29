'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

export default function Confirm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [customer, setCustomer] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [upsells, setUpsells] = useState<any[]>([])
  const [keyTag, setKeyTag] = useState('')
  const [hasSigned, setHasSigned] = useState(false)

  // Signature canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    setCustomer(JSON.parse(localStorage.getItem('checkin_customer') || 'null'))
    setServices(JSON.parse(localStorage.getItem('checkin_services') || '[]'))
    setUpsells(JSON.parse(localStorage.getItem('checkin_upsells') || '[]'))
    setKeyTag(localStorage.getItem('checkin_keytag') || '')
  }, [])

  // ── Canvas setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#18181b'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    isDrawing.current = true
    lastPos.current = getPos(e, canvas)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
    setHasSigned(true)
  }

  const endDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    isDrawing.current = false
    lastPos.current = null
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSigned(false)
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!hasSigned) return
    setSubmitting(true)

    const canvas = canvasRef.current
    const signatureData = canvas ? canvas.toDataURL('image/png') : null

    const allServices = [...services, ...upsells]
    await supabase.from('checkins').insert({
      customer_id: customer?.id || null,
      customer_name: customer ? `${customer.first_name} ${customer.last_name}` : null,
      phone: customer?.phone || null,
      is_new_customer: customer?.is_new_customer || false,
      services: allServices,
      key_tag_number: keyTag || null,
      status: 'pending',
      signature: signatureData,
    })

    localStorage.removeItem('checkin_customer')
    localStorage.removeItem('checkin_services')
    localStorage.removeItem('checkin_upsells')
    localStorage.removeItem('checkin_keytag')

    setSubmitting(false)
    setDone(true)
    setTimeout(() => router.push('/'), 5000)
  }

  // ── Done screen ───────────────────────────────────────────────────────────────
  if (done) {
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
        <div style={{ fontSize: '5rem', marginBottom: '24px' }}>✅</div>
        <h1 style={{ color: '#18181b', fontSize: '2.8rem', fontWeight: '800', marginBottom: '12px' }}>
          You're checked in!
        </h1>
        <p style={{ color: '#71717a', fontSize: '1.2rem', marginBottom: '8px' }}>
          We'll be right with you.
        </p>
        <p style={{ color: '#a1a1aa', fontSize: '1rem' }}>
          Returning to home screen...
        </p>
      </div>
    )
  }

  // ── Main confirm screen ───────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: '#f4f4f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      fontFamily: 'sans-serif',
      padding: '48px 40px',
      overflowY: 'auto',
    }}>
      <h1 style={{ color: '#18181b', fontSize: '2.4rem', fontWeight: '800', marginBottom: '8px' }}>
        Confirm your check-in
      </h1>
      <p style={{ color: '#71717a', fontSize: '1.1rem', marginBottom: '40px' }}>
        Please review and confirm
      </p>

      {/* ── Summary card ── */}
      <div style={{
        width: '100%',
        maxWidth: '560px',
        background: '#ffffff',
        borderRadius: '20px',
        border: '0.5px solid #e4e4e7',
        overflow: 'hidden',
        marginBottom: '32px',
      }}>
        {/* Customer */}
        <div style={{ padding: '24px', borderBottom: '0.5px solid #f4f4f5' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#a1a1aa', marginBottom: '4px', letterSpacing: '0.5px' }}>CUSTOMER</p>
          <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#18181b', margin: 0 }}>
            {customer ? `${customer.first_name} ${customer.last_name}` : 'Guest'}
          </p>
          {customer?.phone && (
            <p style={{ fontSize: '0.95rem', color: '#71717a', margin: '4px 0 0' }}>{customer.phone}</p>
          )}
        </div>

        {/* Services */}
        <div style={{ padding: '24px', borderBottom: '0.5px solid #f4f4f5' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#a1a1aa', marginBottom: '12px', letterSpacing: '0.5px' }}>SERVICES REQUESTED</p>
          {services.length === 0 ? (
            <p style={{ color: '#71717a', margin: 0 }}>None selected</p>
          ) : services.map((s: any) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#18181b', fontWeight: '600' }}>{s.name}</span>
              <span style={{ color: '#71717a' }}>{s.price_display}</span>
            </div>
          ))}
        </div>

        {/* Upsells */}
        {upsells.length > 0 && (
          <div style={{ padding: '24px', borderBottom: '0.5px solid #f4f4f5' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#a1a1aa', marginBottom: '12px', letterSpacing: '0.5px' }}>ADD-ONS</p>
            {upsells.map((s: any) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#18181b', fontWeight: '600' }}>{s.name}</span>
                <span style={{ color: '#71717a' }}>{s.price_display}</span>
              </div>
            ))}
          </div>
        )}

        {/* Key Tag */}
        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#a1a1aa', marginBottom: '4px', letterSpacing: '0.5px' }}>KEY TAG</p>
          <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#18181b', margin: 0 }}>
            {keyTag || 'No key tag'}
          </p>
        </div>
      </div>

      {/* ── Signature pad ── */}
      <div style={{
        width: '100%',
        maxWidth: '560px',
        background: '#ffffff',
        borderRadius: '20px',
        border: '0.5px solid #e4e4e7',
        padding: '28px',
        marginBottom: '32px',
      }}>
        {/* Authorization text */}
        <p style={{
          fontSize: '0.95rem',
          color: '#52525b',
          lineHeight: '1.6',
          margin: '0 0 20px',
          textAlign: 'center',
        }}>
          By signing, you affirm that you have authority over this vehicle and authorize us to perform services on the vehicle.
        </p>

        {/* Signature label + clear button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#a1a1aa', letterSpacing: '0.5px', margin: 0 }}>
            CUSTOMER SIGNATURE
          </p>
          {hasSigned && (
            <button
              onClick={clearSignature}
              style={{
                background: 'none',
                border: 'none',
                color: '#a1a1aa',
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Canvas */}
        <div style={{
          borderRadius: '12px',
          border: hasSigned ? '1.5px solid #e4e4e7' : '1.5px dashed #d4d4d8',
          overflow: 'hidden',
          background: '#ffffff',
          position: 'relative',
        }}>
          <canvas
            ref={canvasRef}
            width={520}
            height={180}
            style={{ display: 'block', width: '100%', height: '180px', touchAction: 'none', cursor: 'crosshair' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          {/* Placeholder hint */}
          {!hasSigned && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <p style={{ color: '#d4d4d8', fontSize: '1rem', fontWeight: '500', margin: 0 }}>
                ✍️ Sign here
              </p>
            </div>
          )}
        </div>

        {/* Signature line decoration */}
        <div style={{
          marginTop: '10px',
          borderTop: '1.5px solid #e4e4e7',
          paddingTop: '6px',
        }}>
          <p style={{ fontSize: '0.75rem', color: '#a1a1aa', margin: 0, textAlign: 'center' }}>
            
          </p>
        </div>
      </div>

      {/* ── Confirm button ── */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !hasSigned}
        style={{
          padding: '20px 60px',
          borderRadius: '16px',
          background: submitting || !hasSigned ? '#e4e4e7' : '#e03b1f',
          color: submitting || !hasSigned ? '#a1a1aa' : 'white',
          border: 'none',
          fontSize: '1.3rem',
          fontWeight: '800',
          cursor: submitting || !hasSigned ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        {submitting ? 'Submitting...' : 'Confirm Check-In ✓'}
      </button>

      {!hasSigned && (
        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginTop: '12px' }}>
          Please sign above to continue
        </p>
      )}

      <button
        onClick={() => router.push('/kiosk/keytag')}
        style={{
          marginTop: '24px',
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