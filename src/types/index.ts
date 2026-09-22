/** 通用类型定义 - 便于后续迁移 UniApp / 对接真实 API */

export type UserRole = 'student' | 'teacher' | 'admin'

export type AuditStatus = 'pending' | 'approved' | 'rejected'

export type TeachMode = 'offline' | 'online' | 'both'

export type Subject = '吉他' | '钢琴' | '文化课' | '英语' | '数学' | '语文'

export type HefeiDistrict =
  | '瑶海区'
  | '庐阳区'
  | '蜀山区'
  | '包河区'
  | '长丰县'
  | '肥东县'
  | '肥西县'
  | '庐江县'
  | '巢湖市'

export interface UserInfo {
  id: string
  phone: string
  name: string
  role: UserRole
  avatar?: string
  createdAt: string
}

export interface Teacher {
  id: string
  userId?: string
  name: string
  phone: string
  avatar: string
  subjects: Subject[]
  districts: HefeiDistrict[]
  price: number
  teachMode: TeachMode
  experience: string
  introduction: string
  certificates: string[]
  availableTimes: string[]
  rating: number
  reviewCount: number
  status: AuditStatus
  rejectReason?: string
  createdAt: string
  isHot?: boolean
}

export interface Demand {
  id: string
  userId?: string
  subject: Subject
  district: HefeiDistrict
  budget: number
  schedule: string
  teachMode: TeachMode
  remark: string
  phone: string
  status: 'open' | 'closed'
  createdAt: string
}

export interface Comment {
  id: string
  teacherId: string
  userName: string
  content: string
  rating: number
  createdAt: string
  visible: boolean
}

export interface TeacherFilter {
  keyword?: string
  subject?: Subject | ''
  district?: HefeiDistrict | ''
  teachMode?: TeachMode | ''
  priceMin?: number | null
  priceMax?: number | null
}

export interface ConsultForm {
  teacherId: string
  teacherName: string
  name: string
  phone: string
  message: string
}
