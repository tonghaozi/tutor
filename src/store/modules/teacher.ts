import { defineStore } from 'pinia'
import type { Teacher, TeacherFilter } from '@/types'

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
    list: [],
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

    setList(list: Teacher[]) {
      this.list = list
    },

    upsert(teacher: Teacher) {
      const index = this.list.findIndex((item) => item.id === teacher.id)
      if (index === -1) this.list.unshift(teacher)
      else this.list[index] = teacher
    },

    search(filter: TeacherFilter = {}, onlyApproved = true): Teacher[] {
      const source = onlyApproved
        ? this.list.filter((t) => t.status === 'approved')
        : this.list
      return source.filter((t) => matchTeacher(t, filter))
    },

    remove(id: string) {
      this.list = this.list.filter((t) => t.id !== id)
    },
  },
})
