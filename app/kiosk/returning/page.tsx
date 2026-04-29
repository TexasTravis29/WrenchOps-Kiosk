'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

type Customer = {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
}

export default function ReturningCustomer() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Customer | null>(null)

  useEffect(() => {
    if (search.length < 2) {
      setResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('customers')
        .select('id, first_name, last_name, phone, email')
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`)
        .eq('is_active', true)
        .limit(8)
      setResults(data || [])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  const handleSelect = (customer: Customer) => {
    setSelected(customer)
    setSearch(`${customer.first_name} ${customer.last_name}`)
    setResults([])
  }

  const handleContinue = () => {
    if (!selected) return
    localStorage.setItem('checkin_customer', JSON.stringify(selected))
    router.push('/kiosk/service')
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
      padding: '40px',
    }}>
      <h1 style={{ color: '#18181b', fontSize: '2.4rem', fontWeight: '800', marginBottom: '8px' }}>
        Find your account
      </h1>
      <p style={{ color: '#71717a', fontSize: '1.2rem', marginBottom: '40px' }}>
        Search by name or phone number
      </p>

      <div style={{ width: '100%', maxWidth: '560px', position: 'relative' }}>
        <input
          autoFocus
          type="text"
          placeholder="Start typing your name or phone..."
          value={search}
          onChange={e => { setSearch(e.target.value); setSelected(null) }}
          style={{
            width: '100%',
            padding: '20px 24px',
            fontSize: '1.3rem',
            borderRadius: '16px',
            border: '0.5px solid #e4e4e7',
            background: '#ffffff',
            color: '#18181b',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {loading && (
          <div style={{ textAlign: 'center', padding: '16px', color: '#71717a' }}>
            Searching...
          </div>
        )}

        {results.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#ffffff',
            border: '0.5px solid #e4e4e7',
            borderRadius: '16px',
            marginTop: '8px',
            overflow: 'hidden',
            zIndex: 10,
          }}>
            {results.map((c, i) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  background: 'none',
                  border: 'none',
                  borderTop: i > 0 ? '0.5px solid #f4f4f5' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#18181b' }}>
                  {c.first_name} {c.last_name}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#71717a' }}>
                  {c.phone || c.email || ''}
                </span>
              </button>
            ))}
          </div>
        )}

        {search.length >= 2 && !loading && results.length === 0 && !selected && (
          <div style={{
            marginTop: '16px',
            padding: '20px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '0.5px solid #e4e4e7',
            textAlign: 'center',
            color: '#71717a',
          }}>
            No results found —{' '}
            <span
              onClick={() => router.push('/kiosk/new')}
              style={{ color: '#e03b1f', cursor: 'pointer', fontWeight: '700' }}
            >
              register as new customer
            </span>
          </div>
        )}
      </div>

      {selected && (
        <button
          onClick={handleContinue}
          style={{
            marginTop: '40px',
            padding: '20px 60px',
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
      )}

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