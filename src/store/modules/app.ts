import { defineStore } from 'pinia'
import {
  buildCityPath,
  buildDistrictPath,
  cityDisplayName,
  getDistrictsOfCity,
} from '@/utils/region'

interface AppState {
  sidebarCollapsed: boolean
  /** 当前定位省 */
  province: string
  /** 当前定位市（直辖市多为「市辖区」） */
  city: string
  /** 当前选中区县，空表示全市 */
  district: string
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    sidebarCollapsed: false,
    province: '安徽省',
    city: '合肥市',
    district: '',
  }),
  getters: {
    cityLabel: (state) => cityDisplayName(state.province, state.city),
    cityPath: (state) => buildCityPath(state.province, state.city),
    /** 用于接口筛选：有区则精确到区，否则到市 */
    regionPath: (state) =>
      state.district
        ? buildDistrictPath(state.province, state.city, state.district)
        : buildCityPath(state.province, state.city),
    districts: (state) => getDistrictsOfCity(state.province, state.city),
  },
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    setCity(province: string, city: string) {
      if (!province || !city) return
      if (this.province === province && this.city === city) return
      this.province = province
      this.city = city
      this.district = ''
    },

    setDistrict(district: string) {
      this.district = district === this.district ? '' : district
    },

    clearDistrict() {
      this.district = ''
    },
  },
  persist: {
    pick: ['province', 'city', 'district'],
  },
})
