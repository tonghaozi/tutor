const DEVICE_KEY = 'tonghao_device_id'
const LAST_SEND_KEY = 'tonghao_sms_last_send'
/** 同一设备两次发送最短间隔（秒） */
export const SMS_COOLDOWN_SECONDS = 60

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `d_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return `d_${Date.now()}`
  }
}

function readLastSendAt(): number {
  try {
    const raw = localStorage.getItem(LAST_SEND_KEY)
    const value = raw ? Number(raw) : 0
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

export function markSmsSent(): void {
  try {
    localStorage.setItem(LAST_SEND_KEY, String(Date.now()))
  } catch {
    // ignore
  }
}

/** 距离下次可发送还剩多少秒，0 表示可以发送 */
export function getSmsCooldownRemain(): number {
  const last = readLastSendAt()
  if (!last) return 0
  const remain = Math.ceil((last + SMS_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000)
  return remain > 0 ? remain : 0
}

export function assertSmsSendable(): void {
  const remain = getSmsCooldownRemain()
  if (remain > 0) {
    throw new Error(`发送太频繁，请 ${remain} 秒后再试`)
  }
}
