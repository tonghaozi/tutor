/**
 * 业务接口：老师、需求、评论、咨询走后端 HTTP API，登录仍走 CloudBase Auth。
 */
import { request } from '@/lib/http'
import { useCommentStore, useDemandStore, useTeacherStore, useUserStore } from '@/store'
import type {
  AuditStatus,
  Comment,
  ConsultForm,
  Demand,
  Teacher,
  TeacherFilter,
  UserRole,
} from '@/types'

export async function apiLogin(phone: string, code: string, role: UserRole = 'student') {
  return useUserStore().loginByPhone(phone, code, role)
}

export async function apiSendCode(phone: string) {
  return useUserStore().sendCode(phone)
}

function teacherQuery(filter: TeacherFilter) {
  const params = new URLSearchParams()
  if (filter.keyword) params.set('keyword', filter.keyword)
  if (filter.subject) params.set('subject', filter.subject)
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
    body: JSON.stringify(payload),
  })
}

export async function apiAuditTeacher(id: string, status: AuditStatus, reason = '') {
  const teacher = await request<Teacher>(`/teachers/${encodeURIComponent(id)}/audit`, {
    method: 'POST',
    body: JSON.stringify({ status, reason }),
  })
  useTeacherStore().upsert(teacher)
  return teacher
}

export async function apiGetDemands() {
  return request<Demand[]>('/demands')
}

export async function apiLoadDemands() {
  const list = await request<Demand[]>('/demands?scope=all')
  useDemandStore().setList(list)
  return list
}

export async function apiPublishDemand(payload: Omit<Demand, 'id' | 'status' | 'createdAt'>) {
  return request<Demand>('/demands', {
    method: 'POST',
    body: JSON.stringify(payload),
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
    body: JSON.stringify({ visible }),
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
    body: JSON.stringify(form),
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
