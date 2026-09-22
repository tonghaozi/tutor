import type { UserInfo } from '@/types'
import { ADMIN_PHONE } from '@/constants'

export const mockUsers: UserInfo[] = [
  {
    id: 'u_admin',
    phone: ADMIN_PHONE,
    name: '平台管理员',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    createdAt: '2025-10-01T00:00:00.000Z',
  },
  {
    id: 'u1',
    phone: '13855120001',
    name: '学员小雨',
    role: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Student1',
    createdAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'u2',
    phone: '13955110001',
    name: '陈一诺',
    role: 'teacher',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ChenYinuo',
    createdAt: '2025-11-02T00:00:00.000Z',
  },
]
