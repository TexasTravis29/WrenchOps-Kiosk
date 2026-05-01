'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../../lib/supabase'

type Plan = 'monthly' | 'annual'

type FormData = {
  firstName: string
  lastName: string
  email: string
  shopName: string
  password: string
  confirmPassword: string
  plan: Plan
}

type CreatedAccount = {
  shopName: string
  adminEmail: string
  staffUsername: string
  kioskUsername: string
}

const FEATURES = [
  { icon: '🖥️', title: 'Customer Check-In Kiosk', desc: 'Self-service iPad kiosk for fast, paperless customer check-ins with digital signature.' },
  { icon: '🔧', title: 'Service Menu Management', desc: 'Build your service menu, set pricing, and add upsell options that show at check-in.' },
  { icon: '👥', title: 'Staff Dashboard', desc: 'Real-time view of active check-ins, customer queue, and service requests.' },
  { icon: '📋', title: 'Repair Order Tracking', desc: 'Use with any Shop managment system or as a stand-alone.' },
  { icon: '📊', title: 'Admin Analytics', desc: 'Customer counts, check-in history, and shop performance at a glance.' },
  { icon: '⚡', title: 'Instant Setup', desc: 'Your kiosk, staff, and admin accounts are ready the moment you sign up.' },
]

const CAROUSEL_IMAGES = [
  { label: 'Check-In Kiosk', bg: '#18181b', emoji: '🖥️', sub: 'Customer self-check-in' },
  { label: 'Staff Dashboard', bg: '#1a3a2a', emoji: '👨‍🔧', sub: 'Live service queue' },
  { label: 'Service Menu', bg: '#1a1a3a', emoji: '📋', sub: 'Custom pricing & upsells' },
  { label: 'Admin Controls', bg: '#2a1a1a', emoji: '⚙️', sub: 'Full shop management' },
  { label: 'Digital Signature', bg: '#1a2a3a', emoji: '✍️', sub: 'Paperless authorization' },
  { label: 'Analytics', bg: '#2a2a1a', emoji: '📊', sub: 'Shop performance data' },
]

const NAV_TABS = [
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'signup', label: 'Sign Up' },
  { id: 'contact', label: 'Contact' },
]

export default function SignupPage() {
  const router = useRouter()
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState('features')
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const scrollStartX = useRef(0)

  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    shopName: '',
    password: '',
    confirmPassword: '',
    plan: 'monthly',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<CreatedAccount | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // globals.css sets overflow:hidden on body (needed for kiosk pages).
  // Override it just for this page, restore on unmount.
  useEffect(() => {
    document.body.style.overflow = 'auto'
    return () => { document.body.style.overflow = 'hidden' }
  }, [])
  useEffect(() => {
    const ids = ['features', 'pricing', 'signup', 'contact']
    const observers: IntersectionObserver[] = []
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveTab(id) },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  // Callback ref — guarantees the wheel listener is attached the moment the element mounts
  const carouselCallbackRef = (el: HTMLDivElement | null) => {
    if (!el) return
    // @ts-ignore
    carouselRef.current = el
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      el.scrollLeft += e.deltaY + e.deltaX
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Carousel — drag to scroll in both directions
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    dragStartX.current = e.clientX
    scrollStartX.current = carouselRef.current?.scrollLeft ?? 0
    if (carouselRef.current) carouselRef.current.style.cursor = 'grabbing'
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !carouselRef.current) return
    carouselRef.current.scrollLeft = scrollStartX.current - (e.clientX - dragStartX.current)
  }
  const onMouseUp = () => {
    isDragging.current = false
    if (carouselRef.current) carouselRef.current.style.cursor = 'grab'
  }

  const set = (field: keyof FormData, value: string) => {
    setForm(p => ({ ...p, [field]: value }))
    setErrors(p => ({ ...p, [field]: '' }))
  }

  const slugify = (name: string) =>
    name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email required'
    if (!form.shopName.trim()) e.shopName = 'Required'
    if (form.password.length < 6) e.password = 'Min 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)

    const slug = slugify(form.shopName)
    const staffUsername = `${slug}_staff`
    const kioskUsername = `${slug}_kiosk`

    const { data: shopData, error: shopErr } = await supabase
      .from('shops')
      .insert({ name: form.shopName.trim(), slug })
      .select()
      .single()

    if (shopErr || !shopData) {
      setLoading(false)
      alert('Failed to create shop. Please try again.')
      return
    }

    const shopId = shopData.id

    const { error: adminErr } = await supabase.from('users').insert({
      name: form.email.trim(),
      password: form.password,
      role: 'admin',
      shop_id: shopId,
      is_active: true,
    })

    const { error: staffErr } = await supabase.from('users').insert({
      name: staffUsername,
      password: 'Staff1234!',
      role: 'staff',
      shop_id: shopId,
      is_active: true,
    })

    const { error: kioskErr } = await supabase.from('users').insert({
      name: kioskUsername,
      password: 'Kiosk1234!',
      role: 'kiosk',
      shop_id: shopId,
      is_active: true,
    })

    if (adminErr || staffErr || kioskErr) {
      console.error({ adminErr, staffErr, kioskErr })
      setLoading(false)
      alert('Account setup partially failed. Please contact support.')
      return
    }

    setCreated({ shopName: form.shopName.trim(), adminEmail: form.email.trim(), staffUsername, kioskUsername })
    setLoading(false)
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '14px 16px',
    fontSize: '1rem',
    borderRadius: '10px',
    border: hasError ? '1.5px solid #e03b1f' : '0.5px solid #e4e4e7',
    background: '#ffffff',
    color: '#18181b',
    outline: 'none',
    boxSizing: 'border-box',
  })

  // ── Success screen ────────────────────────────────────────────────────────────
  if (created) {
    const rows = [
      { role: 'Admin', username: created.adminEmail, password: form.password, note: 'Your login' },
      { role: 'Staff', username: created.staffUsername, password: 'Staff1234!', note: 'Give to technicians' },
      { role: 'Kiosk', username: created.kioskUsername, password: 'Kiosk1234!', note: 'For the front desk tablet' },
    ]
    return (
      <div style={{ minHeight: '100vh', background: '#f4f4f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '0.5px solid #e4e4e7', padding: '48px 40px', maxWidth: '560px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ color: '#18181b', fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>{created.shopName} is live!</h1>
          <p style={{ color: '#71717a', fontSize: '1rem', marginBottom: '40px' }}>
            Your shop, kiosk, and staff accounts are ready. Save these credentials — you'll need them to sign in.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {rows.map(row => (
              <div key={row.role} style={{ background: '#f4f4f5', borderRadius: '12px', padding: '16px 20px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '800', color: '#18181b', fontSize: '0.9rem' }}>{row.role}</span>
                  <span style={{ fontSize: '0.8rem', color: '#71717a' }}>{row.note}</span>
                </div>
                {[{ label: 'Username', val: row.username, key: `u-${row.role}` }, { label: 'Password', val: row.password, key: `p-${row.role}` }].map(item => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#52525b' }}>{item.label}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <code style={{ fontSize: '0.9rem', color: '#18181b', fontWeight: '600' }}>{item.val}</code>
                      <button onClick={() => copyToClipboard(item.val, item.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: copied === item.key ? '#16a34a' : '#e03b1f', fontWeight: '700' }}>
                        {copied === item.key ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/')} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#e03b1f', color: 'white', border: 'none', fontSize: '1rem', fontWeight: '800', cursor: 'pointer' }}>
            Sign In to Your Shop →
          </button>
        </div>
      </div>
    )
  }

  // ── Main landing page ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'sans-serif' }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '0.5px solid #e4e4e7',
        padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px',
      }}>
        <Image src="/wrenchops_logo_trans.png" alt="WrenchOps" width={160} height={48} style={{ objectFit: 'contain' }} />

        {/* Tab links with active highlight */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {NAV_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => scrollTo(tab.id)}
              style={{
                height: '100%',
                padding: '0 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2.5px solid #e03b1f' : '2.5px solid transparent',
                color: activeTab === tab.id ? '#18181b' : '#71717a',
                fontWeight: activeTab === tab.id ? '700' : '500',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
          <a href="/" style={{
            marginLeft: '16px',
            padding: '8px 20px',
            borderRadius: '8px',
            background: '#18181b',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '700',
            textDecoration: 'none',
          }}>
            Sign In
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: '100px 40px 80px', textAlign: 'center', background: 'linear-gradient(180deg, #fff5f3 0%, #ffffff 100%)' }}>
        <div style={{ display: 'inline-block', background: '#fef2f0', border: '0.5px solid #fca99a', borderRadius: '20px', padding: '6px 16px', fontSize: '0.85rem', fontWeight: '700', color: '#e03b1f', marginBottom: '24px', letterSpacing: '0.5px' }}>
          BUILT FOR AUTO SHOPS
        </div>
        <h1 style={{ fontSize: '3.8rem', fontWeight: '900', color: '#18181b', lineHeight: '1.1', margin: '0 auto 24px', maxWidth: '760px' }}>
          Run your shop.<br /><span style={{ color: '#e03b1f' }}>Not paperwork.</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#71717a', maxWidth: '560px', margin: '0 auto 48px', lineHeight: '1.7' }}>
          WrenchOps gives your auto shop a self-service kiosk, staff dashboard, and admin tools — all set up in seconds. No IT needed.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => scrollTo('signup')} style={{ padding: '16px 36px', borderRadius: '12px', background: '#e03b1f', color: 'white', fontWeight: '800', fontSize: '1.05rem', border: 'none', cursor: 'pointer' }}>
            Start Trial →
          </button>
          <button onClick={() => scrollTo('features')} style={{ padding: '16px 36px', borderRadius: '12px', background: '#f4f4f5', color: '#18181b', fontWeight: '700', fontSize: '1.05rem', border: 'none', cursor: 'pointer' }}>
            See How It Works
          </button>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '80px 40px', background: '#f9f9f9' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.2rem', fontWeight: '800', color: '#18181b', marginBottom: '12px' }}>
            Everything your shop needs
          </h2>
          <p style={{ textAlign: 'center', color: '#71717a', fontSize: '1.05rem', marginBottom: '56px' }}>
            One platform. Zero paper. Happier customers.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: '#ffffff', borderRadius: '16px', border: '0.5px solid #e4e4e7', padding: '28px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#18181b', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '0.95rem', color: '#71717a', lineHeight: '1.6', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Carousel ── */}
      <section style={{ padding: '80px 0', background: '#ffffff' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '800', color: '#18181b', marginBottom: '12px', padding: '0 40px' }}>
          See it in action
        </h2>
        <p style={{ textAlign: 'center', color: '#71717a', fontSize: '0.95rem', marginBottom: '36px' }}>
          Drag, scroll, or use the scrollbar to explore
        </p>
        <div
          ref={carouselCallbackRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'scroll',
            paddingLeft: '40px',
            paddingRight: '40px',
            paddingBottom: '20px',
            cursor: 'grab',
            userSelect: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {CAROUSEL_IMAGES.map((img, i) => (
            <div key={i} style={{
              flexShrink: 0,
              width: '300px',
              height: '200px',
              borderRadius: '16px',
              background: img.bg,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              border: '0.5px solid #e4e4e7',
              pointerEvents: 'none',
            }}>
              <div style={{ fontSize: '3rem' }}>{img.emoji}</div>
              <div style={{ color: '#ffffff', fontWeight: '800', fontSize: '1rem' }}>{img.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{img.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: '80px 40px', background: '#f9f9f9' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.2rem', fontWeight: '800', color: '#18181b', marginBottom: '12px' }}>
            Simple, transparent pricing
          </h2>
          <p style={{ textAlign: 'center', color: '#71717a', fontSize: '1.05rem', marginBottom: '48px' }}>
            One shop. All features included. Cancel anytime.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '700px', margin: '0 auto' }}>

            {/* Monthly */}
            <div style={{ background: '#ffffff', borderRadius: '20px', border: '0.5px solid #e4e4e7', padding: '36px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#71717a', marginBottom: '16px', letterSpacing: '0.5px' }}>MONTHLY</div>
              <div style={{ fontSize: '3rem', fontWeight: '900', color: '#18181b', lineHeight: '1' }}>$19<span style={{ fontSize: '1.2rem', fontWeight: '600' }}>.99</span></div>
              <div style={{ fontSize: '0.9rem', color: '#71717a', marginBottom: '28px' }}>per month</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', textAlign: 'left' }}>
                {['Kiosk check-in system', 'Staff dashboard', 'Admin controls', 'Stand-alone system', 'Unlimited customers'].map(item => (
                  <li key={item} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.9rem', color: '#52525b', marginBottom: '10px' }}>
                    <span style={{ color: '#e03b1f', fontWeight: '800' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => scrollTo('signup')} style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '10px', background: '#f4f4f5', color: '#18181b', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '0.95rem' }}>
                Get Started
              </button>
            </div>

            {/* Annual */}
            <div style={{ background: '#18181b', borderRadius: '20px', border: '2px solid #e03b1f', padding: '36px 28px', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#e03b1f', color: 'white', fontSize: '0.75rem', fontWeight: '800', padding: '4px 16px', borderRadius: '20px', whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>
                BEST VALUE — SAVE $40
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#71717a', marginBottom: '16px', letterSpacing: '0.5px' }}>ANNUAL</div>
              <div style={{ fontSize: '3rem', fontWeight: '900', color: '#ffffff', lineHeight: '1' }}>$199<span style={{ fontSize: '1.2rem', fontWeight: '600' }}>.99</span></div>
              <div style={{ fontSize: '0.9rem', color: '#71717a', marginBottom: '28px' }}>per year · ~$16.67/mo</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', textAlign: 'left' }}>
                {['Everything in monthly', '2 months free', 'Priority support', 'Early access features', 'Locked-in rate guarantee'].map(item => (
                  <li key={item} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '10px' }}>
                    <span style={{ color: '#e03b1f', fontWeight: '800' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => scrollTo('signup')} style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '10px', background: '#e03b1f', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '0.95rem' }}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Signup Form ── */}
      <section id="signup" style={{ padding: '80px 40px', background: '#ffffff' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#18181b', marginBottom: '8px', textAlign: 'center' }}>
            Create your shop
          </h2>
          <p style={{ color: '#71717a', textAlign: 'center', marginBottom: '40px' }}>
            Get set up in under 2 minutes.
          </p>

          {/* Plan selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
            {(['monthly', 'annual'] as Plan[]).map(plan => (
              <button key={plan} onClick={() => set('plan', plan)} style={{ padding: '16px', borderRadius: '12px', border: form.plan === plan ? '2px solid #e03b1f' : '0.5px solid #e4e4e7', background: form.plan === plan ? '#fff5f3' : '#ffffff', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontWeight: '800', color: '#18181b', fontSize: '0.95rem', marginBottom: '4px', textTransform: 'capitalize' }}>{plan}</div>
                <div style={{ fontWeight: '700', color: '#e03b1f', fontSize: '1.1rem' }}>{plan === 'monthly' ? '$19.99/mo' : '$199.99/yr'}</div>
                {plan === 'annual' && <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '2px' }}>Save $40 vs monthly</div>}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <input placeholder="First name" value={form.firstName} onChange={e => set('firstName', e.target.value)} style={inputStyle(!!errors.firstName)} />
                {errors.firstName && <p style={{ color: '#e03b1f', fontSize: '0.8rem', margin: '4px 0 0' }}>{errors.firstName}</p>}
              </div>
              <div>
                <input placeholder="Last name" value={form.lastName} onChange={e => set('lastName', e.target.value)} style={inputStyle(!!errors.lastName)} />
                {errors.lastName && <p style={{ color: '#e03b1f', fontSize: '0.8rem', margin: '4px 0 0' }}>{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <input type="email" placeholder="Email address" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle(!!errors.email)} />
              {errors.email && <p style={{ color: '#e03b1f', fontSize: '0.8rem', margin: '4px 0 0' }}>{errors.email}</p>}
            </div>

            <div>
              <input placeholder="Shop name" value={form.shopName} onChange={e => set('shopName', e.target.value)} style={inputStyle(!!errors.shopName)} />
              {form.shopName && (
                <p style={{ color: '#71717a', fontSize: '0.8rem', margin: '4px 0 0' }}>
                  Staff: <strong>{slugify(form.shopName)}_staff</strong> · Kiosk: <strong>{slugify(form.shopName)}_kiosk</strong>
                </p>
              )}
              {errors.shopName && <p style={{ color: '#e03b1f', fontSize: '0.8rem', margin: '4px 0 0' }}>{errors.shopName}</p>}
            </div>

            <div>
              <input type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={e => set('password', e.target.value)} style={inputStyle(!!errors.password)} />
              {errors.password && <p style={{ color: '#e03b1f', fontSize: '0.8rem', margin: '4px 0 0' }}>{errors.password}</p>}
            </div>

            <div>
              <input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} style={inputStyle(!!errors.confirmPassword)} />
              {errors.confirmPassword && <p style={{ color: '#e03b1f', fontSize: '0.8rem', margin: '4px 0 0' }}>{errors.confirmPassword}</p>}
            </div>

            <div style={{ background: '#f9f9f9', borderRadius: '10px', padding: '14px 16px', fontSize: '0.85rem', color: '#71717a', lineHeight: '1.5', border: '0.5px solid #e4e4e7' }}>
              <strong style={{ color: '#18181b' }}>⚡ Test mode active</strong> — No payment required during beta. Your shop and all accounts are created instantly.
            </div>

            <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '18px', borderRadius: '12px', background: loading ? '#f0a090' : '#e03b1f', color: 'white', border: 'none', fontSize: '1.05rem', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}>
              {loading ? 'Setting up your shop...' : `Create Shop — ${form.plan === 'monthly' ? '$19.99/mo' : '$199.99/yr'}`}
            </button>

            <p style={{ textAlign: 'center', color: '#71717a', fontSize: '0.9rem', margin: 0 }}>
              Already have an account?{' '}
              <a href="/" style={{ color: '#e03b1f', fontWeight: '700', textDecoration: 'none' }}>Sign in</a>
            </p>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" style={{ padding: '72px 40px 60px', background: '#18181b', textAlign: 'center' }}>
        <Image
          src="/WrenchOps_Logo.png"
          alt="WrenchOps"
          width={200}
          height={80}
          style={{ objectFit: 'contain', marginBottom: '24px' }}
        />
        <h2 style={{ color: '#ffffff', fontSize: '1.8rem', fontWeight: '800', marginBottom: '12px' }}>
          Questions? We're here.
        </h2>
        <p style={{ color: '#71717a', marginBottom: '28px', fontSize: '1rem', maxWidth: '440px', margin: '0 auto 28px', lineHeight: '1.6' }}>
          Reach out anytime and we'll get back to you within one business day.
        </p>
        <a
          href="mailto:support@wrenchops.org"
          style={{
            display: 'inline-block',
            padding: '14px 36px',
            borderRadius: '10px',
            background: '#e03b1f',
            color: 'white',
            fontWeight: '700',
            textDecoration: 'none',
            fontSize: '0.95rem',
            marginBottom: '48px',
          }}
        >
          Contact Us →
        </a>

        {/* Footer links + copyright */}
        <div style={{ borderTop: '0.5px solid #2e2e31', paddingTop: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="/privacy-policy" style={{ color: '#71717a', fontSize: '0.85rem', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/terms-of-service" style={{ color: '#71717a', fontSize: '0.85rem', textDecoration: 'none' }}>Terms of Service</a>
            <a href="mailto:support@wrenchops.org" style={{ color: '#71717a', fontSize: '0.85rem', textDecoration: 'none' }}>support@wrenchops.org</a>
          </div>
          <p style={{ color: '#52525b', fontSize: '0.85rem', margin: 0 }}>
            © {new Date().getFullYear()} WrenchOps. All rights reserved.
          </p>
        </div>
      </section>

    </div>
  )
}