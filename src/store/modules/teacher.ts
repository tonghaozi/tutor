import { defineStore } from 'pinia'
import type { AuditStatus, Teacher, TeacherFilter } from '@/types'
import { mockTeachers } from '@/mock/teachers'
import { uid } from '@/utils'

interface TeacherState {
  list: Teacher[]
}

function matchTeacher(t: Teacher, filter: TeacherFilter) {
  if (filter.keyword) {
    const kw = filter.keyword.trim().toLowerCase()
    const hit =
      t.name.toLowerCase().includes(kw) ||
      t.subjects.some((s) => s.includes(kw)) ||
      t.introduction.toLowerCase().includes(kw)
    if (!hit) return false
  }
  if (filter.subject && !t.subjects.includes(filter.subject)) return false
  if (filter.district && !t.districts.includes(filter.district)) return false
  if (filter.teachMode && filter.teachMode !== 'both') {
    if (t.teachMode !== 'both' && t.teachMode !== filter.teachMode) return false
  }
  if (filter.priceMin != null && t.price < filter.priceMin) return false
  if (filter.priceMax != null && t.price > filter.priceMax) return false
  return true
}

export const useTeacherStore = defineStore('teacher', {
  state: (): TeacherState => ({
    list: [...mockTeachers],
  }),
  getters: {
    approvedList: (state) => state.list.filter((t) => t.status === 'approved'),
    pendingList: (state) => state.list.filter((t) => t.status === 'pending'),
    hotList: (state) => state.list.filter((t) => t.status === 'approved' && t.isHot),
  },
  actions: {
    getById(id: string): Teacher | undefined {
      return this.list.find((t) => t.id === id)
    },

    search(filter: TeacherFilter = {}, onlyApproved = true): Teacher[] {
      const source = onlyApproved
        ? this.list.filter((t) => t.status === 'approved')
        : this.list
      return source.filter((t) => matchTeacher(t, filter))
    },

    submitJoin(
      payload: Omit<Teacher, 'id' | 'status' | 'rating' | 'reviewCount' | 'createdAt' | 'isHot'>,
    ): Teacher {
      const teacher: Teacher = {
        ...payload,
        id: uid('t'),
        rating: 5,
        reviewCount: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
        isHot: false,
      }
      this.list.unshift(teacher)
      return teacher
    },

    audit(id: string, status: AuditStatus, rejectReason = '') {
      const teacher = this.list.find((t) => t.id === id)
      if (!teacher) return
      teacher.status = status
      teacher.rejectReason = status === 'rejected' ? rejectReason : ''
      if (status === 'approved') {
        teacher.isHot = teacher.subjects.includes('吉他')
      }
    },

    remove(id: string) {
      this.list = this.list.filter((t) => t.id !== id)
    },
  },
  persist: {
    pick: ['list'],
  },
})
