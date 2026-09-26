/**
 * API 层：对接 tonghao-server（Vite 代理 /api -> localhost:8080）
 * 新增接口按下方写法：return axios({ url, method, data/params })
 */
import axios from './request'
import { useUserStore } from '@/store'
import type {
  AuditStatus,
  Comment,
  ConsultForm,
  Demand,
  Teacher,
  TeacherFilter,
  UserInfo,
  UserRole,
} from '@/types'

export async function apiLogin(phone: string, code: string, role: UserRole = 'student') {
  const data = await axios<{ token: string; user: UserInfo }>({
    url: '/api/auth/login',
    method: 'POST',
    data: { phone, code, role },
  })
  useUserStore().setSession(data.token, data.user)
  return data.user
}

export function apiSendCode(phone: string) {
  return axios<{ code: string; message: string }>({
    url: '/api/auth/send-code',
    method: 'POST',
    data: { phone },
  })
}

export function apiGetTeachers(filter: TeacherFilter = {}) {
  return axios<Teacher[]>({
    url: '/api/teachers',
    method: 'GET',
    params: filter,
  })
}

export function apiGetHotTeachers() {
  return axios<Teacher[]>({
    url: '/api/teachers/hot',
    method: 'GET',
  })
}

export function apiGetTeacherDetail(id: string) {
  return axios<Teacher>({
    url: `/api/teachers/${id}`,
    method: 'GET',
  })
}

export function apiSubmitTeacherJoin(
  data: Omit<Teacher, 'id' | 'status' | 'rating' | 'reviewCount' | 'createdAt' | 'isHot'>,
) {
  return axios<Teacher>({
    url: '/api/teachers/join',
    method: 'POST',
    data,
  })
}

export function apiAuditTeacher(id: string, status: AuditStatus, reason = '') {
  return axios<null>({
    url: `/api/admin/teachers/${id}/audit`,
    method: 'PUT',
    data: { status, reason },
  })
}

export function apiGetDemands() {
  return axios<Demand[]>({
    url: '/api/demands',
    method: 'GET',
  })
}

export function apiPublishDemand(data: Omit<Demand, 'id' | 'status' | 'createdAt'>) {
  return axios<Demand>({
    url: '/api/demands',
    method: 'POST',
    data,
  })
}

export function apiGetComments(teacherId: string) {
  return axios<Comment[]>({
    url: `/api/teachers/${teacherId}/comments`,
    method: 'GET',
  })
}

export function apiSubmitConsult(data: ConsultForm) {
  return axios<{ success: boolean; message: string }>({
    url: '/api/consults',
    method: 'POST',
    data,
  })
}

export function apiGetDashboard() {
  return axios<{
    teacherCount: number
    studentCount: number
    pendingCount: number
    demandCount: number
    commentCount: number
  }>({
    url: '/api/admin/dashboard',
    method: 'GET',
  })
}

export function apiAdminTeachers() {
  return axios<Teacher[]>({
    url: '/api/admin/teachers',
    method: 'GET',
  })
}

export function apiAdminUsers() {
  return axios<UserInfo[]>({
    url: '/api/admin/users',
    method: 'GET',
  })
}

export function apiAdminDemands() {
  return axios<Demand[]>({
    url: '/api/admin/demands',
    method: 'GET',
  })
}

export function apiAdminComments() {
  return axios<Comment[]>({
    url: '/api/admin/comments',
    method: 'GET',
  })
}

export function apiAdminUpdateUserRole(id: string, role: UserRole) {
  return axios<null>({
    url: `/api/admin/users/${id}/role`,
    method: 'PUT',
    data: { role },
  })
}

export function apiAdminDeleteUser(id: string) {
  return axios<null>({
    url: `/api/admin/users/${id}`,
    method: 'DELETE',
  })
}

export function apiAdminCloseDemand(id: string) {
  return axios<null>({
    url: `/api/admin/demands/${id}/close`,
    method: 'PUT',
  })
}

export function apiAdminDeleteDemand(id: string) {
  return axios<null>({
    url: `/api/admin/demands/${id}`,
    method: 'DELETE',
  })
}

export function apiAdminSetCommentVisible(id: string, visible: boolean) {
  return axios<null>({
    url: `/api/admin/comments/${id}/visible`,
    method: 'PUT',
    params: { visible },
  })
}

export function apiAdminDeleteComment(id: string) {
  return axios<null>({
    url: `/api/admin/comments/${id}`,
    method: 'DELETE',
  })
}
