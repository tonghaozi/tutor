import { defineStore } from 'pinia'
import type { UserInfo, UserRole } from '@/types'
import { ADMIN_PHONE } from '@/constants'
import { auth } from '@/lib/cloudbase'
import {
  assertLocalPhone,
  authPhone,
  deleteUser,
  listUsers,
  loadOwnProfile,
  syncOwnProfile,
  updateUserRole,
} from '@/lib/users'
import { errorMessage } from '@/utils'

type VerifyOtp = (params: { token: string }) => Promise<{
  data: { session?: { user: { is_anonymous: boolean } } | null }
  error: { message: string } | null
}>

let verifyOtp: VerifyOtp | null = null
let pendingRestore: Promise<void> | null = null

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
      verifyOtp = null
    },

    async restoreSession() {
      if (this.sessionChecked) return
      if (!pendingRestore) {
        pendingRestore = this.pullSession().finally(() => {
          pendingRestore = null
        })
      }
      await pendingRestore
    },

    async pullSession() {
      const profile = await loadOwnProfile()
      this.userInfo = profile
      this.sessionChecked = true
    },

    async sendCode(phone: string) {
      const local = assertLocalPhone(phone)
      const { data, error } = await auth.signInWithOtp({
        phone: authPhone(local),
        options: { shouldCreateUser: true },
      })
      if (error || !data.verifyOtp) {
        throw new Error(error?.message || '验证码发送失败')
      }
      verifyOtp = data.verifyOtp
      return { message: '验证码已发送，请查看短信' }
    },

    async loginByPhone(phone: string, code: string, role: UserRole = 'student'): Promise<UserInfo> {
      const local = assertLocalPhone(phone)
      if (!code.trim()) throw new Error('请输入验证码')
      if (role === 'admin' && local !== ADMIN_PHONE) {
        throw new Error('只有管理员手机号可以管理员身份登录')
      }
      if (!verifyOtp) throw new Error('请先获取验证码')

      const { data, error } = await verifyOtp({ token: code.trim() })
      if (error || !data.session || data.session.user.is_anonymous) {
        throw new Error(error?.message || '登录失败')
      }
      verifyOtp = null

      const finalRole: UserRole = local === ADMIN_PHONE ? 'admin' : role
      const profile = await syncOwnProfile(local, finalRole)
      this.userInfo = profile
      this.sessionChecked = true
      return profile
    },

    async logout() {
      const result = await auth.signOut()
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        throw new Error(errorMessage(result.error, '退出失败'))
      }
      this.clearLocalSession()
    },

    async fetchUsers() {
      this.users = await listUsers()
    },

    async updateUser(id: string, payload: Partial<UserInfo>) {
      if (!payload.role) return
      const updated = await updateUserRole(id, payload.role)
      const index = this.users.findIndex((user) => user.id === id)
      if (index >= 0) this.users[index] = updated
      if (this.userInfo?.id === id) this.userInfo = updated
    },

    async removeUser(id: string) {
      await deleteUser(id)
      this.users = this.users.filter((user) => user.id !== id)
      if (this.userInfo?.id === id) this.userInfo = null
    },
  },
})

export function bindAuthListener() {
  const userStore = useUserStore()
  auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') userStore.clearLocalSession()
  })
}
