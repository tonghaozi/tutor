import { defineStore } from 'pinia'
import type { Demand } from '@/types'
import { mockDemands } from '@/mock/demands'
import { uid } from '@/utils'

interface DemandState {
  list: Demand[]
}

export const useDemandStore = defineStore('demand', {
  state: (): DemandState => ({
    list: [...mockDemands],
  }),
  getters: {
    openList: (state) =>
      [...state.list]
        .filter((d) => d.status === 'open')
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
  },
  actions: {
    publish(payload: Omit<Demand, 'id' | 'status' | 'createdAt'>): Demand {
      const item: Demand = {
        ...payload,
        id: uid('d'),
        status: 'open',
        createdAt: new Date().toISOString(),
      }
      this.list.unshift(item)
      return item
    },
    close(id: string) {
      const item = this.list.find((d) => d.id === id)
      if (item) item.status = 'closed'
    },
    remove(id: string) {
      this.list = this.list.filter((d) => d.id !== id)
    },
  },
  persist: {
    pick: ['list'],
  },
})
