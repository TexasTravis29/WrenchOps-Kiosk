'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { getSession, clearSession } from '../../../lib/auth'

type Service = {
  id: string
  name: string
  description: string
  price_display: string
  is_upsell: boolean
  is_active: boolean
  sort_order: number
}

type Customer = {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  is_active: boolean
  tekmetric_id: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'services' | 'customers' | 'settings'>('services')
  const [services, setServices] = useState<Service[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  const [newService, setNewService] = useState({
    name: '', description: '', price_display: '', is_upsell: false, sort_order: 0
  })

  useEffect(() => {
    const session = getSession()
        if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
        router.push('/')
    return
}
    loadAll()
  }, [router])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: s }, { data: c }, { data: st }] = await Promise.all([
      supabase.from('services').select('*').order('sort_order'),
      supabase.from('customers').select('*').order('last_name').limit(100),
      supabase.from('settings').select('*'),
    ])
    setServices(s || [])
    setCustomers(c || [])
    const settingsMap: Record<string, string> = {}
    st?.forEach(row => { settingsMap[row.key] = row.value })
    setSettings(settingsMap)
    setLoading(false)
  }

  const loadCustomers = async (search: string) => {
    const query = supabase.from('customers').select('*').order('last_name').limit(100)
    if (search.length > 1) {
      query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    const { data } = await query
    setCustomers(data || [])
  }

  const toggleService = async (id: string, is_active: boolean) => {
    await supabase.from('services').update({ is_active }).eq('id', id)
    loadAll()
  }

  const deleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return
    await supabase.from('services').delete().eq('id', id)
    loadAll()
  }

  const addService = async () => {
    if (!newService.name.trim()) return
    await supabase.from('services').insert({ ...newService, is_active: true })
    setNewService({ name: '', description: '', price_display: '', is_upsell: false, sort_order: 0 })
    loadAll()
  }

  const toggleCustomer = async (id: string, is_active: boolean) => {
    await supabase.from('customers').update({ is_active }).eq('id', id)
    loadAll()
  }

  const saveSetting = async (key: string, value: string) => {
    await supabase.from('settings').upsert({ key, value })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle = {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '0.5px solid #e4e4e7',
    background: '#ffffff',
    color: '#18181b',
    fontSize: '0.95rem',
    outline: 'none',
  }

  const tabs = ['services', 'customers', 'settings'] as const

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f4f5', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{
        background: '#18181b',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h1 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>
          WrenchOps Admin
        </h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/staff/dashboard')}
            style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            Staff View
          </button>
          <button
            onClick={() => { clearSession(); router.push('/') }}
            style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: '#ffffff',
        borderBottom: '0.5px solid #e4e4e7',
        padding: '0 32px',
        display: 'flex',
        gap: '32px',
      }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '16px 0',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid #e03b1f' : '2px solid transparent',
              color: tab === t ? '#18181b' : '#71717a',
              fontSize: '0.95rem',
              fontWeight: tab === t ? '700' : '400',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
        {loading ? (
          <p style={{ color: '#71717a' }}>Loading...</p>
        ) : (

          <>
            {/* SERVICES TAB */}
            {tab === 'services' && (
              <div style={{ maxWidth: '760px' }}>
                <h2 style={{ color: '#18181b', fontSize: '1.2rem', fontWeight: '800', marginBottom: '24px' }}>
                  Service Menu
                </h2>

                {/* Add new service */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '0.5px solid #e4e4e7',
                  padding: '24px',
                  marginBottom: '24px',
                }}>
                  <p style={{ fontWeight: '700', color: '#18181b', marginBottom: '16px' }}>Add New Service</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <input
                      placeholder="Service name *"
                      value={newService.name}
                      onChange={e => setNewService(p => ({ ...p, name: e.target.value }))}
                      style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}
                    />
                    <input
                      placeholder="Price (e.g. From $49)"
                      value={newService.price_display}
                      onChange={e => setNewService(p => ({ ...p, price_display: e.target.value }))}
                      style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}
                    />
                  </div>
                  <input
                    placeholder="Description (optional)"
                    value={newService.description}
                    onChange={e => setNewService(p => ({ ...p, description: e.target.value }))}
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const, marginBottom: '12px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#18181b', fontSize: '0.95rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newService.is_upsell}
                        onChange={e => setNewService(p => ({ ...p, is_upsell: e.target.checked }))}
                      />
                      Show as upsell / add-on
                    </label>
                    <input
                      type="number"
                      placeholder="Sort order"
                      value={newService.sort_order}
                      onChange={e => setNewService(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                      style={{ ...inputStyle, width: '100px' }}
                    />
                    <button
                      onClick={addService}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '8px',
                        background: '#e03b1f',
                        color: 'white',
                        border: 'none',
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                      }}
                    >
                      + Add Service
                    </button>
                  </div>
                </div>

                {/* Services list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {services.map(s => (
                    <div
                      key={s.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '0.5px solid #e4e4e7',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        opacity: s.is_active ? 1 : 0.5,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700', color: '#18181b' }}>{s.name}</span>
                          {s.is_upsell && (
                            <span style={{
                              background: '#fef9c3',
                              color: '#854d0e',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '10px',
                            }}>UPSELL</span>
                          )}
                        </div>
                        {s.description && <p style={{ color: '#71717a', fontSize: '0.85rem', margin: '2px 0 0' }}>{s.description}</p>}
                      </div>
                      <span style={{ color: '#e03b1f', fontWeight: '700', fontSize: '0.95rem' }}>{s.price_display}</span>
                      <button
                        onClick={() => toggleService(s.id, !s.is_active)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '0.5px solid #e4e4e7',
                          background: 'none',
                          color: s.is_active ? '#71717a' : '#16a34a',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {s.is_active ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => deleteService(s.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'none',
                          color: '#e03b1f',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CUSTOMERS TAB */}
            {tab === 'customers' && (
              <div style={{ maxWidth: '760px' }}>
                <h2 style={{ color: '#18181b', fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' }}>
                  Customers
                </h2>

                <input
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={e => { setCustomerSearch(e.target.value); loadCustomers(e.target.value) }}
                  style={{
                    ...inputStyle,
                    width: '100%',
                    boxSizing: 'border-box' as const,
                    marginBottom: '16px',
                    padding: '14px 20px',
                    fontSize: '1rem',
                    borderRadius: '12px',
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customers.map(c => (
                    <div
                      key={c.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '0.5px solid #e4e4e7',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        opacity: c.is_active ? 1 : 0.5,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: '700', color: '#18181b' }}>
                          {c.first_name} {c.last_name}
                        </span>
                        <div style={{ color: '#71717a', fontSize: '0.85rem', marginTop: '2px' }}>
                          {c.phone} {c.email ? `· ${c.email}` : ''}
                        </div>
                      </div>
                      {c.tekmetric_id && (
                        <span style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>#{c.tekmetric_id}</span>
                      )}
                      <button
                        onClick={() => toggleCustomer(c.id, !c.is_active)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '0.5px solid #e4e4e7',
                          background: 'none',
                          color: c.is_active ? '#71717a' : '#16a34a',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {tab === 'settings' && (
              <div style={{ maxWidth: '560px' }}>
                <h2 style={{ color: '#18181b', fontSize: '1.2rem', fontWeight: '800', marginBottom: '24px' }}>
                  Kiosk Settings
                </h2>

                <div style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '0.5px solid #e4e4e7',
                  overflow: 'hidden',
                }}>
                  {[
                    { key: 'kiosk_pin', label: 'Kiosk PIN', hint: 'PIN to unlock the kiosk screen' },
                    { key: 'welcome_message', label: 'Welcome Message', hint: 'Shown on the kiosk home screen' },
                    { key: 'shop_name', label: 'Shop Name', hint: 'Displayed throughout the kiosk' },
                    { key: 'staff_password', label: 'Staff Password', hint: 'Password for the staff portal' },
                  ].map((setting, i) => (
                    <div
                      key={setting.key}
                      style={{
                        padding: '20px 24px',
                        borderTop: i > 0 ? '0.5px solid #f4f4f5' : 'none',
                      }}
                    >
                      <label style={{ display: 'block', fontWeight: '700', color: '#18181b', marginBottom: '4px' }}>
                        {setting.label}
                      </label>
                      <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0 0 10px' }}>{setting.hint}</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          value={settings[setting.key] || ''}
                          onChange={e => setSettings(p => ({ ...p, [setting.key]: e.target.value }))}
                          style={{
                            ...inputStyle,
                            flex: 1,
                            boxSizing: 'border-box' as const,
                          }}
                        />
                        <button
                          onClick={() => saveSetting(setting.key, settings[setting.key] || '')}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            background: '#18181b',
                            color: 'white',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {saved && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px 20px',
                    background: '#dcfce7',
                    borderRadius: '10px',
                    color: '#166534',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                  }}>
                    ✓ Saved successfully
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}