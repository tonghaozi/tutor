/**
 * API 层：当前走 Pinia mock，后续可替换为 uni.request / HTTP
 */
import { delay } from '@/utils'
import { useTeacherStore, useDemandStore, useCommentStore, useUserStore } from '@/store'
import type {
  AuditStatus,
  ConsultForm,
  Demand,
  Teacher,
  TeacherFilter,
  UserRole,
} from '@/types'

export async function apiLogin(phone: string, code: string, role: UserRole = 'student') {
  await delay()
  return useUserStore().loginByPhone(phone, code, role)
}

export async function apiSendCode(phone: string) {
  await delay()
  return useUserStore().sendCode(phone)
}

export async function apiGetTeachers(filter: TeacherFilter = {}) {
  await delay()
  return useTeacherStore().search(filter, true)
}

export async function apiGetHotTeachers() {
  await delay()
  const store = useTeacherStore()
  const hot = store.hotList
  return hot.length ? hot : store.approvedList.slice(0, 4)
}

export async function apiGetTeacherDetail(id: string) {
  await delay()
  const teacher = useTeacherStore().getById(id)
  if (!teacher || teacher.status !== 'approved') {
    throw new Error('老师不存在或未通过审核')
  }
  return teacher
}

export async function apiSubmitTeacherJoin(
  payload: Omit<Teacher, 'id' | 'status' | 'rating' | 'reviewCount' | 'createdAt' | 'isHot'>,
) {
  await delay(300)
  return useTeacherStore().submitJoin(payload)
}

export async function apiAuditTeacher(id: string, status: AuditStatus, reason = '') {
  await delay()
  useTeacherStore().audit(id, status, reason)
}

export async function apiGetDemands() {
  await delay()
  return useDemandStore().openList
}

export async function apiPublishDemand(
  payload: Omit<Demand, 'id' | 'status' | 'createdAt'>,
) {
  await delay(300)
  return useDemandStore().publish(payload)
}

export async function apiGetComments(teacherId: string) {
  await delay()
  return useCommentStore().listByTeacher(teacherId, true)
}

export async function apiSubmitConsult(form: ConsultForm) {
  await delay(300)
  // MVP 仅 mock 成功，不做持久化
  return { success: true, message: `已向 ${form.teacherName} 发送咨询，请等待老师回电` }
}

export async function apiGetDashboard() {
  await delay()
  const teachers = useTeacherStore().list
  const users = useUserStore().users
  const demands = useDemandStore().list
  return {
    teacherCount: teachers.filter((t) => t.status === 'approved').length,
    studentCount: users.filter((u) => u.role === 'student').length,
    pendingCount: teachers.filter((t) => t.status === 'pending').length,
    demandCount: demands.filter((d) => d.status === 'open').length,
    commentCount: useCommentStore().list.length,
  }
}
