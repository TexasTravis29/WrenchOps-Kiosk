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

type ShopUser = {
  id: string
  name: string
  password: string
  role: 'kiosk' | 'staff'
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
  const [shopUsers, setShopUsers] = useState<ShopUser[]>([])
  const [userEdits, setUserEdits] = useState<Record<string, { name: string; password: string }>>({})
  const [userSaved, setUserSaved] = useState<Record<string, boolean>>({})

  const [newService, setNewService] = useState({
    name: '', description: '', price_display: '', is_upsell: false, sort_order: 0
  })

  const [editingService, setEditingService] = useState<string | null>(null)
  const [serviceEdits, setServiceEdits] = useState<Record<string, { name: string; description: string; price_display: string; sort_order: number }>>({});

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
    const session = getSession()
    const [{ data: s }, { data: c }, { data: st }, { data: u }] = await Promise.all([
      supabase.from('services').select('*').order('sort_order'),
      supabase.from('customers').select('*').order('last_name').limit(100),
      supabase.from('settings').select('*'),
      supabase.from('users').select('id, name, password, role').eq('shop_id', session!.shop_id).in('role', ['kiosk', 'staff']),
    ])
    setServices(s || [])
    setCustomers(c || [])
    const settingsMap: Record<string, string> = {}
    st?.forEach(row => { settingsMap[row.key] = row.value })
    setSettings(settingsMap)
    const users = u || []
    setShopUsers(users)
    const edits: Record<string, { name: string; password: string }> = {}
    users.forEach(usr => { edits[usr.id] = { name: usr.name, password: usr.password } })
    setUserEdits(edits)
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

  const startEditService = (s: Service) => {
    setEditingService(s.id)
    setServiceEdits(p => ({
      ...p,
      [s.id]: { name: s.name, description: s.description, price_display: s.price_display, sort_order: s.sort_order }
    }))
  }

  const saveService = async (id: string) => {
    const edit = serviceEdits[id]
    if (!edit?.name.trim()) return
    await supabase.from('services').update({
      name: edit.name.trim(),
      description: edit.description.trim(),
      price_display: edit.price_display.trim(),
      sort_order: edit.sort_order,
    }).eq('id', id)
    setEditingService(null)
    loadAll()
  }

  const saveUser = async (userId: string) => {
    const edit = userEdits[userId]
    if (!edit?.name.trim() || !edit?.password.trim()) return
    await supabase.from('users').update({ name: edit.name.trim(), password: edit.password.trim() }).eq('id', userId)
    setUserSaved(p => ({ ...p, [userId]: true }))
    setTimeout(() => setUserSaved(p => ({ ...p, [userId]: false })), 2000)
    loadAll()
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

  // suppress unused warning
  void settings

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
                  {services.map(s => {
                    const isEditing = editingService === s.id
                    const edit = serviceEdits[s.id]
                    return (
                      <div
                        key={s.id}
                        style={{
                          background: '#ffffff',
                          borderRadius: '12px',
                          border: isEditing ? '1.5px solid #18181b' : '0.5px solid #e4e4e7',
                          padding: '16px 20px',
                          opacity: s.is_active ? 1 : 0.5,
                          transition: 'border 0.15s ease',
                        }}
                      >
                        {isEditing ? (
                          // — Edit mode —
                          <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                              <input
                                autoFocus
                                value={edit.name}
                                onChange={e => setServiceEdits(p => ({ ...p, [s.id]: { ...edit, name: e.target.value } }))}
                                placeholder="Service name"
                                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}
                              />
                              <input
                                value={edit.price_display}
                                onChange={e => setServiceEdits(p => ({ ...p, [s.id]: { ...edit, price_display: e.target.value } }))}
                                placeholder="Price (e.g. From $49)"
                                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}
                              />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '10px', marginBottom: '14px' }}>
                              <input
                                value={edit.description}
                                onChange={e => setServiceEdits(p => ({ ...p, [s.id]: { ...edit, description: e.target.value } }))}
                                placeholder="Description (optional)"
                                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}
                              />
                              <input
                                type="number"
                                value={edit.sort_order}
                                onChange={e => setServiceEdits(p => ({ ...p, [s.id]: { ...edit, sort_order: parseInt(e.target.value) || 0 } }))}
                                placeholder="Sort"
                                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => saveService(s.id)}
                                style={{
                                  padding: '8px 20px',
                                  borderRadius: '8px',
                                  background: '#18181b',
                                  color: 'white',
                                  border: 'none',
                                  fontWeight: '700',
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingService(null)}
                                style={{
                                  padding: '8px 20px',
                                  borderRadius: '8px',
                                  background: 'none',
                                  border: '0.5px solid #e4e4e7',
                                  color: '#71717a',
                                  fontWeight: '600',
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // — Display mode —
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                              {s.description && (
                                <p style={{ color: '#71717a', fontSize: '0.85rem', margin: '2px 0 0' }}>{s.description}</p>
                              )}
                            </div>
                            <span style={{ color: '#e03b1f', fontWeight: '700', fontSize: '0.95rem' }}>{s.price_display}</span>
                            <button
                              onClick={() => startEditService(s)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: '0.5px solid #e4e4e7',
                                background: 'none',
                                color: '#18181b',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                              }}
                            >
                              Edit
                            </button>
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
                        )}
                      </div>
                    )
                  })}
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
                <h2 style={{ color: '#18181b', fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>
                  User Management
                </h2>
                <p style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '24px' }}>
                  Set the username and password for each login type at this shop.
                </p>

                {shopUsers.length === 0 && (
                  <p style={{ color: '#a1a1aa' }}>No kiosk or staff users found for this shop.</p>
                )}

                {(['kiosk', 'staff'] as const).map(role => {
                  const user = shopUsers.find(u => u.role === role)
                  if (!user) return (
                    <div key={role} style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '0.5px solid #e4e4e7',
                      padding: '24px',
                      marginBottom: '16px',
                    }}>
                      <p style={{ color: '#71717a', fontWeight: '600', textTransform: 'capitalize' }}>
                        {role} — no user found
                      </p>
                    </div>
                  )
                  const edit = userEdits[user.id] || { name: user.name, password: user.password }
                  return (
                    <div key={role} style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '0.5px solid #e4e4e7',
                      padding: '24px',
                      marginBottom: '16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: role === 'kiosk' ? '#dbeafe' : '#dcfce7',
                          color: role === 'kiosk' ? '#1e40af' : '#166534',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          {role}
                        </span>
                        <span style={{ color: '#18181b', fontWeight: '700', fontSize: '1rem' }}>
                          {role === 'kiosk' ? 'Kiosk Login' : 'Staff Login'}
                        </span>
                      </div>

                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontWeight: '600', color: '#18181b', fontSize: '0.85rem', marginBottom: '6px' }}>
                          Username
                        </label>
                        <input
                          value={edit.name}
                          onChange={e => setUserEdits(p => ({ ...p, [user.id]: { ...edit, name: e.target.value } }))}
                          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}
                          placeholder="Username"
                        />
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontWeight: '600', color: '#18181b', fontSize: '0.85rem', marginBottom: '6px' }}>
                          Password
                        </label>
                        <input
                          value={edit.password}
                          onChange={e => setUserEdits(p => ({ ...p, [user.id]: { ...edit, password: e.target.value } }))}
                          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' as const }}
                          placeholder="Password"
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                          onClick={() => saveUser(user.id)}
                          style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            background: '#18181b',
                            color: 'white',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                          }}
                        >
                          Save Changes
                        </button>
                        {userSaved[user.id] && (
                          <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '0.9rem' }}>✓ Saved</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}