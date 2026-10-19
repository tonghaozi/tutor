import { auth } from '@/lib/cloudbase'
import { errorMessage } from '@/utils'

const base = import.meta.env.VITE_API_BASE_URL || '/api'

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await auth.getSession()
  const token = data.session?.access_token
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${base}${path}`, { ...init, headers })
  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `请求失败（${response.status}）`
    throw new Error(message)
  }
  return payload as T
}

export function apiError(error: unknown, fallback: string) {
  return errorMessage(error, fallback)
}
