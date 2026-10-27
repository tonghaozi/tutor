import JSEncrypt from 'jsencrypt'
import { request } from '@/lib/http'

let cachedPublicKey: string | null = null

export async function fetchRsaPublicKey(force = false): Promise<string> {
  if (!force && cachedPublicKey) return cachedPublicKey
  const res = await request<{ publicKey: string }>('/auth/public-key')
  if (!res?.publicKey) {
    throw new Error('获取加密公钥失败')
  }
  cachedPublicKey = res.publicKey
  return cachedPublicKey
}

/** 使用后端公钥对明文密码做 RSA 加密（JSEncrypt / PKCS1） */
export async function rsaEncryptPassword(plain: string): Promise<string> {
  const publicKey = await fetchRsaPublicKey()
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(publicKey)
  const encrypted = encryptor.encrypt(plain)
  if (!encrypted) {
    throw new Error('密码加密失败，请刷新页面后重试')
  }
  return encrypted
}
