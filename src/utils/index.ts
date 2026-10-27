export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = error.message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

/** 简易延迟，模拟网络请求，后续可替换为 uni.request / axios */
export function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function formatDate(value: string | number | Date): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value ?? '')
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

export function defaultAvatar(gender?: string): string {
  return gender === 'female' ? '/avatars/female.jpg' : '/avatars/male.jpg'
}

/** 统一头像地址；支持 data URL / 网络地址 / 默认头像 */
export function resolveAvatar(avatar?: string, gender?: string): string {
  const raw = avatar?.trim()
  if (!raw) return defaultAvatar(gender)
  if (raw.startsWith('data:image/') || raw.startsWith('blob:') || /^https?:\/\//i.test(raw)) {
    return raw
  }
  // 兼容历史 /uploads 路径；若不可访问则回退默认头像由 img onerror 处理
  if (raw.startsWith('/uploads/')) {
    const filePart = raw.split('/').pop() || raw
    return `${raw}?v=${encodeURIComponent(filePart)}`
  }
  if (raw.startsWith('/avatars/')) return raw
  return defaultAvatar(gender)
}

/** 设置/注册/修改密码：6-32 位，英文字母 + 数字 */
export const PASSWORD_RULE_HINT = '6-32 位，需同时包含英文字母和数字'

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 6 &&
    password.length <= 32 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  )
}

export function passwordRuleError(password: string): string | null {
  if (password.length < 6 || password.length > 32) return '密码长度需要 6 到 32 位'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return '密码需同时包含英文字母和数字'
  }
  return null
}
