import { defineStore } from 'pinia'
import type { UserInfo, UserRole } from '@/types'
import { ADMIN_PHONE, MOCK_SMS_CODE } from '@/constants'
import { mockUsers } from '@/mock/users'
import { uid } from '@/utils'

interface UserState {
  token: string
  userInfo: UserInfo | null
  users: UserInfo[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: '',
    userInfo: null,
    users: [...mockUsers],
  }),
  getters: {
    isLogin: (state) => Boolean(state.token && state.userInfo),
    isAdmin: (state) => state.userInfo?.role === 'admin',
  },
  actions: {
    async sendCode(phone: string) {
      if (!/^1\d{10}$/.test(phone)) {
        throw new Error('请输入正确的手机号')
      }
      return { code: MOCK_SMS_CODE, message: `验证码已发送（演示码：${MOCK_SMS_CODE}）` }
    },

    async loginByPhone(phone: string, code: string, role: UserRole = 'student'): Promise<UserInfo> {
      if (!/^1\d{10}$/.test(phone)) {
        throw new Error('请输入正确的手机号')
      }
      if (code !== MOCK_SMS_CODE) {
        throw new Error(`验证码错误（演示请填 ${MOCK_SMS_CODE}）`)
      }

      const finalRole: UserRole = phone === ADMIN_PHONE ? 'admin' : role
      let user = this.users.find((u) => u.phone === phone)

      if (!user) {
        user = {
          id: uid('u'),
          phone,
          name: finalRole === 'admin' ? '平台管理员' : `用户${phone.slice(-4)}`,
          role: finalRole,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
          createdAt: new Date().toISOString(),
        }
        this.users.push(user)
      } else if (phone !== ADMIN_PHONE && role !== user.role) {
        user.role = role
      }

      this.token = `mock_token_${user.id}`
      this.userInfo = { ...user }
      return user
    },

    logout() {
      this.token = ''
      this.userInfo = null
    },

    setSession(token: string, user: UserInfo) {
      this.token = token
      this.userInfo = { ...user }
      const idx = this.users.findIndex((u) => u.id === user.id)
      if (idx === -1) {
        this.users.push({ ...user })
      } else {
        this.users[idx] = { ...user }
      }
    },

    updateUser(id: string, payload: Partial<UserInfo>) {
      const idx = this.users.findIndex((u) => u.id === id)
      if (idx === -1) return
      this.users[idx] = { ...this.users[idx], ...payload }
      if (this.userInfo?.id === id) {
        this.userInfo = { ...this.users[idx] }
      }
    },

    removeUser(id: string) {
      this.users = this.users.filter((u) => u.id !== id)
    },
  },
  persist: {
    pick: ['token', 'userInfo', 'users'],
  },
})
