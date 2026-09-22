import { defineStore } from 'pinia'
import type { Comment } from '@/types'
import { mockComments } from '@/mock/comments'

interface CommentState {
  list: Comment[]
}

export const useCommentStore = defineStore('comment', {
  state: (): CommentState => ({
    list: [...mockComments],
  }),
  actions: {
    listByTeacher(teacherId: string, onlyVisible = true): Comment[] {
      return this.list.filter((c) => c.teacherId === teacherId && (!onlyVisible || c.visible))
    },
    setVisible(id: string, visible: boolean) {
      const item = this.list.find((c) => c.id === id)
      if (item) item.visible = visible
    },
    remove(id: string) {
      this.list = this.list.filter((c) => c.id !== id)
    },
  },
  persist: {
    pick: ['list'],
  },
})
