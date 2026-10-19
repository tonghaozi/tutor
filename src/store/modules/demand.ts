import { defineStore } from 'pinia'
import type { Demand } from '@/types'

interface DemandState {
  list: Demand[]
}

export const useDemandStore = defineStore('demand', {
  state: (): DemandState => ({
    list: [],
  }),
  getters: {
    openList: (state) =>
      [...state.list]
        .filter((d) => d.status === 'open')
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
  },
  actions: {
    setList(list: Demand[]) {
      this.list = list
    },

    upsert(demand: Demand) {
      const index = this.list.findIndex((item) => item.id === demand.id)
      if (index === -1) this.list.unshift(demand)
      else this.list[index] = demand
    },

    remove(id: string) {
      this.list = this.list.filter((d) => d.id !== id)
    },
  },
})
