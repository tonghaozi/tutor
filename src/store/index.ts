import { createPinia, getActivePinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

const pinia = createPinia()

pinia.use(
  createPersistedState({
    key: (id) => `tonghao-${id}`,
    storage: localStorage,
  }),
)

export function resetAllStores() {
  const activePinia = getActivePinia()
  if (!activePinia) return
  activePinia._s.forEach((store) => {
    store.$reset()
  })
}

export default pinia
export { createStore } from './createStore'
export * from './modules/user'
export * from './modules/app'
export * from './modules/teacher'
export * from './modules/demand'
export * from './modules/comment'
