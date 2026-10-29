/**
 * 业务接口和登录都走服务器上的后端。域名未备案，先用 IP。
 */
import { request } from '@/lib/http'
import { useCommentStore, useDemandStore, useTeacherStore, useUserStore } from '@/store'
import type {
  AuditStatus,
  Comment,
  ConsultForm,
  Demand,
  DemandFilter,
  PlatformMeta,
  Teacher,
  TeacherFilter,
  UserGender,
  UserRole,
} from '@/types'

export async function apiLogin(
  phone: string,
  code: string,
  role: UserRole = 'student',
  profile?: { gender: UserGender; age: number },
) {
  return useUserStore().loginByPhone(phone, code, role, profile)
}

export async function apiLoginByPassword(phone: string, password: string, role: UserRole = 'student') {
  return useUserStore().loginByPassword(phone, password, role)
}

export async function apiRegisterByPassword(
  phone: string,
  password: string,
  role: UserRole = 'student',
  profile: { gender: UserGender; age: number },
) {
  return useUserStore().registerByPassword(phone, password, role, profile)
}

export async function apiUpdateProfile(payload: { name?: string; gender?: UserGender; age?: number }) {
  return useUserStore().updateProfile(payload)
}

export async function apiChangePhone(phone: string, code: string) {
  return useUserStore().changePhone(phone, code)
}

export async function apiUploadAvatar(avatarDataUrl: string) {
  return useUserStore().uploadAvatar(avatarDataUrl)
}

export async function apiSendCode(phone: string) {
  return useUserStore().sendCode(phone)
}

export async function apiChangePassword(payload: {
  method: 'code' | 'password'
  code?: string
  oldPassword?: string
  newPassword: string
}) {
  return useUserStore().changePassword(payload)
}

function teacherQuery(filter: TeacherFilter) {
  const params = new URLSearchParams()
  if (filter.keyword) params.set('keyword', filter.keyword)
  if (filter.subject) params.set('subject', filter.subject)
  if (filter.stage) params.set('stage', filter.stage)
  if (filter.district) params.set('district', filter.district)
  if (filter.teachMode) params.set('teachMode', filter.teachMode)
  if (filter.priceMin != null) params.set('priceMin', String(filter.priceMin))
  if (filter.priceMax != null) params.set('priceMax', String(filter.priceMax))
  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function apiGetTeachers(filter: TeacherFilter = {}) {
  return request<Teacher[]>(`/teachers${teacherQuery(filter)}`)
}

export async function apiLoadTeachers() {
  const list = await request<Teacher[]>('/teachers?scope=all')
  useTeacherStore().setList(list)
  return list
}

export async function apiGetHotTeachers() {
  return request<Teacher[]>('/teachers/hot')
}

export async function apiGetTeacherDetail(id: string) {
  return request<Teacher>(`/teachers/${encodeURIComponent(id)}`)
}

export async function apiSubmitTeacherJoin(
  payload: Omit<Teacher, 'id' | 'status' | 'rating' | 'reviewCount' | 'createdAt' | 'isHot'>,
) {
  return request<Teacher>('/teachers', {
    method: 'POST',
    data: payload,
  })
}

export async function apiGetMeta() {
  return request<PlatformMeta>('/meta')
}

export async function apiAuditTeacher(id: string, status: AuditStatus, reason = '') {
  const teacher = await request<Teacher>(`/teachers/${encodeURIComponent(id)}/audit`, {
    method: 'POST',
    data: { status, reason },
  })
  useTeacherStore().upsert(teacher)
  return teacher
}

function demandQuery(filter: DemandFilter = {}) {
  const params = new URLSearchParams()
  if (filter.keyword) params.set('keyword', filter.keyword)
  if (filter.subject) params.set('subject', filter.subject)
  if (filter.stage) params.set('stage', filter.stage)
  if (filter.district) params.set('district', filter.district)
  if (filter.teachMode) params.set('teachMode', filter.teachMode)
  if (filter.budgetMin != null) params.set('budgetMin', String(filter.budgetMin))
  if (filter.budgetMax != null) params.set('budgetMax', String(filter.budgetMax))
  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function apiGetDemands(filter: DemandFilter = {}) {
  return request<Demand[]>(`/demands${demandQuery(filter)}`)
}

export async function apiGetDemandDetail(id: string) {
  return request<Demand>(`/demands/${encodeURIComponent(id)}`)
}

export async function apiLoadDemands() {
  const list = await request<Demand[]>('/demands?scope=all')
  useDemandStore().setList(list)
  return list
}

export async function apiPublishDemand(payload: Omit<Demand, 'id' | 'status' | 'createdAt'>) {
  return request<Demand>('/demands', {
    method: 'POST',
    data: payload,
  })
}

export async function apiCloseDemand(id: string) {
  const demand = await request<Demand>(`/demands/${encodeURIComponent(id)}/close`, { method: 'POST' })
  useDemandStore().upsert(demand)
  return demand
}

export async function apiRemoveDemand(id: string) {
  await request<{ ok: boolean }>(`/demands/${encodeURIComponent(id)}`, { method: 'DELETE' })
  useDemandStore().remove(id)
}

export async function apiGetComments(teacherId: string) {
  return request<Comment[]>(`/comments?teacherId=${encodeURIComponent(teacherId)}`)
}

export async function apiLoadComments() {
  const list = await request<Comment[]>('/comments?scope=all')
  useCommentStore().setList(list)
  return list
}

export async function apiSetCommentVisible(id: string, visible: boolean) {
  const comment = await request<Comment>(`/comments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    data: { visible },
  })
  useCommentStore().upsert(comment)
  return comment
}

export async function apiRemoveComment(id: string) {
  await request<{ ok: boolean }>(`/comments/${encodeURIComponent(id)}`, { method: 'DELETE' })
  useCommentStore().remove(id)
}

export async function apiSubmitConsult(form: ConsultForm) {
  return request<{ success: boolean; message: string }>('/consults', {
    method: 'POST',
    data: form,
  })
}

export async function apiGetDashboard() {
  return request<{
    teacherCount: number
    studentCount: number
    pendingCount: number
    demandCount: number
    commentCount: number
  }>('/dashboard')
}
