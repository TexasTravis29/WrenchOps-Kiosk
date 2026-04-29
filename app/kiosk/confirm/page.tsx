'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function Confirm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [customer, setCustomer] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [upsells, setUpsells] = useState<any[]>([])
  const [keyTag, setKeyTag] = useState('')

  useEffect(() => {
    setCustomer(JSON.parse(localStorage.getItem('checkin_customer') || 'null'))
    setServices(JSON.parse(localStorage.getItem('checkin_services') || '[]'))
    setUpsells(JSON.parse(localStorage.getItem('checkin_upsells') || '[]'))
    setKeyTag(localStorage.getItem('checkin_keytag') || '')
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    const allServices = [...services, ...upsells]
    await supabase.from('checkins').insert({
      customer_id: customer?.id || null,
      customer_name: customer ? `${customer.first_name} ${customer.last_name}` : null,
      phone: customer?.phone || null,
      is_new_customer: customer?.is_new_customer || false,
      services: allServices,
      key_tag_number: keyTag || null,
      status: 'pending',
    })

    // Clear localStorage
    localStorage.removeItem('checkin_customer')
    localStorage.removeItem('checkin_services')
    localStorage.removeItem('checkin_upsells')
    localStorage.removeItem('checkin_keytag')

    setSubmitting(false)
    setDone(true)

    // Return to welcome screen after 5 seconds
    setTimeout(() => router.push('/'), 5000)
  }

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
        <div style={{
          fontSize: '5rem',
          marginBottom: '24px',
        }}>✅</div>
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
        Confirm your check-in
      </h1>
      <p style={{ color: '#71717a', fontSize: '1.1rem', marginBottom: '40px' }}>
        Please review and confirm
      </p>

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

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          padding: '20px 60px',
          borderRadius: '16px',
          background: submitting ? '#e4e4e7' : '#e03b1f',
          color: submitting ? '#a1a1aa' : 'white',
          border: 'none',
          fontSize: '1.3rem',
          fontWeight: '800',
          cursor: submitting ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        {submitting ? 'Submitting...' : 'Confirm Check-In ✓'}
      </button>

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