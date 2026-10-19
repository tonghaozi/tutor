import cloudbase from '@cloudbase/js-sdk'

function requiredEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`缺少环境变量 ${name}`)
  }
  return value
}

export const cloudbaseApp = cloudbase.init({
  env: requiredEnv('VITE_CLOUDBASE_ENV_ID'),
  region: import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai',
  accessKey: requiredEnv('VITE_PUBLISHABLE_KEY'),
  auth: { detectSessionInUrl: true },
})

export const auth = cloudbaseApp.auth
export const db = cloudbaseApp.rdb()
