/** 通用类型定义 - 便于后续迁移 UniApp / 对接真实 API */

export type UserRole = 'student' | 'teacher' | 'admin'

export type UserGender = 'male' | 'female'

export type AuditStatus = 'pending' | 'approved' | 'rejected'

export type TeachMode = 'offline' | 'online' | 'both'

export type Subject =
  | '吉他'
  | '尤克里里'
  | '钢琴'
  | '电子琴'
  | '声乐'
  | '小提琴'
  | '大提琴'
  | '古筝'
  | '二胡'
  | '琵琶'
  | '笛子'
  | '萨克斯'
  | '长笛'
  | '单簧管'
  | '架子鼓'
  | '非洲鼓'
  | '口琴'
  | '音乐理论'
  | '视唱练耳'

/** 省市区路径，如「安徽省/合肥市/蜀山区」 */
export type RegionPath = string

export interface UserInfo {
  id: string
  phone: string
  name: string
  role: UserRole
  avatar?: string
  gender?: UserGender
  age?: number
  createdAt: string
}

export interface Teacher {
  id: string
  userId?: string
  name: string
  phone: string
  avatar: string
  gender?: UserGender
  age?: number
  subjects: Subject[]
  districts: RegionPath[]
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
  district: RegionPath
  budget: number
  schedule: string
  teachMode: TeachMode
  remark: string
  phone: string
  gender?: UserGender
  age?: number
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
  district?: RegionPath | ''
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
