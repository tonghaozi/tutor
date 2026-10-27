import axios, { type AxiosRequestConfig, isAxiosError } from 'axios'
import { errorMessage } from '@/utils'

const TOKEN_KEY = 'tonghao_token'
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export const http = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    // 必须去掉默认 application/json，否则 multipart 解析失败
    if (typeof config.headers.set === 'function') {
      config.headers.set('Content-Type', false as unknown as string)
    } else {
      delete (config.headers as Record<string, unknown>)['Content-Type']
    }
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error)) {
      const payload = error.response?.data
      const message =
        payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : error.response
            ? `请求失败（${error.response.status}）`
            : '网络请求失败'
      return Promise.reject(new Error(message))
    }
    return Promise.reject(error)
  },
)

export async function request<T>(path: string, config: AxiosRequestConfig = {}): Promise<T> {
  const response = await http.request<T>({ url: path, ...config })
  return response.data
}

export function apiError(error: unknown, fallback: string) {
  return errorMessage(error, fallback)
}
