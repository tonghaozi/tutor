import { defineStore } from 'pinia'
import type { Comment } from '@/types'

interface CommentState {
  list: Comment[]
}

export const useCommentStore = defineStore('comment', {
  state: (): CommentState => ({
    list: [],
  }),
  actions: {
    setList(list: Comment[]) {
      this.list = list
    },

    upsert(comment: Comment) {
      const index = this.list.findIndex((item) => item.id === comment.id)
      if (index === -1) this.list.unshift(comment)
      else this.list[index] = comment
    },

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
})
