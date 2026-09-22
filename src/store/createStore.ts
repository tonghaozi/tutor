import { defineStore } from 'pinia'

/**
 * 统一封装 defineStore，默认开启持久化
 * 后续迁移 UniApp 时可替换 storage 实现
 */
export function createStore(id: string, options: Record<string, unknown>) {
  const { persist = true, ...rest } = options
  return defineStore(id, {
    ...rest,
    persist,
  } as any)
}
