import { defineStore } from 'pinia'
import type { UserGender, UserInfo, UserRole } from '@/types'
import { getToken, request, setToken } from '@/lib/http'
import { getDeviceId } from '@/utils/smsLimit'
import { rsaEncryptPassword } from '@/utils/rsa'

interface UserState {
  userInfo: UserInfo | null
  users: UserInfo[]
  sessionChecked: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userInfo: null,
    users: [],
    sessionChecked: false,
  }),
  getters: {
    isLogin: (state) => Boolean(state.userInfo),
    isAdmin: (state) => state.userInfo?.role === 'admin',
  },
  actions: {
    clearLocalSession() {
      this.userInfo = null
      this.users = []
      this.sessionChecked = true
      setToken(null)
    },

    async restoreSession() {
      if (this.sessionChecked) return
      await this.pullSession()
    },

    async pullSession() {
      if (!getToken()) {
        this.userInfo = null
        this.sessionChecked = true
        return
      }
      try {
        this.userInfo = await request<UserInfo>('/auth/me')
      } catch {
        setToken(null)
        this.userInfo = null
      }
      this.sessionChecked = true
    },

    async sendCode(phone: string) {
      return request<{ message: string; registered: boolean; cooldown?: number }>('/auth/send-code', {
        method: 'POST',
        data: { phone, deviceId: getDeviceId() },
      })
    },

    async loginByPhone(
      phone: string,
      code: string,
      role: UserRole = 'student',
      profile?: { gender: UserGender; age: number },
    ): Promise<UserInfo> {
      const result = await request<{ token: string; user: UserInfo }>('/auth/login', {
        method: 'POST',
        data: {
          method: 'code',
          phone,
          code,
          role,
          ...(profile ? { gender: profile.gender, age: profile.age } : {}),
        },
      })
      setToken(result.token)
      this.userInfo = result.user
      this.sessionChecked = true
      return result.user
    },

    async loginByPassword(phone: string, password: string, role: UserRole = 'student'): Promise<UserInfo> {
      const encryptedPassword = await rsaEncryptPassword(password)
      const result = await request<{ token: string; user: UserInfo }>('/auth/login', {
        method: 'POST',
        data: { method: 'password', phone, password: encryptedPassword, role },
      })
      setToken(result.token)
      this.userInfo = result.user
      this.sessionChecked = true
      return result.user
    },

    async registerByPassword(
      phone: string,
      password: string,
      role: UserRole = 'student',
      profile: { gender: UserGender; age: number },
    ): Promise<UserInfo> {
      const encryptedPassword = await rsaEncryptPassword(password)
      const result = await request<{ token: string; user: UserInfo }>('/auth/register', {
        method: 'POST',
        data: {
          phone,
          password: encryptedPassword,
          role,
          gender: profile.gender,
          age: profile.age,
        },
      })
      setToken(result.token)
      this.userInfo = result.user
      this.sessionChecked = true
      return result.user
    },

    async updateProfile(payload: { name?: string; gender?: UserGender; age?: number }) {
      const updated = await request<UserInfo>('/auth/profile', {
        method: 'PATCH',
        data: payload,
      })
      this.userInfo = updated
      return updated
    },

    async changePhone(phone: string, code: string) {
      const updated = await request<UserInfo>('/auth/change-phone', {
        method: 'POST',
        data: { phone, code },
      })
      this.userInfo = updated
      return updated
    },

    async uploadAvatar(avatarDataUrl: string) {
      const updated = await request<UserInfo>('/auth/avatar', {
        method: 'POST',
        data: { avatar: avatarDataUrl },
      })
      this.userInfo = updated
      return updated
    },

    async logout() {
      try {
        if (getToken()) {
          await request('/auth/logout', { method: 'POST' })
        }
      } finally {
        this.clearLocalSession()
      }
    },

    async changePassword(payload: {
      method: 'code' | 'password'
      code?: string
      oldPassword?: string
      newPassword: string
    }) {
      const data: Record<string, string> = {
        method: payload.method,
        newPassword: await rsaEncryptPassword(payload.newPassword),
      }
      if (payload.code) data.code = payload.code
      if (payload.oldPassword) {
        data.oldPassword = await rsaEncryptPassword(payload.oldPassword)
      }
      return request<{ ok: boolean; message: string }>('/auth/change-password', {
        method: 'POST',
        data,
      })
    },

    async fetchUsers() {
      this.users = await request<UserInfo[]>('/users')
    },

    async updateUser(id: string, payload: Partial<UserInfo>) {
      if (!payload.role) return
      const updated = await request<UserInfo>(`/users/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        data: { role: payload.role },
      })
      const index = this.users.findIndex((user) => user.id === id)
      if (index >= 0) this.users[index] = updated
      if (this.userInfo?.id === id) this.userInfo = updated
    },

    async removeUser(id: string) {
      await request(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
      this.users = this.users.filter((user) => user.id !== id)
      if (this.userInfo?.id === id) this.userInfo = null
    },
  },
})

export function bindAuthListener() {
  // 登录态保存在本机 token 里，不再监听云开发会话。
}
