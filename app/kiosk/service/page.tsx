'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

type Service = {
  id: string
  name: string
  description: string
  price_display: string
  is_upsell: boolean
}

type Customer = {
  id: string
  first_name: string
  last_name: string
}

export default function ServiceSelection() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('checkin_customer')
    if (stored) setCustomer(JSON.parse(stored))

    async function loadServices() {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .eq('is_upsell', false)
        .order('sort_order')
      setServices(data || [])
      setLoading(false)
    }
    loadServices()
  }, [])

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleContinue = () => {
    const selectedServices = services.filter(s => selected.includes(s.id))
    localStorage.setItem('checkin_services', JSON.stringify(selectedServices))
    router.push('/kiosk/upsell')
  }

  const mainServices = services.filter(s => !s.is_upsell)

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: '#f4f4f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'sans-serif',
      overflowY: 'auto',
      padding: '48px 40px',
    }}>
      {customer && (
        <p style={{ color: '#71717a', fontSize: '1.1rem', marginBottom: '8px' }}>
          Hi, <strong style={{ color: '#18181b' }}>{customer.first_name}!</strong>
        </p>
      )}

      <h1 style={{ color: '#18181b', fontSize: '2.4rem', fontWeight: '800', marginBottom: '8px', textAlign: 'center' }}>
        What brings you in today?
      </h1>
      <p style={{ color: '#71717a', fontSize: '1.1rem', marginBottom: '40px' }}>
        Select all that apply
      </p>

      {loading ? (
        <p style={{ color: '#71717a' }}>Loading services...</p>
      ) : mainServices.length === 0 ? (
        <p style={{ color: '#71717a' }}>No services found — ask an admin to add services.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          width: '100%',
          maxWidth: '720px',
          marginBottom: '40px',
        }}>
          {mainServices.map(service => {
            const isSelected = selected.includes(service.id)
            return (
              <button
                key={service.id}
                onClick={() => toggle(service.id)}
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: isSelected ? '2px solid #e03b1f' : '0.5px solid #e4e4e7',
                  background: isSelected ? 'rgba(224,59,31,0.06)' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  transform: isSelected ? 'scale(0.98)' : 'scale(1)',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#18181b' }}>
                    {service.name}
                  </span>
                  {isSelected && (
                    <span style={{
                      background: '#e03b1f',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}>✓</span>
                  )}
                </div>
                {service.description && (
                  <p style={{ fontSize: '0.9rem', color: '#71717a', margin: '0 0 8px' }}>
                    {service.description}
                  </p>
                )}
                {service.price_display && (
                  <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#e03b1f', margin: 0 }}>
                    {service.price_display}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={selected.length === 0}
        style={{
          padding: '20px 60px',
          borderRadius: '16px',
          background: selected.length > 0 ? '#e03b1f' : '#e4e4e7',
          color: selected.length > 0 ? 'white' : '#a1a1aa',
          border: 'none',
          fontSize: '1.3rem',
          fontWeight: '800',
          cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s ease',
        }}
      >
        Continue →
      </button>

      <button
        onClick={() => router.push('/kiosk/returning')}
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