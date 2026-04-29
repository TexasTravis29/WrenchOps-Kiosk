import { supabase } from './supabase'

export type AuthUser = {
  id: string
  shop_id: string
  shop_name: string
  name: string
  role: 'kiosk' | 'staff' | 'admin' | 'superadmin'
}

export async function login(username: string, password: string): Promise<AuthUser | null> {
  const { data: user } = await supabase
    .from('users')
    .select('id, shop_id, name, role, shops(name)')
    .eq('password', password)
    .eq('name', username)
    .eq('is_active', true)
    .single()

  if (!user) return null

  return {
    id: user.id,
    shop_id: user.shop_id,
    shop_name: (user.shops as any)?.name || '',
    name: user.name,
    role: user.role,
  }
}

export function saveSession(user: AuthUser) {
  localStorage.setItem('wrenchops_user', JSON.stringify(user))
}

export function getSession(): AuthUser | null {
  const stored = localStorage.getItem('wrenchops_user')
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem('wrenchops_user')
  localStorage.removeItem('checkin_customer')
  localStorage.removeItem('checkin_services')
  localStorage.removeItem('checkin_upsells')
  localStorage.removeItem('checkin_keytag')
}