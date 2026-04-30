'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { getSession, clearSession } from '../../../lib/auth'

type Shop = {
  id: string
  name: string
  created_at: string
}

type ShopStats = {
  shop_id: string
  customerCount: number
  checkinCount: number
  checkinLast30: number
}

type User = {
  id: string
  name: string
  role: string
  shop_id: string
  is_active: boolean
}

type NewShopForm = {
  name: string
  adminName: string
  adminPassword: string
}

type NewUserForm = {
  name: string
  password: string
  role: 'admin' | 'staff' | 'kiosk'
  shop_id: string
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'shops' | 'users'>('overview')
  const [shops, setShops] = useState<Shop[]>([])
  const [stats, setStats] = useState<Record<string, ShopStats>>({})
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewShop, setShowNewShop] = useState(false)
  const [showNewUser, setShowNewUser] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const [newShop, setNewShop] = useState<NewShopForm>({
    name: '',
    adminName: '',
    adminPassword: '',
  })

  const [newUser, setNewUser] = useState<NewUserForm>({
    name: '',
    password: '',
    role: 'admin',
    shop_id: '',
  })

  useEffect(() => {
    const session = getSession()
    if (!session || session.role !== 'superadmin') {
      router.push('/')
      return
    }
    loadAll()
  }, [router])

  const loadAll = async () => {
    setLoading(true)

    const [{ data: shopsData }, { data: usersData }, { data: checkins }, { data: customers }] =
      await Promise.all([
        supabase.from('shops').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('id, name, role, shop_id, is_active').order('name'),
        supabase.from('checkins').select('shop_id, created_at'),
        supabase.from('customers').select('shop_id'),
      ])

    setShops(shopsData || [])
    setUsers(usersData || [])

    // Build per-shop stats
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const statsMap: Record<string, ShopStats> = {}

    for (const shop of shopsData || []) {
      const shopCheckins = checkins?.filter(c => c.shop_id === shop.id) || []
      const shopCustomers = customers?.filter(c => c.shop_id === shop.id) || []
      statsMap[shop.id] = {
        shop_id: shop.id,
        customerCount: shopCustomers.length,
        checkinCount: shopCheckins.length,
        checkinLast30: shopCheckins.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length,
      }
    }

    setStats(statsMap)
    setLoading(false)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const createShop = async () => {
    if (!newShop.name.trim() || !newShop.adminName.trim() || !newShop.adminPassword.trim()) return
    setSaving(true)

    // Insert shop
    const { data: shopData, error: shopErr } = await supabase
      .from('shops')
      .insert({ name: newShop.name.trim() })
      .select()
      .single()

    if (shopErr || !shopData) {
      showToast('Failed to create shop')
      setSaving(false)
      return
    }

    // Insert admin user for that shop
    const { error: userErr } = await supabase.from('users').insert({
      name: newShop.adminName.trim(),
      password: newShop.adminPassword.trim(),
      role: 'admin',
      shop_id: shopData.id,
      is_active: true,
    })

    if (userErr) {
      showToast('Shop created but failed to create admin user')
    } else {
      showToast(`✓ Shop "${newShop.name}" created with admin "${newShop.adminName}"`)
    }

    setNewShop({ name: '', adminName: '', adminPassword: '' })
    setShowNewShop(false)
    setSaving(false)
    loadAll()
  }

  const createUser = async () => {
    if (!newUser.name.trim() || !newUser.password.trim() || !newUser.shop_id) return
    setSaving(true)

    const { error } = await supabase.from('users').insert({
      name: newUser.name.trim(),
      password: newUser.password.trim(),
      role: newUser.role,
      shop_id: newUser.shop_id,
      is_active: true,
    })

    if (error) {
      showToast('Failed to create user')
    } else {
      showToast(`✓ User "${newUser.name}" created`)
      setNewUser({ name: '', password: '', role: 'admin', shop_id: '' })
      setShowNewUser(false)
      loadAll()
    }
    setSaving(false)
  }

  const toggleUser = async (id: string, is_active: boolean) => {
    await supabase.from('users').update({ is_active }).eq('id', id)
    loadAll()
  }

  const shopName = (shop_id: string) => shops.find(s => s.id === shop_id)?.name || '—'

  const totalCheckins = Object.values(stats).reduce((a, s) => a + s.checkinCount, 0)
  const totalCustomers = Object.values(stats).reduce((a, s) => a + s.customerCount, 0)
  const totalLast30 = Object.values(stats).reduce((a, s) => a + s.checkinLast30, 0)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '0.5px solid #e4e4e7',
    background: '#ffffff',
    color: '#18181b',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#71717a',
    marginBottom: '6px',
    letterSpacing: '0.4px',
    display: 'block',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d0f',
      fontFamily: 'sans-serif',
      color: '#ffffff',
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#16a34a',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          fontSize: '0.95rem',
          fontWeight: '700',
          zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: '#18181b',
        borderBottom: '0.5px solid #27272a',
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: '#e03b1f',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
          }}>⚡</div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff' }}>WrenchOps</div>
            <div style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: '600', letterSpacing: '0.5px' }}>SUPER ADMIN</div>
          </div>
        </div>
        <button
          onClick={() => { clearSession(); router.push('/') }}
          style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '0.9rem', cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        background: '#18181b',
        borderBottom: '0.5px solid #27272a',
        padding: '0 40px',
        display: 'flex',
        gap: '32px',
      }}>
        {(['overview', 'shops', 'users'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '16px 0',
            background: 'none',
            border: 'none',
            borderBottom: tab === t ? '2px solid #e03b1f' : '2px solid transparent',
            color: tab === t ? '#ffffff' : '#71717a',
            fontSize: '0.9rem',
            fontWeight: tab === t ? '700' : '400',
            cursor: 'pointer',
            textTransform: 'capitalize',
          }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ color: '#71717a', textAlign: 'center', padding: '80px' }}>Loading...</div>
        ) : (
          <>
            {/* ── OVERVIEW TAB ── */}
            {tab === 'overview' && (
              <div>
                {/* Top stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' }}>
                  {[
                    { label: 'Total Shops', value: shops.length, icon: '🏪' },
                    { label: 'Total Customers', value: totalCustomers.toLocaleString(), icon: '👥' },
                    { label: 'Total Check-ins', value: totalCheckins.toLocaleString(), icon: '📋' },
                    { label: 'Check-ins (30d)', value: totalLast30.toLocaleString(), icon: '📈' },
                  ].map(card => (
                    <div key={card.label} style={{
                      background: '#18181b',
                      borderRadius: '16px',
                      border: '0.5px solid #27272a',
                      padding: '24px',
                    }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>{card.icon}</div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ffffff', marginBottom: '4px' }}>
                        {card.value}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: '600', letterSpacing: '0.3px' }}>
                        {card.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Per-shop activity table */}
                <div style={{
                  background: '#18181b',
                  borderRadius: '16px',
                  border: '0.5px solid #27272a',
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '20px 24px', borderBottom: '0.5px solid #27272a' }}>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#ffffff' }}>
                      Shop Activity
                    </h2>
                  </div>
                  {shops.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>No shops yet</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '0.5px solid #27272a' }}>
                          {['Shop', 'Customers', 'Total Check-ins', 'Last 30 Days', 'Users'].map(h => (
                            <th key={h} style={{
                              padding: '12px 24px',
                              textAlign: 'left',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              color: '#52525b',
                              letterSpacing: '0.5px',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {shops.map((shop, i) => {
                          const s = stats[shop.id] || { customerCount: 0, checkinCount: 0, checkinLast30: 0 }
                          const shopUsers = users.filter(u => u.shop_id === shop.id && u.is_active)
                          return (
                            <tr key={shop.id} style={{
                              borderTop: i > 0 ? '0.5px solid #27272a' : 'none',
                            }}>
                              <td style={{ padding: '16px 24px' }}>
                                <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.95rem' }}>{shop.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#52525b', marginTop: '2px' }}>
                                  Added {new Date(shop.created_at).toLocaleDateString()}
                                </div>
                              </td>
                              <td style={{ padding: '16px 24px', color: '#a1a1aa', fontWeight: '600' }}>
                                {s.customerCount.toLocaleString()}
                              </td>
                              <td style={{ padding: '16px 24px', color: '#a1a1aa', fontWeight: '600' }}>
                                {s.checkinCount.toLocaleString()}
                              </td>
                              <td style={{ padding: '16px 24px' }}>
                                <span style={{
                                  background: s.checkinLast30 > 0 ? 'rgba(224,59,31,0.15)' : '#27272a',
                                  color: s.checkinLast30 > 0 ? '#e03b1f' : '#52525b',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.85rem',
                                  fontWeight: '700',
                                }}>
                                  {s.checkinLast30}
                                </span>
                              </td>
                              <td style={{ padding: '16px 24px', color: '#a1a1aa', fontWeight: '600' }}>
                                {shopUsers.length}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ── SHOPS TAB ── */}
            {tab === 'shops' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>
                    Shops <span style={{ color: '#52525b', fontWeight: '400', fontSize: '1rem' }}>({shops.length})</span>
                  </h2>
                  <button
                    onClick={() => setShowNewShop(!showNewShop)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      background: '#e03b1f',
                      color: 'white',
                      border: 'none',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    + New Shop
                  </button>
                </div>

                {/* New shop form */}
                {showNewShop && (
                  <div style={{
                    background: '#18181b',
                    borderRadius: '16px',
                    border: '0.5px solid #e03b1f',
                    padding: '28px',
                    marginBottom: '24px',
                  }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: '800', color: '#ffffff' }}>
                      Create New Shop
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={labelStyle}>SHOP NAME</label>
                        <input
                          autoFocus
                          placeholder="e.g. Main Street Auto"
                          value={newShop.name}
                          onChange={e => setNewShop(p => ({ ...p, name: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>ADMIN USERNAME</label>
                        <input
                          placeholder="e.g. john_admin"
                          value={newShop.adminName}
                          onChange={e => setNewShop(p => ({ ...p, adminName: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>ADMIN PASSWORD</label>
                        <input
                          type="password"
                          placeholder="Temporary password"
                          value={newShop.adminPassword}
                          onChange={e => setNewShop(p => ({ ...p, adminPassword: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={createShop}
                        disabled={saving || !newShop.name || !newShop.adminName || !newShop.adminPassword}
                        style={{
                          padding: '10px 24px',
                          borderRadius: '10px',
                          background: saving ? '#27272a' : '#e03b1f',
                          color: 'white',
                          border: 'none',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          cursor: saving ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {saving ? 'Creating...' : 'Create Shop + Admin'}
                      </button>
                      <button
                        onClick={() => setShowNewShop(false)}
                        style={{
                          padding: '10px 24px',
                          borderRadius: '10px',
                          background: 'none',
                          color: '#71717a',
                          border: '0.5px solid #27272a',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Shops list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {shops.map(shop => {
                    const s = stats[shop.id] || { customerCount: 0, checkinCount: 0, checkinLast30: 0 }
                    const shopUsers = users.filter(u => u.shop_id === shop.id)
                    return (
                      <div key={shop.id} style={{
                        background: '#18181b',
                        borderRadius: '16px',
                        border: '0.5px solid #27272a',
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                      }}>
                        <div style={{
                          width: '44px', height: '44px',
                          background: '#27272a',
                          borderRadius: '12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.3rem', flexShrink: 0,
                        }}>🏪</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '800', fontSize: '1rem', color: '#ffffff' }}>{shop.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#52525b', marginTop: '2px' }}>
                            Created {new Date(shop.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '32px', textAlign: 'center' }}>
                          {[
                            { val: s.customerCount, label: 'Customers' },
                            { val: s.checkinCount, label: 'Check-ins' },
                            { val: s.checkinLast30, label: 'Last 30d' },
                            { val: shopUsers.filter(u => u.is_active).length, label: 'Users' },
                          ].map(stat => (
                            <div key={stat.label}>
                              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>{stat.val}</div>
                              <div style={{ fontSize: '0.72rem', color: '#52525b', fontWeight: '600' }}>{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  {shops.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#52525b' }}>
                      No shops yet — create one above
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── USERS TAB ── */}
            {tab === 'users' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>
                    Users <span style={{ color: '#52525b', fontWeight: '400', fontSize: '1rem' }}>({users.length})</span>
                  </h2>
                  <button
                    onClick={() => setShowNewUser(!showNewUser)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      background: '#e03b1f',
                      color: 'white',
                      border: 'none',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    + New User
                  </button>
                </div>

                {/* New user form */}
                {showNewUser && (
                  <div style={{
                    background: '#18181b',
                    borderRadius: '16px',
                    border: '0.5px solid #e03b1f',
                    padding: '28px',
                    marginBottom: '24px',
                  }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: '800' }}>Add User to Existing Shop</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={labelStyle}>USERNAME</label>
                        <input
                          autoFocus
                          placeholder="Username"
                          value={newUser.name}
                          onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>PASSWORD</label>
                        <input
                          type="password"
                          placeholder="Password"
                          value={newUser.password}
                          onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>ROLE</label>
                        <select
                          value={newUser.role}
                          onChange={e => setNewUser(p => ({ ...p, role: e.target.value as any }))}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                          <option value="admin">Admin</option>
                          <option value="staff">Staff</option>
                          <option value="kiosk">Kiosk</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>SHOP</label>
                        <select
                          value={newUser.shop_id}
                          onChange={e => setNewUser(p => ({ ...p, shop_id: e.target.value }))}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                          <option value="">Select shop...</option>
                          {shops.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={createUser}
                        disabled={saving || !newUser.name || !newUser.password || !newUser.shop_id}
                        style={{
                          padding: '10px 24px',
                          borderRadius: '10px',
                          background: saving ? '#27272a' : '#e03b1f',
                          color: 'white',
                          border: 'none',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          cursor: saving ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {saving ? 'Creating...' : 'Create User'}
                      </button>
                      <button
                        onClick={() => setShowNewUser(false)}
                        style={{
                          padding: '10px 24px',
                          borderRadius: '10px',
                          background: 'none',
                          color: '#71717a',
                          border: '0.5px solid #27272a',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Users grouped by shop */}
                {shops.map(shop => {
                  const shopUsers = users.filter(u => u.shop_id === shop.id)
                  if (shopUsers.length === 0) return null
                  return (
                    <div key={shop.id} style={{ marginBottom: '24px' }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: '#52525b',
                        letterSpacing: '0.5px',
                        marginBottom: '8px',
                        paddingLeft: '4px',
                      }}>
                        {shop.name.toUpperCase()}
                      </div>
                      <div style={{
                        background: '#18181b',
                        borderRadius: '16px',
                        border: '0.5px solid #27272a',
                        overflow: 'hidden',
                      }}>
                        {shopUsers.map((u, i) => {
                          const roleColors: Record<string, { bg: string; color: string }> = {
                            admin: { bg: 'rgba(224,59,31,0.15)', color: '#e03b1f' },
                            staff: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
                            kiosk: { bg: '#27272a', color: '#71717a' },
                            superadmin: { bg: 'rgba(234,179,8,0.15)', color: '#eab308' },
                          }
                          const rc = roleColors[u.role] || roleColors.kiosk
                          return (
                            <div key={u.id} style={{
                              padding: '16px 20px',
                              borderTop: i > 0 ? '0.5px solid #27272a' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              opacity: u.is_active ? 1 : 0.4,
                            }}>
                              <div style={{ flex: 1 }}>
                                <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.95rem' }}>
                                  {u.name}
                                </span>
                              </div>
                              <span style={{
                                background: rc.bg,
                                color: rc.color,
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                              }}>
                                {u.role}
                              </span>
                              <button
                                onClick={() => toggleUser(u.id, !u.is_active)}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  border: '0.5px solid #27272a',
                                  background: 'none',
                                  color: u.is_active ? '#71717a' : '#16a34a',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                }}
                              >
                                {u.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Unassigned or superadmins */}
                {users.filter(u => !u.shop_id || u.role === 'superadmin').length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{
                      fontSize: '0.75rem', fontWeight: '700', color: '#52525b',
                      letterSpacing: '0.5px', marginBottom: '8px', paddingLeft: '4px',
                    }}>
                      SYSTEM / SUPERADMINS
                    </div>
                    <div style={{
                      background: '#18181b', borderRadius: '16px',
                      border: '0.5px solid #27272a', overflow: 'hidden',
                    }}>
                      {users.filter(u => !u.shop_id || u.role === 'superadmin').map((u, i) => (
                        <div key={u.id} style={{
                          padding: '16px 20px',
                          borderTop: i > 0 ? '0.5px solid #27272a' : 'none',
                          display: 'flex', alignItems: 'center', gap: '16px',
                        }}>
                          <div style={{ flex: 1, fontWeight: '700', color: '#ffffff' }}>{u.name}</div>
                          <span style={{
                            background: 'rgba(234,179,8,0.15)', color: '#eab308',
                            padding: '4px 10px', borderRadius: '8px',
                            fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase',
                          }}>
                            {u.role}
                          </span>
                        </div>
                      ))}
                    </div>
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
