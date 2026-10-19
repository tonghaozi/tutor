import type { UserInfo, UserRole } from '@/types'
import { ADMIN_PHONE } from '@/constants'
import { auth, db } from '@/lib/cloudbase'

interface UserRow {
  id: number | string
  uid: string
  phone: string
  name: string
  role: UserRole
  avatar: string | null
  created_at: string
}

const ROLES: UserRole[] = ['student', 'teacher', 'admin']

function isRole(value: unknown): value is UserRole {
  return typeof value === 'string' && ROLES.some((role) => role === value)
}

function asId(value: unknown): string | null {
  if (typeof value === 'string' && value) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

function asText(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function toRow(value: unknown): UserRow | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const id = asId(row.id)
  const uid = asText(row.uid)
  const phone = asText(row.phone)
  const name = asText(row.name)
  const createdAt = asText(row.created_at)
  if (!id || !uid || !phone || !name || !createdAt || !isRole(row.role)) return null
  const avatar = row.avatar == null ? null : asText(row.avatar)
  if (row.avatar != null && avatar == null) return null
  return {
    id,
    uid,
    phone,
    name,
    role: row.role,
    avatar,
    created_at: createdAt,
  }
}

function toUserInfo(row: UserRow): UserInfo {
  return {
    id: String(row.id),
    phone: row.phone,
    name: row.name,
    role: row.role,
    avatar: row.avatar ?? undefined,
    createdAt: row.created_at,
  }
}

function rowsOf(data: unknown): UserRow[] {
  const list = Array.isArray(data) ? data : data ? [data] : []
  return list.map((item) => {
    const row = toRow(item)
    if (!row) throw new Error('用户数据格式不正确')
    return row
  })
}

function assertOk(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

export function localPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.startsWith('86') && digits.length === 13 ? digits.slice(2) : digits
}

export function assertLocalPhone(value: string): string {
  const phone = localPhone(value)
  if (!/^1\d{10}$/.test(phone)) {
    throw new Error('请输入正确的手机号')
  }
  return phone
}

export function authPhone(phone: string): string {
  return `+86${assertLocalPhone(phone)}`
}

export async function currentSessionUser() {
  const { data, error } = await auth.getSession()
  if (error) throw new Error(error.message)
  const session = data.session
  if (!session || session.user.is_anonymous) return null
  const id = asId(session.user.id)
  if (!id) throw new Error('登录结果缺少用户标识')
  const phoneValue = session.user.phone
  const phone = typeof phoneValue === 'string' && phoneValue ? localPhone(phoneValue) : ''
  return { id, phone }
}

async function selectUsers(column: 'uid' | 'id', value: string): Promise<UserRow[]> {
  const { data, error } = await db.from('users').select('*').eq(column, value)
  assertOk(error)
  return rowsOf(data)
}

export async function syncOwnProfile(phone: string, role: UserRole): Promise<UserInfo> {
  const sessionUser = await currentSessionUser()
  if (!sessionUser) throw new Error('请先登录')
  if (sessionUser.phone && sessionUser.phone !== phone) {
    throw new Error('验证码对应的手机号与输入不一致')
  }

  const existing = await selectUsers('uid', sessionUser.id)
  const current = existing[0]
  if (!current) {
    const name = phone === ADMIN_PHONE ? '平台管理员' : `用户${phone.slice(-4)}`
    const { data, error } = await db
      .from('users')
      .insert({
        phone,
        name,
        role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
      })
      .select()
    assertOk(error)
    const created = rowsOf(data)[0]
    if (!created) throw new Error('创建用户资料失败')
    return toUserInfo(created)
  }

  if (current.role === role && current.phone === phone) return toUserInfo(current)

  const { data, error } = await db.from('users').update({ role }).eq('uid', sessionUser.id).select()
  assertOk(error)
  const updated = rowsOf(data)[0]
  if (!updated) throw new Error('更新用户资料失败')
  return toUserInfo(updated)
}

export async function loadOwnProfile(): Promise<UserInfo | null> {
  const sessionUser = await currentSessionUser()
  if (!sessionUser) return null
  const rows = await selectUsers('uid', sessionUser.id)
  return rows[0] ? toUserInfo(rows[0]) : null
}

export async function listUsers(): Promise<UserInfo[]> {
  const { data, error } = await db.from('users').select('*').order('created_at', { ascending: false })
  assertOk(error)
  return rowsOf(data).map(toUserInfo)
}

export async function updateUserRole(id: string, role: UserRole): Promise<UserInfo> {
  const { data, error } = await db.from('users').update({ role }).eq('id', id).select()
  assertOk(error)
  const updated = rowsOf(data)[0]
  if (!updated) throw new Error('更新角色失败')
  return toUserInfo(updated)
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await db.from('users').delete().eq('id', id)
  assertOk(error)
}
