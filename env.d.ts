/// <reference types="vite/client" />
/// <reference types="pinia-plugin-persistedstate" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.scss' {
  const content: Record<string, string>
  export default content
}
